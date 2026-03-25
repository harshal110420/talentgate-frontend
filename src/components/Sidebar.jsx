import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSelector } from "react-redux";
import { useState } from "react";
import {
  ChevronDown,
  Users, FileText, Briefcase, Building2,
  ClipboardList, Settings, LayoutGrid, Shield,
  GraduationCap, CalendarCheck, UserCheck,
} from "lucide-react";

/* ── Category icon map ───────────────────────────────────────── */
const CATEGORY_ICONS = {
  "Recruitment": <Users size={13} />,
  "Assessment": <GraduationCap size={13} />,
  "Interview": <CalendarCheck size={13} />,
  "HR Tools": <ClipboardList size={13} />,
  "Administration": <Shield size={13} />,
  "Organization": <Building2 size={13} />,
  "Jobs": <Briefcase size={13} />,
  "Reports": <FileText size={13} />,
  "Settings": <Settings size={13} />,
  "Selection": <UserCheck size={13} />,
};

const getCategoryIcon = (cat) =>
  CATEGORY_ICONS[cat] || <LayoutGrid size={13} />;

/* ── Menu item icon color by index (subtle variety) ─────────── */
const ACCENT_COLORS = [
  { dot: "#3b82f6", activeBg: "bg-blue-50 dark:bg-blue-950/60", activeText: "text-blue-700 dark:text-blue-300", activeBorder: "border-blue-300 dark:border-blue-700" },
];

const Sidebar = ({ moduleName, collapsed }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { loggedInUserPermissions: modules } = useSelector(
    (state) => state.userPermission
  );
  const [openCategory, setOpenCategory] = useState(null);

  if (!user || !modules) return null;

  const currentModule = modules.find((mod) => mod.modulePath === moduleName);

  if (!currentModule) {
    return (
      <div className="m-4 rounded-xl bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
        🚫 No access to this module
      </div>
    );
  }

  const modulePermissions = currentModule.menus;
  const toggleCategory = (cat) =>
    setOpenCategory(openCategory === cat ? null : cat);

  return (
    <aside
      className={`
        ${collapsed ? "w-0 opacity-0 pointer-events-none" : "w-64 opacity-100"}
        transition-all duration-300 ease-in-out
        h-full flex-shrink-0 flex flex-col
        bg-white dark:bg-gray-900
        border-r border-gray-200 dark:border-gray-800
        overflow-hidden
      `}
    >
      {!collapsed && (
        <>
          {/* ── Module Header ── */}
          <div className="px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
            {/* Module badge */}
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700
                              flex items-center justify-center shadow-sm flex-shrink-0">
                <LayoutGrid size={14} color="white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight truncate">
                  {currentModule.moduleName}
                </h2>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider mt-0.5">
                  Module
                </p>
              </div>
            </div>
          </div>

          {/* ── Navigation ── */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5
                          scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
            {Object.keys(modulePermissions).map((category, catIdx) => {
              const visibleMenus = modulePermissions[category]?.filter(
                (menu) => menu.actions?.includes("view")
              );
              if (!visibleMenus?.length) return null;

              const isOpen = openCategory === category;
              const accent = ACCENT_COLORS[catIdx % ACCENT_COLORS.length];

              // Check if any menu in this category is active
              const isCategoryActive = visibleMenus.some((m) =>
                location.pathname.includes(m.menuId)
              );

              return (
                <div key={category}>
                  {/* ── Category Button ── */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className={`
                      w-full flex items-center justify-between
                      px-3 py-2.5 rounded-xl
                      text-xs font-semibold uppercase tracking-wider
                      transition-all duration-200
                      ${isCategoryActive
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-700 dark:hover:text-gray-300"
                      }
                    `}
                  >
                    <span className="flex items-center gap-2">
                      {/* Icon with accent color */}
                      <span
                        className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ background: `${accent.dot}20`, color: accent.dot }}
                      >
                        {getCategoryIcon(category)}
                      </span>
                      {category}
                    </span>

                    <ChevronDown
                      size={14}
                      className={`text-gray-400 transition-transform duration-200 flex-shrink-0
                        ${isOpen ? "rotate-180" : "rotate-0"}`}
                    />
                  </button>

                  {/* ── Menu Items ── */}
                  <div
                    className={`
                      overflow-hidden transition-all duration-300 ease-in-out
                      ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}
                    `}
                  >
                    <ul className="mt-1 ml-3 pl-3 space-y-0.5
                                   border-l-2 border-gray-100 dark:border-gray-800">
                      {visibleMenus.map((subModule, menuIdx) => {
                        const isActive = location.pathname.includes(subModule.menuId);
                        const menuAccent = ACCENT_COLORS[menuIdx % ACCENT_COLORS.length];

                        return (
                          <li key={subModule.menuId}>
                            <Link
                              to={`/module/${moduleName}/${subModule.menuId}`}
                              className={`
                                flex items-center gap-2.5
                                px-3 py-2 rounded-lg text-sm
                                transition-all duration-150
                                ${isActive
                                  ? `${menuAccent.activeBg} ${menuAccent.activeText} font-semibold border ${menuAccent.activeBorder}`
                                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 font-medium"
                                }
                              `}
                            >
                              {/* Active indicator dot */}
                              <span
                                className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-150"
                                style={{
                                  background: isActive ? menuAccent.dot : "transparent",
                                  border: isActive ? "none" : "1.5px solid #d1d5db",
                                }}
                              />
                              <span className="truncate">{subModule.name}</span>

                              {/* Active arrow */}
                              {isActive && (
                                <span
                                  className="ml-auto text-xs flex-shrink-0"
                                  style={{ color: menuAccent.dot }}
                                >
                                  ›
                                </span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              );
            })}
          </nav>

          {/* ── Footer ── */}
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600
                              flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate leading-tight">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate capitalize">
                  {user?.role?.displayName || user?.role?.role_name || "Team Member"}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </aside>
  );
};

export default Sidebar;