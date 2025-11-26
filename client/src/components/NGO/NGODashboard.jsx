import AnalyticsPage from "./AnalyticsPage";
import SettingsPage from "./SettingsPage"; // adjust path if different
import ReportsPage from "./ReportsPage.jsx"; // adjust path if file sits in same folder
import FundingPage from "./FundingPage";
import { Bell } from "lucide-react";

import React, { useState, useMemo, useRef, useEffect, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import {
    getUserProfile,
    getNGODashboardStats,
    getNGOProjects,
    createNGOProject,
    updateNGOProject,
    deleteNGOProject,
    getNGORequests,
    acceptCSRRequest,
    rejectCSRRequest,
    getNGOPartnerships,
    logout,
    getNGOHistory,
    getUserNotifications,
    markUserNotificationRead,
    markAllUserNotificationsRead,
    addFundUtilization,
    getPartnershipFundUtilization,
} from "../../services/api";
import ChatDrawer from "../shared/ChatDrawer";
import PartnerChatPanel from "../shared/PartnerChatPanel";
import HistoryPage from "../shared/HistoryPage";

import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import {
    Menu, X, CheckCircle, HandCoins, FolderKanban, Users, TrendingUp,
    Home, BarChart2, FileText, Settings, LogOut, Calendar, MapPin, FilePlus,
    Edit2, Trash2, CheckSquare, Eye, PlusCircle, Send, PanelLeft, PanelLeftClose,
    MessageCircle, Search, History, Briefcase, Camera, Loader2,
} from "lucide-react";

/**
 * NGODashboard — extended with Active Projects (ProjectsPage + modals)
 * Paste/replace your current NGODashboard with this file.
 * Keep dependencies: recharts, lucide-react, tailwind CSS.
 */

export default function NGODashboard() {
    const navigate = useNavigate();
    // ---------- Global UI state ----------
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarPinned, setSidebarPinned] = useState(true);
    const [activeNav, setActiveNav] = useState("dashboard");
    const [alert, setAlert] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState(null);
    const [dashboardStats, setDashboardStats] = useState(null);
    
    const showAlert = (text, kind = "info") => {
        setAlert({ text, kind, id: Date.now() });
        setTimeout(() => setAlert(null), 3000);
    };

    const handleLogout = useCallback(async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            // Clear localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            // Navigate to home page
            navigate('/');
        }
    }, [navigate]);

    // ---------- CSR Requests ----------
    const [csrRequests, setCsrRequests] = useState([]);

    // ---------- Connections / Partnerships ----------
    const [acceptedConnections, setAcceptedConnections] = useState([]);
    const [connectionHistory, setConnectionHistory] = useState([]);
    const [partnerships, setPartnerships] = useState([]); // Store partnerships for Analytics
    const [connSearchQuery, setConnSearchQuery] = useState("");
    const [connFilterTab, setConnFilterTab] = useState("incoming"); // incoming | accepted | history

    // modal states
    const [chatPanel, setChatPanel] = useState({
        open: false,
        partnershipId: null,
        partnerName: "",
        partnerSubtitle: "",
        partnerAvatar: "",
    });
    const [profileModal, setProfileModal] = useState({ open: false, company: null });

    const resetChatPanel = useCallback(() => {
        setChatPanel({
            open: false,
            partnershipId: null,
            partnerName: "",
            partnerSubtitle: "",
            partnerAvatar: "",
        });
    }, []);

    // actions (reuse / duplicate logic so ConnectionsPage works standalone)
    // Accept a CSR request and update counts (removes from csrRequests, adds to acceptedConnections & history)
    const acceptConnectionRequest = async (reqId) => {
        const req = csrRequests.find(r => r.id === reqId);
        if (!req) return;

        try {
            showAlert("Processing acceptance...", "info");
            const response = await acceptCSRRequest(reqId);
            
            if (response.success) {
                // remove from pending requests
                setCsrRequests(prev => prev.filter(r => r.id !== reqId));

                // add to accepted connections
                const partnership = response.data.partnership;
                const newConn = {
                    id: partnership.id,
                    company: req.company,
                    connectedAt: partnership.start_date || new Date().toISOString().slice(0, 10),
                    contact: { name: "TBD", phone: "", email: "" },
                    sharedInfo: req.project + " — " + req.budget,
                    partnershipData: partnership,
                };
                setAcceptedConnections(prev => [newConn, ...prev]);

                // add to connection history
                setConnectionHistory(prev => [{ id: Date.now() + 1, company: req.company, action: "Accepted", note: req.project, date: new Date().toISOString().slice(0, 10) }, ...prev]);

                // Refresh notifications and data
                await fetchNotifications();

                // Refresh data
                const partnershipsResponse = await getNGOPartnerships({ status: 'active' });
                if (partnershipsResponse.success && partnershipsResponse.data) {
                    const parts = partnershipsResponse.data.partnerships || partnershipsResponse.data;
                    const fundDataList = parts.map((p, idx) => ({
                        name: p.company_name || `Partner ${idx + 1}`,
                        value: parseFloat(p.agreed_budget || 0),
                    }));
                    setFundData(fundDataList);
                }

                showAlert(`✅ Accepted connection from ${req.company}`, "success");
            }
        } catch (error) {
            console.error('Error accepting request:', error);
            if (error?.message && (error.message.toLowerCase().includes('already processed') || error.message.toLowerCase().includes('not found'))) {
                setCsrRequests(prev => prev.filter(r => r.id !== reqId));
            }
            showAlert(`Failed to accept request: ${error.message}`, "error");
        }
    };


    const declineConnectionRequest = async (reqId, reason = "Declined by NGO") => {
        const req = csrRequests.find(r => r.id === reqId);
        if (!req) return;

        try {
            showAlert("Processing decline...", "info");
            const response = await rejectCSRRequest(reqId, reason);
            
            if (response.success) {
                setCsrRequests(s => s.filter(r => r.id !== reqId));
                setConnectionHistory(s => [{ id: Date.now() + 2, company: req.company, action: "Declined", note: reason, date: new Date().toISOString().slice(0, 10) }, ...s]);
                
                // Refresh notifications
                await fetchNotifications();
                
                showAlert(`❌ Declined ${req.company}`, "error");
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
            if (error?.message && (error.message.toLowerCase().includes('already processed') || error.message.toLowerCase().includes('not found'))) {
                setCsrRequests(prev => prev.filter(r => r.id !== reqId));
            }
            showAlert(`Failed to reject request: ${error.message}`, "error");
        }
    };

    const closeConnection = (connId, note = "Closed by NGO") => {
        const conn = acceptedConnections.find(c => c.id === connId);
        if (!conn) return;
        setAcceptedConnections(s => s.filter(c => c.id !== connId));
        setConnectionHistory(s => [{ id: Date.now() + 3, company: conn.company, action: "Closed", note, date: new Date().toISOString().slice(0, 10) }, ...s]);
        showAlert(`🔒 Closed connection with ${conn.company}`, "info");
    };

    const openChatWithConnection = useCallback(
        (connection) => {
            if (!connection) return;
            const partnershipId = connection?.partnershipData?.id || connection?.id;
            if (!partnershipId) {
                showAlert("Chat is unavailable for this connection yet.", "error");
                return;
            }
            const initials = connection.company
                ? connection.company
                      .split(" ")
                      .map((word) => word[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                : "";
            setChatPanel({
                open: true,
                partnershipId,
                partnerName: connection.company,
                partnerSubtitle: connection.sharedInfo,
                partnerAvatar: initials,
            });
        },
        [showAlert]
    );


    // ---------- Fund data for pie chart (derived from partnerships) ----------
    const [fundData, setFundData] = useState([]);
    const COLORS = ["#14b8a6", "#ec4899", "#8b5cf6"];

    // ---------- NGO Chat Items (for Partner Chat Panel) ----------
    const ngoChatItems = useMemo(
        () =>
            acceptedConnections
                .filter(conn => conn.partnershipData?.id) // Only include connections with partnership data
                .map((conn) => {
                    const p = conn.partnershipData || {};
                    // Prioritize project_name (actual project title) over partnership_name (CSR request description)
                    // This shows the corporate's initiated project/description prominently
                    const displayName = p.project_name || p.partnership_name || p.project_description || "Partnership";
                    return {
                        id: p.id || conn.id,
                        partnerName: conn.company || "Corporate Partner",
                        projectName: displayName,
                        location: p.project_location || p.location || "Location TBA",
                        fundsDisplay: p.budget_display || `₹${Number(p.agreed_budget || 0).toLocaleString('en-IN')}`,
                        progress: p.progress || 0,
                        partnershipId: p.id || conn.id,
                        raw: conn,
                    };
                }),
        [acceptedConnections]
    );

    // ---------- Projects data ----------
    const [projects, setProjects] = useState([]);

    // ---------- Projects page UI state ----------
    const [projectsQuery, setProjectsQuery] = useState("");
    const [projectsFilter, setProjectsFilter] = useState("all"); // all | active | completed | archived
    const [projectsSort, setProjectsSort] = useState("newest"); // newest | progress_desc | progress_asc
    // notification system
    const [notifications, setNotifications] = useState([]);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifLoading, setNotifLoading] = useState(false);
    const notifRef = useRef(null);
    const bellRef = useRef(null);

    const fetchNotifications = useCallback(async () => {
        try {
            setNotifLoading(true);
            const response = await getUserNotifications({ limit: 50 });
            const payload = Array.isArray(response?.notifications)
                ? response.notifications
                : response?.data?.notifications || [];
            const normalized = payload.map((item) => ({
                id: item.id,
                type: item.type,
                title: item.title,
                message: item.message,
                timestamp: item.created_at || item.timestamp,
                read: Boolean(item.read || item.read_at),
                metadata: item.metadata || {},
            }));
            setNotifications(normalized);
        } catch (error) {
            console.error("Failed to load notifications", error);
        } finally {
            setNotifLoading(false);
        }
    }, []);

    const markAsRead = useCallback(async (id) => {
        try {
            await markUserNotificationRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
        } catch (error) {
            console.error("Failed to mark notification read", error);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            await markAllUserNotificationsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        } catch (error) {
            console.error("Failed to mark notifications read", error);
        }
    }, []);

    const unreadCount = useMemo(() => {
        return notifications.filter((n) => !n.read).length;
    }, [notifications]);

    // Handle click outside notification dropdown
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

    // ---------- Fetch data on mount ----------
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                
                // Fetch user profile
                const profileResponse = await getUserProfile();
                if (profileResponse.success && profileResponse.data) {
                    setUserProfile(profileResponse.data);
                }

                // Fetch notifications
                await fetchNotifications();

                // Fetch dashboard stats
                const statsResponse = await getNGODashboardStats();
                if (statsResponse.success && statsResponse.data) {
                    setDashboardStats(statsResponse.data);
                }

                // Fetch projects
                const projectsResponse = await getNGOProjects();
                if (projectsResponse.success && projectsResponse.data) {
                    const projs = projectsResponse.data.projects || projectsResponse.data;
                    setProjects(projs.map(p => ({
                        id: p.id,
                        name: p.title || p.name,
                        duration: p.duration_months || 12,
                        funds: parseFloat(p.budget_required || p.required_funding || 0),
                        fundsDisplay: p.budget_display || `₹${Number(p.budget_required || p.required_funding || 0).toLocaleString('en-IN')}`,
                        progress: p.progress || 0,
                        beneficiaries: p.beneficiaries_count || 0,
                        location: p.location || "N/A",
                        status: p.status || "draft",
                        startDate: p.start_date || null,
                        endDate: p.end_date || null,
                        documents: [],
                        description: p.description || "",
                    })));
                }

                // Fetch CSR requests
                const requestsResponse = await getNGORequests();
                if (requestsResponse.success && requestsResponse.data) {
                    const reqs = requestsResponse.data.requests || requestsResponse.data;
                    const mappedRequests = reqs.map(r => {
                        const normalizedStatus = (r.status || '').toLowerCase();
                        return {
                            id: r.id,
                            company: r.company_name || "Unknown Company",
                            project: r.project_name || r.description || "General Partnership",
                            budget: r.budget_display || `₹${Number(r.proposed_budget || 0).toLocaleString('en-IN')}`,
                            message: r.message || r.description || "",
                            receivedAt: r.requested_at ? new Date(r.requested_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
                            status: normalizedStatus,
                            rawStatus: r.status,
                            requestData: r, // Keep original for API calls
                        };
                    });
                    const pendingRequests = mappedRequests.filter(req => req.status === 'pending');
                    setCsrRequests(pendingRequests);
                    // Notifications will be created by the useEffect that monitors csrRequests
                }

                // Fetch partnerships (accepted connections)
                const partnershipsResponse = await getNGOPartnerships({ status: 'active' });
                console.log('Partnerships Response:', partnershipsResponse);
                if (partnershipsResponse.success && partnershipsResponse.data) {
                    const parts = partnershipsResponse.data.partnerships || partnershipsResponse.data;
                    console.log('Partnerships found:', parts.length);
                    
                    if (parts.length === 0) {
                        console.warn('No active partnerships found');
                        setPartnerships([]);
                        setFundData([]);
                        setConnectionHistory([]);
                    } else {
                        // Fetch fund utilization for each partnership to get total utilized
                        const partnershipsWithUtilization = await Promise.all(
                            parts.map(async (p) => {
                                try {
                                    const utilResponse = await getPartnershipFundUtilization(p.id);
                                    if (utilResponse.success && utilResponse.data) {
                                        const summary = utilResponse.data.summary || {};
                                        return {
                                            ...p,
                                            total_utilized: parseFloat(summary.total_utilized || 0),
                                            total_funds_utilized: parseFloat(summary.total_utilized || 0),
                                        };
                                    }
                                    return { ...p, total_utilized: 0, total_funds_utilized: 0 };
                                } catch (error) {
                                    console.error(`Error fetching utilization for partnership ${p.id}:`, error);
                                    return { ...p, total_utilized: 0, total_funds_utilized: 0 };
                                }
                            })
                        );
                        
                        console.log('Partnerships with utilization:', partnershipsWithUtilization);
                        
                        // Store partnerships for Analytics with utilization data
                        setPartnerships(partnershipsWithUtilization);
                        
                        setAcceptedConnections(partnershipsWithUtilization.map(p => ({
                            id: p.id,
                            company: p.company_name || "Unknown Company",
                            connectedAt: p.start_date || p.created_at ? new Date(p.start_date || p.created_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
                            contact: { name: "TBD", phone: "", email: "" },
                            // Store all project info for chat display - prioritize project_name over partnership_name
                            sharedInfo: p.project_name || p.partnership_name || p.project_description || `Budget: ${p.budget_display || "N/A"}`,
                            partnershipData: p,
                        })));

                        // Update fund data from partnerships
                        const fundDataList = partnershipsWithUtilization.map((p, idx) => ({
                            name: p.company_name || `Partner ${idx + 1}`,
                            value: parseFloat(p.agreed_budget || 0),
                        }));
                        console.log('Fund Data List:', fundDataList);
                        setFundData(fundDataList);
                        
                        // Build connectionHistory from partnerships for Analytics and Funding pages
                        const historyEntries = partnershipsWithUtilization.map(p => ({
                            id: p.id,
                            company: p.company_name || "Unknown Company",
                            action: "Partnership",
                            note: `Partnership for ${p.project_name || p.partnership_name || "project"} - Budget: ₹${Number(p.agreed_budget || 0).toLocaleString('en-IN')}`,
                            date: p.start_date || p.created_at ? new Date(p.start_date || p.created_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
                            amount: parseFloat(p.agreed_budget || 0),
                        }));
                        console.log('Connection History:', historyEntries);
                        setConnectionHistory(historyEntries);
                    }
                } else {
                    console.warn('Partnerships response not successful:', partnershipsResponse);
                    setPartnerships([]);
                    setFundData([]);
                    setConnectionHistory([]);
                }

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                showAlert(`Failed to load dashboard: ${error.message}`, "error");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Poll for notifications periodically
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Modals for projects
    const [viewProject, setViewProject] = useState(null); // project object
    const [editProject, setEditProject] = useState(null); // project object for editing
    const [addProjectOpen, setAddProjectOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, projectId: null });
    
    // Fund utilization modal state (moved to parent to persist across re-renders)
    // Form state is now managed inside the modal component to prevent re-renders on typing
    const [fundUtilModal, setFundUtilModal] = useState({ open: false, partnership: null });

    // ---------- Helper functions (projects) ----------
    const addProject = async (project) => {
        try {
            showAlert("Creating project...", "info");
            const projectData = {
                name: project.name,
                title: project.name,
                description: project.description || "",
                focus_area: project.focus_area || "general",
                location: project.location || "",
                target_region: project.target_region || null,
                budget_required: parseFloat(project.fundsDisplay.replace(/\D/g, '')) || project.funds || 0,
                beneficiaries_count: project.beneficiaries || null,
                duration_months: project.duration || 12,
                start_date: project.startDate || null,
                end_date: project.endDate || null,
            };

            const response = await createNGOProject(projectData);
            
            if (response.success) {
                const newProject = response.data.project;
                const formattedProject = {
                    id: newProject.id,
                    name: newProject.title || newProject.name,
                    duration: newProject.duration_months || 12,
                    funds: parseFloat(newProject.budget_required || 0),
                    fundsDisplay: newProject.budget_display || `₹${Number(newProject.budget_required || 0).toLocaleString('en-IN')}`,
                    progress: newProject.progress || 0,
                    beneficiaries: newProject.beneficiaries_count || 0,
                    location: newProject.location || "N/A",
                    status: newProject.status || "draft",
                    startDate: newProject.start_date || null,
                    endDate: newProject.end_date || null,
                    documents: [],
                    description: newProject.description || "",
                };
                
                setProjects((s) => [formattedProject, ...s]);
                setConnectionHistory(prev => [{ id: Date.now() + 13, company: formattedProject.name, action: "Project Created", note: formattedProject.name, date: (new Date()).toISOString().slice(0, 10) }, ...prev]);
                showAlert("✅ Project added", "success");
                setAddProjectOpen(false);
            }
        } catch (error) {
            console.error('Error creating project:', error);
            showAlert(`Failed to create project: ${error.message}`, "error");
        }
    };

    const updateProject = async (id, patch) => {
        try {
            showAlert("Updating project...", "info");
            const updates = {
                ...(patch.title !== undefined && { title: patch.title || patch.name }),
                ...(patch.name !== undefined && { title: patch.name }),
                ...(patch.description !== undefined && { description: patch.description }),
                ...(patch.progress !== undefined && { progress: patch.progress }),
                ...(patch.beneficiaries !== undefined && { beneficiaries_count: patch.beneficiaries }),
                ...(patch.location !== undefined && { location: patch.location }),
                ...(patch.status !== undefined && { status: patch.status }),
            };

            if (patch.fundsDisplay || patch.funds) {
                updates.budget_required = parseFloat(patch.fundsDisplay?.replace(/\D/g, '') || patch.funds || 0);
            }

            if (patch.duration !== undefined) {
                updates.duration_months = patch.duration;
            }

            const response = await updateNGOProject(id, updates);
            
            if (response.success) {
                const updated = response.data.project;
                setProjects((s) => s.map(p => p.id === id ? {
                    ...p,
                    name: updated.title || updated.name || p.name,
                    funds: parseFloat(updated.budget_required || p.funds),
                    fundsDisplay: updated.budget_display || p.fundsDisplay,
                    progress: updated.progress || p.progress,
                    beneficiaries: updated.beneficiaries_count || p.beneficiaries,
                    duration: updated.duration_months || p.duration,
                    location: updated.location || p.location,
                    status: updated.status || p.status,
                } : p));
                showAlert("✅ Project updated", "success");
                setEditProject(null);
            }
        } catch (error) {
            console.error('Error updating project:', error);
            showAlert(`Failed to update project: ${error.message}`, "error");
        }
    };

    const uploadDocument = (projectId, fileName) => {
        setProjects((s) => s.map(p => p.id === projectId ? { ...p, documents: [{ id: Date.now(), name: fileName, uploadedAt: (new Date()).toISOString().slice(0, 10) }, ...p.documents] } : p));
        showAlert("📎 Document uploaded", "info");
    };

    const markComplete = async (projectId) => {
        const proj = projects.find(p => p.id === projectId);
        try {
            await updateNGOProject(projectId, {
                status: "completed",
                progress: 100,
                end_date: (new Date()).toISOString().slice(0, 10),
            });
            setProjects((s) => s.map(p => p.id === projectId ? { ...p, status: "completed", progress: 100, endDate: (new Date()).toISOString().slice(0, 10) } : p));
            if (proj) {
                setConnectionHistory(prev => [{ id: Date.now() + 10, company: proj.name, action: "Project Completed", note: proj.name, date: (new Date()).toISOString().slice(0, 10) }, ...prev]);
            }
            showAlert("🎉 Project marked complete", "success");
        } catch (error) {
            console.error('Error marking project complete:', error);
            showAlert(`Failed to mark complete: ${error.message}`, "error");
        }
    };

    const archiveProject = async (projectId) => {
        const proj = projects.find(p => p.id === projectId);
        try {
            await updateNGOProject(projectId, { status: "archived" });
            setProjects((s) => s.map(p => p.id === projectId ? { ...p, status: "archived" } : p));
            if (proj) {
                setConnectionHistory(prev => [{ id: Date.now() + 11, company: proj.name, action: "Project Archived", note: proj.name, date: (new Date()).toISOString().slice(0, 10) }, ...prev]);
            }
            showAlert("📦 Project archived", "info");
        } catch (error) {
            console.error('Error archiving project:', error);
            showAlert(`Failed to archive project: ${error.message}`, "error");
        }
    };

    const deleteProject = async (projectId) => {
        const proj = projects.find(p => p.id === projectId);
        try {
            showAlert("Deleting project...", "info");
            const response = await deleteNGOProject(projectId);
            
            if (response.success) {
                setProjects((s) => s.filter(p => p.id !== projectId));
                setConfirmDelete({ open: false, projectId: null });
                if (proj) {
                    setConnectionHistory(prev => [{ id: Date.now() + 14, company: proj.name, action: "Project Deleted", note: proj.name, date: (new Date()).toISOString().slice(0, 10) }, ...prev]);
                }
                showAlert("🗑️ Project deleted successfully", "success");
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            showAlert(`Failed to delete project: ${error.message}`, "error");
        }
    };


    const unarchiveProject = async (projectId) => {
        const proj = projects.find(p => p.id === projectId);
        try {
            await updateNGOProject(projectId, { status: "active" });
            setProjects((s) => s.map(p => p.id === projectId ? { ...p, status: "active" } : p));
            if (proj) {
                setConnectionHistory(prev => [{ id: Date.now() + 12, company: proj.name, action: "Project Restored", note: proj.name, date: (new Date()).toISOString().slice(0, 10) }, ...prev]);
            }
            showAlert("✅ Project restored from archive", "success");
        } catch (error) {
            console.error('Error restoring project:', error);
            showAlert(`Failed to restore project: ${error.message}`, "error");
        }
    };



    // ---------- Projects filter/sort/search ----------
    const filteredProjects = useMemo(() => {
        let res = projects.slice();
        if (projectsFilter !== "all") res = res.filter(p => p.status === projectsFilter);
        if (projectsQuery) {
            const q = projectsQuery.toLowerCase();
            res = res.filter(p => p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q));
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
        <div className="w-full h-2 rounded-full bg-slate-100">
            <div className="h-2 transition-all bg-green-500 rounded-full" style={{ width: `${value}%` }} />
        </div>
    );

    // ---------- Projects Modals ----------
    function ViewProjectModal({ project, onClose }) {
        if (!project) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/30" onClick={onClose} />
                <div className="relative z-10 w-full max-w-2xl p-6 bg-white shadow-lg rounded-xl">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold">{project.name}</h3>
                            <p className="text-sm text-slate-500">Duration: {project.duration} months • {project.location}</p>
                            <p className="mt-1 text-xs text-slate-400">Started: {project.startDate} {project.endDate ? `• End: ${project.endDate}` : ""}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => { setEditProject(project); }} className="flex items-center gap-2 px-3 py-1 text-white bg-indigo-600 rounded-md"><Edit2 /> Edit</button>
                            <button onClick={() => setConfirmDelete({ open: true, projectId: project.id })} className="flex items-center gap-2 px-3 py-1 text-red-600 rounded-md bg-red-50"><Trash2 /> Delete</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mt-4">
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
                                        <p className="mt-2 text-sm text-slate-500">No documents uploaded</p>
                                    ) : (
                                        <ul className="mt-2 space-y-2">
                                            {project.documents.map(doc => (
                                                <li key={doc.id} className="flex items-center justify-between p-2 rounded bg-slate-50">
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

                    <div className="flex justify-end gap-3 mt-6">
                        {project.status === "archived" ? (
                            <>
                                <button
                                    onClick={() => unarchiveProject(project.id)}
                                    className="flex items-center gap-2 px-4 py-2 text-white rounded-md bg-emerald-600"
                                >
                                    Restore
                                </button>
                                <button onClick={onClose} className="px-4 py-2 rounded-md bg-slate-100">Close</button>
                            </>
                        ) : (
                            <>
                                {project.status !== "completed" && (
                                    <button onClick={() => markComplete(project.id)} className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-md"><CheckSquare /> Mark Complete</button>
                                )}
                                <button onClick={() => archiveProject(project.id)} className="px-4 py-2 text-yellow-700 rounded-md bg-yellow-50">Archive</button>
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
        
        const originalForm = {
            name: project.name || "", 
            duration: project.duration || 12, 
            fundsDisplay: project.fundsDisplay || "",
            beneficiaries: project.beneficiaries || 0, 
            location: project.location || "", 
            description: project.description || ""
        };

        const [form, setForm] = useState(originalForm);
        const [errors, setErrors] = useState({});

        // Check if there are any changes
        const hasChanges = 
            form.name !== originalForm.name ||
            form.duration !== originalForm.duration ||
            form.fundsDisplay !== originalForm.fundsDisplay ||
            form.beneficiaries !== originalForm.beneficiaries ||
            form.location !== originalForm.location ||
            form.description !== originalForm.description;

        // Validate only changed fields
        const validateForm = () => {
            const newErrors = {};
            
            // Only validate fields that have changed
            if (form.name !== originalForm.name) {
                if (!form.name.trim()) {
                    newErrors.name = "Project name is required";
                }
            }
            
            if (form.duration !== originalForm.duration) {
                if (!form.duration || form.duration < 1) {
                    newErrors.duration = "Duration must be at least 1 month";
                }
            }
            
            if (form.fundsDisplay !== originalForm.fundsDisplay) {
                if (!form.fundsDisplay.trim()) {
                    newErrors.fundsDisplay = "Project funds are required";
                } else {
                    const fundsValue = parseInt(form.fundsDisplay.replace(/\D/g, ''), 10);
                    if (isNaN(fundsValue) || fundsValue <= 0) {
                        newErrors.fundsDisplay = "Please enter a valid amount";
                    }
                }
            }
            
            if (form.location !== originalForm.location) {
                if (!form.location.trim()) {
                    newErrors.location = "Project location is required";
                }
            }
            
            if (form.description !== originalForm.description) {
                if (!form.description.trim()) {
                    newErrors.description = "Project description is required";
                }
            }
            
            if (form.beneficiaries !== originalForm.beneficiaries && form.beneficiaries < 0) {
                newErrors.beneficiaries = "Beneficiaries cannot be negative";
            }
            
            setErrors(newErrors);
            return Object.keys(newErrors).length === 0;
        };

        const handleSubmit = () => {
            if (!hasChanges) {
                showAlert("No changes to save", "info");
                return;
            }

            if (validateForm()) {
                const fundsValue = parseInt(form.fundsDisplay.replace(/\D/g, ''), 10) || project.funds || 0;
                updateProject(project.id, { 
                    ...form, 
                    funds: fundsValue, 
                    fundsDisplay: form.fundsDisplay, 
                    duration: form.duration || 12
                });
                setErrors({});
                onClose();
            } else {
                showAlert("Please fix the errors in the changed fields", "error");
            }
        };

        // Form is valid if there are changes and no validation errors
        const isFormValid = hasChanges && Object.keys(errors).length === 0;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/30" onClick={onClose} />
                <div className="relative bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 z-10 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-semibold text-slate-800">Edit Project</h3>
                            <p className="mt-1 text-sm text-slate-500">Update project details</p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 transition-colors rounded-full hover:bg-slate-100"
                        >
                            <X size={20} className="text-slate-500" />
                        </button>
                    </div>

                    <div className="space-y-5">
                        {/* Project Name */}
                        <div className="col-span-2">
                            <label className="block mb-2 text-sm font-medium text-slate-700">
                                Project Name <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="text"
                                value={form.name} 
                                onChange={(e) => {
                                    setForm(f => ({ ...f, name: e.target.value }));
                                    if (errors.name) setErrors({ ...errors, name: null });
                                }}
                                placeholder="e.g., Digital Learning Labs 2.0"
                                className={`w-full border ${errors.name ? 'border-red-300' : 'border-slate-300'} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                            />
                            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                            <p className="mt-1 text-xs text-slate-400">Enter a descriptive name for your project</p>
                    </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Duration */}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-slate-700">
                                    Project Duration (Months) <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="number" 
                                    min="1"
                                    value={form.duration} 
                                    onChange={(e) => {
                                        const val = Number(e.target.value) || 0;
                                        setForm(f => ({ ...f, duration: val }));
                                        if (errors.duration) setErrors({ ...errors, duration: null });
                                    }}
                                    placeholder="12"
                                    className={`w-full border ${errors.duration ? 'border-red-300' : 'border-slate-300'} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                                />
                                {errors.duration && <p className="mt-1 text-xs text-red-500">{errors.duration}</p>}
                                <p className="mt-1 text-xs text-slate-400">How long will this project run?</p>
                            </div>

                            {/* Funds */}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-slate-700">
                                    Project Funds (₹) <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text"
                                    value={form.fundsDisplay} 
                                    onChange={(e) => {
                                        setForm(f => ({ ...f, fundsDisplay: e.target.value }));
                                        if (errors.fundsDisplay) setErrors({ ...errors, fundsDisplay: null });
                                    }}
                                    placeholder="e.g., 32,00,000"
                                    className={`w-full border ${errors.fundsDisplay ? 'border-red-300' : 'border-slate-300'} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                                />
                                {errors.fundsDisplay && <p className="mt-1 text-xs text-red-500">{errors.fundsDisplay}</p>}
                                <p className="mt-1 text-xs text-slate-400">Total budget required for this project</p>
                            </div>
                        </div>

                        {/* Beneficiaries */}
                        <div>
                            <label className="block mb-2 text-sm font-medium text-slate-700">
                                Expected Beneficiaries
                            </label>
                            <input 
                                type="number" 
                                min="0"
                                value={form.beneficiaries} 
                                onChange={(e) => {
                                    const val = Math.max(0, Number(e.target.value || 0));
                                    setForm(f => ({ ...f, beneficiaries: val }));
                                    if (errors.beneficiaries) setErrors({ ...errors, beneficiaries: null });
                                }}
                                placeholder="0"
                                className={`w-full border ${errors.beneficiaries ? 'border-red-300' : 'border-slate-300'} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                            />
                            {errors.beneficiaries && <p className="mt-1 text-xs text-red-500">{errors.beneficiaries}</p>}
                            <p className="mt-1 text-xs text-slate-400">Number of people who will benefit from this project</p>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block mb-2 text-sm font-medium text-slate-700">
                                Project Location <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="text"
                                value={form.location} 
                                onChange={(e) => {
                                    setForm(f => ({ ...f, location: e.target.value }));
                                    if (errors.location) setErrors({ ...errors, location: null });
                                }}
                                placeholder="e.g., Mumbai, Maharashtra"
                                className={`w-full border ${errors.location ? 'border-red-300' : 'border-slate-300'} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                            />
                            {errors.location && <p className="mt-1 text-xs text-red-500">{errors.location}</p>}
                            <p className="mt-1 text-xs text-slate-400">Where will this project be implemented?</p>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block mb-2 text-sm font-medium text-slate-700">
                                Project Description <span className="text-red-500">*</span>
                            </label>
                            <textarea 
                                value={form.description} 
                                onChange={(e) => {
                                    setForm(f => ({ ...f, description: e.target.value }));
                                    if (errors.description) setErrors({ ...errors, description: null });
                                }}
                                placeholder="Describe your project goals, objectives, and expected impact..."
                                rows={4}
                                className={`w-full border ${errors.description ? 'border-red-300' : 'border-slate-300'} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none`}
                            />
                            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                            <p className="mt-1 text-xs text-slate-400">Provide a detailed description of your project</p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-slate-200">
                        <button 
                            onClick={onClose} 
                            className="px-5 py-2.5 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSubmit}
                            disabled={!isFormValid}
                            className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${
                                isFormValid 
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    function AddProjectModal({ open, onClose }) {
        const [form, setForm] = useState({ name: "", duration: 12, fundsDisplay: "", beneficiaries: 0, location: "", description: "" });
        const [errors, setErrors] = useState({});
        
        if (!open) return null;

        const validateForm = () => {
            const newErrors = {};
            
            if (!form.name.trim()) {
                newErrors.name = "Project name is required";
            }
            
            if (!form.duration || form.duration < 1) {
                newErrors.duration = "Duration must be at least 1 month";
            }
            
            if (!form.fundsDisplay.trim()) {
                newErrors.fundsDisplay = "Project funds are required";
            } else {
                const fundsValue = parseInt(form.fundsDisplay.replace(/\D/g, ''), 10);
                if (isNaN(fundsValue) || fundsValue <= 0) {
                    newErrors.fundsDisplay = "Please enter a valid amount";
                }
            }
            
            if (!form.location.trim()) {
                newErrors.location = "Project location is required";
            }
            
            if (!form.description.trim()) {
                newErrors.description = "Project description is required";
            }
            
            if (form.beneficiaries < 0) {
                newErrors.beneficiaries = "Beneficiaries cannot be negative";
            }
            
            setErrors(newErrors);
            return Object.keys(newErrors).length === 0;
        };

        const handleSubmit = () => {
            if (validateForm()) {
                const fundsValue = parseInt(form.fundsDisplay.replace(/\D/g, ''), 10) || 0;
                addProject({ 
                    ...form, 
                    funds: fundsValue, 
                    fundsDisplay: form.fundsDisplay, 
                    duration: form.duration || 12,
                    progress: 0 // Default progress to 0 for new projects
                });
                // Reset form
                setForm({ name: "", duration: 12, fundsDisplay: "", beneficiaries: 0, location: "", description: "" });
                setErrors({});
                onClose();
            } else {
                showAlert("Please fill in all required fields correctly", "error");
            }
        };

        const isFormValid = form.name.trim() && 
                           form.duration >= 1 && 
                           form.fundsDisplay.trim() && 
                           parseInt(form.fundsDisplay.replace(/\D/g, ''), 10) > 0 &&
                           form.location.trim() && 
                           form.description.trim() &&
                           form.beneficiaries >= 0;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/30" onClick={onClose} />
                <div className="relative bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 z-10 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-semibold text-slate-800">Add New Project</h3>
                            <p className="mt-1 text-sm text-slate-500">Fill in the details to create a new project</p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 transition-colors rounded-full hover:bg-slate-100"
                        >
                            <X size={20} className="text-slate-500" />
                        </button>
                    </div>

                    <div className="space-y-5">
                        {/* Project Name */}
                        <div className="col-span-2">
                            <label className="block mb-2 text-sm font-medium text-slate-700">
                                Project Name <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="text"
                                value={form.name} 
                                onChange={(e) => {
                                    setForm(f => ({ ...f, name: e.target.value }));
                                    if (errors.name) setErrors({ ...errors, name: null });
                                }}
                                placeholder="e.g., Digital Learning Labs 2.0"
                                className={`w-full border ${errors.name ? 'border-red-300' : 'border-slate-300'} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                            />
                            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                            <p className="mt-1 text-xs text-slate-400">Enter a descriptive name for your project</p>
                    </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Duration */}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-slate-700">
                                    Project Duration (Months) <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="number" 
                                    min="1"
                                    value={form.duration} 
                                    onChange={(e) => {
                                        const val = Number(e.target.value) || 0;
                                        setForm(f => ({ ...f, duration: val }));
                                        if (errors.duration) setErrors({ ...errors, duration: null });
                                    }}
                                    placeholder="12"
                                    className={`w-full border ${errors.duration ? 'border-red-300' : 'border-slate-300'} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                                />
                                {errors.duration && <p className="mt-1 text-xs text-red-500">{errors.duration}</p>}
                                <p className="mt-1 text-xs text-slate-400">How long will this project run?</p>
                            </div>

                            {/* Funds */}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-slate-700">
                                    Project Funds (₹) <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text"
                                    value={form.fundsDisplay} 
                                    onChange={(e) => {
                                        setForm(f => ({ ...f, fundsDisplay: e.target.value }));
                                        if (errors.fundsDisplay) setErrors({ ...errors, fundsDisplay: null });
                                    }}
                                    placeholder="e.g., 32,00,000"
                                    className={`w-full border ${errors.fundsDisplay ? 'border-red-300' : 'border-slate-300'} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                                />
                                {errors.fundsDisplay && <p className="mt-1 text-xs text-red-500">{errors.fundsDisplay}</p>}
                                <p className="mt-1 text-xs text-slate-400">Total budget required for this project</p>
                            </div>
                        </div>

                        {/* Beneficiaries */}
                        <div>
                            <label className="block mb-2 text-sm font-medium text-slate-700">
                                Expected Beneficiaries
                            </label>
                            <input 
                                type="number" 
                                min="0"
                                value={form.beneficiaries} 
                                onChange={(e) => {
                                    const val = Math.max(0, Number(e.target.value || 0));
                                    setForm(f => ({ ...f, beneficiaries: val }));
                                    if (errors.beneficiaries) setErrors({ ...errors, beneficiaries: null });
                                }}
                                placeholder="0"
                                className={`w-full border ${errors.beneficiaries ? 'border-red-300' : 'border-slate-300'} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                            />
                            {errors.beneficiaries && <p className="mt-1 text-xs text-red-500">{errors.beneficiaries}</p>}
                            <p className="mt-1 text-xs text-slate-400">Number of people who will benefit from this project</p>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block mb-2 text-sm font-medium text-slate-700">
                                Project Location <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="text"
                                value={form.location} 
                                onChange={(e) => {
                                    setForm(f => ({ ...f, location: e.target.value }));
                                    if (errors.location) setErrors({ ...errors, location: null });
                                }}
                                placeholder="e.g., Mumbai, Maharashtra"
                                className={`w-full border ${errors.location ? 'border-red-300' : 'border-slate-300'} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                            />
                            {errors.location && <p className="mt-1 text-xs text-red-500">{errors.location}</p>}
                            <p className="mt-1 text-xs text-slate-400">Where will this project be implemented?</p>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block mb-2 text-sm font-medium text-slate-700">
                                Project Description <span className="text-red-500">*</span>
                            </label>
                            <textarea 
                                value={form.description} 
                                onChange={(e) => {
                                    setForm(f => ({ ...f, description: e.target.value }));
                                    if (errors.description) setErrors({ ...errors, description: null });
                                }}
                                placeholder="Describe your project goals, objectives, and expected impact..."
                                rows={4}
                                className={`w-full border ${errors.description ? 'border-red-300' : 'border-slate-300'} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none`}
                            />
                            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                            <p className="mt-1 text-xs text-slate-400">Provide a detailed description of your project</p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-slate-200">
                        <button 
                            onClick={onClose} 
                            className="px-5 py-2.5 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSubmit}
                            disabled={!isFormValid}
                            className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${
                                isFormValid 
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            Add Project
                        </button>
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
                <div className="relative z-10 w-full max-w-md p-6 bg-white shadow-lg rounded-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
                            <Trash2 size={24} className="text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">Delete Project?</h3>
                            <p className="text-sm text-slate-500">This action cannot be undone</p>
                        </div>
                    </div>
                    <p className="mb-1 text-sm text-slate-600">
                        You are about to permanently delete:
                    </p>
                    <p className="mb-4 text-sm font-medium text-slate-800">
                        "{project?.name}"
                    </p>
                    <p className="mb-6 text-xs text-slate-500">
                        This will completely remove the project from your dashboard. All project data will be lost and cannot be recovered.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={onCancel} 
                            className="px-5 py-2.5 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => onConfirm(projectId)} 
                            className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                            <Trash2 size={16} />
                            Delete Permanently
                        </button>
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
            <div className="p-6 bg-white border shadow-lg rounded-2xl border-indigo-50">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text">Connections</h2>
                        <p className="text-sm text-slate-500">Manage incoming requests, partners & history</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center px-3 py-2 rounded-lg shadow-sm bg-slate-100">
                            <input
                                ref={searchRef}
                                value={connSearchQuery}
                                onChange={(e) => setConnSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                placeholder="Search companies..."
                                className="text-sm bg-transparent outline-none"
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
                            <h3 className="mb-2 text-sm text-slate-600">Incoming Requests</h3>
                            {inFiltered.length === 0 ? <div className="p-6 border border-dashed rounded-md text-slate-500">No incoming requests</div> : inFiltered.map(req => (
                                <div key={req.id} className="flex items-start justify-between gap-4 p-4 border-b">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <div className="grid w-10 h-10 font-semibold text-indigo-600 rounded-full bg-indigo-50 place-items-center">{req.company.split(" ").map(s => s[0]).slice(0, 2).join("")}</div>
                                            <div>
                                                <p className="font-semibold">{req.company}</p>
                                                <p className="text-sm text-slate-500">{req.project} • <span className="text-purple-600">{req.budget}</span></p>
                                            </div>
                                        </div>
                                        <p className="mt-2 text-xs italic text-slate-500">{req.message}</p>
                                        <p className="mt-1 text-xs text-slate-400">Received: {req.receivedAt}</p>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex gap-2">
                                            <button onClick={() => acceptConnectionRequest(req.id)} className="px-3 py-1 text-white bg-green-600 rounded-lg">Accept</button>
                                            <button onClick={() => declineConnectionRequest(req.id)} className="px-3 py-1 text-white bg-red-600 rounded-lg">Decline</button>
                                        </div>
                                        <div className="text-xs text-slate-400">ID: {req.id}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {connFilterTab === "accepted" && (
                        <div>
                            <h3 className="mb-2 text-sm text-slate-600">Accepted Connections</h3>
                            {acceptedFiltered.length === 0 ? <div className="p-6 border border-dashed rounded-md text-slate-500">No accepted connections</div> : acceptedFiltered.map(conn => (
                                <div key={conn.id} className="flex items-center justify-between gap-4 p-4 border-b">
                                    <div className="flex items-center gap-3">
                                        <div className="grid w-10 h-10 font-semibold rounded-full bg-cyan-50 place-items-center text-cyan-600">{conn.company.split(" ").map(s => s[0]).slice(0, 2).join("")}</div>
                                        <div>
                                            <p className="font-semibold">{conn.company}</p>
                                            <p className="text-sm text-slate-500">Connected: {conn.connectedAt}</p>
                                            <p className="mt-1 text-sm text-slate-600">{conn.sharedInfo}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openChatWithConnection(conn)}
                                            className="px-3 py-1 text-white bg-indigo-600 rounded-lg"
                                        >
                                            Chat
                                        </button>
                                        <button onClick={() => setProfileModal({ open: true, company: conn })} className="px-3 py-1 rounded-lg bg-slate-100">Profile</button>
                                        <button onClick={() => closeConnection(conn.id)} className="px-3 py-1 text-red-600 rounded-lg bg-red-50">Close</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {connFilterTab === "history" && (
                        <div>
                            <h3 className="mb-2 text-sm text-slate-600">Connection History</h3>
                            {historyFiltered.length === 0 ? <div className="p-6 border border-dashed rounded-md text-slate-500">No history</div> : historyFiltered.map(h => (
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

                {profileModal.open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/30" onClick={() => setProfileModal({ open: false, company: null })}></div>
                        <div className="relative z-10 w-full max-w-lg p-6 bg-white shadow-lg rounded-xl">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">{profileModal.company.company} — Profile</h3>
                                <button onClick={() => setProfileModal({ open: false, company: null })}><X /></button>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <p className="text-xs text-slate-500">Contact</p>
                                    <p className="font-medium">{profileModal.company.contact?.name || "Not provided"}</p>
                                    <p className="text-sm">{profileModal.company.contact?.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Connected</p>
                                    <p className="font-medium">{profileModal.company.connectedAt}</p>
                                    <p className="mt-3 text-xs text-slate-500">Shared</p>
                                    <p>{profileModal.company.sharedInfo}</p>
                                </div>
                            </div>
                            <div className="mt-4 text-right">
                                <button onClick={() => setProfileModal({ open: false, company: null })} className="px-3 py-2 rounded bg-slate-100">Close</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }


    // ---------- Active Partnerships Page UI ----------
    function ActivePartnershipsPage({ fundUtilModal, setFundUtilModal }) {
        const [partnerships, setPartnerships] = useState([]);
        const [loading, setLoading] = useState(true);
        // Modal state is passed from parent to persist across re-renders

        const modalOpenRef = useRef(false);
        
        // Keep modal state in sync with ref
        useEffect(() => {
            modalOpenRef.current = fundUtilModal.open;
        }, [fundUtilModal.open]);

        const loadPartnerships = useCallback(async (skipIfModalOpen = false) => {
            // Skip reload if modal is open to prevent form from closing
            if (skipIfModalOpen && modalOpenRef.current) {
                return;
            }
            
            try {
                setLoading(true);
                const response = await getNGOPartnerships({ status: 'active' });
                if (response.success && response.data) {
                    const parts = response.data.partnerships || response.data;
                    setPartnerships(parts);
                }
            } catch (error) {
                console.error('Error loading partnerships:', error);
                showAlert(`Failed to load partnerships: ${error.message}`, "error");
            } finally {
                setLoading(false);
            }
        }, [showAlert]);

        useEffect(() => {
            loadPartnerships();
            
            // Listen for partnership updates from modal
            const handlePartnershipUpdate = (event) => {
                const { partnershipId, progress } = event.detail;
                setPartnerships(prev => prev.map(p => 
                    p.id === partnershipId 
                        ? { ...p, progress }
                        : p
                ));
            };
            
            window.addEventListener('partnershipUpdated', handlePartnershipUpdate);
            return () => {
                window.removeEventListener('partnershipUpdated', handlePartnershipUpdate);
            };
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        const ProgressBar = ({ value }) => (
            <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div 
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                />
            </div>
        );

        if (loading) {
            return (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="inline-block w-12 h-12 mb-4 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-slate-600">Loading partnerships...</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div className="p-6 bg-white border shadow-lg rounded-2xl border-indigo-50">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent font-[Poppins]">
                                Active Partnerships
                            </h2>
                            <p className="text-sm text-slate-500">
                                Manage your active partnerships and track progress with corporate partners
                            </p>
                        </div>
                    </div>

                    {partnerships.length === 0 ? (
                        <div className="p-12 text-center border border-dashed rounded-xl text-slate-500 bg-slate-50">
                            <Briefcase size={48} className="mx-auto mb-4 text-slate-400" />
                            <p className="text-lg font-semibold">No active partnerships</p>
                            <p className="mt-2 text-sm text-slate-400">
                                Accept a CSR request to start an active partnership
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {partnerships.map((partnership) => (
                                <div 
                                    key={partnership.id} 
                                    className="p-5 transition-shadow bg-white border border-slate-200 rounded-xl hover:shadow-md"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-slate-800">
                                                    {partnership.project_name || partnership.partnership_name || "Partnership"}
                                                </h3>
                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                    partnership.status === 'active' 
                                                        ? 'bg-green-100 text-green-700' 
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {partnership.status}
                                                </span>
                                            </div>
                                            
                                            {partnership.project_description && (
                                                <p className="mb-3 text-sm text-slate-600 line-clamp-2">
                                                    {partnership.project_description}
                                                </p>
                                            )}
                                            
                                            <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-3">
                                                <div>
                                                    <p className="mb-1 text-xs text-slate-500">Corporate Partner</p>
                                                    <p className="font-medium text-slate-700">
                                                        {partnership.company_name || "Unknown Company"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="mb-1 text-xs text-slate-500">Agreed Budget</p>
                                                    <p className="font-medium text-slate-700">
                                                        {partnership.budget_display || `₹${Number(partnership.agreed_budget || 0).toLocaleString('en-IN')}`}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="mb-1 text-xs text-slate-500">Start Date</p>
                                                    <p className="font-medium text-slate-700">
                                                        {partnership.start_date ? new Date(partnership.start_date).toLocaleDateString('en-IN') : "N/A"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-sm font-medium text-slate-700">Progress</p>
                                                    <span className="text-sm font-semibold text-indigo-600">
                                                        {partnership.progress || 0}%
                                                    </span>
                                                </div>
                                                <ProgressBar value={partnership.progress || 0} />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Form will reset automatically when modal opens (handled in modal component)
                                                    setFundUtilModal({ open: true, partnership });
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500"
                                            >
                                                <Edit2 size={16} />
                                                Update Progress
                                            </button>
                                            <button
                                                onClick={() => openChatWithConnection({
                                                    id: partnership.id,
                                                    company: partnership.company_name,
                                                    partnershipData: partnership
                                                })}
                                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200"
                                            >
                                                <MessageCircle size={16} />
                                                Chat
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

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
            <div className="p-6 bg-white border shadow-lg rounded-2xl border-indigo-50">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent font-[Poppins]">Active Projects</h2>
                        <p className="text-sm text-slate-500">Manage your projects, duration, progress and documents</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center px-3 py-2 rounded-lg shadow-sm bg-slate-100">
                            <input
                                ref={searchRef}
                                value={projectsQuery}
                                onChange={(e) => setProjectsQuery(e.target.value)}
                                onKeyDown={(e) => e.stopPropagation()}        /* prevent parent shortcuts stealing focus */
                                onMouseDown={(e) => e.stopPropagation()}      /* prevent pointer handlers stealing focus */
                                placeholder="Search projects, location..."
                                className="text-sm bg-transparent outline-none"
                                autoFocus
                                autoComplete="off"
                                inputMode="search"
                                aria-label="Search projects"
                            />
                        </div>

                        <select value={projectsFilter} onChange={(e) => setProjectsFilter(e.target.value)} className="px-3 py-2 text-sm border rounded">
                            <option value="all">All</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="archived">Archived</option>
                        </select>

                        <select value={projectsSort} onChange={(e) => setProjectsSort(e.target.value)} className="px-3 py-2 text-sm border rounded">
                            <option value="newest">Newest</option>
                            <option value="progress_desc">Progress (High → Low)</option>
                            <option value="progress_asc">Progress (Low → High)</option>
                        </select>

                        <button onClick={() => setAddProjectOpen(true)} className="flex items-center gap-2 px-3 py-2 text-white bg-indigo-600 rounded-lg">
                            <PlusCircle /> Add Project
                        </button>
                    </div>
                </div>

                <div className="grid gap-4 mt-6">
                    {filteredProjects.length === 0 ? (
                        <div className="p-6 border border-dashed rounded text-slate-500">No projects found</div>
                    ) : (
                        filteredProjects.map((p) => (
                            <div key={p.id} className="flex items-center justify-between gap-4 p-4 transition-all bg-white border rounded-lg hover:shadow-md">
                                <div className="flex items-start gap-4">
                                    <div className="grid w-12 h-12 font-semibold text-indigo-700 rounded-lg bg-indigo-50 place-items-center">
                                        {p.name.split(" ").map(s => s[0]).slice(0, 2).join("")}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-semibold">{p.name}</h3>
                                            <div className="px-2 py-1 text-xs rounded text-slate-400 bg-slate-100">{p.status}</div>
                                        </div>
                                        <p className="text-sm text-slate-500">Duration: {p.duration} months • {p.location}</p>
                                        <p className="mt-1 text-xs text-slate-400">Beneficiaries: <span className="font-medium">{p.beneficiaries}</span> • Funds: <span className="font-medium">{p.fundsDisplay}</span></p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 min-w-[280px]">
                                    <div className="w-48">
                                        <ProgressBar value={p.progress} />
                                        <div className="mt-2 text-xs text-slate-500">{p.progress}% completed</div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setViewProject(p)} className="flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200"><Eye /> View</button>

                                        {p.status === "archived" ? (
                                            <button
                                                onClick={() => unarchiveProject(p.id)}
                                                className="flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                            >
                                                Restore
                                            </button>
                                        ) : (
                                            <>
                                                <button onClick={() => setEditProject(p)} className="flex items-center gap-2 px-3 py-1 text-white bg-indigo-600 rounded-md"><Edit2 /> Edit</button>
                                                <button onClick={() => setConfirmDelete({ open: true, projectId: p.id })} className="flex items-center gap-2 px-3 py-1 text-red-600 rounded-md bg-red-50"><Trash2 /> Delete</button>
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
            <aside className={`fixed top-0 left-0 h-full bg-white/95 backdrop-blur-md shadow-xl transform transition-transform duration-300 z-30 w-64 ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            } ${sidebarPinned ? "lg:translate-x-0" : "lg:-translate-x-full"}`}>
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-2xl font-extrabold text-transparent bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text">Kartvya</h2>
                    <button 
                        onClick={() => setSidebarOpen(false)} 
                        className="p-1 rounded hover:bg-slate-100 lg:hidden"
                    >
                        <X size={18} />
                    </button>
                </div>

                <nav className="p-4 space-y-1">
                    {[
                        { id: "dashboard", label: "Dashboard", icon: Home },
                        { id: "analytics", label: "Analytics", icon: BarChart2 },
                        { id: "funding", label: "Funding", icon: HandCoins },
                        { id: "projects", label: "Projects", icon: FolderKanban },
                        { id: "partnerships", label: "Active Partnerships", icon: Briefcase },
                        { id: "connections", label: "Connections", icon: Users },
                        { id: "chat", label: "Partner Chat", icon: MessageCircle },
                        { id: "history", label: "History", icon: History },
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

                    <div className="pt-4 mt-4 border-t">
                        <button 
                            onClick={handleLogout}
                            className="flex items-center w-full gap-3 p-3 text-red-600 rounded-lg hover:bg-red-50"
                        >
                            <LogOut size={18} />
                            <span className="font-medium">Logout</span>
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Main content */}
            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
                sidebarPinned ? "lg:ml-64" : "lg:ml-0"
            }`}>
                {/* Header */}
                <header className="sticky top-0 z-10 flex items-center justify-between p-6 bg-white border-b shadow">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setSidebarOpen(true)} 
                            className="p-2 bg-white border rounded-lg shadow-sm hover:shadow-md lg:hidden"
                        >
                            <Menu size={20} />
                        </button>
                        <button
                            onClick={() => setSidebarPinned(!sidebarPinned)}
                            className="hidden p-2 transition-colors bg-white border rounded-lg shadow-sm lg:flex hover:shadow-md"
                            aria-label={sidebarPinned ? "Collapse sidebar" : "Expand sidebar"}
                        >
                            {sidebarPinned ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-indigo-700">
                                {userProfile?.profile?.organization_name || userProfile?.user?.name || "NGO Dashboard"}
                            </h1>
                            <p className="text-sm text-slate-500">
                                {userProfile?.profile?.tagline || "Empowering Lives Through CSR Initiatives"}
                            </p>
                        </div>
                    </div>

                    {/* Header right side — notifications + verified badge */}
                    <div className="flex items-center gap-6">
                        {/* Notification Bell */}
                        <div className="relative">
                            <button
                                ref={bellRef}
                                onClick={() => setNotifOpen(!notifOpen)}
                                className="relative p-2 bg-white border rounded-lg shadow-sm hover:shadow-md"
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full -top-1 -right-1">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {notifOpen && (
                                <div
                                    ref={notifRef}
                                    className="absolute right-0 z-50 mt-2 bg-white border shadow-lg w-80 rounded-xl"
                                >
                                    <div className="flex items-center justify-between p-4 border-b">
                                        <h4 className="font-semibold text-slate-700">Notifications</h4>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllAsRead}
                                                className="text-xs text-indigo-600 hover:text-indigo-700"
                                            >
                                                Mark all as read
                                            </button>
                                        )}
                        </div>

                                    <div className="overflow-y-auto max-h-96">
                                        {notifLoading ? (
                                            <div className="p-6 text-center">
                                                <div className="w-8 h-8 mx-auto mb-2 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
                                                <p className="text-sm text-slate-500">Loading notifications...</p>
                                            </div>
                                        ) : notifications.length === 0 ? (
                                            <div className="p-6 text-center">
                                                <Bell size={32} className="mx-auto mb-2 text-slate-300" />
                                                <p className="text-sm text-slate-500">No notifications yet</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y">
                                                {notifications.slice(0, 20).map((n) => {
                                                    const isRead = n.read;
                                                    const getIcon = () => {
                                                        switch(n.type) {
                                                            case 'accepted': return '✅';
                                                            case 'rejected': return '❌';
                                                            case 'meeting': return '📅';
                                                            case 'message': return '✉️';
                                                            case 'fund': return '💰';
                                                            case 'partnership': return '🤝';
                                                            case 'request': return '📥';
                                                            default: return 'ℹ️';
                                                        }
                                                    };
                                                    const getColor = () => {
                                                        switch(n.type) {
                                                            case 'accepted': return 'bg-green-50 border-green-200';
                                                            case 'rejected': return 'bg-red-50 border-red-200';
                                                            case 'meeting': return 'bg-blue-50 border-blue-200';
                                                            case 'message': return 'bg-purple-50 border-purple-200';
                                                            case 'fund': return 'bg-yellow-50 border-yellow-200';
                                                            case 'partnership': return 'bg-indigo-50 border-indigo-200';
                                                            case 'request': return 'bg-cyan-50 border-cyan-200';
                                                            default: return 'bg-slate-50 border-slate-200';
                                                        }
                                                    };
                                                    const timeAgo = (timestamp) => {
                                                        const now = new Date();
                                                        const past = new Date(timestamp);
                                                        const diffMs = now - past;
                                                        const diffMins = Math.floor(diffMs / 60000);
                                                        const diffHours = Math.floor(diffMs / 3600000);
                                                        const diffDays = Math.floor(diffMs / 86400000);
                                                        if (diffMins < 1) return 'Just now';
                                                        if (diffMins < 60) return `${diffMins}m ago`;
                                                        if (diffHours < 24) return `${diffHours}h ago`;
                                                        return `${diffDays}d ago`;
                                                    };
                                                    return (
                                                        <div
                                                            key={n.id}
                                                            onClick={() => markAsRead(n.id)}
                                                            className={`p-3 cursor-pointer transition-colors ${isRead ? 'bg-white' : getColor()} hover:bg-slate-50`}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <span className="text-lg">{getIcon()}</span>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className={`font-medium text-sm ${isRead ? 'text-slate-600' : 'text-slate-800'}`}>
                                                                        {n.title}
                                                                    </p>
                                                                    <p className="mt-1 text-xs text-slate-500">{n.message}</p>
                                                                    <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.timestamp)}</p>
                                                                </div>
                                                                {!isRead && (
                                                                    <span className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5"></span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Verified Badge (unchanged) */}
                        <div className="relative flex items-center gap-3 px-4 py-2 border rounded-full shadow-md bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
                            <CheckCircle size={22} className="text-emerald-600" />
                            <div className="flex flex-col leading-tight">
                                <span className="text-sm font-semibold text-emerald-700">Verified Organization</span>
                                <span className="text-[11px] text-green-700">
                                    Badge ID: <span className="font-semibold text-emerald-600">VF-2025-011</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content: show Projects page or Dashboard */}
                <main className="p-6">
                    {loading && (
                        <div className="flex items-center justify-center min-h-[400px]">
                            <div className="text-center">
                                <div className="inline-block w-12 h-12 mb-4 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
                                <p className="text-slate-600">Loading dashboard...</p>
                            </div>
                        </div>
                    )}
                    {!loading && (
                        <>
                        {activeNav === "analytics" ? (
                        <AnalyticsPage
                            projects={projects}
                            fundData={fundData}
                            connectionHistory={connectionHistory}
                            acceptedConnections={acceptedConnections}
                            partnerships={partnerships}
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
                    ) : activeNav === "partnerships" ? (
                        <ActivePartnershipsPage 
                            key="active-partnerships"
                            fundUtilModal={fundUtilModal}
                            setFundUtilModal={setFundUtilModal}
                        />
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
                    ) : activeNav === "chat" ? (
                        <PartnerChatPanel
                            title="Partner Chat"
                            subtitle="Stay in sync with your corporate partners"
                            items={ngoChatItems}
                            onOpenChat={(item) => openChatWithConnection(item.raw)}
                            onViewDetails={(item) => {
                                // You can implement a view details modal if needed
                                showAlert(`Viewing details for ${item.partnerName}`, "info");
                            }}
                            emptyState={{
                                title: "No chat-ready partnerships",
                                description: "Accept a CSR request to start collaborating with corporate partners.",
                            }}
                            primaryActionLabel="Open Chat"
                            secondaryActionLabel="View details"
                            searchPlaceholder="Search corporate partner or project"
                        />
                    ) : activeNav === "history" ? (
                        <HistoryPage fetchHistory={getNGOHistory} userRole="ngo" />
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
                            <section className="grid gap-6 md:grid-cols-4">
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setActiveNav("funding")}
                                    className="p-5 transition-all duration-300 border shadow-sm cursor-pointer bg-gradient-to-br from-teal-50 to-cyan-100 rounded-2xl hover:border-cyan-300 hover:shadow-lg hover:scale-105 transform-gpu"
                                >
                                    <p className="text-sm text-slate-500">Total Funds</p>
                                    <div className="flex items-center justify-between mt-1">
                                        <h2 className="text-3xl font-extrabold text-cyan-700">
                                            ₹
                                            {fundData
                                                .reduce((sum, d) => sum + d.value, 0)
                                                .toLocaleString("en-IN")}
                                        </h2>
                                        <div className="p-2 rounded-lg bg-cyan-200">
                                            <HandCoins size={28} />
                                        </div>
                                    </div>
                                </div>

                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setActiveNav("projects")}
                                    className="p-5 transition-all duration-300 border shadow-sm cursor-pointer bg-gradient-to-br from-violet-50 to-purple-100 rounded-2xl hover:border-violet-300 hover:shadow-lg hover:scale-105 transform-gpu"
                                >
                                    <p className="text-sm text-slate-500">Active Projects</p>
                                    <div className="flex items-center justify-between mt-1">
                                        <h2 className="text-3xl font-extrabold text-violet-700">
                                                {projects.filter((p) => p.status === "active").length}
                                        </h2>
                                        <div className="p-2 rounded-lg bg-violet-200">
                                            <FolderKanban size={28} />
                                        </div>
                                    </div>
                                </div>

                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => openConnectionsFromCard("accepted")}
                                    className="p-5 transition-all duration-300 border shadow-sm cursor-pointer bg-gradient-to-br from-teal-50 to-cyan-100 rounded-2xl hover:border-cyan-300 hover:shadow-lg hover:scale-105 transform-gpu"
                                >
                                    <p className="text-sm text-slate-500">Connections</p>
                                    <div className="flex items-center justify-between mt-1">
                                        <h2 className="text-3xl font-extrabold text-cyan-700">
                                            {acceptedConnections.length}
                                        </h2>
                                        <div className="p-2 rounded-lg bg-cyan-200">
                                            <Users size={28} />
                                        </div>
                                    </div>
                                </div>

                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setActiveNav("connections")}
                                    className="p-5 transition-all duration-300 border shadow-sm cursor-pointer bg-gradient-to-br from-violet-50 to-purple-100 rounded-2xl hover:border-violet-300 hover:shadow-lg hover:scale-105 transform-gpu"
                                >
                                    <p className="text-sm text-slate-500">Pending Requests</p>
                                    <div className="flex items-center justify-between mt-1">
                                        <h2 className="text-3xl font-extrabold text-violet-700">
                                            {dashboardStats?.pendingRequests || csrRequests.filter(r => r.status === 'pending').length}
                                        </h2>
                                        <div className="p-2 rounded-lg bg-violet-200">
                                            <TrendingUp size={28} />
                                        </div>
                                    </div>
                                </div>
                            </section>

                                {/* Requests Monitor Section */}
                                <section className="grid gap-6 lg:grid-cols-[2fr,1fr] mt-6">
                                    <div className="p-6 bg-white border shadow-sm border-indigo-50 rounded-2xl">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-lg font-semibold text-slate-800">
                                                    Requests Monitor
                                                </h2>
                                                <p className="text-sm text-slate-500">
                                                    Track incoming CSR requests and responses
                                                </p>
                                            </div>
                                            <Send size={18} className="text-indigo-500" />
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 mt-6 sm:grid-cols-3">
                                            {[
                                                {
                                                    label: "Received",
                                                    value: csrRequests.length,
                                                    tone: "bg-indigo-50 text-indigo-600",
                                                },
                                                {
                                                    label: "Pending",
                                                    value: csrRequests.filter(r => r.status === 'pending').length,
                                                    tone: "bg-amber-50 text-amber-600",
                                                },
                                                {
                                                    label: "Active Partnerships",
                                                    value: acceptedConnections.length,
                                                    tone: "bg-emerald-50 text-emerald-600",
                                                },
                                            ].map((metric) => (
                                                <div
                                                    key={metric.label}
                                                    className={`rounded-xl px-4 py-3 text-sm font-medium ${metric.tone}`}
                                                >
                                                    <div className="text-xs tracking-wide uppercase text-slate-500">
                                                        {metric.label}
                                                    </div>
                                                    <div className="mt-2 text-2xl">
                                                        {metric.value.toLocaleString("en-IN")}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-6">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-sm font-semibold text-slate-700">
                                                    Recent Requests
                                                </h3>
                                                <span className="text-xs text-slate-400">
                                                    Showing {Math.min(csrRequests.length, 4)} of {csrRequests.length}
                                                </span>
                                            </div>
                                    {csrRequests.length === 0 ? (
                                                <div className="p-4 text-sm border border-dashed rounded-lg text-slate-500">
                                                    No requests received yet. Your projects will appear here when corporates send CSR requests.
                                                </div>
                                            ) : (
                                                <ul className="space-y-3">
                                                    {csrRequests.slice(0, 4).map((item) => (
                                                        <li
                                                            key={item.id}
                                                            className="flex items-start justify-between gap-3 p-3 border rounded-xl border-slate-100 bg-slate-50/60"
                                                        >
                                                            <div className="flex-1">
                                                                <div className="text-sm font-semibold text-slate-700">
                                                                    {item.company}
                                                                </div>
                                                                <div className="mt-1 text-xs text-slate-500">
                                                                    {item.project} • {item.budget}
                                                                </div>
                                                                {item.message && (
                                                                    <div className="mt-1 text-xs italic text-slate-400 line-clamp-1">
                                                                        {item.message}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span
                                                                className={`text-xs px-3 py-1 rounded-full font-medium shrink-0 ${
                                                                    item.status === "accepted" || item.status === "Accepted"
                                                                        ? "bg-emerald-100 text-emerald-600"
                                                                        : item.status === "rejected" || item.status === "Rejected"
                                                                        ? "bg-rose-100 text-rose-600"
                                                                        : "bg-amber-100 text-amber-600"
                                                                }`}
                                                            >
                                                                {item.status === "pending" ? "Pending" : item.status}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>

                                        {csrRequests.filter(r => r.status === 'pending').length > 0 && (
                                            <div className="mt-6">
                                                <h3 className="mb-2 text-sm font-semibold text-slate-700">
                                                    Pending Requests
                                                </h3>
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    {csrRequests.filter(r => r.status === 'pending').slice(0, 2).map((item) => (
                                                        <div
                                                            key={item.id}
                                                            className="p-3 border rounded-xl border-amber-100 bg-amber-50/60"
                                                        >
                                                            <div className="text-sm font-medium text-slate-700">
                                                                {item.company}
                                                </div>
                                                            <div className="mt-1 text-xs text-slate-500 line-clamp-2">
                                                                {item.project}
                                                            </div>
                                                            <div className="flex gap-2 mt-2">
                                                    <button
                                                                    onClick={() => acceptConnectionRequest(item.id)}
                                                                    className="px-2 py-1 text-xs text-white bg-green-600 rounded-md hover:bg-green-700"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                                    onClick={() => declineConnectionRequest(item.id)}
                                                                    className="px-2 py-1 text-xs text-red-600 rounded-md bg-red-50 hover:bg-red-100"
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            </div>
                                                    ))}
                                                </div>
                                            </div>
                                    )}
                                </div>

                                    <div className="p-6 bg-white border shadow-sm border-indigo-50 rounded-2xl">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h2 className="text-lg font-semibold text-slate-800">
                                                    Fund Distribution
                                                </h2>
                                                <p className="text-sm text-slate-500">
                                                    Distribution across partnerships
                                                </p>
                                            </div>
                                            <BarChart2 size={20} className="text-indigo-500" />
                                        </div>
                                        {fundData.length === 0 ? (
                                            <div className="grid h-64 border border-dashed place-items-center text-slate-500 rounded-xl">
                                                Not enough data yet
                                            </div>
                                        ) : (
                                            <div className="h-64">
                                                <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={fundData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={90}
                                                            innerRadius={50}
                                                            paddingAngle={4}
                                                            label={({ name, value }) =>
                                                                `${name} (₹${(value / 100000).toFixed(1)}L)`
                                                            }
                                                >
                                                    {fundData.map((entry, index) => (
                                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                        <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Active Projects and Recent Activity */}
                                <section className="grid gap-6 mt-6 lg:grid-cols-2">
                                    <div className="p-6 bg-white border shadow-sm border-indigo-50 rounded-2xl">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h2 className="text-lg font-semibold text-slate-800">
                                                    Active Projects
                                                </h2>
                                                <p className="text-sm text-slate-500">
                                                    Projects currently in progress
                                                </p>
                                            </div>
                                            <FolderKanban size={20} className="text-indigo-500" />
                                        </div>
                                        {projects.filter(p => p.status === "active").length === 0 ? (
                                            <div className="p-4 text-sm border border-dashed rounded-lg text-slate-500">
                                                No active projects to display yet.
                                            </div>
                                        ) : (
                                            <ul className="space-y-4">
                                                {projects.filter(p => p.status === "active").slice(0, 4).map((project) => (
                                                    <li
                                                        key={project.id}
                                                        className="p-4 border rounded-xl border-slate-100 bg-slate-50/60"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1">
                                                                <div className="text-sm font-semibold text-slate-700">
                                                                    {project.name}
                                                                </div>
                                                                <div className="mt-1 text-xs text-slate-500">
                                                                    {project.location} • {project.duration} months
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-right text-slate-500">
                                                                {project.fundsDisplay}
                                                            </div>
                                                        </div>
                                                        <div className="mt-3">
                                                            <ProgressBar value={project.progress} />
                                                            <div className="flex justify-between mt-2 text-xs text-slate-500">
                                                                <span>{project.status || "In progress"}</span>
                                                                <span>{Math.round(project.progress || 0)}%</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 mt-3">
                                                            <button
                                                                onClick={() => setViewProject(project)}
                                                                className="flex items-center gap-2 px-3 py-1 text-xs text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                                                            >
                                                                <Eye size={14} />
                                                                View
                                                            </button>
                                                            <button
                                                                onClick={() => setEditProject(project)}
                                                                className="flex items-center gap-2 px-3 py-1 text-xs rounded-md bg-slate-100 hover:bg-slate-200"
                                                            >
                                                                <Edit2 size={14} />
                                                                Edit
                                                            </button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    <div className="p-6 bg-white border shadow-sm border-indigo-50 rounded-2xl">
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-lg font-semibold text-slate-800">
                                                Recent Activity
                                            </h2>
                                            <span className="text-xs text-slate-400">
                                                {connectionHistory.length} updates
                                            </span>
                                        </div>
                                        <div className="relative">
                                            <div className="absolute top-0 w-px left-5 bottom-4 bg-slate-200" />
                                            <ul className="space-y-4">
                                                {connectionHistory.length === 0 ? (
                                                    <li className="pl-8 text-sm text-slate-500">
                                                        No recent activity to display.
                                                    </li>
                                                ) : (
                                                    connectionHistory.slice(0, 6).map((item, index) => (
                                                        <li key={item.id} className="relative flex items-start gap-4">
                                                            <div className="relative z-10 flex items-center justify-center w-8 h-8 text-sm bg-white border rounded-full shadow-sm border-slate-200">
                                                                {item.action === "Accepted" ? "✅" : item.action === "Rejected" ? "❌" : item.action.includes("Project") ? "📦" : "📝"}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="text-sm text-slate-600">
                                                                    <span className="font-medium">{item.company}</span> • {item.action}
                                                                </div>
                                                                {item.note && (
                                                                    <div className="mt-1 text-xs text-slate-400">
                                                                        {item.note}
                                                                    </div>
                                                                )}
                                                                <div className="mt-1 text-xs text-slate-400">
                                                                    {item.date}
                                                                </div>
                                                            </div>
                                                        </li>
                                                    ))
                                                )}
                                            </ul>
                                    </div>
                                </div>
                            </section>
                        </>
                        )}
                    </>
                    )}
                </main>

                {/* Footer */}
                <footer className="pb-6 text-sm text-center text-slate-500">
                    © 2025 <span className="font-semibold text-purple-600">Kartvya CSR Dashboard</span> | Empowering NGOs 💜
                </footer>
            </div>

        <ChatDrawer
            open={chatPanel.open}
            onClose={resetChatPanel}
            partnershipId={chatPanel.partnershipId}
            partnerName={chatPanel.partnerName}
            partnerSubtitle={chatPanel.partnerSubtitle}
            partnerAvatar={chatPanel.partnerAvatar}
            currentUserId={userProfile?.user?.id}
            currentUserRole="ngo"
        />

        {/* Fund Utilization Modal - Rendered at parent level to persist across re-renders */}
        {fundUtilModal.open && fundUtilModal.partnership && (
            <FundUtilizationModal
                fundUtilModal={fundUtilModal}
                setFundUtilModal={setFundUtilModal}
                showAlert={showAlert}
            />
        )}

            {/* Global alerts (inline) */}
            {alert && (
                <div className={`fixed bottom-6 right-6 p-3 rounded shadow z-50 ${alert.kind === "success" ? "bg-green-50 text-green-700" : alert.kind === "error" ? "bg-red-50 text-red-700" : "bg-indigo-50 text-indigo-700"}`}>
                    {alert.text}
                </div>
            )}
        </div>
    );
}

// Fund Utilization Modal Component - Extracted to prevent re-creation
// Form state is managed internally to prevent parent re-renders on every keystroke
const FundUtilizationModal = memo(function FundUtilizationModal({ fundUtilModal, setFundUtilModal, showAlert }) {
    const [submitting, setSubmitting] = useState(false);
    const [fundUtilForm, setFundUtilForm] = useState({
        category: "",
        description: "",
        amount_used: "",
        utilization_date: new Date().toISOString().slice(0, 10),
        photos: [],
    });
    
    // Reset form when modal opens for a new partnership
    useEffect(() => {
        if (fundUtilModal.open && fundUtilModal.partnership) {
            setFundUtilForm({
                category: "",
                description: "",
                amount_used: "",
                utilization_date: new Date().toISOString().slice(0, 10),
                photos: [],
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fundUtilModal.open, fundUtilModal.partnership?.id]);

    const CATEGORIES = [
        { value: "infrastructure", label: "Infrastructure" },
        { value: "staff", label: "Staff & Salaries" },
        { value: "materials", label: "Materials & Supplies" },
        { value: "operations", label: "Operations" },
        { value: "marketing", label: "Marketing & Outreach" },
        { value: "training", label: "Training & Development" },
        { value: "other", label: "Other" },
    ];

    const handlePhotoUpload = (e) => {
        // Don't prevent default - we need the file input to work normally
        e.stopPropagation(); // Only stop propagation to prevent modal from closing
        
        const files = e.target.files;
        if (!files || files.length === 0) {
            return;
        }

        const fileArray = Array.from(files);
        const readerPromises = fileArray.map(file => {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showAlert(`File ${file.name} is not an image`, "error");
                return null;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showAlert(`File ${file.name} is too large. Maximum size is 5MB`, "error");
                return null;
            }

            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
                reader.readAsDataURL(file);
            });
        });

        Promise.all(readerPromises.filter(p => p !== null))
            .then(base64Images => {
                if (base64Images.length > 0) {
                    setFundUtilForm(prev => ({
                        ...prev,
                        photos: [...prev.photos, ...base64Images]
                    }));
                    showAlert(`✅ ${base64Images.length} image(s) added`, "success");
                }
            })
            .catch(error => {
                console.error('Error reading images:', error);
                showAlert(`Failed to process images: ${error.message}`, "error");
            });
        
        // Reset input to allow selecting the same file again
        e.target.value = '';
    };

    const removePhoto = (index) => {
        setFundUtilForm(prev => ({
            ...prev,
            photos: prev.photos.filter((_, i) => i !== index)
        }));
    };

    const handleFundUtilSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!fundUtilModal.partnership) return;

        const { partnership } = fundUtilModal;
        if (!fundUtilForm.category || !fundUtilForm.description || !fundUtilForm.amount_used) {
            showAlert("Please fill all required fields", "error");
            return;
        }

        const amount = parseFloat(fundUtilForm.amount_used);
        if (amount <= 0) {
            showAlert("Amount must be greater than 0", "error");
            return;
        }

        try {
            setSubmitting(true);
            const response = await addFundUtilization(partnership.id, {
                category: fundUtilForm.category,
                description: fundUtilForm.description,
                amount_used: amount,
                utilization_date: fundUtilForm.utilization_date,
                photos: fundUtilForm.photos,
            });

            if (response.success) {
                const updatedProgress = response.data?.updated_progress || 0;
                showAlert(`✅ Fund utilization added! Progress updated to ${updatedProgress}%`, "success");
                
                // Close modal and reset form only after successful submission
                setFundUtilModal({ open: false, partnership: null });
                setFundUtilForm({
                    category: "",
                    description: "",
                    amount_used: "",
                    utilization_date: new Date().toISOString().slice(0, 10),
                    photos: [],
                });
                // Trigger a custom event to notify ActivePartnershipsPage to refresh
                window.dispatchEvent(new CustomEvent('partnershipUpdated', { detail: { partnershipId: partnership.id, progress: updatedProgress } }));
            }
        } catch (error) {
            console.error('Error adding fund utilization:', error);
            showAlert(`Failed to add fund utilization: ${error.message}`, "error");
            // Don't close modal on error - let user fix and retry
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-black/30" 
                onClick={(e) => {
                    // Only close if clicking directly on backdrop, not on form
                    if (e.target === e.currentTarget) {
                        setFundUtilModal({ open: false, partnership: null });
                    }
                }} 
            />
            <form 
                onSubmit={handleFundUtilSubmit} 
                onClick={(e) => e.stopPropagation()}
                className="relative z-10 w-full max-w-2xl bg-white shadow-xl rounded-xl p-6 max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                            Add Fund Utilization
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            {fundUtilModal.partnership.project_name || fundUtilModal.partnership.partnership_name || "Partnership"}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setFundUtilModal({ open: false, partnership: null })}
                        className="text-slate-500 hover:text-slate-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block mb-1 text-sm font-medium text-slate-700">Category *</label>
                        <select
                            value={fundUtilForm.category}
                            onChange={(e) => setFundUtilForm(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        >
                            <option value="">Select Category</option>
                            {CATEGORIES.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block mb-1 text-sm font-medium text-slate-700">Description *</label>
                        <textarea
                            value={fundUtilForm.description}
                            onChange={(e) => setFundUtilForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe what the funds were used for..."
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            rows={3}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-slate-700">Amount Used (₹) *</label>
                            <input
                                type="number"
                                value={fundUtilForm.amount_used}
                                onChange={(e) => setFundUtilForm(prev => ({ ...prev, amount_used: e.target.value }))}
                                placeholder="0.00"
                                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-slate-700">Date *</label>
                            <input
                                type="date"
                                value={fundUtilForm.utilization_date}
                                onChange={(e) => setFundUtilForm(prev => ({ ...prev, utilization_date: e.target.value }))}
                                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block mb-2 text-sm font-medium text-slate-700">Photos (Optional)</label>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handlePhotoUpload}
                            onClick={(e) => e.stopPropagation()}
                            className="hidden"
                            id="photo-upload"
                        />
                        <label
                            htmlFor="photo-upload"
                            className="flex items-center justify-center w-full gap-2 px-4 py-8 transition-colors border-2 border-dashed rounded-lg cursor-pointer border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/50"
                        >
                            <Camera size={24} className="text-slate-400" />
                            <span className="text-sm text-slate-600">Click to upload photos or drag and drop</span>
                        </label>
                        {fundUtilForm.photos.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 mt-3">
                                {fundUtilForm.photos.map((photo, idx) => (
                                    <div key={idx} className="relative group">
                                        <img src={photo} alt={`Preview ${idx + 1}`} className="object-cover w-full h-20 border rounded-lg border-slate-200" />
                                        <button
                                            type="button"
                                            onClick={() => removePhoto(idx)}
                                            className="absolute flex items-center justify-center w-5 h-5 text-white transition-opacity bg-red-500 rounded-full opacity-0 top-1 right-1 group-hover:opacity-100"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-3 border border-indigo-200 rounded-lg bg-indigo-50">
                        <p className="text-xs text-indigo-700">
                            <strong>Note:</strong> Progress will be automatically calculated based on the amount used. 
                            Current budget: ₹{Number(fundUtilModal.partnership.agreed_budget || 0).toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        type="button"
                        onClick={() => setFundUtilModal({ open: false, partnership: null })}
                        className="px-4 py-2 text-sm font-medium border rounded-lg border-slate-300 hover:bg-slate-50"
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
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
    );
});
