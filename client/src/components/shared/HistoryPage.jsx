import React, { useState, useEffect, useMemo } from "react";
import { History, Calendar, MapPin, DollarSign, Building2, Users, Loader2, FileText } from "lucide-react";

const HistoryPage = ({ fetchHistory, userRole = "corporate" }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const limit = 20;

  useEffect(() => {
    loadHistory();
  }, [page]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await fetchHistory({ page, limit });
      const data = response?.history || response?.data?.history || [];
      const totalCount = response?.total || response?.data?.total || 0;
      setHistory(data);
      setTotal(totalCount);
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history;
    const query = searchQuery.toLowerCase();
    return history.filter((item) => {
      const projectTitle = item.project_title?.toLowerCase() || "";
      const partnerName = userRole === "corporate"
        ? (item.ngo_organization_name || item.ngo_name || "").toLowerCase()
        : (item.corporate_company_name || item.corporate_name || "").toLowerCase();
      const location = item.project_location?.toLowerCase() || "";
      return projectTitle.includes(query) || partnerName.includes(query) || location.includes(query);
    });
  }, [history, searchQuery, userRole]);

  const formatCurrency = (amount) => {
    if (!amount) return "₹0";
    return `₹${parseFloat(amount).toLocaleString("en-IN")}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-50">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <History size={24} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-slate-800">Partnership History</h2>
                <p className="text-sm text-slate-500">
                  View all past partnerships and funding records
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-full max-w-md">
            <FileText size={16} className="text-slate-400 mr-2" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by project, partner, or location..."
              className="bg-transparent outline-none text-sm flex-1"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl text-slate-500 bg-slate-50/60">
            <History size={48} className="mx-auto mb-4 text-slate-400" />
            <p className="font-semibold text-lg">No history found</p>
            <p className="text-sm text-slate-400 mt-2">
              {searchQuery
                ? "No records match your search criteria"
                : "Historical records will appear here for completed and past partnerships"}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {filteredHistory.map((item) => {
                const partnerName = userRole === "corporate"
                  ? item.ngo_organization_name || item.ngo_name || "NGO Partner"
                  : item.corporate_company_name || item.corporate_name || "Corporate Partner";

                const metadata = typeof item.metadata === "string" 
                  ? JSON.parse(item.metadata || "{}")
                  : item.metadata || {};

                return (
                  <div
                    key={item.id}
                    className="p-5 border border-slate-200 rounded-xl bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-4 mb-3">
                          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 font-semibold grid place-items-center flex-shrink-0">
                            <Building2 size={20} />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-800 mb-1">
                              {item.project_title || "Untitled Project"}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-2">
                              <div className="flex items-center gap-1">
                                <Users size={14} />
                                <span>{partnerName}</span>
                              </div>
                              {item.project_location && (
                                <div className="flex items-center gap-1">
                                  <MapPin size={14} />
                                  <span>{item.project_location}</span>
                                </div>
                              )}
                              {item.project_focus_area && (
                                <span className="px-2 py-1 rounded-md bg-slate-100 text-xs">
                                  {item.project_focus_area}
                                </span>
                              )}
                            </div>
                            {item.project_description && (
                              <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                                {item.project_description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                            <div className="flex items-center gap-2 mb-1">
                              <DollarSign size={16} className="text-emerald-600" />
                              <span className="text-xs text-emerald-700 font-medium">Committed</span>
                            </div>
                            <p className="text-lg font-semibold text-emerald-800">
                              {formatCurrency(item.total_funds_committed)}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                            <div className="flex items-center gap-2 mb-1">
                              <DollarSign size={16} className="text-indigo-600" />
                              <span className="text-xs text-indigo-700 font-medium">Disbursed</span>
                            </div>
                            <p className="text-lg font-semibold text-indigo-800">
                              {formatCurrency(item.total_funds_disbursed)}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar size={16} className="text-slate-600" />
                              <span className="text-xs text-slate-700 font-medium">Archived</span>
                            </div>
                            <p className="text-sm font-semibold text-slate-800">
                              {formatDate(item.archived_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-slate-600">
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} records
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;

