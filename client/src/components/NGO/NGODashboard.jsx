import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
    Menu,
    X,
    CheckCircle,
    HandCoins,
    FolderKanban,
    Users,
    TrendingUp,
    Home,
    BarChart2,
    FileText,
    Settings,
    LogOut,
} from "lucide-react";

export default function NGODashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeNav, setActiveNav] = useState("dashboard");

    const [csrRequests, setCsrRequests] = useState([
        {
            id: 1,
            company: "GreenEarth Pvt Ltd",
            project: "Tree Plantation Drive",
            budget: "₹2,00,000",
            message: "Partnering for environmental restoration",
        },
        {
            id: 2,
            company: "TechForGood",
            project: "Digital Literacy Camp",
            budget: "₹1,50,000",
            message: "CSR for rural education",
        },
    ]);

    const [activeProjects] = useState([
        {
            id: 1,
            name: "Clean Water Initiative",
            donor: "HydroCare Ltd",
            funds: "₹3,00,000",
            progress: 80,
        },
        {
            id: 2,
            name: "School Renovation",
            donor: "EduCorp India",
            funds: "₹1,75,000",
            progress: 55,
        },
    ]);

    const fundData = [
        { name: "HydroCare Ltd", value: 300000 },
        { name: "EduCorp India", value: 175000 },
        { name: "GreenEarth Pvt Ltd", value: 200000 },
    ];

    // 🌈 Turquoise, pinkish, and purplish pie chart colors
    const COLORS = ["#14b8a6", "#ec4899", "#8b5cf6"];

    const handleAccept = (id) => {
        setCsrRequests((s) => s.filter((r) => r.id !== id));
        alert("✅ Connection Accepted");
    };

    const handleDecline = (id) => {
        setCsrRequests((s) => s.filter((r) => r.id !== id));
        alert("❌ Connection Declined");
    };

    const navItems = [
        { id: "dashboard", label: "Dashboard", icon: Home },
        { id: "analytics", label: "Analytics", icon: BarChart2 },
        { id: "funding", label: "Funding", icon: HandCoins },
        { id: "projects", label: "Projects", icon: FolderKanban },
        { id: "reports", label: "Reports", icon: FileText },
        { id: "settings", label: "Settings", icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex text-slate-800 font-[Poppins]">
            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full bg-white/95 backdrop-blur-md shadow-xl transform transition-transform duration-300 z-30 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    } w-64`}
            >
                <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent font-[Poppins]">
                            Kartvya
                        </h2>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            aria-label="close sidebar"
                            className="p-1 rounded-md hover:bg-slate-100"
                        >
                            <X size={18} className="text-slate-600" />
                        </button>
                    </div>
                </div>

                <nav className="p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = activeNav === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveNav(item.id)}
                                className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition ${active
                                    ? "bg-indigo-50 ring-1 ring-indigo-200"
                                    : "hover:bg-slate-50"
                                    }`}
                            >
                                <Icon
                                    size={18}
                                    className={active ? "text-indigo-600" : "text-slate-500"}
                                />
                                <span
                                    className={`font-medium ${active ? "text-indigo-700" : "text-slate-600"
                                        }`}
                                >
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}

                    <div className="mt-4 border-t pt-4">
                        <button className="w-full flex items-center gap-3 p-3 rounded-lg text-red-600 hover:bg-red-50">
                            <LogOut size={18} />
                            <span className="font-medium">Logout</span>
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="flex items-center justify-between p-6 bg-white border-b shadow-md sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 bg-white border rounded-lg shadow-sm hover:shadow-md"
                            aria-label="open sidebar"
                        >
                            <Menu size={20} className="text-indigo-600" />
                        </button>

                        <div>
                            <h1 className="text-xl font-bold text-indigo-700 font-[Poppins]">
                                Hope Foundation
                            </h1>
                            <p className="text-sm text-slate-500">
                                Empowering Lives Through CSR Initiatives
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right mr-4">
                            <p className="text-xs text-slate-500">Organization Type</p>
                            <p className="text-sm font-medium text-slate-700">
                                Registered NGO
                            </p>
                        </div>

                        {/* Improved Verified Badge – Green Theme */}
                        <div className="relative flex items-center gap-3 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border border-emerald-200 rounded-full px-4 py-2 shadow-md backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-105">
                            <div className="relative">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 opacity-30 blur-sm"></div>
                                <CheckCircle
                                    size={22}
                                    className="text-emerald-600 drop-shadow-[0_0_6px_rgba(16,185,129,0.4)] animate-pulse"
                                />
                            </div>
                            <div className="flex flex-col leading-tight">
                                <span className="text-sm font-semibold text-emerald-700 tracking-wide font-[Poppins]">
                                    Verified Organization
                                </span>
                                <span className="text-[11px] text-green-700 font-medium">
                                    Badge ID: <span className="text-emerald-600 font-semibold">VF-2025-011</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Stats Overview */}
                <section className="grid md:grid-cols-4 gap-6 p-6">
                    {/* Total Funds (Now turquoise like Connections) */}
                    <div className="bg-gradient-to-br from-teal-50 to-cyan-100 rounded-2xl shadow-sm p-5 border hover:border-cyan-300 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                        <p className="text-sm text-slate-500">Total Funds</p>
                        <div className="flex justify-between items-center mt-1">
                            <h2 className="text-3xl font-extrabold text-cyan-700">₹6,75,000</h2>
                            <div className="bg-cyan-200 p-2 rounded-lg">
                                <HandCoins className="text-cyan-700" size={28} />
                            </div>
                        </div>
                    </div>

                    {/* Active Projects */}
                    <div className="bg-gradient-to-br from-violet-50 to-purple-100 rounded-2xl shadow-sm p-5 border hover:border-violet-300 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                        <p className="text-sm text-slate-500">Active Projects</p>
                        <div className="flex justify-between items-center mt-1">
                            <h2 className="text-3xl font-extrabold text-violet-700">2</h2>
                            <div className="bg-violet-200 p-2 rounded-lg">
                                <FolderKanban className="text-violet-700" size={28} />
                            </div>
                        </div>
                    </div>

                    {/* Connections */}
                    <div className="bg-gradient-to-br from-teal-50 to-cyan-100 rounded-2xl shadow-sm p-5 border hover:border-cyan-300 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                        <p className="text-sm text-slate-500">Connections</p>
                        <div className="flex justify-between items-center mt-1">
                            <h2 className="text-3xl font-extrabold text-cyan-700">5</h2>
                            <div className="bg-cyan-200 p-2 rounded-lg">
                                <Users className="text-cyan-700" size={28} />
                            </div>
                        </div>
                    </div>

                    {/* Pending Requests */}
                    <div className="bg-gradient-to-br from-violet-50 to-purple-100 rounded-2xl shadow-sm p-5 border hover:border-violet-300 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                        <p className="text-sm text-slate-500">Pending Requests</p>
                        <div className="flex justify-between items-center mt-1">
                            <h2 className="text-3xl font-extrabold text-violet-700">
                                {csrRequests.length}
                            </h2>
                            <div className="bg-violet-200 p-2 rounded-lg">
                                <TrendingUp className="text-violet-700" size={28} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Main content cards */}
                <main className="grid md:grid-cols-2 gap-8 p-6">
                    {/* CSR Requests */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-50">
                        <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent font-[Poppins]">
                            Pending CSR Requests
                        </h2>
                        {csrRequests.length === 0 ? (
                            <p className="text-slate-500">No pending requests 🎉</p>
                        ) : (
                            csrRequests.map((req) => (
                                <div
                                    key={req.id}
                                    className="border-b py-4 flex justify-between items-center"
                                >
                                    <div>
                                        <h3 className="font-semibold text-black">{req.company}</h3>
                                        <p className="text-sm text-slate-600">
                                            {req.project} —{" "}
                                            <span className="font-medium text-purple-600">
                                                {req.budget}
                                            </span>
                                        </p>
                                        <p className="text-slate-500 text-xs italic">
                                            {req.message}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAccept(req.id)}
                                            className="px-3 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-all"
                                        >
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => handleDecline(req.id)}
                                            className="px-3 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all"
                                        >
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Fund Distribution */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-50">
                        <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent font-[Poppins]">
                            Fund Distribution
                        </h2>
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
                </main>

                {/* Active Projects */}
                <section className="bg-white shadow-inner rounded-2xl p-6 mx-6 mb-10 border border-indigo-50">
                    <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent font-[Poppins]">
                        Active Projects
                    </h2>
                    {activeProjects.map((proj) => (
                        <div key={proj.id} className="border-b py-3">
                            <p className="font-semibold text-black">{proj.name}</p>
                            <p className="text-sm text-slate-500">Donor: {proj.donor}</p>
                            <p className="text-sm text-slate-600 mb-1">Funds: {proj.funds}</p>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{ width: `${proj.progress}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </section>

                {/* Footer */}
                <footer className="text-center text-slate-500 text-sm pb-6">
                    © 2025{" "}
                    <span className="text-purple-600 font-semibold font-[Poppins]">
                        Kartvya CSR Dashboard
                    </span>{" "}
                    | Empowering NGOs 💜
                </footer>
            </div>
        </div>
    );
}
