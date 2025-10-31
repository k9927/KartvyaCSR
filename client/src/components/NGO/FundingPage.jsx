// src/components/NGO/FundingPage.jsx
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
} from "recharts";
import { CSVLink } from "react-csv";
import { PlusCircle, FilePlus } from "lucide-react";

/**
 * Props expected:
 * - fundData: [{ name, value }]
 * - setFundData: (fn|new) => void
 * - projects: array
 * - setProjects: fn
 * - connectionHistory, setConnectionHistory
 * - acceptedConnections (optional, for linking donors)
 * - showAlert (fn)
 */
export default function FundingPage({
  fundData,
  setFundData,
  projects,
  setProjects,
  connectionHistory,
  setConnectionHistory,
  acceptedConnections = [],
  showAlert,
}) {
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  // Add donation form
  const [form, setForm] = useState({
    donor: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    projectId: "", // optional link
    note: "",
  });

  // minor helpers
  const parseNumber = (v) => {
    if (!v) return 0;
    return Number(String(v).replace(/[^\d.-]/g, "")) || 0;
  };

  // filtered donors
  const donorsFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return fundData;
    return fundData.filter((d) => d.name.toLowerCase().includes(q));
  }, [fundData, query]);

  // pie colors
  const COLORS = ["#14b8a6", "#ec4899", "#8b5cf6", "#06b6d4", "#fb923c", "#ef4444"];

  // funds over time (aggregate by date)
  const fundsOverTime = useMemo(() => {
    const map = {};
    connectionHistory.forEach((h) => {
      if (h.action !== "Donation") return;
      const dt = h.date ? new Date(h.date) : new Date();
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
      const amt = Number(h.amount) || 0;
      map[key] = (map[key] || 0) + amt;
    });

    // Build last 6 months window (ensures stable axis & spacing)
    const out = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      out.push({ month: key, funds: map[key] || 0 });
    }
    return out;
  }, [connectionHistory]);

  // CSV for export: donors + totals
  const csvData = useMemo(() => {
    const header = ["Donor", "TotalFunds"];
    const rows = fundData.map((d) => [d.name, d.value]);
    return [header, ...rows];
  }, [fundData]);

  // Add donation handler — updates fundData, optionally a project, and connectionHistory
  const addDonation = (e) => {
    e?.preventDefault?.();
    const donor = form.donor.trim();
    const amount = parseNumber(form.amount);
    if (!donor) return showAlert?.("Please enter donor name", "error");
    if (!amount || amount <= 0) return showAlert?.("Enter a valid donation amount", "error");

    // update fundData (add or accumulate)
    setFundData((prev) => {
      const exists = prev.find((p) => p.name === donor);
      if (exists) {
        return prev.map((p) => (p.name === donor ? { ...p, value: p.value + amount } : p));
      }
      return [{ name: donor, value: amount }, ...prev];
    });

    // optional: if linked to a project, add amount to that project's funds
    if (form.projectId) {
      const pid = Number(form.projectId);
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === pid) {
            const newFunds = (Number(p.funds) || 0) + amount;
            const newDisplay = `₹${newFunds.toLocaleString("en-IN")}`;
            return { ...p, funds: newFunds, fundsDisplay: newDisplay };
          }
          return p;
        })
      );
    }

    // add to connectionHistory
    const historyEntry = {
      id: Date.now(),
      company: donor,
      action: "Donation",
      note: form.note || (form.projectId ? `For project ${form.projectId}` : "General donation"),
      date: form.date,
      amount,
    };
    setConnectionHistory((s) => [historyEntry, ...s]);

    showAlert?.(`✅ Recorded donation of ₹${amount.toLocaleString("en-IN")} from ${donor}`, "success");

    // reset form and close
    setForm({ donor: "", amount: "", date: new Date().toISOString().slice(0, 10), projectId: "", note: "" });
    setShowAdd(false);
  };

  // quick select existing connection as donor
  const setDonorFromConnection = (name) => setForm((f) => ({ ...f, donor: name }));

  // nice, inside-the-slice label (short and never overflows)
  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
    const RAD = Math.PI / 180;
    const r = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + r * Math.cos(-midAngle * RAD);
    const y = cy + r * Math.sin(-midAngle * RAD);
    const short = value >= 1e7 ? `${(value / 1e7).toFixed(1)}cr`
      : value >= 1e5 ? `${(value / 1e5).toFixed(1)}L`
        : value >= 1e3 ? `${(value / 1e3).toFixed(0)}k`
          : `${value}`;
    return (
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} style={{ pointerEvents: "none" }}>
        {short}
      </text>
    );
  };

  const formatINRCompact = (v) => {
    if (v >= 1e7) return `₹${(v / 1e7).toFixed(1)}cr`;
    if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
    if (v >= 1e3) return `₹${(v / 1e3).toFixed(0)}k`;
    return `₹${v}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-50 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Funding</h2>
          <p className="text-sm text-slate-500">Manage donors, donations and fund flows</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-lg px-3 py-2">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search donors..." className="bg-transparent outline-none text-sm" />
          </div>

          <CSVLink data={csvData} filename={`donors_${new Date().toISOString().slice(0, 10)}.csv`} className="px-3 py-2 bg-indigo-600 text-white rounded text-sm">Export CSV</CSVLink>

          <button onClick={() => setShowAdd(true)} className="px-3 py-2 bg-emerald-600 text-white rounded flex items-center gap-2">
            <PlusCircle /> Add Donation
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Donor list */}
        <div className="col-span-1 bg-white rounded p-4 border">
          <h3 className="font-semibold mb-2">Top Donors</h3>
          <div className="space-y-2 max-h-[320px] overflow-auto pr-2">
            {donorsFiltered.length === 0 ? (
              <div className="text-slate-500 text-sm">No donors</div>
            ) : donorsFiltered.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
                <div>
                  <div className="text-sm font-medium">{d.name}</div>
                  <div className="text-xs text-slate-400">Total: ₹{d.value.toLocaleString("en-IN")}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button title="Use as donor" onClick={() => setDonorFromConnection(d.name)} className="text-xs px-2 py-1 bg-slate-100 rounded">Use</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="col-span-2 grid grid-cols-2 gap-4">
          {/* Donor Distribution */}
          <div className="bg-white rounded p-4 border">
            <h4 className="font-semibold mb-2">Donor Distribution</h4>
            <div className="w-full h-[220px] sm:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fundData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={renderPieLabel}
                    labelLine={false}
                  >
                    {fundData.map((entry, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Funds Over Time */}
          <div className="bg-white rounded p-4 border">
            <h4 className="font-semibold mb-2">Funds Over Time</h4>
            <div className="w-full h-[220px] sm:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fundsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={formatINRCompact} />
                  <Tooltip formatter={(v) => formatINRCompact(Number(v))} />
                  <Line type="monotone" dataKey="funds" stroke="#14b8a6" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent donations (from connectionHistory) */}
        <div className="col-span-2 bg-white rounded p-4 border">
          <h4 className="font-semibold mb-2">Recent Donations / Funding Activity</h4>
          <div className="space-y-2 max-h-48 overflow-auto">
            {connectionHistory.filter(h => h.action === "Donation").slice(0, 8).map(h => (
              <div key={h.id} className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
                <div>
                  <div className="text-sm font-medium">{h.company}</div>
                  <div className="text-xs text-slate-400">{h.note}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">₹{Number(h.amount).toLocaleString("en-IN")}</div>
                  <div className="text-xs text-slate-400">{h.date}</div>
                </div>
              </div>
            ))}

            {connectionHistory.filter(h => h.action === "Donation").length === 0 && <div className="text-slate-500 text-sm">No donations recorded yet</div>}
          </div>
        </div>
      </div>

      {/* Add donation modal */}
      {
        showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowAdd(false)} />
            <form onSubmit={addDonation} className="relative bg-white rounded-xl shadow-lg p-6 w-full max-w-lg z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Add Donation</h3>
                <button type="button" onClick={() => setShowAdd(false)} className="text-slate-500">Close</button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Donor name" value={form.donor} onChange={(e) => setForm(s => ({ ...s, donor: e.target.value }))} className="col-span-2 border p-2 rounded" />
                <input placeholder="Amount (numbers only)" value={form.amount} onChange={(e) => setForm(s => ({ ...s, amount: e.target.value }))} className="border p-2 rounded" />
                <input type="date" value={form.date} onChange={(e) => setForm(s => ({ ...s, date: e.target.value }))} className="border p-2 rounded" />
                <select value={form.projectId} onChange={(e) => setForm(s => ({ ...s, projectId: e.target.value }))} className="border p-2 rounded">
                  <option value="">— Link to project (optional) —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.donor})</option>)}
                </select>
                <textarea placeholder="Note (optional)" value={form.note} onChange={(e) => setForm(s => ({ ...s, note: e.target.value }))} className="col-span-2 border p-2 rounded" />
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-2 bg-slate-100 rounded">Cancel</button>
                <button type="submit" className="px-3 py-2 bg-emerald-600 text-white rounded flex items-center gap-2"><FilePlus /> Record</button>
              </div>
            </form>
          </div>
        )
      }
    </div >
  );
}
