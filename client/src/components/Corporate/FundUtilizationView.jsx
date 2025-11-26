import React, { useState, useEffect } from "react";
import { DollarSign, Image as ImageIcon, Calendar, FileText, Loader2, Eye, X } from "lucide-react";
import { getProjectFundUtilization, getCorporatePartnerships } from "../../services/api";

export default function FundUtilizationView({ projectId, onClose }) {
  const [utilizationData, setUtilizationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    if (projectId) {
      loadUtilization();
    }
  }, [projectId]);

  const loadUtilization = async () => {
    try {
      setLoading(true);
      const response = await getProjectFundUtilization(projectId);
      setUtilizationData(response?.data || response);
    } catch (error) {
      console.error("Failed to load fund utilization", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString("en-IN")}`;
  };

  const getCategoryColor = (category) => {
    const colors = {
      infrastructure: "bg-blue-100 text-blue-700",
      staff: "bg-purple-100 text-purple-700",
      materials: "bg-green-100 text-green-700",
      operations: "bg-orange-100 text-orange-700",
      marketing: "bg-pink-100 text-pink-700",
      training: "bg-indigo-100 text-indigo-700",
      other: "bg-gray-100 text-gray-700",
    };
    return colors[category] || colors.other;
  };

  const getCategoryLabel = (category) => {
    const labels = {
      infrastructure: "Infrastructure",
      staff: "Staff & Salaries",
      materials: "Materials & Supplies",
      operations: "Operations",
      marketing: "Marketing & Outreach",
      training: "Training & Development",
      other: "Other",
    };
    return labels[category] || category;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      </div>
    );
  }

  const utilization = utilizationData?.utilization || [];
  const summary = utilizationData?.summary || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl z-10 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Fund Utilization Breakdown</h3>
            <p className="text-sm text-slate-500">View how funds are being utilized for this project</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign size={16} className="text-emerald-600" />
                <span className="text-xs text-emerald-700 font-medium">Total Utilized</span>
              </div>
              <p className="text-xl font-semibold text-emerald-800">{formatCurrency(summary.total_utilized)}</p>
            </div>
            <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200">
              <div className="flex items-center gap-2 mb-1">
                <FileText size={16} className="text-indigo-600" />
                <span className="text-xs text-indigo-700 font-medium">Total Entries</span>
              </div>
              <p className="text-xl font-semibold text-indigo-800">{summary.total_entries || 0}</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={16} className="text-blue-600" />
                <span className="text-xs text-blue-700 font-medium">Last Updated</span>
              </div>
              <p className="text-sm font-semibold text-blue-800">
                {utilization.length > 0
                  ? new Date(utilization[0].created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Utilization Entries */}
          {utilization.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-200 rounded-lg text-slate-500 bg-slate-50/60">
              <DollarSign size={48} className="mx-auto mb-4 text-slate-400" />
              <p className="font-semibold">No fund utilization entries yet</p>
              <p className="text-sm text-slate-400 mt-2">
                NGO partner will add fund utilization entries as they use the funds
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {utilization.map((entry) => {
                const photos = typeof entry.photos === "string" ? JSON.parse(entry.photos || "[]") : entry.photos || [];
                return (
                  <div key={entry.id} className="p-5 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-md text-xs font-medium ${getCategoryColor(entry.category)}`}>
                            {getCategoryLabel(entry.category)}
                          </span>
                          <span className="text-lg font-semibold text-slate-800">{formatCurrency(entry.amount_used)}</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(entry.utilization_date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{entry.description}</p>
                        {entry.partnership_name && (
                          <p className="text-xs text-slate-500">Partnership: {entry.partnership_name}</p>
                        )}
                      </div>
                    </div>

                    {photos.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-slate-600 mb-2">Photos ({photos.length})</p>
                        <div className="grid grid-cols-4 gap-2">
                          {photos.map((photo, idx) => (
                            <div
                              key={idx}
                              className="relative w-full aspect-square rounded-lg overflow-hidden border border-slate-200 cursor-pointer group"
                              onClick={() => setSelectedPhoto(photo)}
                            >
                              <img src={photo} alt={`Utilization ${idx + 1}`} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <Eye size={20} className="text-white opacity-0 group-hover:opacity-100" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80" onClick={() => setSelectedPhoto(null)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100"
            >
              <X size={20} />
            </button>
            <img src={selectedPhoto} alt="Full size" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}


