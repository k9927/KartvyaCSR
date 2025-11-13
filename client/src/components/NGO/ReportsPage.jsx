// src/components/NGO/ReportsPage.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { CSVLink } from "react-csv";
import { Search, DownloadCloud, FileText, Eye, Calendar } from "lucide-react";

/**
 * ReportsPage
 *
 * Props:
 * - projects: array of project objects
 * - connectionHistory: array of history objects (Donation action etc.)
 * - fundData: array of donor totals
 * - showAlert: function(msg, kind)
 */
export default function ReportsPage({ projects = [], connectionHistory = [], fundData = [], showAlert }) {
  // UI state
  const [tab, setTab] = useState("projects"); // projects | donations | donors
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(8);
  const [page, setPage] = useState(1);
  const [viewItem, setViewItem] = useState(null);

  // Utilities
  const formatINR = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

  // date helpers
  const toISO = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);

  // Preset ranges
  const setRangeDays = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(toISO(start));
    setEndDate(toISO(end));
  };

  // Filtered lists
  const filteredProjects = useMemo(() => {
    let list = projects.slice();
    if (startDate) list = list.filter((p) => p.startDate && p.startDate >= startDate);
    if (endDate) list = list.filter((p) => !p.endDate || p.endDate <= endDate);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((p) => (p.name || "").toLowerCase().includes(q) || (p.donor || "").toLowerCase().includes(q) || (p.location || "").toLowerCase().includes(q));
    }
    return list;
  }, [projects, startDate, endDate, query]);

  const donations = useMemo(() => connectionHistory.filter((h) => h.action === "Donation"), [connectionHistory]);

  const filteredDonations = useMemo(() => {
    let list = donations.slice();
    if (startDate) list = list.filter((d) => d.date && d.date >= startDate);
    if (endDate) list = list.filter((d) => d.date && d.date <= endDate);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((d) => (d.company || "").toLowerCase().includes(q) || (d.note || "").toLowerCase().includes(q));
    }
    return list;
  }, [donations, startDate, endDate, query]);

  const filteredDonors = useMemo(() => {
    let list = fundData.slice();
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((d) => (d.name || "").toLowerCase().includes(q));
    }
    return list;
  }, [fundData, query]);

  // Pagination helper
  const pageCount = (len) => Math.max(1, Math.ceil(len / rowsPerPage));
  const paginated = (arr) => {
    const start = (page - 1) * rowsPerPage;
    return arr.slice(start, start + rowsPerPage);
  };

  useEffect(() => {
    setPage(1);
  }, [tab, query, startDate, endDate, rowsPerPage]);

  // CSV export datasets
  const csvProjects = useMemo(() => [
    ["Project name", "Donor", "Funds", "Status", "Start", "End", "Beneficiaries"],
    ...projects.map((p) => [p.name, p.donor, p.fundsDisplay || p.funds, p.status, p.startDate || "", p.endDate || "", p.beneficiaries || ""])
  ], [projects]);

  const csvDonations = useMemo(() => [
    ["Date", "Donor", "Amount", "Note"],
    ...donations.map((d) => [d.date || "", d.company || "", d.amount || "", d.note || ""])
  ], [donations]);

  const csvDonors = useMemo(() => [
    ["Donor", "TotalFunds"],
    ...fundData.map((d) => [d.name, d.value])
  ], [fundData]);

  // Quick print/export (simple)
  const printReport = (nodeId) => {
    // Print current window (could add specific print styles)
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-50 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold bg-clip-text text-slate-900">Reports</h2>
          <p className="text-sm text-slate-500">Generate and export reports for projects, donors and donations</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded px-3 py-2 gap-2">
            <Search size={16} className="text-slate-500" />
            <input className="bg-transparent outline-none text-sm" placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          <div className="flex items-center gap-2">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border rounded px-2 py-1 text-sm" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border rounded px-2 py-1 text-sm" />
            <button onClick={() => { setStartDate(""); setEndDate(""); }} className="px-2 py-1 bg-slate-100 rounded text-sm">Reset</button>
            <div className="flex items-center gap-1">
              <button onClick={() => setRangeDays(30)} className="px-2 py-1 text-xs rounded bg-indigo-50">30d</button>
              <button onClick={() => setRangeDays(90)} className="px-2 py-1 text-xs rounded bg-indigo-50">90d</button>
              <button onClick={() => { setStartDate(""); setEndDate(""); }} className="px-2 py-1 text-xs rounded bg-indigo-50">All</button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b pb-3">
        <button onClick={() => setTab("projects")} className={`px-3 py-2 rounded ${tab === "projects" ? "bg-indigo-50" : "hover:bg-slate-50"}`}>Projects</button>
        <button onClick={() => setTab("donations")} className={`px-3 py-2 rounded ${tab === "donations" ? "bg-indigo-50" : "hover:bg-slate-50"}`}>Donations</button>
        <button onClick={() => setTab("donors")} className={`px-3 py-2 rounded ${tab === "donors" ? "bg-indigo-50" : "hover:bg-slate-50"}`}>Donors</button>

        <div className="ml-auto flex items-center gap-2">
          <CSVLink data={tab === "projects" ? csvProjects : tab === "donations" ? csvDonations : csvDonors} filename={`reports_${tab}_${new Date().toISOString().slice(0,10)}.csv`} className="px-3 py-2 bg-indigo-600 text-white rounded flex items-center gap-2 text-sm">
            <DownloadCloud size={16} /> Export CSV
          </CSVLink>
          <button onClick={() => printReport()} className="px-3 py-2 bg-slate-100 rounded text-sm flex items-center gap-2"><FileText size={16} /> Print</button>
        </div>
      </div>

      {/* Table area */}
      <div>
        {tab === "projects" && (
          <div>
            <div className="overflow-auto rounded border">
              <table className="min-w-full divide-y">
                <thead className="bg-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Project</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Donor</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Funds</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Dates</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y">
                  {paginated(filteredProjects).map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3">{p.name}</td>
                      <td className="px-4 py-3">{p.donor}</td>
                      <td className="px-4 py-3">{p.fundsDisplay || formatINR(p.funds)}</td>
                      <td className="px-4 py-3">{p.status}</td>
                      <td className="px-4 py-3">{p.startDate || "-"} {p.endDate ? `– ${p.endDate}` : ""}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setViewItem({ type: "project", item: p })} className="px-2 py-1 bg-slate-100 rounded text-sm flex items-center gap-2"><Eye size={14} /> View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* pagination */}
            <div className="flex items-center justify-between mt-3">
              <div className="text-sm text-slate-500">Showing {Math.min(filteredProjects.length, (page)*rowsPerPage)} of {filteredProjects.length}</div>
              <div className="flex items-center gap-2">
                <select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))} className="border rounded px-2 py-1 text-sm">
                  <option value={5}>5</option>
                  <option value={8}>8</option>
                  <option value={12}>12</option>
                </select>
                <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p-1))} className="px-2 py-1 border rounded">Prev</button>
                <div className="px-2 py-1 rounded bg-slate-50 text-sm">Page {page}/{pageCount(filteredProjects.length)}</div>
                <button disabled={page >= pageCount(filteredProjects.length)} onClick={() => setPage((p) => Math.min(pageCount(filteredProjects.length), p+1))} className="px-2 py-1 border rounded">Next</button>
              </div>
            </div>
          </div>
        )}

        {tab === "donations" && (
          <div>
            <div className="overflow-auto rounded border">
              <table className="min-w-full divide-y">
                <thead className="bg-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Donor</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Note</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y">
                  {paginated(filteredDonations).map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 py-3">{d.date}</td>
                      <td className="px-4 py-3">{d.company}</td>
                      <td className="px-4 py-3">{formatINR(d.amount)}</td>
                      <td className="px-4 py-3">{d.note}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setViewItem({ type: "donation", item: d })} className="px-2 py-1 bg-slate-100 rounded text-sm flex items-center gap-2"><Eye size={14} /> View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="text-sm text-slate-500">Showing {Math.min(filteredDonations.length, (page)*rowsPerPage)} of {filteredDonations.length}</div>
              <div className="flex items-center gap-2">
                <select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))} className="border rounded px-2 py-1 text-sm">
                  <option value={5}>5</option>
                  <option value={8}>8</option>
                  <option value={12}>12</option>
                </select>
                <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p-1))} className="px-2 py-1 border rounded">Prev</button>
                <div className="px-2 py-1 rounded bg-slate-50 text-sm">Page {page}/{pageCount(filteredDonations.length)}</div>
                <button disabled={page >= pageCount(filteredDonations.length)} onClick={() => setPage((p) => Math.min(pageCount(filteredDonations.length), p+1))} className="px-2 py-1 border rounded">Next</button>
              </div>
            </div>
          </div>
        )}

        {tab === "donors" && (
          <div>
            <div className="overflow-auto rounded border">
              <table className="min-w-full divide-y">
                <thead className="bg-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Donor</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y">
                  {paginated(filteredDonors).map((d) => (
                    <tr key={d.name}>
                      <td className="px-4 py-3">{d.name}</td>
                      <td className="px-4 py-3">{formatINR(d.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="text-sm text-slate-500">Showing {Math.min(filteredDonors.length, (page)*rowsPerPage)} of {filteredDonors.length}</div>
              <div className="flex items-center gap-2">
                <select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))} className="border rounded px-2 py-1 text-sm">
                  <option value={5}>5</option>
                  <option value={8}>8</option>
                  <option value={12}>12</option>
                </select>
                <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p-1))} className="px-2 py-1 border rounded">Prev</button>
                <div className="px-2 py-1 rounded bg-slate-50 text-sm">Page {page}/{pageCount(filteredDonors.length)}</div>
                <button disabled={page >= pageCount(filteredDonors.length)} onClick={() => setPage((p) => Math.min(pageCount(filteredDonors.length), p+1))} className="px-2 py-1 border rounded">Next</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View modal */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setViewItem(null)} />
          <div className="relative bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 z-10">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold">{viewItem.type === "project" ? viewItem.item.name : viewItem.item.company}</h3>
              <button onClick={() => setViewItem(null)} className="text-slate-500">Close</button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              {viewItem.type === "project" ? (
                <>
                  <div>
                    <p className="text-xs text-slate-500">Donor</p>
                    <p className="font-medium">{viewItem.item.donor}</p>

                    <p className="text-xs text-slate-500 mt-3">Beneficiaries</p>
                    <p className="font-medium">{viewItem.item.beneficiaries}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Funds</p>
                    <p className="font-medium">{viewItem.item.fundsDisplay || formatINR(viewItem.item.funds)}</p>

                    <p className="text-xs text-slate-500 mt-3">Status</p>
                    <p className="font-medium">{viewItem.item.status}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500">Description</p>
                    <p className="text-sm">{viewItem.item.description}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-xs text-slate-500">Date</p>
                    <p className="font-medium">{viewItem.item.date}</p>

                    <p className="text-xs text-slate-500 mt-3">Amount</p>
                    <p className="font-medium">{formatINR(viewItem.item.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Note</p>
                    <p className="text-sm">{viewItem.item.note}</p>
                    <p className="text-xs text-slate-500 mt-3">Recorded ID</p>
                    <p className="text-sm text-slate-400">{viewItem.item.id}</p>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 text-right">
              <button onClick={() => setViewItem(null)} className="px-3 py-2 bg-slate-100 rounded">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
