import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Legend,
    BarChart,
    Bar,
} from "recharts";
import {
    Menu,
    X,
    Home,
    BarChart2,
    HandCoins,
    FolderKanban,
    Users,
    FileText,
    Settings as SettingsIcon,
    LogOut,
    TrendingUp,
    CheckCircle2,
    Send,
    Bookmark,
    BookmarkCheck,
    Search,
    Sparkles,
    MessageCircle,
    Mail,
    Phone,
    MapPin,
    Globe,
    Loader2,
    Eye,
    PanelLeft,
    PanelLeftClose,
    LineChart as LineIcon,
    BarChart3,
    PieChart as PieIcon,
    Calendar,
    Clock,
} from "lucide-react";

const FOCUS_AREA_OPTIONS = [
    { value: "education", label: "Education" },
    { value: "healthcare", label: "Healthcare" },
    { value: "environment", label: "Environment" },
    { value: "women_empowerment", label: "Women Empowerment" },
    { value: "rural_development", label: "Rural Development" },
    { value: "skill_development", label: "Skill Development" },
    { value: "other", label: "Other" },
];

const FOCUS_AREA_LOOKUP = FOCUS_AREA_OPTIONS.reduce((acc, item) => {
    acc[item.value] = item.label;
    return acc;
}, {});

const normalizeFocusAreaValue = (value) => {
    if (!value) return null;
    const raw = String(value).trim();
    if (!raw) return null;

    const matchByLabel = FOCUS_AREA_OPTIONS.find(
        (option) => option.label.toLowerCase() === raw.toLowerCase()
    );
    if (matchByLabel) return matchByLabel.value;

    const slug = raw
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9\s_]/g, "")
        .replace(/\s+/g, "_");

    if (FOCUS_AREA_LOOKUP[slug]) {
        return slug;
    }

    return slug || null;
};

const getFocusAreaLabel = (value) => {
    const normalized = normalizeFocusAreaValue(value);
    if (normalized && FOCUS_AREA_LOOKUP[normalized]) {
        return FOCUS_AREA_LOOKUP[normalized];
    }
    if (!value) return "";
    return String(value)
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

import {
    getUserProfile,
    getCorporateDashboardStats,
    getCorporateProjects,
    updateCorporateProjectStatus,
    getCorporateProjectMessages,
    postCorporateProjectMessage,
    getCorporateRequests,
    createCorporateRequest,
    getCorporateConnections,
    saveCorporateNgo,
    removeCorporateNgo,
    getCorporateActivity,
} from "../../services/api";

const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];

const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number.isFinite(value) ? value : 0);

const unwrapApi = (payload) => {
    if (!payload) return null;
    if (payload.success !== undefined) {
        if (!payload.success) return null;
        return payload.data ?? null;
    }
    return payload;
};

const extractArray = (payload, key) => {
    const data = unwrapApi(payload);
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (key && Array.isArray(data[key])) return data[key];
    if (Array.isArray(data.data)) return data.data;
    if (key && data.data && Array.isArray(data.data[key])) return data.data[key];
    return [];
};

const extractValue = (payload, key) => {
    const data = unwrapApi(payload);
    if (!data) return null;
    if (key && data[key] !== undefined) return data[key];
    if (key && data.data && data.data[key] !== undefined) return data.data[key];
    return data;
};

const normalizeProject = (project) => {
    if (!project) return null;
    const funds = Number(
        project.funds ?? project.budget_required ?? project.agreed_budget ?? 0
    );
    return {
        id: String(project.id),
        name: project.name ?? project.title ?? "Project",
        ngo: project.ngo ?? project.ngo_name ?? project.partner_name ?? "",
        ngoId: project.ngo_id ?? project.partner_id ?? null,
        status: (project.status ?? "active").toLowerCase(),
        category: project.category ?? project.focus_area ?? "",
        location: project.location ?? "N/A",
        duration: project.duration_months ?? project.duration ?? 0,
        funds,
        fundsDisplay: project.funds_display ?? project.budget_display ?? formatCurrency(funds),
        progress: Number(project.progress ?? 0),
        beneficiaries: Number(project.beneficiaries ?? project.beneficiaries_count ?? 0),
        startDate: project.start_date ?? null,
        endDate: project.end_date ?? null,
        description: project.description ?? "",
    };
};

const normalizeRequest = (request) => {
    if (!request) return null;
    const amount = Number(request.amount ?? request.proposed_budget ?? 0);
    return {
        id: String(request.id),
        ngoId: request.ngo_id ?? request.ngoId ?? null,
        ngo: request.ngo_name ?? request.ngo ?? "NGO",
        status: (request.status ?? "Pending").replace(/^[a-z]/, (c) => c.toUpperCase()),
        amount,
        focusAreas: request.focus_areas ?? request.focusAreas ?? [],
        description: request.description ?? request.project_name ?? "",
        message: request.message ?? "",
        date: request.sent_at ?? request.date ?? request.created_at ?? new Date().toISOString(),
    };
};

const normalizeNgo = (item) => {
    if (!item) return null;

    const focusAreasRaw = item.focusAreas ?? item.project?.focusAreas ?? item.project_focus_area ?? [];
    const focusAreas = Array.isArray(focusAreasRaw)
        ? focusAreasRaw
        : String(focusAreasRaw ?? "")
              .split(",")
              .map((entry) => entry.trim())
              .filter(Boolean);
    const normalizedFocusAreas = Array.from(
        new Set(
            focusAreas
                .map(normalizeFocusAreaValue)
                .filter(Boolean)
        )
    );

    const projectSource = item.project ?? {
        id: item.projectId ?? item.id,
        name: item.projectName ?? item.title,
        status: item.projectStatus,
        description: item.projectDescription,
        funds: item.funds ?? item.project_budget_required,
        fundsDisplay: item.fundsDisplay ?? item.project_budget_display,
        beneficiaries: item.beneficiaries ?? item.project_beneficiaries_count,
        location: item.location ?? item.project_location,
        durationMonths: item.durationMonths ?? item.project_duration_months,
        startDate: item.startDate ?? item.project_start_date,
        endDate: item.endDate ?? item.project_end_date,
    };

    const fundsNumeric = Number(projectSource?.funds ?? 0);

    return {
        id: String(item.id ?? projectSource.id ?? Date.now()),
        ngoId: String(item.ngoId ?? item.ngo_id ?? item.project?.ngoId ?? ""),
        name: item.name ?? item.ngoName ?? item.organization_name ?? "NGO",
        location: projectSource?.location ?? item.location ?? "N/A",
        tagline: item.tagline ?? item.ngoTagline ?? item.mission ?? "",
        focusAreas: normalizedFocusAreas,
        verified: Boolean(item.verified ?? item.ngoVerified ?? item.project?.verified ?? false),
        logo: item.logo ?? item.logo_path ?? item.logo_url ?? "/images/logo2.jpg",
        contact: item.contact ?? {
            email: item.contactEmail ?? item.contact_email ?? item.email ?? "",
            phone: item.contactPhone ?? item.contact_phone ?? item.phone ?? "",
        },
        description: item.description ?? projectSource?.description ?? "",
        project: {
            id: String(projectSource?.id ?? item.id),
            name: projectSource?.name ?? "Project",
            status: (projectSource?.status ?? "draft").toLowerCase(),
            description: projectSource?.description ?? "",
            funds: fundsNumeric,
            fundsDisplay:
                projectSource?.fundsDisplay ??
                projectSource?.funds_display ??
                formatCurrency(fundsNumeric),
            beneficiaries: Number(projectSource?.beneficiaries ?? 0),
            location: projectSource?.location ?? item.location ?? "N/A",
            durationMonths: projectSource?.durationMonths ?? null,
            startDate: projectSource?.startDate ?? null,
            endDate: projectSource?.endDate ?? null,
            focusAreas: normalizedFocusAreas,
        },
        saved: Boolean(item.saved ?? item.project?.saved ?? item.saved_id),
    };
};

const normalizeMessage = (message) => {
    if (!message) return null;
    return {
        id: String(message.id ?? `${Date.now()}`),
        author: message.author ?? message.sender_name ?? "Partner",
        text: message.text ?? message.body ?? "",
        timestamp: message.timestamp ?? message.created_at ?? new Date().toISOString(),
    };
};

