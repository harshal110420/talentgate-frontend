import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyPermissions } from "../features/UserPermission/userPermissionSlice";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import DashboardSkeleton from "../components/skeletons/DashboardSkeleton";
import Navbar from "../components/Navbar";

// ── Module icon map ──────────────────────────────────────────────
const MODULE_META = {
  candidate_management: {
    icon: "👤",
    color: "from-blue-500/20 to-blue-600/10",
    accent: "#3b82f6",
    border: "border-blue-500/30",
    tag: "Recruitment",
  },
  exam_management: {
    icon: "📝",
    color: "from-violet-500/20 to-violet-600/10",
    accent: "#8b5cf6",
    border: "border-violet-500/30",
    tag: "Assessment",
  },
  interview_management: {
    icon: "🎙️",
    color: "from-emerald-500/20 to-emerald-600/10",
    accent: "#10b981",
    border: "border-emerald-500/30",
    tag: "Hiring",
  },
  user_management: {
    icon: "🛡️",
    color: "from-amber-500/20 to-amber-600/10",
    accent: "#f59e0b",
    border: "border-amber-500/30",
    tag: "Admin",
  },
  department_management: {
    icon: "🏢",
    color: "from-rose-500/20 to-rose-600/10",
    accent: "#f43f5e",
    border: "border-rose-500/30",
    tag: "Organization",
  },
  job_management: {
    icon: "💼",
    color: "from-cyan-500/20 to-cyan-600/10",
    accent: "#06b6d4",
    border: "border-cyan-500/30",
    tag: "Openings",
  },
};

const DEFAULT_META = {
  icon: "⚡",
  color: "from-slate-500/20 to-slate-600/10",
  accent: "#64748b",
  border: "border-slate-500/30",
  tag: "Module",
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

const getInitials = (first, last) =>
  `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();

// ── ModuleCard ───────────────────────────────────────────────────
const ModuleCard = ({ mod, index }) => {
  const key = mod.modulePath?.split("/").pop() || "";
  const meta = MODULE_META[key] || DEFAULT_META;
  const menus = mod?.menus || {};
  const allMenus = Object.values(menus).flat();
  const menuCount = allMenus.length;

  return (
    <Link
      to={`/module/${mod.modulePath}`}
      className="group relative block"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div
        className={`
          relative overflow-hidden rounded-2xl border bg-white dark:bg-gray-900
          ${meta.border}
          transition-all duration-300
          hover:-translate-y-1 hover:shadow-xl
          dark:hover:shadow-black/40
          animate-fadeIn
        `}
      >
        {/* Gradient bg */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${meta.color} opacity-60 group-hover:opacity-100 transition-opacity duration-300`}
        />

        {/* Accent line top */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: `linear-gradient(90deg, transparent, ${meta.accent}, transparent)` }}
        />

        <div className="relative p-6">
          {/* Header row */}
          <div className="flex items-start justify-between mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl
                         border border-white/20 bg-white/10 backdrop-blur-sm
                         group-hover:scale-110 transition-transform duration-300"
            >
              {meta.icon}
            </div>
            <span
              className="text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{
                color: meta.accent,
                background: `${meta.accent}18`,
                border: `1px solid ${meta.accent}30`,
              }}
            >
              {meta.tag}
            </span>
          </div>

          {/* Name */}
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-1 leading-tight">
            {mod.moduleName}
          </h3>

          {/* Menu count */}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {menuCount} {menuCount === 1 ? "section" : "sections"} available
          </p>

          {/* Arrow */}
          <div className="mt-5 flex items-center gap-1.5 text-xs font-medium"
            style={{ color: meta.accent }}>
            <span>Open module</span>
            <span className="transform group-hover:translate-x-1 transition-transform duration-200 inline-block">→</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

// ── Stat pill ────────────────────────────────────────────────────
const StatPill = ({ label, value, color }) => (
  <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 shadow-sm">
    <span className="w-2 h-2 rounded-full" style={{ background: color }} />
    <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{value}</span>
  </div>
);

// ── Dashboard ────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user?.id) dispatch(fetchMyPermissions(user.id));
  }, [user, dispatch]);

  const { loggedInUserPermissions = [], loading } = useSelector(
    (state) => state.userPermission || {}
  );

  if (!user) return null;

  const visibleModules = loggedInUserPermissions.filter((module) => {
    const menus = module?.menus || {};
    const allMenus = Object.values(menus).flat();
    return allMenus.some((menu) => menu.actions?.includes("view"));
  });

  const totalMenus = visibleModules.reduce((acc, mod) => {
    const menus = mod?.menus || {};
    return acc + Object.values(menus).flat().length;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        * { font-family: 'DM Sans', sans-serif; }
        code, .mono { font-family: 'DM Mono', monospace; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
        .animate-fadeIn  { animation: fadeIn 0.4s ease both; }
        .animate-slideDown { animation: slideDown 0.35s ease both; }

        .dot-grid {
          background-image: radial-gradient(circle, #94a3b820 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .dark .dot-grid {
          background-image: radial-gradient(circle, #ffffff0d 1px, transparent 1px);
        }
      `}</style>

      <Navbar />

      <main className="max-w-7xl mx-auto px-5 py-8">

        {/* ── Hero Banner ──────────────────────────────────────── */}
        <div className="relative rounded-3xl overflow-hidden mb-8 animate-slideDown"
          style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)" }}>

          {/* dot grid overlay */}
          <div className="absolute inset-0 dot-grid opacity-60" />

          {/* glow blobs */}
          <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full"
            style={{ background: "radial-gradient(circle, #3b82f630 0%, transparent 70%)" }} />
          <div className="absolute -bottom-12 right-8 w-48 h-48 rounded-full"
            style={{ background: "radial-gradient(circle, #8b5cf620 0%, transparent 70%)" }} />

          <div className="relative px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">

            {/* Left — greeting */}
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600
                               flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {getInitials(user.firstName, user.lastName)}
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-gray-900" />
              </div>

              {/* Text */}
              <div className="flex flex-col gap-1">
                <p className="text-blue-400 text-xs font-medium tracking-widest opacity-75">
                  {getGreeting()}
                </p>

                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  {user.firstName} {user.lastName}
                </h1>

                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                  <span>{user.displayName || user.role?.role_name || "Team Member"}</span>
                  <span className="text-gray-600">•</span>
                  <span>{user.departmentName || user.department?.name}</span>
                </div>
              </div>
            </div>

            {/* Right — stat pills */}
            <div className="flex flex-wrap gap-2">
              {/* <StatPill label="Modules" value={visibleModules.length} color="#3b82f6" />
              <StatPill label="Sections" value={totalMenus} color="#8b5cf6" /> */}
              <StatPill
                label="Today"
                value={new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                color="#10b981"
              />
            </div>
          </div>
        </div>

        {/* ── Section header ───────────────────────────────────── */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Your Modules
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {visibleModules.length} module{visibleModules.length !== 1 ? "s" : ""} accessible to you
            </p>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Live session
          </div>
        </div>

        {/* ── Module Grid ──────────────────────────────────────── */}
        {loading ? (
          <DashboardSkeleton />
        ) : visibleModules.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fadeIn">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
              No modules assigned
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
              Your account doesn't have access to any modules yet. Contact your administrator.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleModules.map((mod, i) => (
              <ModuleCard key={mod.modulePath} mod={mod} index={i} />
            ))}
          </div>
        )}

        {/* ── Footer note ──────────────────────────────────────── */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-10 mono">
          TalentGate · {new Date().getFullYear()} · {user.mail}
        </p>
      </main>
    </div>
  );
};

export default Dashboard;