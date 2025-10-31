// src/components/AnalyticsPage.jsx
import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Brush,
  BarChart,
  Bar,
} from "recharts";
import { CSVLink } from "react-csv";

export default function AnalyticsPage({
  projects,
  fundData,
  connectionHistory,
  acceptedConnections,
  showAlert,
}) {
  // Local states
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [donorFilter, setDonorFilter] = useState("");
  const [hoveredDonor, setHoveredDonor] = useState(null);

  const parseISO = (s) => (s ? new Date(s) : null);

  // Filtered projects
  const projectsFiltered = useMemo(() => {
    const s = new Date(startDate + "T00:00:00");
    const e = new Date(endDate + "T23:59:59");
    return projects.filter((p) => {
      const pDate = parseISO(p.startDate) || new Date();
      if (pDate < s || pDate > e) return false;
      if (donorFilter && p.donor !== donorFilter) return false;
      return true;
    });
  }, [projects, startDate, endDate, donorFilter]);

  // KPI Calculations
  const totalFunds = useMemo(
    () => projects.reduce((sum, p) => sum + (Number(p.funds) || 0), 0),
    [projects]
  );
  const filteredFunds = useMemo(
    () => projectsFiltered.reduce((s, p) => s + (Number(p.funds) || 0), 0),
    [projectsFiltered]
  );
  const totalBeneficiaries = useMemo(
    () => projects.reduce((s, p) => s + (Number(p.beneficiaries) || 0), 0),
    [projects]
  );
  const completedProjects = useMemo(
    () => projects.filter((p) => p.status === "completed").length,
    [projects]
  );
  const activeProjectsCount = useMemo(
    () => projects.filter((p) => p.status === "active").length,
    [projects]
  );

  // Replace your current fundsOverTime useMemo with this:
  const fundsOverTime = useMemo(() => {
    // window: selected range
    const s = new Date(startDate + "T00:00:00");
    const e = new Date(endDate + "T23:59:59");

    const map = {};
    connectionHistory.forEach(h => {
      if (h.action !== "Donation") return;
      const dt = h.date ? new Date(h.date + "T00:00:00") : new Date();
      if (dt < s || dt > e) return;
      if (donorFilter && h.company !== donorFilter) return;

      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
      const amt = Number(h.amount) || 0;
      map[key] = (map[key] || 0) + amt;
    });

    const arr = Object.keys(map).sort().map(k => ({ month: k, funds: map[k] }));
    return arr;
  }, [connectionHistory, startDate, endDate, donorFilter]);


  // Replace your current donorsAgg useMemo with this:
  const donorsAgg = useMemo(() => {
    const s = new Date(startDate + "T00:00:00");
    const e = new Date(endDate + "T23:59:59");

    const map = {};
    connectionHistory.forEach(h => {
      if (h.action !== "Donation") return;
      const dt = h.date ? new Date(h.date + "T00:00:00") : new Date();
      if (dt < s || dt > e) return;
      const donor = h.company || "Unknown Donor";
      const amt = Number(h.amount) || 0;
      map[donor] = (map[donor] || 0) + amt;
    });

    return Object.keys(map)
      .map(donor => ({ donor, funds: map[donor] }))
      .sort((a, b) => b.funds - a.funds);
  }, [connectionHistory, startDate, endDate]);

  // And update donorPie to use donorsAgg (unchanged shape):
  const donorPie = useMemo(() => {
    return donorsAgg
      .filter(d => !donorFilter || d.donor === donorFilter)
      .slice(0, 6)
      .map(d => ({ name: d.donor, value: d.funds }));
  }, [donorsAgg, donorFilter]);

  // CSV export data
  const csvData = useMemo(() => {
    const header = [
      "Project ID",
      "Name",
      "Donor",
      "Funds",
      "Progress",
      "Beneficiaries",
      "Location",
      "Status",
      "StartDate",
      "EndDate",
    ];
    const rows = projectsFiltered.map((p) => [
      p.id,
      p.name,
      p.donor,
      p.funds,
      p.progress,
      p.beneficiaries,
      p.location,
      p.status,
      p.startDate,
      p.endDate || "",
    ]);
    return [header, ...rows];
  }, [projectsFiltered]);

  // Donor click
  const handleDonorClick = (donor) => {
    setDonorFilter(donor === donorFilter ? "" : donor);
    showAlert &&
      showAlert(
        donor
          ? `📊 Filter applied: ${donor}`
          : "🔄 Donor filter cleared",
        "info"
      );
  };

  const KPI = ({ title, value }) => (
    <div className="bg-white rounded-2xl shadow-sm p-4 border hover:shadow-md transition-all">
      <p className="text-xs text-slate-500">{title}</p>
      <h3 className="text-2xl font-extrabold">{value}</h3>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-50 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Analytics
          </h2>
          <p className="text-sm text-slate-500">
            Key performance insights and donor metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
          <CSVLink
            data={csvData}
            filename={`analytics_${startDate}_${endDate}.csv`}
            className="px-3 py-1 bg-indigo-600 text-white rounded text-sm"
          >
            Export CSV
          </CSVLink>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid md:grid-cols-5 gap-4">
        <KPI title="Total Funds" value={`₹${totalFunds.toLocaleString("en-IN")}`} />
        <KPI
          title="Funds in Range"
          value={`₹${filteredFunds.toLocaleString("en-IN")}`}
        />
        <KPI title="Completed Projects" value={completedProjects} />
        <KPI title="Active Projects" value={activeProjectsCount} />
        <KPI title="Beneficiaries" value={totalBeneficiaries} />
      </div>

      <p className="text-[11px] text-slate-400">
        Data source: Recorded donations (Funding → connectionHistory)
      </p>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funds Over Time */}
        <div className="bg-white rounded-2xl p-4 border shadow-sm">
          <h3 className="font-semibold mb-4">Funds Over Time</h3>
          <div className="w-full h-[260px] sm:h-[300px] md:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fundsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
                <Line type="monotone" dataKey="funds" stroke="#14b8a6" strokeWidth={3} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donor Insights */}
        <div className="bg-white rounded-2xl p-4 border shadow-sm">
          <h3 className="font-semibold mb-4">Top Donors</h3>
          <div className="w-full h-[260px] sm:h-[300px] md:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={donorsAgg.slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="donor" width={120} />
                <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
                <Bar dataKey="funds" onClick={(data) => handleDonorClick(data.donor)}>
                  {donorsAgg.slice(0, 6).map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        donorFilter === entry.donor
                          ? "#8b5cf6"
                          : hoveredDonor === entry.donor
                            ? "#ec4899"
                            : "#6366f1"
                      }
                      onMouseOver={() => setHoveredDonor(entry.donor)}
                      onMouseOut={() => setHoveredDonor(null)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pie Distribution */}
      <div className="bg-white rounded-2xl p-4 border shadow-sm">
        <h3 className="font-semibold mb-4">Donor Distribution</h3>
        <div className="w-full h-[260px] sm:h-[300px] md:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donorPie}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius="75%"
                labelLine={false} // disable label lines
              >
                {donorPie.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={["#14b8a6", "#ec4899", "#8b5cf6", "#06b6d4", "#f59e0b"][i % 5]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-2 max-h-20 overflow-y-auto text-xs text-slate-500">
        {donorPie.map(d => (
          <div key={d.name} className="flex justify-between">
            <span className="truncate">{d.name}</span>
            <span>₹{d.value.toLocaleString("en-IN")}</span>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="font-semibold mb-2">Recent Activity</h3>
        <div className="space-y-2">
          {connectionHistory.slice(0, 6).map((h) => (
            <div
              key={h.id}
              className="flex justify-between bg-slate-50 p-3 rounded border"
            >
              <div>
                <p className="font-medium text-sm">
                  {h.company} — {h.action}
                </p>
                <p className="text-xs text-slate-500">{h.note}</p>
              </div>
              <p className="text-xs text-slate-400">{h.date}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
