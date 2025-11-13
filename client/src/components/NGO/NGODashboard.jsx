import AnalyticsPage from "./AnalyticsPage";
import SettingsPage from "./SettingsPage"; // adjust path if different
import ReportsPage from "./ReportsPage.jsx"; // adjust path if file sits in same folder
import FundingPage from "./FundingPage";
import { Bell } from "lucide-react";

import React, { useState, useMemo, useRef, useEffect } from "react";

import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import {
    Menu, X, CheckCircle, HandCoins, FolderKanban, Users, TrendingUp,
    Home, BarChart2, FileText, Settings, LogOut, Calendar, MapPin, FilePlus,
    Edit2, Trash2, CheckSquare, Eye, PlusCircle,
} from "lucide-react";

/**
 * NGODashboard — extended with Active Projects (ProjectsPage + modals)
 * Paste/replace your current NGODashboard with this file.
 * Keep dependencies: recharts, lucide-react, tailwind CSS.
 */

export default function NGODashboard() {
    // ---------- Global UI state ----------
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeNav, setActiveNav] = useState("dashboard");
    const [alert, setAlert] = useState(null);
    const showAlert = (text, kind = "info") => {
        setAlert({ text, kind, id: Date.now() });
        setTimeout(() => setAlert(null), 3000);
    };

    // ---------- CSR Requests (existing) ----------
    const [csrRequests, setCsrRequests] = useState([
        { id: 1, company: "GreenEarth Pvt Ltd", project: "Tree Plantation Drive", budget: "₹2,00,000", message: "Partnering for environmental restoration", receivedAt: "2025-10-19" },
        { id: 2, company: "TechForGood", project: "Digital Literacy Camp", budget: "₹1,50,000", message: "CSR for rural education", receivedAt: "2025-10-22" },
    ]);

    // ---------- Connections (simplified) ----------
    const [acceptedConnections, setAcceptedConnections] = useState([
        { id: 101, company: "HydroCare Ltd", connectedAt: "2025-09-20", contact: { name: "Arjun Patel", phone: "+91 98765 43210", email: "arjun@hydrocare.com" }, sharedInfo: "Funding for clean water initiative" },
        { id: 102, company: "EduCorp India", connectedAt: "2025-08-02", contact: { name: "Meera Rao", phone: "+91 91234 56789", email: "meera@educorp.in" }, sharedInfo: "School renovation support" },
    ]);

    // --- Connections state & handlers (add near csrRequests / acceptedConnections) ---
    const [connectionHistory, setConnectionHistory] = useState([
        { id: 9001, company: "OldPartner Ltd", action: "Closed", note: "Project completed", date: "2025-07-15" },
    ]);
    const [connSearchQuery, setConnSearchQuery] = useState("");
    const [connFilterTab, setConnFilterTab] = useState("incoming"); // incoming | accepted | history

    // modal states
    const [messageModal, setMessageModal] = useState({ open: false, company: null });
    const [scheduleModal, setScheduleModal] = useState({ open: false, company: null });
    const [profileModal, setProfileModal] = useState({ open: false, company: null });

    // actions (reuse / duplicate logic so ConnectionsPage works standalone)
    // Accept a CSR request and update counts (removes from csrRequests, adds to acceptedConnections & history)
    const acceptConnectionRequest = (reqId) => {
        const req = csrRequests.find(r => r.id === reqId);
        if (!req) return;

        // remove from pending requests
        setCsrRequests(prev => prev.filter(r => r.id !== reqId));

        // add to accepted connections
        const newConn = {
            id: Date.now(),
            company: req.company,
            connectedAt: new Date().toISOString().slice(0, 10),
            contact: { name: "TBD", phone: "", email: "" },
            sharedInfo: req.project + " — " + req.budget,
        };
        setAcceptedConnections(prev => [newConn, ...prev]);

        // add to connection history
        setConnectionHistory(prev => [{ id: Date.now() + 1, company: req.company, action: "Accepted", note: req.project, date: new Date().toISOString().slice(0, 10) }, ...prev]);

        showAlert(`✅ Accepted connection from ${req.company}`, "success");
    };


    const declineConnectionRequest = (reqId, reason = "Declined by NGO") => {
        const req = csrRequests.find(r => r.id === reqId);
        if (!req) return;
        setCsrRequests(s => s.filter(r => r.id !== reqId));
        setConnectionHistory(s => [{ id: Date.now() + 2, company: req.company, action: "Declined", note: reason, date: new Date().toISOString().slice(0, 10) }, ...s]);
        showAlert(`❌ Declined ${req.company}`, "error");
    };

    const closeConnection = (connId, note = "Closed by NGO") => {
        const conn = acceptedConnections.find(c => c.id === connId);
        if (!conn) return;
        setAcceptedConnections(s => s.filter(c => c.id !== connId));
        setConnectionHistory(s => [{ id: Date.now() + 3, company: conn.company, action: "Closed", note, date: new Date().toISOString().slice(0, 10) }, ...s]);
        showAlert(`🔒 Closed connection with ${conn.company}`, "info");
    };

    const scheduleConnMeeting = (company, datetime, link) => {
        setConnectionHistory(s => [{ id: Date.now() + 4, company, action: "Meeting Scheduled", note: `${datetime} | ${link || "no link"}`, date: new Date().toISOString().slice(0, 10) }, ...s]);
        setScheduleModal({ open: false, company: null });
        showAlert(`📅 Meeting scheduled with ${company} on ${datetime}`, "success");
    };

    const sendConnMessage = (company, text) => {
        setConnectionHistory(s => [{ id: Date.now() + 5, company, action: "Message Sent", note: text.slice(0, 80), date: new Date().toISOString().slice(0, 10) }, ...s]);
        setMessageModal({ open: false, company: null });
        showAlert(`✉️ Message sent to ${company}`, "success");
    };


    // ---------- Fund data for pie chart ----------
    const [fundData, setFundData] = useState([
        { name: "HydroCare Ltd", value: 300000 },
        { name: "EduCorp India", value: 175000 },
        { name: "GreenEarth Pvt Ltd", value: 200000 },
    ]);

    const COLORS = ["#14b8a6", "#ec4899", "#8b5cf6"];

    // ---------- Projects data (NEW) ----------
    const [projects, setProjects] = useState([
        {
            id: 201,
            name: "Clean Water Initiative",
            donor: "HydroCare Ltd",
            funds: 300000,
            fundsDisplay: "₹3,00,000",
            progress: 80,
            beneficiaries: 1200,
            location: "Pune, Maharashtra",
            status: "active", // active | completed | archived
            startDate: "2025-05-10",
            endDate: null,
            documents: [
                { id: "d1", name: "MoU.pdf", uploadedAt: "2025-05-11" },
            ],
            description: "Install community filters across 10 villages, awareness sessions.",
        },
        {
            id: 202,
            name: "School Renovation",
            donor: "EduCorp India",
            funds: 175000,
            fundsDisplay: "₹1,75,000",
            progress: 55,
            beneficiaries: 450,
            location: "Thrissur, Kerala",
            status: "active",
            startDate: "2025-07-01",
            endDate: null,
            documents: [],
            description: "Classroom repairs, painting, furniture & sanitary works.",
        },
    ]);

    // ---------- Projects page UI state ----------
    const [projectsQuery, setProjectsQuery] = useState("");
    const [projectsFilter, setProjectsFilter] = useState("all"); // all | active | completed | archived
    const [projectsSort, setProjectsSort] = useState("newest"); // newest | progress_desc | progress_asc
    // notification dropdown state
    const [notifOpen, setNotifOpen] = useState(false);

    const notifRef = useRef(null);
    useEffect(() => {
        function handleClickOutside(event) {
            if (
                notifRef.current &&
                !notifRef.current.contains(event.target) &&
                bellRef.current &&
                !bellRef.current.contains(event.target)
            ) {
                setNotifOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const bellRef = useRef(null);

    // safe compute: handle case connectionHistory may be undefined
    const notifications = (connectionHistory || [])
        .filter(h => h.action === "Message Sent" || h.action === "Message" || h.action === "Message Sent via UI")
        .slice(0, 5);

    // Modals for projects
    const [viewProject, setViewProject] = useState(null); // project object
    const [editProject, setEditProject] = useState(null); // project object for editing
    const [addProjectOpen, setAddProjectOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, projectId: null });

    // ---------- Helper functions (projects) ----------
    const addProject = (project) => {
        const newProject = { ...project, id: Date.now(), documents: [], startDate: (new Date()).toISOString().slice(0, 10), status: "active" };
        setProjects((s) => [newProject, ...s]);
        // history: project created
        setConnectionHistory(prev => [{ id: Date.now() + 13, company: newProject.donor || newProject.name, action: "Project Created", note: newProject.name, date: (new Date()).toISOString().slice(0, 10) }, ...prev]);
        showAlert("✅ Project added", "success");
        setAddProjectOpen(false);
    };

    const updateProject = (id, patch) => {
        setProjects((s) => s.map(p => p.id === id ? { ...p, ...patch } : p));
        showAlert("✅ Project updated", "success");
        setEditProject(null);
    };

    const uploadDocument = (projectId, fileName) => {
        setProjects((s) => s.map(p => p.id === projectId ? { ...p, documents: [{ id: Date.now(), name: fileName, uploadedAt: (new Date()).toISOString().slice(0, 10) }, ...p.documents] } : p));
        showAlert("📎 Document uploaded", "info");
    };

    const markComplete = (projectId) => {
        const proj = projects.find(p => p.id === projectId);
        setProjects((s) => s.map(p => p.id === projectId ? { ...p, status: "completed", progress: 100, endDate: (new Date()).toISOString().slice(0, 10) } : p));
        // Add connection history entry tied to this project's donor (so it appears under Connections -> History)
        if (proj) {
            setConnectionHistory(prev => [{ id: Date.now() + 10, company: proj.donor || proj.name, action: "Project Completed", note: proj.name, date: (new Date()).toISOString().slice(0, 10) }, ...prev]);
        }
        showAlert("🎉 Project marked complete", "success");
    };

    const archiveProject = (projectId) => {
        const proj = projects.find(p => p.id === projectId);
        setProjects((s) => s.map(p => p.id === projectId ? { ...p, status: "archived" } : p));
        if (proj) {
            setConnectionHistory(prev => [{ id: Date.now() + 11, company: proj.donor || proj.name, action: "Project Archived", note: proj.name, date: (new Date()).toISOString().slice(0, 10) }, ...prev]);
        }
        showAlert("📦 Project archived", "info");
    };

    const deleteProject = (projectId) => {
        const proj = projects.find(p => p.id === projectId);
        setProjects((s) => s.filter(p => p.id !== projectId));
        setConfirmDelete({ open: false, projectId: null });
        if (proj) {
            setConnectionHistory(prev => [{ id: Date.now() + 14, company: proj.donor || proj.name, action: "Project Deleted", note: proj.name, date: (new Date()).toISOString().slice(0, 10) }, ...prev]);
        }
        showAlert("🗑️ Project deleted", "error");
    };


    const unarchiveProject = (projectId) => {
        const proj = projects.find(p => p.id === projectId);
        setProjects((s) => s.map(p => p.id === projectId ? { ...p, status: "active" } : p));
        if (proj) {
            setConnectionHistory(prev => [{ id: Date.now() + 12, company: proj.donor || proj.name, action: "Project Restored", note: proj.name, date: (new Date()).toISOString().slice(0, 10) }, ...prev]);
        }
        showAlert("✅ Project restored from archive", "success");
    };



    // ---------- Projects filter/sort/search ----------
    const filteredProjects = useMemo(() => {
        let res = projects.slice();
        if (projectsFilter !== "all") res = res.filter(p => p.status === projectsFilter);
        if (projectsQuery) {
            const q = projectsQuery.toLowerCase();
            res = res.filter(p => p.name.toLowerCase().includes(q) || p.donor.toLowerCase().includes(q) || p.location.toLowerCase().includes(q));
        }
        if (projectsSort === "newest") res = res.sort((a, b) => b.id - a.id);
        if (projectsSort === "progress_desc") res = res.sort((a, b) => b.progress - a.progress);
        if (projectsSort === "progress_asc") res = res.sort((a, b) => a.progress - b.progress);
        return res;
    }, [projects, projectsQuery, projectsFilter, projectsSort]);

    // ---------- Reuse existing connections/page handlers ----------
    const openConnectionsFromCard = (defaultTab = "accepted") => {
        setActiveNav("connections");
        setSidebarOpen(false);
        // if you had filterTab for connections, set it here (not in this snippet).
    };

    // ---------- Small reusable UI pieces ----------
    const ProgressBar = ({ value }) => (
        <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${value}%` }} />
        </div>
    );

    // ---------- Projects Modals ----------
    function ViewProjectModal({ project, onClose }) {
        if (!project) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/30" onClick={onClose} />
                <div className="relative bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 z-10">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold">{project.name}</h3>
                            <p className="text-sm text-slate-500">{project.donor} • {project.location}</p>
                            <p className="text-xs text-slate-400 mt-1">Started: {project.startDate} {project.endDate ? `• End: ${project.endDate}` : ""}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => { setEditProject(project); }} className="px-3 py-1 rounded-md bg-indigo-600 text-white flex items-center gap-2"><Edit2 /> Edit</button>
                            <button onClick={() => setConfirmDelete({ open: true, projectId: project.id })} className="px-3 py-1 rounded-md bg-red-50 text-red-600 flex items-center gap-2"><Trash2 /> Delete</button>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-slate-600">{project.description}</p>
                            <div className="mt-4">
                                <p className="text-xs text-slate-500">Beneficiaries</p>
                                <p className="font-medium">{project.beneficiaries}</p>
                            </div>
                            <div className="mt-3">
                                <p className="text-xs text-slate-500">Funds</p>
                                <p className="font-medium">{project.fundsDisplay}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs text-slate-500">Progress</p>
                            <div className="mt-2">
                                <div className="flex items-center gap-3">
                                    <div style={{ width: 120 }}><ProgressBar value={project.progress} /></div>
                                    <div className="text-sm font-medium">{project.progress}%</div>
                                </div>

                                <div className="mt-4">
                                    <p className="text-xs text-slate-500">Documents</p>
                                    {project.documents.length === 0 ? (
                                        <p className="text-sm text-slate-500 mt-2">No documents uploaded</p>
                                    ) : (
                                        <ul className="mt-2 space-y-2">
                                            {project.documents.map(doc => (
                                                <li key={doc.id} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                                                    <div className="flex items-center gap-2">
                                                        <FilePlus size={16} />
                                                        <div>
                                                            <div className="text-sm font-medium">{doc.name}</div>
                                                            <div className="text-xs text-slate-400">Uploaded: {doc.uploadedAt}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-slate-400">View</div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                <div className="mt-4">
                                    <label className="block text-xs text-slate-500">Upload document (local demo)</label>
                                    <input type="file" onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) uploadDocument(project.id, f.name);
                                    }} className="mt-2" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        {project.status === "archived" ? (
                            <>
                                <button
                                    onClick={() => unarchiveProject(project.id)}
                                    className="px-4 py-2 rounded-md bg-emerald-600 text-white flex items-center gap-2"
                                >
                                    Restore
                                </button>
                                <button onClick={onClose} className="px-4 py-2 rounded-md bg-slate-100">Close</button>
                            </>
                        ) : (
                            <>
                                {project.status !== "completed" && (
                                    <button onClick={() => markComplete(project.id)} className="px-4 py-2 rounded-md bg-green-600 text-white flex items-center gap-2"><CheckSquare /> Mark Complete</button>
                                )}
                                <button onClick={() => archiveProject(project.id)} className="px-4 py-2 rounded-md bg-yellow-50 text-yellow-700">Archive</button>
                                <button onClick={onClose} className="px-4 py-2 rounded-md bg-slate-100">Close</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    function EditProjectModal({ project, onClose }) {
        if (!project) return null;
        const [form, setForm] = useState({
            name: project.name, donor: project.donor, fundsDisplay: project.fundsDisplay,
            progress: project.progress, beneficiaries: project.beneficiaries, location: project.location, description: project.description
        });

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/30" onClick={onClose} />
                <div className="relative bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 z-10">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Edit Project</h3>
                        <button onClick={onClose}><X /></button>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="col-span-2 border p-2 rounded" />
                        <input value={form.donor} onChange={(e) => setForm(f => ({ ...f, donor: e.target.value }))} className="border p-2 rounded" />
                        <input value={form.fundsDisplay} onChange={(e) => setForm(f => ({ ...f, fundsDisplay: e.target.value }))} className="border p-2 rounded" />
                        <input value={String(form.progress)} onChange={(e) => setForm(f => ({ ...f, progress: Math.max(0, Math.min(100, Number(e.target.value || 0))) }))} type="number" min={0} max={100} className="border p-2 rounded" />
                        <input value={String(form.beneficiaries)} onChange={(e) => setForm(f => ({ ...f, beneficiaries: Number(e.target.value || 0) }))} type="number" className="border p-2 rounded" />
                        <input value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} className="border p-2 rounded col-span-2" />
                        <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="col-span-2 border p-2 rounded" />
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                        <button onClick={onClose} className="px-4 py-2 rounded-md bg-slate-100">Cancel</button>
                        <button onClick={() => { updateProject(project.id, { ...form, funds: parseInt(form.fundsDisplay.replace(/\D/g, ''), 10) || project.funds }); }} className="px-4 py-2 rounded-md bg-indigo-600 text-white">Save</button>
                    </div>
                </div>
            </div>
        );
    }

    function AddProjectModal({ open, onClose }) {
        const [form, setForm] = useState({ name: "", donor: "", fundsDisplay: "", progress: 0, beneficiaries: 0, location: "", description: "" });
        if (!open) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/30" onClick={onClose} />
                <div className="relative bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 z-10">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Add Project</h3>
                        <button onClick={onClose}><X /></button>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <input placeholder="Project name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="col-span-2 border p-2 rounded" />
                        <input placeholder="Donor" value={form.donor} onChange={(e) => setForm(f => ({ ...f, donor: e.target.value }))} className="border p-2 rounded" />
                        <input placeholder="Funds (₹)" value={form.fundsDisplay} onChange={(e) => setForm(f => ({ ...f, fundsDisplay: e.target.value }))} className="border p-2 rounded" />
                        <input placeholder="Progress (%)" type="number" min={0} max={100} value={form.progress} onChange={(e) => setForm(f => ({ ...f, progress: Number(e.target.value || 0) }))} className="border p-2 rounded" />
                        <input placeholder="Beneficiaries" type="number" value={form.beneficiaries} onChange={(e) => setForm(f => ({ ...f, beneficiaries: Number(e.target.value || 0) }))} className="border p-2 rounded" />
                        <input placeholder="Location" value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} className="border p-2 rounded col-span-2" />
                        <textarea placeholder="Short description" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="col-span-2 border p-2 rounded" />
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                        <button onClick={onClose} className="px-4 py-2 rounded-md bg-slate-100">Cancel</button>
                        <button onClick={() => addProject({ ...form, funds: parseInt(form.fundsDisplay.replace(/\D/g, ''), 10) || 0, fundsDisplay: form.fundsDisplay })} className="px-4 py-2 rounded-md bg-green-600 text-white">Add</button>
                    </div>
                </div>
            </div>
        );
    }

    function ConfirmDeleteModal({ open, projectId, onCancel, onConfirm }) {
        if (!open) return null;
        const project = projects.find(p => p.id === projectId);
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
                <div className="relative bg-white rounded-xl shadow-lg w-full max-w-md p-6 z-10">
                    <h3 className="text-lg font-semibold">Delete project?</h3>
                    <p className="text-sm text-slate-500 mt-2">This will permanently remove <span className="font-medium">{project?.name}</span>. This action cannot be undone.</p>
                    <div className="mt-4 flex justify-end gap-2">
                        <button onClick={onCancel} className="px-4 py-2 rounded-md bg-slate-100">Cancel</button>
                        <button onClick={() => onConfirm(projectId)} className="px-4 py-2 rounded-md bg-red-600 text-white">Delete</button>
                    </div>
                </div>
            </div>
        );
    }

    function ConnectionsPage() {
        const inFiltered = useMemo(() => csrRequests.filter(r => r.company.toLowerCase().includes(connSearchQuery.toLowerCase())), [csrRequests, connSearchQuery]);
        const acceptedFiltered = useMemo(() => acceptedConnections.filter(c => c.company.toLowerCase().includes(connSearchQuery.toLowerCase())), [acceptedConnections, connSearchQuery]);
        const historyFiltered = useMemo(() => connectionHistory.filter(h => h.company.toLowerCase().includes(connSearchQuery.toLowerCase())), [connectionHistory, connSearchQuery]);

        const searchRef = useRef(null);
        useEffect(() => {
            const t = setTimeout(() => searchRef.current?.focus?.(), 50);
            return () => clearTimeout(t);
        }, []);

        return (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-50">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Connections</h2>
                        <p className="text-sm text-slate-500">Manage incoming requests, partners & history</p>
                    </div>

                    <div className="flex gap-2 items-center">
                        <div className="flex items-center bg-slate-100 rounded-lg px-3 py-2 shadow-sm">
                            <input
                                ref={searchRef}
                                value={connSearchQuery}
                                onChange={(e) => setConnSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                placeholder="Search companies..."
                                className="bg-transparent outline-none text-sm"
                                autoFocus
                                autoComplete="off"
                            />
                        </div>

                        <button onClick={() => setConnFilterTab("incoming")} className={`px-3 py-2 rounded-lg ${connFilterTab === "incoming" ? "bg-indigo-50" : "hover:bg-slate-50"}`}>Incoming</button>
                        <button onClick={() => setConnFilterTab("accepted")} className={`px-3 py-2 rounded-lg ${connFilterTab === "accepted" ? "bg-indigo-50" : "hover:bg-slate-50"}`}>Accepted</button>
                        <button onClick={() => setConnFilterTab("history")} className={`px-3 py-2 rounded-lg ${connFilterTab === "history" ? "bg-indigo-50" : "hover:bg-slate-50"}`}>History</button>
                    </div>
                </div>

                <div>
                    {connFilterTab === "incoming" && (
                        <div>
                            <h3 className="text-sm text-slate-600 mb-2">Incoming Requests</h3>
                            {inFiltered.length === 0 ? <div className="p-6 rounded-md border border-dashed text-slate-500">No incoming requests</div> : inFiltered.map(req => (
                                <div key={req.id} className="flex items-start justify-between gap-4 p-4 border-b">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-50 rounded-full grid place-items-center text-indigo-600 font-semibold">{req.company.split(" ").map(s => s[0]).slice(0, 2).join("")}</div>
                                            <div>
                                                <p className="font-semibold">{req.company}</p>
                                                <p className="text-sm text-slate-500">{req.project} • <span className="text-purple-600">{req.budget}</span></p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 italic mt-2">{req.message}</p>
                                        <p className="text-xs text-slate-400 mt-1">Received: {req.receivedAt}</p>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex gap-2">
                                            <button onClick={() => acceptConnectionRequest(req.id)} className="px-3 py-1 rounded-lg bg-green-600 text-white">Accept</button>
                                            <button onClick={() => declineConnectionRequest(req.id)} className="px-3 py-1 rounded-lg bg-red-600 text-white">Decline</button>
                                        </div>
                                        <div className="text-xs text-slate-400">ID: {req.id}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {connFilterTab === "accepted" && (
                        <div>
                            <h3 className="text-sm text-slate-600 mb-2">Accepted Connections</h3>
                            {acceptedFiltered.length === 0 ? <div className="p-6 rounded-md border border-dashed text-slate-500">No accepted connections</div> : acceptedFiltered.map(conn => (
                                <div key={conn.id} className="flex items-center justify-between gap-4 p-4 border-b">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-cyan-50 rounded-full grid place-items-center text-cyan-600 font-semibold">{conn.company.split(" ").map(s => s[0]).slice(0, 2).join("")}</div>
                                        <div>
                                            <p className="font-semibold">{conn.company}</p>
                                            <p className="text-sm text-slate-500">Connected: {conn.connectedAt}</p>
                                            <p className="text-sm text-slate-600 mt-1">{conn.sharedInfo}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setMessageModal({ open: true, company: conn.company })} className="px-3 py-1 rounded-lg bg-indigo-600 text-white">Message</button>
                                        <button onClick={() => setScheduleModal({ open: true, company: conn.company })} className="px-3 py-1 rounded-lg bg-emerald-600 text-white">Schedule</button>
                                        <button onClick={() => setProfileModal({ open: true, company: conn })} className="px-3 py-1 rounded-lg bg-slate-100">Profile</button>
                                        <button onClick={() => closeConnection(conn.id)} className="px-3 py-1 rounded-lg bg-red-50 text-red-600">Close</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {connFilterTab === "history" && (
                        <div>
                            <h3 className="text-sm text-slate-600 mb-2">Connection History</h3>
                            {historyFiltered.length === 0 ? <div className="p-6 rounded-md border border-dashed text-slate-500">No history</div> : historyFiltered.map(h => (
                                <div key={h.id} className="flex items-start justify-between gap-4 p-3 border-b">
                                    <div>
                                        <p className="font-medium">{h.company} <span className="text-xs text-slate-400">• {h.date}</span></p>
                                        <p className="text-sm text-slate-600">{h.action} — {h.note}</p>
                                    </div>
                                    <div className="text-xs text-slate-400">{h.id}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* simple modals reused from earlier patterns */}
                {messageModal.open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/30" onClick={() => setMessageModal({ open: false, company: null })}></div>
                        <div className="relative bg-white rounded-xl shadow-lg p-6 w-full max-w-lg z-10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold">Message {messageModal.company}</h3>
                                <button onClick={() => setMessageModal({ open: false, company: null })}><X /></button>
                            </div>
                            <textarea className="w-full border rounded p-3 min-h-[120px]" placeholder="Write message..." onKeyDown={(e) => { if (e.key === 'Enter') { sendConnMessage(messageModal.company, e.target.value); } }} />
                            <div className="flex justify-end gap-2 mt-3">
                                <button onClick={() => setMessageModal({ open: false, company: null })} className="px-3 py-2 bg-slate-100 rounded">Cancel</button>
                                <button onClick={() => { sendConnMessage(messageModal.company, 'Sent via UI'); }} className="px-3 py-2 bg-indigo-600 text-white rounded">Send</button>
                            </div>
                        </div>
                    </div>
                )}

                {scheduleModal.open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/30" onClick={() => setScheduleModal({ open: false, company: null })}></div>
                        <div className="relative bg-white rounded-xl shadow-lg p-6 w-full max-w-md z-10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold">Schedule — {scheduleModal.company}</h3>
                                <button onClick={() => setScheduleModal({ open: false, company: null })}><X /></button>
                            </div>
                            <input type="datetime-local" className="w-full border rounded p-2" id="schedDt" />
                            <input type="url" className="w-full border rounded p-2 mt-2" placeholder="Meeting link (optional)" id="schedLink" />
                            <div className="flex justify-end gap-2 mt-3">
                                <button onClick={() => setScheduleModal({ open: false, company: null })} className="px-3 py-2 bg-slate-100 rounded">Cancel</button>
                                <button onClick={() => { const dt = document.getElementById('schedDt')?.value; const l = document.getElementById('schedLink')?.value; scheduleConnMeeting(scheduleModal.company, dt, l); }} className="px-3 py-2 bg-green-600 text-white rounded">Schedule</button>
                            </div>
                        </div>
                    </div>
                )}

                {profileModal.open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/30" onClick={() => setProfileModal({ open: false, company: null })}></div>
                        <div className="relative bg-white rounded-xl shadow-lg p-6 w-full max-w-lg z-10">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">{profileModal.company.company} — Profile</h3>
                                <button onClick={() => setProfileModal({ open: false, company: null })}><X /></button>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500">Contact</p>
                                    <p className="font-medium">{profileModal.company.contact?.name || "Not provided"}</p>
                                    <p className="text-sm">{profileModal.company.contact?.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Connected</p>
                                    <p className="font-medium">{profileModal.company.connectedAt}</p>
                                    <p className="text-xs text-slate-500 mt-3">Shared</p>
                                    <p>{profileModal.company.sharedInfo}</p>
                                </div>
                            </div>
                            <div className="mt-4 text-right">
                                <button onClick={() => setProfileModal({ open: false, company: null })} className="px-3 py-2 bg-slate-100 rounded">Close</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }


    // ---------- Projects Page UI ----------
    function ProjectsPage() {
        const searchRef = useRef(null);

        // auto-focus when ProjectsPage mounts
        useEffect(() => {
            // small timeout to ensure element is present and not immediately stolen by other handlers
            const t = setTimeout(() => {
                searchRef.current?.focus?.();
                // optional: select existing text
                // searchRef.current?.select?.();
            }, 50);
            return () => clearTimeout(t);
        }, []);

        return (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-50">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent font-[Poppins]">Active Projects</h2>
                        <p className="text-sm text-slate-500">Manage your projects, donors, progress and documents</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-slate-100 rounded-lg px-3 py-2 shadow-sm">
                            <input
                                ref={searchRef}
                                value={projectsQuery}
                                onChange={(e) => setProjectsQuery(e.target.value)}
                                onKeyDown={(e) => e.stopPropagation()}        /* prevent parent shortcuts stealing focus */
                                onMouseDown={(e) => e.stopPropagation()}      /* prevent pointer handlers stealing focus */
                                placeholder="Search projects, donor, location..."
                                className="bg-transparent outline-none text-sm"
                                autoFocus
                                autoComplete="off"
                                inputMode="search"
                                aria-label="Search projects"
                            />
                        </div>

                        <select value={projectsFilter} onChange={(e) => setProjectsFilter(e.target.value)} className="border rounded px-3 py-2 text-sm">
                            <option value="all">All</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="archived">Archived</option>
                        </select>

                        <select value={projectsSort} onChange={(e) => setProjectsSort(e.target.value)} className="border rounded px-3 py-2 text-sm">
                            <option value="newest">Newest</option>
                            <option value="progress_desc">Progress (High → Low)</option>
                            <option value="progress_asc">Progress (Low → High)</option>
                        </select>

                        <button onClick={() => setAddProjectOpen(true)} className="px-3 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2">
                            <PlusCircle /> Add Project
                        </button>
                    </div>
                </div>

                <div className="mt-6 grid gap-4">
                    {filteredProjects.length === 0 ? (
                        <div className="p-6 rounded border border-dashed text-slate-500">No projects found</div>
                    ) : (
                        filteredProjects.map((p) => (
                            <div key={p.id} className="p-4 rounded-lg border hover:shadow-md transition-all bg-white flex items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-indigo-50 grid place-items-center text-indigo-700 font-semibold">
                                        {p.name.split(" ").map(s => s[0]).slice(0, 2).join("")}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-semibold">{p.name}</h3>
                                            <div className="text-xs text-slate-400 px-2 py-1 rounded bg-slate-100">{p.status}</div>
                                        </div>
                                        <p className="text-sm text-slate-500">{p.donor} • {p.location}</p>
                                        <p className="text-xs text-slate-400 mt-1">Beneficiaries: <span className="font-medium">{p.beneficiaries}</span> • Funds: <span className="font-medium">{p.fundsDisplay}</span></p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 min-w-[280px]">
                                    <div className="w-48">
                                        <ProgressBar value={p.progress} />
                                        <div className="text-xs text-slate-500 mt-2">{p.progress}% completed</div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setViewProject(p)} className="px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center gap-2"><Eye /> View</button>

                                        {p.status === "archived" ? (
                                            <button
                                                onClick={() => unarchiveProject(p.id)}
                                                className="px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center gap-2"
                                            >
                                                Restore
                                            </button>
                                        ) : (
                                            <>
                                                <button onClick={() => setEditProject(p)} className="px-3 py-1 rounded-md bg-indigo-600 text-white flex items-center gap-2"><Edit2 /> Edit</button>
                                                <button onClick={() => setConfirmDelete({ open: true, projectId: p.id })} className="px-3 py-1 rounded-md bg-red-50 text-red-600 flex items-center gap-2"><Trash2 /> Delete</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }


    // ---------- Main Layout (keeps your existing header/footer/cards) ----------
    // NOTE: Dashboard cards will open Projects page when clicking Active Projects card.
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex text-slate-800 font-[Poppins]">
            {/* Overlay for sidebar */}
            {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 h-full bg-white/95 backdrop-blur-md shadow-xl transform transition-transform duration-300 z-30 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} w-64`}>
                <div className="p-6 border-b flex items-center justify-between">
                    <h2 className="text-2xl font-extrabold bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent">Kartvya</h2>
                    <button onClick={() => setSidebarOpen(false)} className="p-1 rounded hover:bg-slate-100"><X /></button>
                </div>

                <nav className="p-4 space-y-1">
                    {[
                        { id: "dashboard", label: "Dashboard", icon: Home },
                        { id: "analytics", label: "Analytics", icon: BarChart2 },
                        { id: "funding", label: "Funding", icon: HandCoins },
                        { id: "projects", label: "Projects", icon: FolderKanban },
                        { id: "connections", label: "Connections", icon: Users },
                        { id: "reports", label: "Reports", icon: FileText },
                        { id: "settings", label: "Settings", icon: Settings },
                    ].map(item => {
                        const Icon = item.icon;
                        const active = activeNav === item.id;
                        return (
                            <button key={item.id} onClick={() => { setActiveNav(item.id); setSidebarOpen(false); }} className={`w-full text-left flex items-center gap-3 p-3 rounded-lg ${active ? "bg-indigo-50 ring-1 ring-indigo-200" : "hover:bg-slate-50"}`}>
                                <Icon size={18} className={active ? "text-indigo-600" : "text-slate-500"} />
                                <span className={`font-medium ${active ? "text-indigo-700" : "text-slate-600"}`}>{item.label}</span>
                            </button>
                        );
                    })}

                    <div className="mt-4 border-t pt-4">
                        <button className="w-full flex items-center gap-3 p-3 rounded-lg text-red-600 hover:bg-red-50"><LogOut size={18} /><span className="font-medium">Logout</span></button>
                    </div>
                </nav>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="flex items-center justify-between p-6 bg-white border-b shadow sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="p-2 bg-white border rounded-lg shadow-sm hover:shadow-md"><Menu size={20} /></button>
                        <div>
                            <h1 className="text-xl font-bold text-indigo-700">Hope Foundation</h1>
                            <p className="text-sm text-slate-500">Empowering Lives Through CSR Initiatives</p>
                        </div>
                    </div>

                    {/* Header right side — notifications + verified badge */}
                    <div className="flex items-center gap-6">
                        {/* Notification Bell */}
                        <div className="relative">
                            <button
                                ref={bellRef}
                                onClick={() => setNotifOpen(!notifOpen)}
                                className="p-2 bg-white border rounded-lg shadow-sm hover:shadow-md relative"
                            >
                                <Bell size={20} />
                            </button>

                            {notifOpen && (
                                <div
                                    ref={notifRef}
                                    className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border p-4 z-50"
                                >
                                    <h4 className="font-semibold text-slate-700 mb-3">Messages</h4>

                                    {notifications.length === 0 ? (
                                        <p className="text-sm text-slate-500">No messages yet</p>
                                    ) : (
                                        <div className="space-y-3 max-h-60 overflow-y-auto">
                                            {notifications.map((n) => (
                                                <div key={n.id} className="p-3 bg-slate-50 rounded border">
                                                    <p className="font-medium text-sm">{n.company}</p>
                                                    <p className="text-xs text-slate-500">{n.note}</p>
                                                    <p className="text-[10px] text-slate-400 mt-1">{n.date}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Verified Badge (unchanged) */}
                        <div className="relative flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-full px-4 py-2 shadow-md">
                            <CheckCircle size={22} className="text-emerald-600" />
                            <div className="flex flex-col leading-tight">
                                <span className="text-sm font-semibold text-emerald-700">Verified Organization</span>
                                <span className="text-[11px] text-green-700">
                                    Badge ID: <span className="text-emerald-600 font-semibold">VF-2025-011</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content: show Projects page or Dashboard */}
                <main className="p-6">
                    {activeNav === "analytics" ? (
                        <AnalyticsPage
                            projects={projects}
                            fundData={fundData}
                            connectionHistory={connectionHistory}
                            acceptedConnections={acceptedConnections}
                            showAlert={showAlert}
                        />
                    ) : activeNav === "reports" ? (
                        <ReportsPage
                            projects={projects}
                            connectionHistory={connectionHistory}
                            fundData={fundData}
                            showAlert={showAlert}
                        />
                    ) : activeNav === "projects" ? (
                        <>
                            <ProjectsPage />
                            {/* Project modals */}
                            <ViewProjectModal project={viewProject} onClose={() => setViewProject(null)} />
                            <EditProjectModal project={editProject} onClose={() => setEditProject(null)} />
                            <AddProjectModal open={addProjectOpen} onClose={() => setAddProjectOpen(false)} />
                            <ConfirmDeleteModal
                                open={confirmDelete.open}
                                projectId={confirmDelete.projectId}
                                onCancel={() => setConfirmDelete({ open: false, projectId: null })}
                                onConfirm={(id) => deleteProject(id)}
                            />
                        </>
                    ) : activeNav === "connections" ? (
                        <>
                            {alert && (
                                <div className="max-w-xl mx-auto">
                                    <div
                                        className={`p-3 rounded-md text-sm ${alert.kind === "success"
                                            ? "bg-green-50 text-green-700"
                                            : alert.kind === "error"
                                                ? "bg-red-50 text-red-700"
                                                : "bg-indigo-50 text-indigo-700"
                                            }`}
                                    >
                                        {alert.text}
                                    </div>
                                </div>
                            )}
                            <ConnectionsPage />
                        </>
                    ) : activeNav === "funding" ? (
                        <FundingPage
                            fundData={fundData}
                            setFundData={setFundData}
                            projects={projects}
                            setProjects={setProjects}
                            connectionHistory={connectionHistory}
                            setConnectionHistory={setConnectionHistory}
                            acceptedConnections={acceptedConnections}
                            showAlert={showAlert}
                        />
                    ) : activeNav === "settings" ? (
                        <SettingsPage
                            org={{ name: "Hope Foundation", darpanId: "VF-2025-011", email: "info@hope.org" }} // pass real data
                            totalConnections={acceptedConnections.length}
                            onUpdateOrg={(updated) => {
                                // optional: integrate with parent state or API
                                showAlert("Profile saved (demo)", "success");
                            }}
                            onHibernate={() => { /* optional parent handler */ }}
                            onCloseAccount={() => { /* optional parent handler */ }}
                            showAlert={showAlert}
                        />
                    ) :
                        (
                            <>
                                {/* Dashboard stat cards (clickable) */}
                                <section className="grid md:grid-cols-4 gap-6">
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => setActiveNav("funding")}
                                        className="bg-gradient-to-br from-teal-50 to-cyan-100 rounded-2xl shadow-sm p-5 border hover:border-cyan-300 hover:shadow-lg hover:scale-105 transform-gpu transition-all duration-300 cursor-pointer"
                                    >
                                        <p className="text-sm text-slate-500">Total Funds</p>
                                        <div className="flex justify-between items-center mt-1">
                                            <h2 className="text-3xl font-extrabold text-cyan-700">
                                                ₹
                                                {fundData
                                                    .reduce((sum, d) => sum + d.value, 0)
                                                    .toLocaleString("en-IN")}
                                            </h2>
                                            <div className="bg-cyan-200 p-2 rounded-lg">
                                                <HandCoins size={28} />
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => setActiveNav("projects")}
                                        className="bg-gradient-to-br from-violet-50 to-purple-100 rounded-2xl shadow-sm p-5 border hover:border-violet-300 hover:shadow-lg hover:scale-105 transform-gpu transition-all duration-300 cursor-pointer"
                                    >
                                        <p className="text-sm text-slate-500">Active Projects</p>
                                        <div className="flex justify-between items-center mt-1">
                                            <h2 className="text-3xl font-extrabold text-violet-700">
                                                {projects.filter((p) => p.status === "active").length}
                                            </h2>
                                            <div className="bg-violet-200 p-2 rounded-lg">
                                                <FolderKanban size={28} />
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => openConnectionsFromCard("accepted")}
                                        className="bg-gradient-to-br from-teal-50 to-cyan-100 rounded-2xl shadow-sm p-5 border hover:border-cyan-300 hover:shadow-lg hover:scale-105 transform-gpu transition-all duration-300 cursor-pointer"
                                    >
                                        <p className="text-sm text-slate-500">Connections</p>
                                        <div className="flex justify-between items-center mt-1">
                                            <h2 className="text-3xl font-extrabold text-cyan-700">
                                                {acceptedConnections.length}
                                            </h2>
                                            <div className="bg-cyan-200 p-2 rounded-lg">
                                                <Users size={28} />
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => setActiveNav("connections")}
                                        className="bg-gradient-to-br from-violet-50 to-purple-100 rounded-2xl shadow-sm p-5 border hover:border-violet-300 hover:shadow-lg hover:scale-105 transform-gpu transition-all duration-300 cursor-pointer"
                                    >
                                        <p className="text-sm text-slate-500">Pending Requests</p>
                                        <div className="flex justify-between items-center mt-1">
                                            <h2 className="text-3xl font-extrabold text-violet-700">
                                                {csrRequests.length}
                                            </h2>
                                            <div className="bg-violet-200 p-2 rounded-lg">
                                                <TrendingUp size={28} />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Two columns: CSR Requests + Fund Chart */}
                                <section className="grid md:grid-cols-2 gap-6 mt-6">
                                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-50 hover:shadow-xl transition-all duration-200">
                                        <h2 className="text-xl font-semibold mb-4">Pending CSR Requests</h2>
                                        {csrRequests.length === 0 ? (
                                            <p className="text-slate-500">No pending requests 🎉</p>
                                        ) : (
                                            csrRequests.map((req) => (
                                                <div
                                                    key={req.id}
                                                    className="border-b py-4 flex justify-between items-center"
                                                >
                                                    <div>
                                                        <h3 className="font-semibold">{req.company}</h3>
                                                        <p className="text-sm text-slate-600">
                                                            {req.project} —{" "}
                                                            <span className="text-purple-600">{req.budget}</span>
                                                        </p>
                                                        <p className="text-xs text-slate-500 italic">{req.message}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => acceptConnectionRequest(req.id)}
                                                            className="px-3 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-all"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => declineConnectionRequest(req.id)}
                                                            className="px-3 py-1 rounded-lg bg-red-600 text-white"
                                                        >
                                                            Decline
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-50 hover:shadow-xl transition-all duration-200">
                                        <h2 className="text-xl font-semibold mb-4">Fund Distribution</h2>
                                        <div className="flex justify-center items-center" style={{ height: 250 }}>
                                            <ResponsiveContainer width="90%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={fundData}
                                                        dataKey="value"
                                                        nameKey="name"
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius={90}
                                                        label
                                                    >
                                                        {fundData.map((entry, index) => (
                                                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </section>
                            </>
                        )}
                </main>

                {/* Footer */}
                <footer className="text-center text-slate-500 text-sm pb-6">
                    © 2025 <span className="text-purple-600 font-semibold">Kartvya CSR Dashboard</span> | Empowering NGOs 💜
                </footer>
            </div>

            {/* Global alerts (inline) */}
            {alert && (
                <div className={`fixed bottom-6 right-6 p-3 rounded shadow z-50 ${alert.kind === "success" ? "bg-green-50 text-green-700" : alert.kind === "error" ? "bg-red-50 text-red-700" : "bg-indigo-50 text-indigo-700"}`}>
                    {alert.text}
                </div>
            )}
        </div>
    );
}
