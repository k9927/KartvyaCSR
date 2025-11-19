// client/src/components/NGO/SettingsPage.jsx
import React, { useState } from "react";
import { X, CheckCircle, ShieldCheck, Moon, Sun, Trash2, PauseCircle } from "lucide-react";

export default function SettingsPage({
  org = {},
  totalConnections = 0,
  onUpdateOrg,
  onHibernate,
  onCloseAccount,
  showAlert,
}) {
  const [activeTab, setActiveTab] = useState("security");
  const [form, setForm] = useState({
    name: org.name || "",
    darpanId: org.darpanId || "",
    email: org.email || "",
    address: org.address || "",
    contactPerson: org.contactPerson || "",
  });

  // security state
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [loginHistory] = useState([
    { id: 1, when: "2025-10-23 09:12", device: "Chrome • Windows", ip: "203.0.113.45" },
    { id: 2, when: "2025-09-02 18:41", device: "Safari • iOS", ip: "198.51.100.9" },
  ]);

  // preferences
  const [darkMode, setDarkMode] = useState(false);
  const [publicProfile, setPublicProfile] = useState(true);
  const [showConnectionsCount] = useState(true);

  // account management modals
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [confirmHibernateOpen, setConfirmHibernateOpen] = useState(false);

  // Handlers
  const handleSaveProfile = () => {
    if (!form.name || !form.email) return showAlert?.("Please fill name & email", "error");
    onUpdateOrg?.(form);
    showAlert?.("✅ Profile updated", "success");
  };

  const handleChangePassword = () => {
    if (!currentPwd || !newPwd) return showAlert?.("Fill current and new password", "error");
    setCurrentPwd("");
    setNewPwd("");
    showAlert?.("🔒 Password changed", "success");
  };

  const handleThemeToggle = () => {
    setDarkMode((s) => !s);
    showAlert?.(darkMode ? "Light mode" : "Dark mode", "info");
  };

  const handleHibernate = () => {
    setConfirmHibernateOpen(false);
    onHibernate?.();
    showAlert?.("🟡 Account hibernated (temporary)", "info");
  };

  const handleClose = () => {
    setConfirmCloseOpen(false);
    onCloseAccount?.();
    showAlert?.("🗑️ Account scheduled for deletion", "error");
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-50 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Settings
          </h2>
          <p className="text-sm text-slate-500">
            Manage security, account preferences and account lifecycle
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-slate-500">Total Connections</p>
            <p className="text-sm font-medium">{totalConnections}</p>
          </div>
          <div className="px-3 py-2 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-2">
            <CheckCircle size={18} /> Verified
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 border-b pb-3">
        <button
          onClick={() => setActiveTab("security")}
          className={`px-3 py-2 rounded-t ${
            activeTab === "security"
              ? "bg-white border border-b-0 shadow-sm"
              : "text-slate-500"
          }`}
        >
          <ShieldCheck size={14} className="inline mr-2" /> Sign-in & Security
        </button>
        <button
          onClick={() => setActiveTab("preferences")}
          className={`px-3 py-2 rounded-t ${
            activeTab === "preferences"
              ? "bg-white border border-b-0 shadow-sm"
              : "text-slate-500"
          }`}
        >
          <Sun size={14} className="inline mr-2" /> Preferences
        </button>
        <button
          onClick={() => setActiveTab("account")}
          className={`px-3 py-2 rounded-t ${
            activeTab === "account"
              ? "bg-white border border-b-0 shadow-sm"
              : "text-slate-500"
          }`}
        >
          <PauseCircle size={14} className="inline mr-2" /> Account Management
        </button>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "security" && (
          <section className="grid md:grid-cols-2 gap-6">
            {/* Left: Change password */}
            <div className="bg-slate-50 p-4 rounded border">
              <h3 className="font-semibold mb-2">Change Password</h3>
              <input
                type="password"
                placeholder="Current password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                className="w-full border p-2 rounded mb-2"
              />
              <input
                type="password"
                placeholder="New password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                className="w-full border p-2 rounded mb-3"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setCurrentPwd("");
                    setNewPwd("");
                  }}
                  className="px-3 py-2 bg-slate-100 rounded"
                >
                  Reset
                </button>
                <button
                  onClick={handleChangePassword}
                  className="px-3 py-2 bg-indigo-600 text-white rounded"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Right: Login history */}
            <div className="bg-slate-50 p-4 rounded border">
              <h3 className="font-semibold mb-2">Recent Sign-ins</h3>
              <div className="space-y-2">
                {loginHistory.map((h) => (
                  <div
                    key={h.id}
                    className="flex justify-between items-center p-2 rounded bg-white"
                  >
                    <div>
                      <div className="text-sm font-medium">{h.device}</div>
                      <div className="text-xs text-slate-400">
                        {h.when} • {h.ip}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">—</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === "preferences" && (
          <section className="grid md:grid-cols-2 gap-6">
            <div className="p-4 rounded border bg-slate-50">
              <h3 className="font-semibold mb-2">Profile & Display</h3>
              <label className="text-xs text-slate-500">Organization Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                className="w-full border p-2 rounded mb-2"
              />
              <label className="text-xs text-slate-500">Email</label>
              <input
                value={form.email}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                className="w-full border p-2 rounded mb-2"
              />
              <label className="text-xs text-slate-500">NGO Darpan ID</label>
              <input
                value={form.darpanId}
                onChange={(e) => setForm((s) => ({ ...s, darpanId: e.target.value }))}
                className="w-full border p-2 rounded mb-2"
              />
              <label className="text-xs text-slate-500">Contact person</label>
              <input
                value={form.contactPerson}
                onChange={(e) => setForm((s) => ({ ...s, contactPerson: e.target.value }))}
                className="w-full border p-2 rounded mb-2"
              />
              <label className="text-xs text-slate-500">Address</label>
              <textarea
                value={form.address}
                onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
                className="w-full border p-2 rounded mb-3"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setForm({
                      name: org.name || "",
                      darpanId: org.darpanId || "",
                      email: org.email || "",
                      address: org.address || "",
                      contactPerson: org.contactPerson || "",
                    });
                    showAlert?.("Reset", "info");
                  }}
                  className="px-3 py-2 bg-slate-100 rounded"
                >
                  Reset
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="px-3 py-2 bg-indigo-600 text-white rounded"
                >
                  Save Profile
                </button>
              </div>
            </div>

            <div className="p-4 rounded border bg-slate-50">
              <h3 className="font-semibold mb-2">Display & Privacy</h3>

              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-medium">Theme</div>
                  <div className="text-xs text-slate-400">
                    Toggle light/dark mode
                  </div>
                </div>
                <button
                  onClick={handleThemeToggle}
                  className="px-3 py-2 border rounded flex items-center gap-2"
                >
                  {darkMode ? <Moon /> : <Sun />} {darkMode ? "Dark" : "Light"}
                </button>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-medium">Public profile</div>
                  <div className="text-xs text-slate-400">
                    Control what external companies see
                  </div>
                </div>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={publicProfile}
                    onChange={() => setPublicProfile((s) => !s)}
                  />
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Show connections count</div>
                  <div className="text-xs text-slate-400">
                    Toggle visibility in directory
                  </div>
                </div>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showConnectionsCount}
                    onChange={() =>
                      showAlert?.("This is a demo toggle", "info")
                    }
                  />
                </label>
              </div>
            </div>
          </section>
        )}

        {activeTab === "account" && (
          <section className="grid md:grid-cols-2 gap-6">
            <div className="p-4 rounded border bg-slate-50">
              <h3 className="font-semibold mb-2">Account Lifecycle</h3>
              <p className="text-sm text-slate-500 mb-3">
                Hibernate your account (temporary) or permanently close. Closing
                will require admin verification.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmHibernateOpen(true)}
                  className="px-3 py-2 bg-yellow-50 text-yellow-700 rounded flex items-center gap-2"
                >
                  <PauseCircle /> Hibernate
                </button>
                <button
                  onClick={() => setConfirmCloseOpen(true)}
                  className="px-3 py-2 bg-red-50 text-red-700 rounded flex items-center gap-2"
                >
                  <Trash2 /> Close Account
                </button>
              </div>
            </div>

            <div className="p-4 rounded border bg-slate-50">
              <h3 className="font-semibold mb-2">Account Activity</h3>
              <p className="text-sm text-slate-500 mb-2">
                Recent important actions
              </p>
              <ul className="space-y-2 text-sm">
                <li>Profile updated — 2025-10-19</li>
                <li>Password changed — 2025-09-01</li>
              </ul>
            </div>
          </section>
        )}
      </div>

      {/* Confirm modals */}
      {confirmHibernateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setConfirmHibernateOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-lg p-6 z-10 w-full max-w-md">
            <h3 className="text-lg font-semibold">Hibernate account?</h3>
            <p className="text-sm text-slate-500 mt-2">
              Your profile will be hidden and you can reactivate later by
              signing in.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirmHibernateOpen(false)}
                className="px-3 py-2 bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleHibernate}
                className="px-3 py-2 bg-yellow-600 text-white rounded"
              >
                Hibernate
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmCloseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setConfirmCloseOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-lg p-6 z-10 w-full max-w-md">
            <h3 className="text-lg font-semibold text-red-700">
              Close account permanently?
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              This action is irreversible. All data may be deleted.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirmCloseOpen(false)}
                className="px-3 py-2 bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleClose}
                className="px-3 py-2 bg-red-600 text-white rounded"
              >
                Close account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
