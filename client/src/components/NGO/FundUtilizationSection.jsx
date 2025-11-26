import React, { useState, useEffect } from "react";
import { PlusCircle, DollarSign, Image as ImageIcon, X, Camera, Calendar, FileText, Loader2 } from "lucide-react";
import { addFundUtilization, getPartnershipFundUtilization, getNGOPartnerships } from "../../services/api";

const CATEGORIES = [
  { value: "infrastructure", label: "Infrastructure" },
  { value: "staff", label: "Staff & Salaries" },
  { value: "materials", label: "Materials & Supplies" },
  { value: "operations", label: "Operations" },
  { value: "marketing", label: "Marketing & Outreach" },
  { value: "training", label: "Training & Development" },
  { value: "other", label: "Other" },
];

export default function FundUtilizationSection({ showAlert }) {
  const [partnerships, setPartnerships] = useState([]);
  const [selectedPartnership, setSelectedPartnership] = useState(null);
  const [utilizationData, setUtilizationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    partnershipId: "",
    category: "",
    description: "",
    amount_used: "",
    utilization_date: new Date().toISOString().slice(0, 10),
    photos: [],
  });

  useEffect(() => {
    loadPartnerships();
  }, []);

  useEffect(() => {
    if (selectedPartnership) {
      loadUtilization();
    }
  }, [selectedPartnership]);

  const loadPartnerships = async () => {
    try {
      setLoading(true);
      const response = await getNGOPartnerships({ status: "active" });
      const data = response?.partnerships || response?.data?.partnerships || [];
      setPartnerships(data);
      if (data.length > 0 && !selectedPartnership) {
        setSelectedPartnership(data[0].id);
        setForm(prev => ({ ...prev, partnershipId: String(data[0].id) }));
      }
    } catch (error) {
      console.error("Failed to load partnerships", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUtilization = async () => {
    if (!selectedPartnership) return;
    try {
      const response = await getPartnershipFundUtilization(selectedPartnership);
      setUtilizationData(response?.data || response);
    } catch (error) {
      console.error("Failed to load fund utilization", error);
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const readerPromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readerPromises).then(base64Images => {
      setForm(prev => ({
        ...prev,
        photos: [...prev.photos, ...base64Images]
      }));
    });
  };

  const removePhoto = (index) => {
    setForm(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.partnershipId || !form.category || !form.description || !form.amount_used) {
      return showAlert?.("Please fill all required fields", "error");
    }

    const amount = parseFloat(form.amount_used);
    if (amount <= 0) {
      return showAlert?.("Amount must be greater than 0", "error");
    }

    try {
      setSubmitting(true);
      const response = await addFundUtilization(form.partnershipId, {
        category: form.category,
        description: form.description,
        amount_used: amount,
        utilization_date: form.utilization_date,
        photos: form.photos,
      });

      showAlert?.("Fund utilization added successfully! Progress updated automatically.", "success");
      setShowAddModal(false);
      setForm({
        partnershipId: form.partnershipId,
        category: "",
        description: "",
        amount_used: "",
        utilization_date: new Date().toISOString().slice(0, 10),
        photos: [],
      });
      loadUtilization();
      loadPartnerships(); // Refresh to update progress
    } catch (error) {
      console.error("Failed to add fund utilization", error);
      showAlert?.(error.message || "Failed to add fund utilization", "error");
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-50">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      </div>
    );
  }

  if (partnerships.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-50">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Fund Utilization</h3>
        <p className="text-sm text-slate-500">No active partnerships found. Accept a CSR request to start tracking fund utilization.</p>
      </div>
    );
  }

  const summary = utilizationData?.summary || {};
  const utilization = utilizationData?.utilization || [];
  const partnership = partnerships.find(p => p.id === selectedPartnership);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-50 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Fund Utilization</h3>
          <p className="text-sm text-slate-500">Track how funds are being used in your projects</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <PlusCircle size={18} />
          Add Utilization
        </button>
      </div>

      {/* Partnership Selector */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Select Partnership</label>
        <select
          value={selectedPartnership || ""}
          onChange={(e) => {
            setSelectedPartnership(Number(e.target.value));
            setForm(prev => ({ ...prev, partnershipId: e.target.value }));
          }}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {partnerships.map(p => (
            <option key={p.id} value={p.id}>
              {p.partnership_name || p.project_name || `Partnership ${p.id}`} - {formatCurrency(p.agreed_budget)}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      {partnership && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={16} className="text-emerald-600" />
              <span className="text-xs text-emerald-700 font-medium">Agreed Budget</span>
            </div>
            <p className="text-xl font-semibold text-emerald-800">{formatCurrency(partnership.agreed_budget)}</p>
          </div>
          <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={16} className="text-indigo-600" />
              <span className="text-xs text-indigo-700 font-medium">Total Utilized</span>
            </div>
            <p className="text-xl font-semibold text-indigo-800">{formatCurrency(summary.total_utilized)}</p>
          </div>
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={16} className="text-amber-600" />
              <span className="text-xs text-amber-700 font-medium">Remaining</span>
            </div>
            <p className="text-xl font-semibold text-amber-800">{formatCurrency(summary.remaining_budget)}</p>
          </div>
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={16} className="text-blue-600" />
              <span className="text-xs text-blue-700 font-medium">Progress</span>
            </div>
            <p className="text-xl font-semibold text-blue-800">{summary.utilization_percentage || 0}%</p>
          </div>
        </div>
      )}

      {/* Utilization Entries */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Utilization History</h4>
        {utilization.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-200 rounded-lg text-slate-500 bg-slate-50/60">
            <p>No fund utilization entries yet</p>
            <p className="text-xs text-slate-400 mt-1">Add your first utilization entry to track expenses</p>
          </div>
        ) : (
          <div className="space-y-3">
            {utilization.map((entry) => {
              const photos = typeof entry.photos === "string" ? JSON.parse(entry.photos || "[]") : entry.photos || [];
              return (
                <div key={entry.id} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(entry.category)}`}>
                          {CATEGORIES.find(c => c.value === entry.category)?.label || entry.category}
                        </span>
                        <span className="text-sm font-semibold text-slate-800">{formatCurrency(entry.amount_used)}</span>
                        <span className="text-xs text-slate-500">
                          {new Date(entry.utilization_date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{entry.description}</p>
                      {photos.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {photos.map((photo, idx) => (
                            <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                              <img src={photo} alt={`Utilization ${idx + 1}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Utilization Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowAddModal(false)} />
          <form onSubmit={handleSubmit} className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Add Fund Utilization</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Partnership *</label>
                <select
                  value={form.partnershipId}
                  onChange={(e) => setForm(prev => ({ ...prev, partnershipId: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select Partnership</option>
                  {partnerships.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.partnership_name || p.project_name || `Partnership ${p.id}`} - {formatCurrency(p.agreed_budget)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what the funds were used for..."
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount Used (₹) *</label>
                  <input
                    type="number"
                    value={form.amount_used}
                    onChange={(e) => setForm(prev => ({ ...prev, amount_used: e.target.value }))}
                    placeholder="0.00"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={form.utilization_date}
                    onChange={(e) => setForm(prev => ({ ...prev, utilization_date: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Photos (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-slate-300 rounded-lg px-4 py-8 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 transition-colors"
                >
                  <Camera size={24} className="text-slate-400" />
                  <span className="text-sm text-slate-600">Click to upload photos or drag and drop</span>
                </label>
                {form.photos.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {form.photos.map((photo, idx) => (
                      <div key={idx} className="relative group">
                        <img src={photo} alt={`Preview ${idx + 1}`} className="w-full h-20 object-cover rounded-lg border border-slate-200" />
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <PlusCircle size={16} />
                    Add Utilization
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}