const normalizeActivity = (entry) => {
    if (!entry) return null;
    const ts = entry.timestamp ?? entry.created_at;
    return {
        id: String(entry.id ?? `${Date.now()}`),
        text: entry.text ?? "",
        icon: entry.icon ?? "ℹ️",
        timestamp: ts,
        time: ts ? timeAgo(ts) : entry.time ?? "Just now",
    };
};

const timeAgo = (isoString) => {
    if (!isoString) return "Just now";
    const past = new Date(isoString);
    if (Number.isNaN(past.getTime())) return "Just now";
    const now = new Date();
    const diffMs = now.getTime() - past.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
};

export default function CorporateDashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarPinned, setSidebarPinned] = useState(true);
    const [activeNav, setActiveNav] = useState("dashboard");
    const [alert, setAlert] = useState(null);
    const [loading, setLoading] = useState(true);

    const [userProfile, setUserProfile] = useState(null);
    const [dashboardStats, setDashboardStats] = useState(null);

    const [projects, setProjects] = useState([]);
    const [requests, setRequests] = useState([]);
    const [projectMessages, setProjectMessages] = useState({});
    const [ngoDirectory, setNgoDirectory] = useState([]);
    const [shortlist, setShortlist] = useState([]);
    const [savedNgos, setSavedNgos] = useState([]);
    const [activityLog, setActivityLog] = useState([]);

    const [viewProject, setViewProject] = useState(null);
    const [messageModal, setMessageModal] = useState({ open: false, project: null });
    const [requestModal, setRequestModal] = useState({ open: false, ngo: null });
    const [selectedNgo, setSelectedNgo] = useState(null);

    const [projectsQuery, setProjectsQuery] = useState("");
    const [projectsFilter, setProjectsFilter] = useState("all");
    const [projectsSort, setProjectsSort] = useState("newest");

    const [connSearchQuery, setConnSearchQuery] = useState("");
    const [connFocusFilter, setConnFocusFilter] = useState("");
    const [connVerifiedOnly, setConnVerifiedOnly] = useState(false);
    const connectionsSearchRef = useRef(null);

    const messageLoadTracker = useRef(new Set());

    const showAlert = useCallback((text, kind = "info") => {
        setAlert({ text, kind, id: Date.now() });
        setTimeout(() => setAlert(null), 3000);
    }, []);

    const appendActivity = (text, icon = "ℹ️") => {
        setActivityLog((prev) => [
            { id: `act-${Date.now()}`, text, icon, time: "Just now", timestamp: new Date().toISOString() },
            ...prev.filter((_, index) => index < 19),
        ]);
    };

    const dedupeByNgo = useCallback((list) => {
        const map = new Map();
        list.forEach((entry) => {
            const key = entry.ngoId || entry.id;
            if (key && !map.has(key)) {
                map.set(key, entry);
            }
        });
        return Array.from(map.values());
    }, []);

    const settledValue = (result) => (result?.status === "fulfilled" ? result.value : null);

    const loadInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                getUserProfile(),
                getCorporateDashboardStats(),
                getCorporateProjects(),
                getCorporateRequests(),
                getCorporateConnections(),
                getCorporateConnections({ shortlist: true }),
                getCorporateActivity(),
            ]);

            const profileData = extractValue(settledValue(results[0]));
            if (profileData) {
                if (profileData.profile || profileData.user) {
                    setUserProfile(profileData);
                } else {
                    setUserProfile({ profile: profileData, user: profileData.user });
                }
            }

            const statsData = extractValue(settledValue(results[1]));
            if (statsData) setDashboardStats(statsData);

            const projectsData = extractArray(settledValue(results[2]), "projects").map(normalizeProject).filter(Boolean);
            setProjects(projectsData);

            const requestsData = extractArray(settledValue(results[3]), "requests").map(normalizeRequest).filter(Boolean);
            setRequests(requestsData);

            const directoryData = extractArray(settledValue(results[4]), "ngos").map(normalizeNgo).filter(Boolean);
            setNgoDirectory(directoryData);

            const shortlistDataRaw = extractArray(settledValue(results[5]), "ngos").map(normalizeNgo).filter(Boolean);
            const shortlistData = dedupeByNgo(shortlistDataRaw);
            setShortlist(shortlistData);
            setSavedNgos(shortlistData.map((ngo) => ngo.ngoId).filter(Boolean));

            const activityData = extractArray(settledValue(results[6]), "entries")
                .map(normalizeActivity)
                .filter(Boolean);
            setActivityLog(activityData);
        } catch (error) {
            console.error("Failed to load corporate dashboard", error);
            showAlert(`Failed to load dashboard: ${error.message}`, "error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    const refreshStats = useCallback(async () => {
        try {
            const response = await getCorporateDashboardStats();
            const statsData = extractValue(response);
            if (statsData) setDashboardStats(statsData);
        } catch (error) {
            console.error("Failed to refresh corporate stats", error);
        }
    }, []);

    const refreshShortlist = useCallback(async () => {
        try {
            const response = await getCorporateConnections({ shortlist: true });
            const shortlistDataRaw = extractArray(response, "ngos").map(normalizeNgo).filter(Boolean);
            const shortlistData = dedupeByNgo(shortlistDataRaw);
            setShortlist(shortlistData);
            setSavedNgos(shortlistData.map((ngo) => ngo.ngoId).filter(Boolean));
        } catch (error) {
            console.error("Failed to refresh shortlist", error);
            showAlert(`Unable to refresh shortlist: ${error.message}`, "error");
        }
    }, [dedupeByNgo, showAlert]);

    const ensureProjectMessages = useCallback(
        async (projectId) => {
            if (!projectId || projectMessages[projectId] || messageLoadTracker.current.has(projectId)) {
                return;
            }
            messageLoadTracker.current.add(projectId);
            try {
                const response = await getCorporateProjectMessages(projectId);
                const messages = extractArray(response, "messages").map(normalizeMessage).filter(Boolean);
                setProjectMessages((prev) => ({ ...prev, [projectId]: messages }));
            } catch (error) {
                console.error("Failed to load project messages", error);
            } finally {
                messageLoadTracker.current.delete(projectId);
            }
        },
        [projectMessages]
    );

    const activeMessageProjectId = useMemo(
        () => messageModal.project?.id ?? viewProject?.id ?? null,
        [messageModal.project, viewProject]
    );

    useEffect(() => {
        if (activeMessageProjectId) {
            ensureProjectMessages(activeMessageProjectId);
        }
    }, [activeMessageProjectId, ensureProjectMessages]);

    const pendingRequests = useMemo(
        () => requests.filter((req) => req.status === "Pending"),
        [requests]
    );
    const acceptedRequests = useMemo(
        () => requests.filter((req) => req.status === "Accepted"),
        [requests]
    );
    const completedRequests = useMemo(
        () => requests.filter((req) => req.status === "Completed"),
        [requests]
    );
    const declinedRequests = useMemo(
        () => requests.filter((req) => req.status === "Declined"),
        [requests]
    );

    const activeProjects = useMemo(
        () => projects.filter((project) => project.status === "active"),
        [projects]
    );

    const fundDistributionData = useMemo(() => {
        if (dashboardStats?.fundDistribution) {
            return dashboardStats.fundDistribution.map((item) => ({
                name: item.name,
                value: Number(item.value) || 0,
            }));
        }
        const bucket = new Map();
        projects
            .filter((project) => project.status !== "archived")
            .forEach((project) => {
                const key = project.category || project.ngo || "Other";
                bucket.set(key, (bucket.get(key) || 0) + (project.funds || 0));
            });
        return Array.from(bucket.entries()).map(([name, value]) => ({ name, value }));
    }, [dashboardStats, projects]);

    const monthlySpendingData = useMemo(() => {
        if (dashboardStats?.monthlySpending) {
            return dashboardStats.monthlySpending;
        }
        return [];
    }, [dashboardStats]);

    const filteredProjects = useMemo(() => {
        let list = projects.slice();
        if (projectsFilter !== "all") {
            list = list.filter((project) => project.status === projectsFilter);
        }
        if (projectsQuery) {
            const query = projectsQuery.toLowerCase();
            list = list.filter((project) =>
                project.name.toLowerCase().includes(query) ||
                (project.ngo || "").toLowerCase().includes(query) ||
                (project.location || "").toLowerCase().includes(query)
            );
        }
        if (projectsSort === "newest") {
            list = list.sort((a, b) => b.id.localeCompare(a.id));
        }
        if (projectsSort === "progress_desc") {
            list = list.sort((a, b) => (b.progress || 0) - (a.progress || 0));
        }
        if (projectsSort === "progress_asc") {
            list = list.sort((a, b) => (a.progress || 0) - (b.progress || 0));
        }
        return list;
    }, [projects, projectsFilter, projectsQuery, projectsSort]);

    const connectionFocusOptions = useMemo(() => FOCUS_AREA_OPTIONS, []);

    const filteredConnections = useMemo(() => {
        const query = connSearchQuery.toLowerCase();
        return ngoDirectory.filter((ngo) => {
            const matchesText =
                `${ngo.name} ${ngo.location} ${ngo.tagline}`
                    .toLowerCase()
                    .includes(query);
            const matchesFocus = connFocusFilter
                ? (ngo.focusAreas || []).includes(connFocusFilter)
                : true;
            const matchesVerified = connVerifiedOnly ? ngo.verified : true;
            return matchesText && matchesFocus && matchesVerified;
        });
    }, [ngoDirectory, connSearchQuery, connFocusFilter, connVerifiedOnly]);

    const toggleSidebarPinned = () => {
        setSidebarPinned((prev) => {
            const next = !prev;
            if (!next) setSidebarOpen(false);
            return next;
        });
    };

    const toggleSaveNgoHandler = async (ngoId) => {
        const numericNgoId = Number(ngoId);
        if (!numericNgoId) {
            showAlert("Unable to update shortlist: missing NGO reference.", "error");
            return;
        }
        try {
            if (savedNgos.includes(ngoId)) {
                await removeCorporateNgo(numericNgoId);
                showAlert("Removed NGO from shortlist", "info");
            } else {
                await saveCorporateNgo(numericNgoId);
                showAlert("Saved NGO to shortlist", "success");
            }
            await refreshShortlist();
        } catch (error) {
            console.error("Failed to toggle shortlist", error);
            showAlert(`Unable to update shortlist: ${error.message}`, "error");
        }
    };

    const sendProjectMessage = async (projectId, text) => {
        if (!text.trim()) return;
        try {
            const response = await postCorporateProjectMessage(projectId, { text });
            const message = normalizeMessage(extractValue(response, "message")) ?? normalizeMessage(response);
            setProjectMessages((prev) => ({
                ...prev,
                [projectId]: [message, ...(prev[projectId] || [])].filter(Boolean),
            }));
            appendActivity("Message sent to project partner", "✉️");
            showAlert("Message sent", "success");
        } catch (error) {
            console.error("Failed to send project message", error);
            showAlert(`Unable to send message: ${error.message}`, "error");
        }
    };

    const updateProjectStatus = async (projectId, payload, successText, activityText) => {
        try {
            const response = await updateCorporateProjectStatus(projectId, payload);
            const updated = normalizeProject(extractValue(response, "project") ?? response);
            if (updated) {
                setProjects((prev) =>
                    prev.map((project) => (project.id === updated.id ? updated : project))
                );
            }
            if (activityText) appendActivity(activityText, "📌");
            if (successText) showAlert(successText, "success");
            refreshStats();
        } catch (error) {
            console.error("Failed to update project status", error);
            showAlert(`Unable to update project: ${error.message}`, "error");
        }
    };

    const markProjectComplete = (projectId) =>
        updateProjectStatus(projectId, { status: "completed" }, "Project marked as completed", "Project marked as completed");

    const archiveProject = (projectId) =>
        updateProjectStatus(projectId, { status: "archived" }, "Project archived", "Project archived");

    const restoreProject = (projectId) =>
        updateProjectStatus(projectId, { status: "active" }, "Project restored", "Project restored");

    const sendRequest = async ({ ngo, amount, message, focusArea }) => {
        try {
            const response = await createCorporateRequest({
                ngo_id: ngo.ngoId,
                project_id: ngo.project?.id,
                amount,
                focus_area: focusArea || (ngo.project?.focusAreas?.[0] ?? null),
                message,
                description: message || ngo.project?.description || null,
            });
            const created = normalizeRequest(extractValue(response, "request") ?? response);
            if (created) {
                setRequests((prev) => [created, ...prev]);
                appendActivity(`Request sent to ${created.ngo}`, "📤");
                refreshStats();
            }
            showAlert("Request sent", "success");
            setActiveNav("funding");
        } catch (error) {
            console.error("Failed to send request", error);
            showAlert(`Unable to send request: ${error.message}`, "error");
        }
    };

    function ProgressBar({ value }) {
        return (
            <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(Math.max(value || 0, 0), 100)}%` }}
                />
            </div>
        );
    }

    function DashboardPage() {
        const totalFundsCard = formatCurrency(
            projects
                .filter((project) => project.status !== "archived")
                .reduce((sum, project) => sum + (project.funds || 0), 0)
        );
        const pendingCount = pendingRequests.length;
        const activeCount = activeProjects.length;
        const shortlistCount = savedNgos.length;

        return (
            <div className="space-y-6">
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
                                {totalFundsCard}
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
                                {activeCount}
                            </h2>
                            <div className="bg-violet-200 p-2 rounded-lg">
                                <FolderKanban size={28} />
                            </div>
                        </div>
                    </div>

                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setActiveNav("connections")}
                        className="bg-gradient-to-br from-teal-50 to-cyan-100 rounded-2xl shadow-sm p-5 border hover:border-cyan-300 hover:shadow-lg hover:scale-105 transform-gpu transition-all duration-300 cursor-pointer"
                    >
                        <p className="text-sm text-slate-500">Shortlisted NGOs</p>
                        <div className="flex justify-between items-center mt-1">
                            <h2 className="text-3xl font-extrabold text-cyan-700">
                                {shortlistCount}
                            </h2>
                            <div className="bg-cyan-200 p-2 rounded-lg">
                                <Users size={28} />
                            </div>
                        </div>
                    </div>

                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setActiveNav("funding")}
                        className="bg-gradient-to-br from-violet-50 to-purple-100 rounded-2xl shadow-sm p-5 border hover:border-violet-300 hover:shadow-lg hover:scale-105 transform-gpu transition-all duration-300 cursor-pointer"
                    >
                        <p className="text-sm text-slate-500">Pending Requests</p>
                        <div className="flex justify-between items-center mt-1">
                            <h2 className="text-3xl font-extrabold text-violet-700">
                                {pendingCount}
                            </h2>
                            <div className="bg-violet-200 p-2 rounded-lg">
                                <TrendingUp size={28} />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
                    <div className="p-6 bg-white border shadow-sm border-indigo-50 rounded-2xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">
                                    Requests Monitor
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Track outgoing CSR requests and responses
                                </p>
                            </div>
                            <Send size={18} className="text-indigo-500" />
                        </div>

                        <div className="grid grid-cols-1 gap-3 mt-6 sm:grid-cols-3">
                            {[
                                {
                                    label: "Sent",
                                    value: requests.length,
                                    tone: "bg-indigo-50 text-indigo-600",
                                },
                                {
                                    label: "Pending",
                                    value: pendingRequests.length,
                                    tone: "bg-amber-50 text-amber-600",
                                },
                                {
                                    label: "Active Projects",
                                    value: activeProjects.length,
                                    tone: "bg-emerald-50 text-emerald-600",
                                },
                            ].map((metric) => (
                                <div
                                    key={metric.label}
                                    className={`rounded-xl px-4 py-3 text-sm font-medium ${metric.tone}`}
                                >
                                    <div className="text-xs uppercase tracking-wide text-slate-500">
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
                                    Showing {Math.min(requests.length, 4)} of {requests.length}
                                </span>
                            </div>
                            {requests.length === 0 ? (
                                <div className="p-4 text-sm border border-dashed rounded-lg text-slate-500">
                                    No requests sent yet. Use "Send Request" to connect with NGOs.
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {requests.slice(0, 4).map((item) => (
                                        <li
                                            key={item.id}
                                            className="flex items-start justify-between gap-3 p-3 border rounded-xl border-slate-100 bg-slate-50/60"
                                        >
                                            <div>
                                                <div className="text-sm font-semibold text-slate-700">
                                                    {item.ngo}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    Sent {timeAgo(item.date)}
                                                </div>
                                            </div>
                                            <span
                                                className={`text-xs px-3 py-1 rounded-full font-medium ${
                                                    item.status === "Accepted"
                                                        ? "bg-emerald-100 text-emerald-600"
                                                        : item.status === "Declined"
                                                        ? "bg-rose-100 text-rose-600"
                                                        : "bg-amber-100 text-amber-600"
                                                }`}
                                            >
                                                {item.status}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {pendingRequests.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-sm font-semibold text-slate-700 mb-2">
                                    Pending Requests
                                </h3>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    {pendingRequests.slice(0, 3).map((item) => (
                                        <div
                                            key={item.id}
                                            className="p-3 border rounded-xl border-amber-100 bg-amber-50/60"
                                        >
                                            <div className="text-sm font-medium text-slate-700">
                                                {item.ngo}
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500 line-clamp-2">
                                                {item.description}
                                            </div>
                                            <div className="mt-2 text-xs text-amber-600">
                                                {timeAgo(item.date)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-white border shadow-sm border-indigo-50 rounded-2xl">
                        <h2 className="mb-4 text-lg font-semibold text-slate-800">
                            Shortlisted NGOs
                        </h2>
                        {shortlist.length === 0 ? (
                            <div className="p-4 text-sm border border-dashed rounded-lg text-slate-500">
                                No NGOs shortlisted yet. Explore and save NGOs to track them here.
                            </div>
                        ) : (
                            <ul className="space-y-4">
                                {shortlist.slice(0, 6).map((ngo) => (
                                    <li key={ngo.ngoId ?? ngo.id} className="flex items-center gap-3">
                                        <div className="w-10 h-10 overflow-hidden border rounded-full border-slate-200">
                                            <img
                                                src={ngo.logo}
                                                alt={ngo.name}
                                                className="object-cover w-full h-full"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-semibold text-slate-700">
                                                {ngo.name}
                                            </div>
                                            <div className="text-xs text-slate-400">{ngo.location}</div>
                                        </div>
                                        <button
                                            onClick={() => toggleSaveNgoHandler(ngo.ngoId)}
                                            className="text-xs text-indigo-600 hover:text-indigo-500"
                                        >
                                            Remove
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-2">
                    <div className="p-6 bg-white border shadow-sm border-indigo-50 rounded-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">
                                    Active Projects
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Projects underway with partner NGOs
                                </p>
                            </div>
                            <FolderKanban size={20} className="text-indigo-500" />
                        </div>
                        {activeProjects.length === 0 ? (
                            <div className="p-4 text-sm text-slate-500 border border-dashed rounded-lg">
                                No active projects to display yet.
                            </div>
                        ) : (
                            <ul className="space-y-4">
                                {activeProjects.slice(0, 4).map((project) => (
                                    <li
                                        key={project.id}
                                        className="p-4 border rounded-xl border-slate-100 bg-slate-50/60"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="text-sm font-semibold text-slate-700">
                                                    {project.name}
                                                </div>
                                                <div className="text-xs text-slate-500">{project.ngo}</div>
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                Budget: {project.fundsDisplay}
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            <ProgressBar value={project.progress} />
                                            <div className="flex justify-between mt-2 text-xs text-slate-500">
                                                <span>{project.status || "In progress"}</span>
                                                <span>{Math.round(project.progress || 0)}%</span>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex gap-2">
                                            <button
                                                onClick={() => setMessageModal({ open: true, project })}
                                                className="px-3 py-1 rounded-md bg-indigo-600 text-white text-xs flex items-center gap-2"
                                            >
                                                <MessageCircle size={14} />
                                                Message
                                            </button>
                                            <button
                                                onClick={() => setViewProject(project)}
                                                className="px-3 py-1 rounded-md bg-slate-100 text-xs flex items-center gap-2"
                                            >
                                                <Eye size={14} />
                                                View
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
                                {activityLog.length} updates
                            </span>
                        </div>
                        <div className="relative">
                            <div className="absolute top-0 left-5 bottom-4 w-px bg-slate-200" />
                            <ul className="space-y-4">
                                {activityLog.slice(0, 6).map((item, index) => (
                                    <li key={item.id} className="relative flex items-start gap-4">
                                        <div className="relative z-10 flex items-center justify-center w-8 h-8 text-sm bg-white border rounded-full shadow-sm border-slate-200">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-600">{item.text}</div>
                                            <div className="mt-1 text-xs text-slate-400">
                                                {index === 0 ? "Moments ago" : item.time}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-2">
                    <div className="p-6 bg-white border shadow-sm border-indigo-50 rounded-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">
                                    Fund Distribution
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Distribution across focus areas
                                </p>
                            </div>
                            <PieIcon className="text-indigo-500" size={20} />
                        </div>
                        <div className="h-64">
                            {fundDistributionData.length === 0 ? (
                                <div className="grid h-full border border-dashed place-items-center text-slate-500 rounded-xl">
                                    Not enough data yet
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={fundDistributionData}
                                            dataKey="value"
                                            nameKey="name"
                                            outerRadius={95}
                                            innerRadius={60}
                                            paddingAngle={4}
                                            label={({ name, value }) =>
                                                `${name} (${(
                                                    (value /
                                                        (fundDistributionData.reduce(
                                                            (sum, item) => sum + item.value,
                                                            0
                                                        ) || 1)) *
                                                    100
                                                ).toFixed(1)}%)`
                                            }
                                        >
                                            {fundDistributionData.map((entry, index) => (
                                                <Cell
                                                    key={entry.name}
                                                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    <div className="p-6 bg-white border shadow-sm border-indigo-50 rounded-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">
                                    Monthly CSR Spending (₹ Lakh)
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Planned vs committed
                                </p>
                            </div>
                            <LineIcon className="text-indigo-500" size={20} />
                        </div>
                        <div className="h-64">
                            {monthlySpendingData.length === 0 ? (
                                <div className="grid h-full border border-dashed place-items-center text-slate-500 rounded-xl">
                                    No monthly data available
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={monthlySpendingData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="planned"
                                            stroke="#6366f1"
                                            strokeWidth={2}
                                            dot={{ r: 3 }}
                                            name="Planned"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="committed"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            dot={{ r: 3 }}
                                            name="Committed"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    function ProjectsPage() {
        const searchRef = useRef(null);

        useEffect(() => {
            const timer = setTimeout(() => searchRef.current?.focus?.(), 80);
            return () => clearTimeout(timer);
        }, []);

        return (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-50">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent font-[Poppins]">
                            Active Projects
                        </h2>
                        <p className="text-sm text-slate-500">
                            Track progress, send updates, and manage timelines
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center bg-slate-100 rounded-lg px-3 py-2 shadow-sm">
                            <input
                                ref={searchRef}
                                value={projectsQuery}
                                onChange={(e) => setProjectsQuery(e.target.value)}
                                placeholder="Search projects, NGO or location..."
                                className="bg-transparent outline-none text-sm"
                                autoComplete="off"
                                inputMode="search"
                                aria-label="Search projects"
                            />
                        </div>

                        <select
                            value={projectsFilter}
                            onChange={(e) => setProjectsFilter(e.target.value)}
                            className="border rounded px-3 py-2 text-sm"
                        >
                            <option value="all">All</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="archived">Archived</option>
                        </select>

                        <select
                            value={projectsSort}
                            onChange={(e) => setProjectsSort(e.target.value)}
                            className="border rounded px-3 py-2 text-sm"
                        >
                            <option value="newest">Newest</option>
                            <option value="progress_desc">Progress (High → Low)</option>
                            <option value="progress_asc">Progress (Low → High)</option>
                        </select>
                    </div>
                </div>

                <div className="mt-6 grid gap-4">
                    {filteredProjects.length === 0 ? (
                        <div className="p-6 rounded border border-dashed text-slate-500">
                            No projects found
                        </div>
                    ) : (
                        filteredProjects.map((project) => (
                            <div
                                key={project.id}
                                className="p-4 rounded-lg border hover:shadow-md transition-all bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-indigo-50 grid place-items-center text-indigo-700 font-semibold">
                                        {project.name
                                            .split(" ")
                                            .map((s) => s[0])
                                            .slice(0, 2)
                                            .join("")}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h3 className="font-semibold">{project.name}</h3>
                                            <div className="text-xs text-slate-400 px-2 py-1 rounded bg-slate-100 capitalize">
                                                {project.status}
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-500">
                                            NGO: {project.ngo} • Location: {project.location}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Beneficiaries:
                                            <span className="font-medium">
                                                {project.beneficiaries.toLocaleString("en-IN")}
                                            </span>
                                            • Funds:
                                            <span className="font-medium"> {project.fundsDisplay}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-[280px]">
                                    <div className="sm:w-48">
                                        <ProgressBar value={project.progress} />
                                        <div className="text-xs text-slate-500 mt-2">
                                            {project.progress}% completed
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            onClick={() => setViewProject(project)}
                                            className="px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center gap-2 text-sm"
                                        >
                                            <Eye size={16} />
                                            View
                                        </button>
                                        <button
                                            onClick={() => setMessageModal({ open: true, project })}
                                            className="px-3 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 flex items-center gap-2 text-sm"
                                        >
                                            <MessageCircle size={16} />
                                            Message
                                        </button>
                                        {project.status === "active" && (
                                            <>
                                                <button
                                                    onClick={() => markProjectComplete(project.id)}
                                                    className="px-3 py-1 rounded-md bg-green-600 text-white flex items-center gap-2 text-sm"
                                                >
                                                    <CheckCircle2 size={16} />
                                                    Mark Complete
                                                </button>
                                                <button
                                                    onClick={() => archiveProject(project.id)}
                                                    className="px-3 py-1 rounded-md bg-yellow-50 text-yellow-700 flex items-center gap-2 text-sm"
                                                >
                                                    Archive
                                                </button>
                                            </>
                                        )}
                                        {project.status === "archived" && (
                                            <button
                                                onClick={() => restoreProject(project.id)}
                                                className="px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center gap-2 text-sm"
                                            >
                                                Restore
                                            </button>
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

    function FundingPage() {
        const [activeTab, setActiveTab] = useState("All");
        const summaryTiles = [
            { label: "Sent Requests", value: requests.length, tone: "bg-indigo-50 text-indigo-600" },
            { label: "Pending", value: pendingRequests.length, tone: "bg-amber-50 text-amber-600" },
            { label: "Accepted", value: acceptedRequests.length, tone: "bg-emerald-50 text-emerald-600" },
            { label: "Completed", value: completedRequests.length, tone: "bg-slate-100 text-slate-600" },
        ];

        const tabs = ["All", "Pending", "Accepted", "Completed", "Declined"];
        const filtered = activeTab === "All" ? requests : requests.filter((req) => req.status === activeTab);

        return (
            <div className="space-y-6">
                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {summaryTiles.map((tile) => (
                        <div
                            key={tile.label}
                            className={`rounded-2xl border border-slate-100 px-4 py-5 text-sm font-medium shadow-sm ${tile.tone}`}
                        >
                            <div className="text-xs uppercase tracking-wide text-slate-500">
                                {tile.label}
                            </div>
                            <div className="mt-2 text-2xl">
                                {tile.value.toLocaleString("en-IN")}
                            </div>
                        </div>
                    ))}
                </section>

                <div className="bg-white border shadow-sm border-slate-100 rounded-2xl">
                    <div className="px-4 md:px-6 border-b border-slate-100">
                        <div className="flex flex-wrap gap-2 py-4">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                        activeTab === tab
                                            ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow"
                                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 md:p-6">
                        {filtered.length === 0 ? (
                            <div className="p-6 text-center border border-dashed rounded-xl text-slate-500">
                                No requests in this category yet.
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {filtered.map((item) => (
                                    <div
                                        key={item.id}
                                        className="p-5 transition-all bg-white border shadow-sm border-slate-100 rounded-2xl hover:shadow-md"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <div className="font-semibold text-slate-800">{item.ngo}</div>
                                                <div className="text-sm text-slate-500">{item.description}</div>
                                            </div>
                                            <span className="text-xs px-3 py-1 rounded-full font-medium border bg-slate-100 text-slate-600 border-slate-200">
                                                {item.status}
                                            </span>
                                        </div>

                                        {(item.focusAreas || []).length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {(item.focusAreas || [])
                                                    .map((area) => normalizeFocusAreaValue(area))
                                                    .filter((area) => area && area !== "general")
                                                    .map((area) => (
                                                        <span
                                                            key={area}
                                                            className="px-2 py-1 text-xs font-medium rounded bg-slate-100 text-slate-600"
                                                        >
                                                            {getFocusAreaLabel(area)}
                                                        </span>
                                                    ))}
                                            </div>
                                        )}

                                        <div className="mb-3 text-sm text-slate-500">
                                            Requested {timeAgo(item.date)}
                                        </div>

                                        {item.message && (
                                            <div className="p-3 mb-3 text-sm border rounded-lg text-slate-600 bg-slate-50 border-slate-100">
                                                "{item.message}"
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <div className="font-medium text-slate-800">
                                                {formatCurrency(item.amount)}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const ngo = ngoDirectory.find((n) => n.id === item.ngoId) ||
                                                        shortlist.find((n) => n.id === item.ngoId);
                                                    if (ngo) setSelectedNgo(ngo);
                                                }}
                                                className="px-3 py-1 text-xs rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            >
                                                View NGO
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    function ConnectionsPage() {
        useEffect(() => {
            const timer = setTimeout(() => connectionsSearchRef.current?.focus?.(), 80);
            return () => clearTimeout(timer);
        }, []);

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1 card-base p-6 bg-white border border-indigo-50 rounded-2xl">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="text-indigo-500" size={18} />
                            <div className="font-semibold text-slate-800">Filters</div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium mb-2 text-slate-500">
                                    <Search size={16} />
                                    Search
                                </label>
                                <input
                                    ref={connectionsSearchRef}
                                    value={connSearchQuery}
                                    onChange={(e) => setConnSearchQuery(e.target.value)}
                                    placeholder="Search by name, location, or tagline"
                                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium mb-2 text-slate-500">
                                    🎯 Project Focus
                                </label>
                                <select
                                    value={connFocusFilter}
                                    onChange={(e) => setConnFocusFilter(e.target.value)}
                                    className="w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All Project Focus Areas</option>
                                    {connectionFocusOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={connVerifiedOnly}
                                    onChange={(e) => setConnVerifiedOnly(e.target.checked)}
                                    className="text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-slate-500">✅ Verified only</span>
                            </div>

                            <button
                                onClick={() => {
                                    setConnSearchQuery("");
                                    setConnFocusFilter("");
                                    setConnVerifiedOnly(false);
                                }}
                                className="w-full px-4 py-2 text-sm font-medium text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-500"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-3 space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h1 className="text-2xl font-semibold text-slate-800">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
                                        Discover
                                    </span>{" "}
                                    Projects
                                </h1>
                                <p className="text-sm text-slate-500">
                                    Find high-impact NGO projects seeking CSR funding
                                </p>
                            </div>
                            <div className="text-sm text-slate-500">
                                {filteredConnections.length} project
                                {filteredConnections.length !== 1 ? "s" : ""} found
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredConnections.map((ngo) => {
                                const focusAreaValues = (ngo.focusAreas || []).filter(
                                    (area) => area && normalizeFocusAreaValue(area) !== "general"
                                );
                                return (
                                    <div
                                        key={ngo.project?.id ?? ngo.id}
                                        className="group flex flex-col overflow-hidden transition-all duration-300 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1"
                                    >
                                        <div className="relative h-48 bg-slate-100">
                                            <img
                                                src={ngo.logo}
                                                alt={focusAreaValues[0] ? getFocusAreaLabel(focusAreaValues[0]) : ngo.name}
                                                className="object-cover w-full h-full"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/45 via-slate-900/10 to-transparent" />
                                            <span
                                                className={`absolute top-3 left-3 px-3 py-1 text-xs font-semibold rounded-full text-white shadow-sm ${
                                                    ngo.verified ? "bg-emerald-500/90" : "bg-amber-500/90"
                                                }`}
                                            >
                                                {ngo.verified ? "Verified" : "Unverified"}
                                            </span>
                                            <button
                                                onClick={() => toggleSaveNgoHandler(ngo.ngoId)}
                                                className="absolute flex items-center justify-center w-10 h-10 transition rounded-full top-3 right-3 bg-white/80 backdrop-blur text-slate-700 hover:bg-white"
                                                title={
                                                    savedNgos.includes(ngo.ngoId)
                                                        ? "Remove from shortlist"
                                                        : "Save NGO"
                                                }
                                            >
                                                {savedNgos.includes(ngo.ngoId) ? (
                                                    <BookmarkCheck size={18} />
                                                ) : (
                                                    <Bookmark size={18} />
                                                )}
                                            </button>
                                            {(ngo.project?.name || ngo.name) && (
                                                <div className="absolute inset-x-0 bottom-0 px-5 pb-4">
                                                    <div className="text-sm font-semibold text-white line-clamp-1 drop-shadow-sm">
                                                        {ngo.project?.name || ngo.name}
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-100/80">
                                                        <MapPin size={14} />
                                                        <span className="line-clamp-1">
                                                            {ngo.location || ngo.project?.location || "Location not specified"}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 flex flex-col gap-4 p-5">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition">
                                                        {ngo.name}
                                                    </div>
                                                    <p className="mt-1 text-sm leading-relaxed text-slate-600 line-clamp-2">
                                                        {ngo.tagline ||
                                                            ngo.project?.description ||
                                                            "No introduction provided yet."}
                                                    </p>
                                                </div>
                                                {ngo.project?.durationMonths ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                                                        <Clock size={14} />
                                                        {ngo.project.durationMonths} mo
                                                    </span>
                                                ) : null}
                                            </div>

                                            {ngo.project && (
                                                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 space-y-3">
                                                    <div className="text-sm font-semibold text-slate-700">
                                                        {ngo.project.name}
                                                    </div>
                                                    <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                                                        <div className="flex items-center gap-1.5">
                                                            <HandCoins size={14} className="text-indigo-500" />
                                                            <span className="font-medium text-slate-700">
                                                                {ngo.project.fundsDisplay}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Users size={14} className="text-indigo-500" />
                                                            <span>
                                                                {ngo.project.beneficiaries.toLocaleString("en-IN")} beneficiaries
                                                            </span>
                                                        </div>
                                                        {ngo.project.startDate && (
                                                            <div className="flex items-center gap-1.5">
                                                                <Calendar size={14} className="text-indigo-500" />
                                                                <span>
                                                                    {new Date(ngo.project.startDate).toLocaleDateString("en-IN", {
                                                                        month: "short",
                                                                        year: "numeric",
                                                                    })}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                                                        {ngo.project.description || "No public description shared yet."}
                                                    </div>
                                                </div>
                                            )}

                                            {focusAreaValues.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {focusAreaValues.map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-50 text-indigo-600"
                                                        >
                                                            {getFocusAreaLabel(tag)}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="mt-auto flex flex-wrap gap-3 justify-between">
                                                <button
                                                    onClick={() => setSelectedNgo(ngo)}
                                                    className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                                >
                                                    <Eye size={16} />
                                                    View NGO
                                                </button>
                                                <button
                                                    onClick={() => setRequestModal({ open: true, ngo })}
                                                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
                                                >
                                                    <Send size={16} />
                                                    Send Request
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    function AnalyticsPage() {
        const portfolioRows = projects
            .filter((project) => project.status !== "archived")
            .map((project) => ({
                ngo: project.ngo,
                project: project.name,
                funds: Math.round((project.funds || 0) / 100000),
            }));

        const totalFunds = portfolioRows.reduce((sum, row) => sum + row.funds, 0);

        return (
            <div className="space-y-6">
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="card-base p-5 bg-white border border-indigo-50 rounded-2xl shadow-sm">
                        <div className="font-semibold mb-3 text-slate-800 flex items-center gap-2">
                            <PieIcon size={18} className="text-indigo-500" />
                            Investment by Focus Area
                        </div>
                        <div className="w-full h-72">
                            {fundDistributionData.length === 0 ? (
                                <div className="grid h-full border border-dashed place-items-center text-slate-500 rounded-xl">
                                    No data available
                                </div>
                            ) : (
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={fundDistributionData}
                                            dataKey="value"
                                            nameKey="name"
                                            outerRadius={110}
                                            innerRadius={65}
                                            paddingAngle={3}
                                        >
                                            {fundDistributionData.map((entry, index) => (
                                                <Cell
                                                    key={entry.name}
                                                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                    <div className="card-base p-5 bg-white border border-indigo-50 rounded-2xl shadow-sm">
                        <div className="font-semibold mb-3 text-slate-800 flex items-center gap-2">
                            <BarChart3 size={18} className="text-indigo-500" />
                            Monthly CSR Spending (₹ Lakh)
                        </div>
                        <div className="w-full h-72">
                            {monthlySpendingData.length === 0 ? (
                                <div className="grid h-full border border-dashed place-items-center text-slate-500 rounded-xl">
                                    No data available
                                </div>
                            ) : (
                                <ResponsiveContainer>
                                    <BarChart data={monthlySpendingData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="committed" fill="#6366f1" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </section>

                <section className="card-base p-5 bg-white border border-indigo-50 rounded-2xl shadow-sm">
                    <div className="font-semibold mb-3 text-slate-800 flex items-center gap-2">
                        <TrendingUp size={18} className="text-indigo-500" />
                        Partnership Growth Over Time
                    </div>
                    <div className="w-full h-72">
                        {monthlySpendingData.length === 0 ? (
                            <div className="grid h-full border border-dashed place-items-center text-slate-500 rounded-xl">
                                No data available
                            </div>
                        ) : (
                            <ResponsiveContainer>
                                <LineChart data={monthlySpendingData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="committed"
                                        stroke="#22d3ee"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </section>

                <section className="card-base p-5 bg-white border border-indigo-50 rounded-2xl shadow-sm">
                    <div className="font-semibold mb-3 text-slate-800">Portfolio Summary</div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-500">
                                    <th className="py-2">NGO</th>
                                    <th>Project</th>
                                    <th>Funds (₹ Lakh)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {portfolioRows.map((row) => (
                                    <tr key={`${row.ngo}-${row.project}`}>
                                        <td className="py-2 text-slate-700">{row.ngo}</td>
                                        <td className="text-slate-600">{row.project}</td>
                                        <td className="text-slate-600">{row.funds}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td className="py-2 font-medium text-slate-700">Total</td>
                                    <td />
                                    <td className="font-medium text-slate-700">{totalFunds}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </section>
            </div>
        );
    }

    function ReportsPage() {
        const reportRows = projects.map((project) => ({
            name: project.name,
            ngo: project.ngo,
            status: project.status,
            funds: project.fundsDisplay,
            progress: `${project.progress}%`,
        }));

        return (
            <div className="space-y-6">
                <section className="card-base p-6 bg-white border border-indigo-50 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-800">Portfolio Status Report</h2>
                        <span className="text-sm text-slate-500">
                            Updated {new Date().toLocaleDateString("en-IN")}
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-500">
                                    <th className="py-2">Project</th>
                                    <th>NGO</th>
                                    <th>Status</th>
                                    <th>Progress</th>
                                    <th>Funds</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportRows.map((row) => (
                                    <tr key={row.name}>
                                        <td className="py-2 text-slate-700">{row.name}</td>
                                        <td className="text-slate-600">{row.ngo}</td>
                                        <td className="text-slate-600 capitalize">{row.status}</td>
                                        <td className="text-slate-600">{row.progress}</td>
                                        <td className="text-slate-600">{row.funds}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        );
    }

    function SettingsPage() {
        const [form, setForm] = useState({
            name: userProfile?.profile?.organization_name || userProfile?.user?.name || "",
            industry: userProfile?.profile?.industry || "",
            location: userProfile?.profile?.location || "",
            website: userProfile?.profile?.website || "",
            contactPerson: userProfile?.profile?.contact_person || userProfile?.user?.name || "",
            email: userProfile?.profile?.email || userProfile?.user?.email || "",
            phone: userProfile?.profile?.phone || "",
            budget: userProfile?.profile?.csr_budget || "",
        });

        const handleSave = () => {
            showAlert("Settings saved (demo only)", "success");
        };

        return (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-50 space-y-6">
                <div>
                    <h2 className="text-xl font-semibold text-slate-800">Profile Settings</h2>
                    <p className="text-sm text-slate-500">
                        Manage your corporate CSR profile information
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { key: "name", label: "Company Name" },
                        { key: "industry", label: "Industry" },
                        { key: "location", label: "Location" },
                        { key: "website", label: "Website" },
                        { key: "contactPerson", label: "Contact Person" },
                        { key: "email", label: "Email" },
                        { key: "phone", label: "Phone" },
                        { key: "budget", label: "CSR Budget" },
                    ].map((field) => (
                        <label key={field.key} className="block">
                            <span className="text-xs text-slate-500 block mb-1">{field.label}</span>
                            <input
                                value={form[field.key] || ""}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        [field.key]: e.target.value,
                                    }))
                                }
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </label>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleSave}
                        className="px-5 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500"
                    >
                        Save Changes
                    </button>
                    <button
                        onClick={() =>
                            setForm({
                                name: userProfile?.profile?.organization_name || userProfile?.user?.name || "",
                                industry: userProfile?.profile?.industry || "",
                                location: userProfile?.profile?.location || "",
                                website: userProfile?.profile?.website || "",
                                contactPerson: userProfile?.profile?.contact_person || userProfile?.user?.name || "",
                                email: userProfile?.profile?.email || userProfile?.user?.email || "",
                                phone: userProfile?.profile?.phone || "",
                                budget: userProfile?.profile?.csr_budget || "",
                            })
                        }
                        className="px-5 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >
                        Reset
                    </button>
                </div>
            </div>
        );
    }

    function ViewProjectModal({ project, onClose }) {
        if (!project) return null;
        const messages = projectMessages[project.id] || [];
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/30" onClick={onClose} />
                <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 z-10">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-xl font-semibold text-slate-800">{project.name}</h3>
                            <p className="text-sm text-slate-500">
                                {project.ngo} • {project.location}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                Started: {project.startDate || "TBD"}
                                {project.endDate ? ` • Ended: ${project.endDate}` : ""}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="mt-4 grid md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-slate-600">{project.description}</p>
                            <div className="mt-4 space-y-2 text-sm">
                                <div className="text-slate-500">
                                    Beneficiaries:{" "}
                                    <span className="font-medium text-slate-700">
                                        {project.beneficiaries.toLocaleString("en-IN")}
                                    </span>
                                </div>
                                <div className="text-slate-500">
                                    Funds:{" "}
                                    <span className="font-medium text-slate-700">
                                        {project.fundsDisplay}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="text-xs text-slate-500">Progress</div>
                            <div className="mt-2 flex items-center gap-3">
                                <ProgressBar value={project.progress} />
                                <div className="text-sm font-medium">{project.progress}%</div>
                            </div>

                            <div className="mt-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold text-slate-700">Message History</h4>
                                    <button
                                        onClick={() => setMessageModal({ open: true, project })}
                                        className="px-3 py-1 rounded-md bg-indigo-600 text-white text-sm flex items-center gap-2"
                                    >
                                        <MessageCircle size={16} />
                                        Message Partner
                                    </button>
                                </div>
                                {messages.length === 0 ? (
                                    <p className="text-sm text-slate-500 mt-2">No messages yet.</p>
                                ) : (
                                    <ul className="mt-2 space-y-2 text-sm">
                                        {messages.map((msg) => (
                                            <li key={msg.id} className="border border-slate-100 rounded-lg p-3 bg-slate-50">
                                                <div className="font-medium text-slate-700">{msg.author}</div>
                                                <div className="text-slate-600">{msg.text}</div>
                                                <div className="text-xs text-slate-400 mt-1">
                                                    {new Date(msg.timestamp).toLocaleString("en-IN")}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        {project.status === "archived" ? (
                            <button
                                onClick={() => {
                                    restoreProject(project.id);
                                    onClose();
                                }}
                                className="px-4 py-2 rounded-md bg-emerald-600 text-white flex items-center gap-2"
                            >
                                Restore
                            </button>
                        ) : (
                            <>
                                {project.status !== "completed" && (
                                    <button
                                        onClick={() => {
                                            markProjectComplete(project.id);
                                            onClose();
                                        }}
                                        className="px-4 py-2 rounded-md bg-green-600 text-white flex items-center gap-2"
                                    >
                                        <CheckCircle2 size={16} />
                                        Mark Complete
                                    </button>
                                )}
                                {project.status !== "archived" && (
                                    <button
                                        onClick={() => {
                                            archiveProject(project.id);
                                            onClose();
                                        }}
                                        className="px-4 py-2 rounded-md bg-yellow-50 text-yellow-700"
                                    >
                                        Archive
                                    </button>
                                )}
                            </>
                        )}
                        <button
                            onClick={() => setMessageModal({ open: true, project })}
                            className="px-4 py-2 rounded-md bg-indigo-600 text-white flex items-center gap-2"
                        >
                            <MessageCircle size={16} />
                            Message
                        </button>
                        <button onClick={onClose} className="px-4 py-2 rounded-md bg-slate-100">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    function ProjectMessageModal({ current, onClose }) {
        const [text, setText] = useState("");
        const messages = projectMessages[current?.id] || [];

        if (!current) return null;

        const handleSubmit = async (e) => {
            e.preventDefault();
            await sendProjectMessage(current.id, text);
            setText("");
            onClose();
        };

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/30" onClick={onClose} />
                <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 z-10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-800">
                            Message {current.ngo} — {current.name}
                        </h3>
                        <button onClick={onClose}>
                            <X size={18} />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="w-full border rounded-lg p-3 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            placeholder="Share an update, request documents, or schedule a check-in..."
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-3 py-2 bg-slate-100 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-3 py-2 bg-indigo-600 text-white rounded flex items-center gap-2 disabled:opacity-60"
                                disabled={!text.trim()}
                            >
                                <Send size={16} />
                                Send Message
                            </button>
                        </div>
                    </form>
                    {messages.length > 0 && (
                        <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                            {messages.map((msg) => (
                                <div key={msg.id} className="border border-slate-100 rounded-lg p-3 bg-slate-50">
                                    <div className="text-sm text-slate-600">{msg.text}</div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        {new Date(msg.timestamp).toLocaleString("en-IN")}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    function SendRequestModal({ ngo, onClose }) {
        const [amount, setAmount] = useState("");
        const initialFocusArea =
            (ngo?.focusAreas || [])
                .map((area) => normalizeFocusAreaValue(area))
                .find((value) => value && value !== "general") || "";
        const [focusArea, setFocusArea] = useState(initialFocusArea);
        const [message, setMessage] = useState("");

        if (!ngo) return null;

        const handleSubmit = async (e) => {
            e.preventDefault();
            const numericAmount = parseInt(amount.replace(/\D/g, ""), 10) || 0;
            if (!numericAmount) {
                showAlert("Please provide a valid funding amount.", "error");
                return;
            }
            await sendRequest({ ngo, amount: numericAmount, message, focusArea });
            setAmount("");
            setMessage("");
            onClose();
        };

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/30" onClick={onClose} />
                <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">
                                Send Request — {ngo.name}
                            </h3>
                            <p className="text-sm text-slate-500">
                                Share funding intent and objectives
                            </p>
                        </div>
                        <button onClick={onClose}>
                            <X size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {ngo.project && (
                            <div className="border border-indigo-100 bg-indigo-50/30 rounded-xl p-4 space-y-1">
                                <div className="text-sm font-semibold text-slate-700">
                                    {ngo.project.name}
                                </div>
                                <div className="text-xs text-slate-500">
                                    Needs: {ngo.project.fundsDisplay} • Beneficiaries:{" "}
                                    {ngo.project.beneficiaries.toLocaleString("en-IN")}
                                </div>
                                <div className="text-xs text-slate-500">
                                    {ngo.project.description || "No public description shared yet."}
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="text-xs text-slate-500 block mb-1">
                                Funding Amount (₹)
                            </label>
                            <input
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="e.g. ₹ 20,00,000"
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 block mb-1">Focus Area</label>
                            <select
                                value={focusArea}
                                onChange={(e) => setFocusArea(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {(ngo.focusAreas || [])
                                    .filter((area) => area && normalizeFocusAreaValue(area) !== "general")
                                    .map((area) => (
                                        <option key={area} value={normalizeFocusAreaValue(area)}>
                                            {getFocusAreaLabel(area)}
                                        </option>
                                    ))}
                                {(!ngo.focusAreas ||
                                    ngo.focusAreas.filter(
                                        (area) => normalizeFocusAreaValue(area) !== "general"
                                    ).length === 0) && (
                                    <option value="">Not specified</option>
                                )}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 block mb-1">
                                Message / Objective
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Share your CSR objectives or expectations..."
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg text-sm bg-slate-100 text-slate-600 hover:bg-slate-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 flex items-center gap-2"
                            >
                                <Send size={16} />
                                Send Request
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    function NgoProfileModal({ ngo, onClose }) {
        if (!ngo) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/30" onClick={onClose} />
                <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 z-10 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <img
                                src={ngo.logo}
                                alt={ngo.name}
                                className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                            />
                            <div>
                                <h3 className="text-xl font-semibold text-slate-800">{ngo.name}</h3>
                                <p className="text-sm text-slate-500">{ngo.tagline}</p>
                                <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                                    <MapPin size={14} />
                                    {ngo.location}
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
                            <X size={18} />
                        </button>
                    </div>

                    <p className="text-sm text-slate-600">
                        {ngo.description || "Partner NGO working towards impactful initiatives."}
                    </p>

                    {ngo.project && (
                        <div className="border border-slate-100 rounded-xl p-5 bg-slate-50/60 space-y-3">
                            <div>
                                <div className="text-base font-semibold text-slate-800">
                                    {ngo.project.name}
                                </div>
                                <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                                    <div className="flex items-center gap-1.5">
                                        <HandCoins size={14} className="text-indigo-500" />
                                        <span className="font-medium text-slate-700">{ngo.project.fundsDisplay}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Users size={14} className="text-indigo-500" />
                                        <span>
                                            {ngo.project.beneficiaries.toLocaleString("en-IN")} beneficiaries
                                        </span>
                                    </div>
                                    {ngo.project.durationMonths ? (
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={14} className="text-indigo-500" />
                                            <span>{ngo.project.durationMonths} mo</span>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {ngo.project.description || "No public description shared yet."}
                            </p>
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-3 text-sm text-slate-600">
                        <div>
                            <p className="text-xs font-semibold uppercase text-slate-400 mb-1">Email</p>
                            <div className="flex items-center gap-2">
                                <Mail size={16} className="text-indigo-500 shrink-0" />
                                {ngo.contact?.email ? (
                                    <a
                                        href={`mailto:${ngo.contact.email}`}
                                        className="text-indigo-600 hover:underline break-all"
                                    >
                                        {ngo.contact.email}
                                    </a>
                                ) : (
                                    <span>Not provided</span>
                                )}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase text-slate-400 mb-1">Phone</p>
                            <div className="flex items-center gap-2">
                                <Phone size={16} className="text-indigo-500 shrink-0" />
                                {ngo.contact?.phone ? (
                                    <a
                                        href={`tel:${ngo.contact.phone}`}
                                        className="text-slate-600 hover:text-indigo-600"
                                    >
                                        {ngo.contact.phone}
                                    </a>
                                ) : (
                                    <span>Not provided</span>
                                )}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase text-slate-400 mb-1">Website</p>
                            <div className="flex items-center gap-2">
                                <Globe size={16} className="text-indigo-500 shrink-0" />
                                {ngo.website ? (
                                    <a
                                        href={ngo.website.startsWith("http") ? ngo.website : `https://${ngo.website}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-indigo-600 hover:underline break-all"
                                    >
                                        {ngo.website.replace(/^https?:\/\//, "")}
                                    </a>
                                ) : (
                                    <span>Not provided</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => {
                                setRequestModal({ open: true, ngo });
                                onClose();
                            }}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 flex items-center gap-2"
                        >
                            <Send size={16} />
                            Send Request
                        </button>
                        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm bg-slate-100">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const navItems = [
        { id: "dashboard", label: "Dashboard", icon: Home },
        { id: "analytics", label: "Analytics", icon: BarChart2 },
        { id: "funding", label: "Funding", icon: HandCoins },
        { id: "projects", label: "Projects", icon: FolderKanban },
        { id: "connections", label: "Connections", icon: Users },
        { id: "reports", label: "Reports", icon: FileText },
        { id: "settings", label: "Settings", icon: SettingsIcon },
    ];

    const navContent = {
        dashboard: <DashboardPage />,
        analytics: <AnalyticsPage />,
        funding: <FundingPage />,
        projects: <ProjectsPage />,
        connections: <ConnectionsPage />,
        reports: <ReportsPage />,
        settings: <SettingsPage />,
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex text-slate-800 font-[Poppins]">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={`fixed top-0 left-0 h-full bg-white/95 backdrop-blur-md shadow-xl transform transition-transform duration-300 z-30 w-64 ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                } ${sidebarPinned ? "lg:translate-x-0" : "lg:-translate-x-full"}`}
            >
                <div className="p-6 border-b flex items-center justify-between">
                    <h2 className="text-2xl font-extrabold bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent">
                        Kartvya
                    </h2>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-1 rounded hover:bg-slate-100 lg:hidden"
                    >
                        <X size={18} />
                    </button>
                </div>

                <nav className="p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = activeNav === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveNav(item.id);
                                    setSidebarOpen(false);
                                }}
                                className={`w-full text-left flex items-center gap-3 p-3 rounded-lg ${
                                    active
                                        ? "bg-indigo-50 ring-1 ring-indigo-200"
                                        : "hover:bg-slate-50"
                                }`}
                            >
                                <Icon
                                    size={18}
                                    className={active ? "text-indigo-600" : "text-slate-500"}
                                />
                                <span
                                    className={`font-medium ${
                                        active ? "text-indigo-700" : "text-slate-600"
                                    }`}
                                >
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}

                    <div className="mt-6 border-t pt-4">
                        <button className="w-full flex items-center gap-3 p-3 rounded-lg text-red-600 hover:bg-red-50">
                            <LogOut size={18} />
                            <span className="font-medium">Logout</span>
                        </button>
                    </div>
                </nav>
            </aside>

            <div
                className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ${
                    sidebarPinned ? "lg:ml-64" : "lg:ml-0"
                }`}
            >
                <header className="flex items-center justify-between p-6 bg-white border-b shadow sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 bg-white border rounded-lg shadow-sm hover:shadow-md lg:hidden"
                        >
                            <Menu size={20} />
                        </button>
                        <button
                            onClick={toggleSidebarPinned}
                            className="hidden p-2 bg-white border rounded-lg shadow-sm hover:shadow-md lg:inline-flex"
                            aria-label={sidebarPinned ? "Collapse sidebar" : "Expand sidebar"}
                        >
                            {sidebarPinned ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-indigo-700">
                                {userProfile?.profile?.organization_name ||
                                    userProfile?.user?.name ||
                                    "Corporate Dashboard"}
                            </h1>
                            <p className="text-sm text-slate-500">
                                {userProfile?.profile?.industry || "Partnering for impact"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right mr-4">
                            <p className="text-xs text-slate-500">CSR Budget</p>
                            <p className="text-sm font-medium text-slate-700">
                                {userProfile?.profile?.csr_budget || "₹ 0"}
                            </p>
                        </div>

                        <div className="relative flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-full px-4 py-2 shadow-md">
                            <CheckCircle2 size={22} className="text-emerald-600" />
                            <div className="flex flex-col leading-tight">
                                <span className="text-sm font-semibold text-emerald-700">
                                    Verified Corporate
                                </span>
                                <span className="text-[11px] text-green-700">
                                    Partner ID: <span className="text-emerald-600 font-semibold">CP-2025-045</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="p-6 space-y-6">
                    {loading ? (
                        <div className="flex items-center justify-center min-h-[400px]">
                            <div className="text-center">
                                <Loader2 className="mx-auto h-12 w-12 animate-spin text-indigo-600 mb-4" />
                                <p className="text-slate-600">Loading corporate dashboard...</p>
                            </div>
                        </div>
                    ) : (
                        navContent[activeNav] || null
                    )}
                </main>

                <footer className="text-center text-slate-500 text-sm pb-6">
                    © 2025 <span className="text-purple-600 font-semibold">Kartvya CSR Dashboard</span> | Empowering NGOs 💜
                </footer>
            </div>

            {alert && (
                <div
                    className={`fixed bottom-6 right-6 p-3 rounded shadow z-50 ${
                        alert.kind === "success"
                            ? "bg-green-50 text-green-700"
                            : alert.kind === "error"
                            ? "bg-red-50 text-red-700"
                            : "bg-indigo-50 text-indigo-700"
                    }`}
                >
                    {alert.text}
                </div>
            )}

            {viewProject && (
                <ViewProjectModal project={viewProject} onClose={() => setViewProject(null)} />
            )}

            {messageModal.open && messageModal.project && (
                <ProjectMessageModal
                    current={messageModal.project}
                    onClose={() => setMessageModal({ open: false, project: null })}
                />
            )}

            {requestModal.open && requestModal.ngo && (
                <SendRequestModal
                    ngo={requestModal.ngo}
                    onClose={() => setRequestModal({ open: false, ngo: null })}
                />
            )}

            {selectedNgo && (
                <NgoProfileModal ngo={selectedNgo} onClose={() => setSelectedNgo(null)} />
            )}
        </div>
    );
}
