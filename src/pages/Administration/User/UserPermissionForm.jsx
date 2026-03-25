// UserPermissionForm.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllPermissions } from "../../../features/permissions/permissionSlice";
import {
    fetchMyPermissions,
    fetchPermissionsByUser,
    saveUserPermission,
} from "../../../features/UserPermission/userPermissionSlice";
import {
    Check, ChevronDown, ChevronRight, X,
    Search, Shield, ShieldCheck, ShieldOff,
    ArrowLeft, Save, Loader2, User,
} from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { getModulePathByMenu } from "../../../utils/navigation";
import { useAuth } from "../../../context/AuthContext";

const actionList = ["view", "details", "new", "edit", "delete", "print", "export", "upload"];

/* ── Action color config ─────────────────────────────────────── */
const ACTION_META = {
    view: { color: "blue", label: "View" },
    details: { color: "indigo", label: "Detail" },
    new: { color: "emerald", label: "New" },
    edit: { color: "amber", label: "Edit" },
    delete: { color: "red", label: "Delete" },
    print: { color: "cyan", label: "Print" },
    export: { color: "purple", label: "Export" },
    upload: { color: "orange", label: "Upload" },
};

const TYPE_CONFIG = {
    Master: { bg: "bg-violet-50 dark:bg-violet-950/30", text: "text-violet-700 dark:text-violet-300", border: "border-violet-200 dark:border-violet-800", badge: "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300" },
    Transaction: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800", badge: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300" },
    Report: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800", badge: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300" },
};

/* ── Custom Checkbox ─────────────────────────────────────────── */
const PermCheckbox = ({ checked, disabled, onChange, action }) => {
    const meta = ACTION_META[action] || {};
    const colorMap = {
        blue: { on: "bg-blue-500 border-blue-500", ring: "ring-blue-200 dark:ring-blue-800" },
        // indigo: { on: "bg-indigo-500 border-indigo-500", ring: "ring-indigo-200 dark:ring-indigo-800" },
        // emerald: { on: "bg-emerald-500 border-emerald-500", ring: "ring-emerald-200 dark:ring-emerald-800" },
        // amber: { on: "bg-amber-500 border-amber-500", ring: "ring-amber-200 dark:ring-amber-800" },
        // red: { on: "bg-red-500 border-red-500", ring: "ring-red-200 dark:ring-red-800" },
        // cyan: { on: "bg-cyan-500 border-cyan-500", ring: "ring-cyan-200 dark:ring-cyan-800" },
        // purple: { on: "bg-purple-500 border-purple-500", ring: "ring-purple-200 dark:ring-purple-800" },
        // orange: { on: "bg-orange-500 border-orange-500", ring: "ring-orange-200 dark:ring-orange-800" },
    };
    const c = colorMap[meta.color] || colorMap.blue;

    return (
        <button
            type="button"
            onClick={disabled ? undefined : onChange}
            disabled={disabled}
            className={`
        relative w-5 h-5 rounded-md border-2 flex items-center justify-center
        transition-all duration-150 flex-shrink-0
        ${checked
                    ? `${c.on} ring-2 ${c.ring} ring-offset-1 dark:ring-offset-gray-900`
                    : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500"
                }
        ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
      `}
            title={disabled ? "Enable 'view' first" : (checked ? `Remove ${action}` : `Grant ${action}`)}
        >
            {checked && <Check size={11} color="white" strokeWidth={3} />}
        </button>
    );
};

/* ── Module stats ─────────────────────────────────────────────── */
const getModuleStats = (menus) => {
    let total = 0, enabled = 0;
    Object.values(menus).forEach(({ actions }) => {
        total++;
        if (actions?.includes("view")) enabled++;
    });
    return { total, enabled };
};

/* ── Main Component ───────────────────────────────────────────── */
const UserPermissionForm = ({ selectedUser, onClose }) => {
    const { user } = useAuth();
    const dispatch = useDispatch();

    const { allPermissions: permissions, loading: permsLoading } = useSelector((s) => s.permission);
    const { selectedUserPermissions: userPermModules, loading: userPermsLoading } = useSelector((s) => s.userPermission);

    const [expandedModules, setExpandedModules] = useState({});
    const [expandedTypes, setExpandedTypes] = useState({});
    const [localPermissions, setLocalPermissions] = useState({});
    const [originalPermissions, setOriginalPermissions] = useState({});
    const [searchQuery, setSearchQuery] = useState("");
    const [hasChanges, setHasChanges] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();
    const modules = useSelector((s) => s.modules.list);
    const menus = useSelector((s) => s.menus.list);
    const modulePath = getModulePathByMenu("user_management", modules, menus);

    useEffect(() => {
        if (selectedUser?.id) {
            dispatch(fetchAllPermissions());
            dispatch(fetchPermissionsByUser(selectedUser.id));
        }
    }, [selectedUser, dispatch]);

    useEffect(() => {
        if (!permissions || !Array.isArray(permissions)) return;
        if (!userPermModules || !Array.isArray(userPermModules)) return;

        const userMap = {};
        for (const mod of userPermModules) {
            const mName = mod.moduleName;
            userMap[mName] = userMap[mName] || {};
            const menusObj = mod.menus || {};
            const flat = [...(menusObj.Master || []), ...(menusObj.Transaction || []), ...(menusObj.Report || [])];
            for (const menu of flat) {
                userMap[mName][String(menu.id)] = menu.actions || [];
            }
        }

        const transformed = {};
        const originalFlat = {};
        for (const mod of permissions) {
            const moduleName = mod.moduleName;
            transformed[moduleName] = {};
            mod.menus?.forEach((menu) => {
                const menuIdStr = String(menu.id);
                const actions = (userMap[moduleName]?.[menuIdStr]) || [];
                transformed[moduleName][menuIdStr] = {
                    name: menu.name || "Unnamed Menu",
                    type: menu.type || "Other",
                    actions: Array.isArray(actions) ? actions.slice() : [],
                };
                originalFlat[menuIdStr] = Array.isArray(actions) ? actions.slice() : [];
            });
        }

        setLocalPermissions(transformed);
        setOriginalPermissions(originalFlat);
        setHasChanges(false);
    }, [permissions, userPermModules]);

    useEffect(() => {
        const currFlat = {};
        for (const [, menus] of Object.entries(localPermissions)) {
            for (const [menuId, data] of Object.entries(menus)) {
                currFlat[menuId] = data.actions || [];
            }
        }
        let changed = false;
        const allMenuIds = new Set([...Object.keys(originalPermissions), ...Object.keys(currFlat)]);
        for (const id of allMenuIds) {
            const a = originalPermissions[id] || [];
            const b = currFlat[id] || [];
            if (a.length !== b.length || a.some((x) => !b.includes(x))) { changed = true; break; }
        }
        setHasChanges(changed);
    }, [localPermissions, originalPermissions]);

    const toggleModule = (name) => setExpandedModules((p) => ({ ...p, [name]: !p[name] }));
    const toggleType = (mod, type) =>
        setExpandedTypes((p) => ({ ...p, [mod]: { ...p[mod], [type]: !p?.[mod]?.[type] } }));

    const handleCheckboxChange = (module, menuId, action) => {
        setLocalPermissions((prev) => {
            const currentActions = prev?.[module]?.[menuId]?.actions || [];
            let updatedActions = [...currentActions];
            if (currentActions.includes(action)) {
                if (action === "view") updatedActions = [];
                else updatedActions = updatedActions.filter((a) => a !== action);
            } else {
                if (action === "view") updatedActions.push("view");
                else {
                    if (currentActions.includes("view")) updatedActions.push(action);
                    else { toast.warn("Enable 'view' permission first."); return prev; }
                }
            }
            return { ...prev, [module]: { ...prev[module], [menuId]: { ...prev[module][menuId], actions: updatedActions } } };
        });
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const requests = [];
        for (const [, menus] of Object.entries(localPermissions)) {
            for (const [menuId, menuData] of Object.entries(menus)) {
                const newActions = menuData.actions || [];
                const oldActions = originalPermissions[menuId] || [];
                const changed = newActions.length !== oldActions.length || newActions.some((a) => !oldActions.includes(a));
                if (changed) {
                    requests.push(dispatch(saveUserPermission({ userId: selectedUser.id, menuId: Number(menuId), actions: newActions, actionType: "replace" })));
                }
            }
        }
        if (!requests.length) { toast.info("No changes to save"); setIsSubmitting(false); return; }
        try {
            await Promise.all(requests);
            if (selectedUser.id === user.id) {
                await dispatch(fetchPermissionsByUser(selectedUser.id));
                await dispatch(fetchMyPermissions(user.id));
            }
            toast.success("Permissions saved successfully!");
            goBack();
        } catch { toast.error("Failed to save permissions"); }
        finally { setIsSubmitting(false); }
    };

    const filterMenus = (menus) =>
        Object.entries(menus).filter(([, menu]) =>
            menu.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

    const goBack = () => navigate(`/module/${modulePath}/user_management`);

    const totalChanges = (() => {
        let n = 0;
        for (const [, menus] of Object.entries(localPermissions)) {
            for (const [menuId, data] of Object.entries(menus)) {
                const a = originalPermissions[menuId] || [];
                const b = data.actions || [];
                if (a.length !== b.length || a.some((x) => !b.includes(x))) n++;
            }
        }
        return n;
    })();

    /* ── Loading ── */
    if (permsLoading || userPermsLoading || !selectedUser) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
                    <Loader2 size={22} color="white" className="animate-spin" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Loading permissions…</p>
            </div>
        );
    }

    /* ── Render ── */
    return (
        <div className="max-w-full px-4 py-6 space-y-5">

            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4
                      pb-5 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600
                          flex items-center justify-center text-white font-bold text-sm shadow flex-shrink-0">
                        {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">
                            {selectedUser.firstName} {selectedUser.lastName}
                        </h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <Shield size={11} className="text-blue-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">Permission Management</span>
                            {hasChanges && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold
                                 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300
                                 border border-amber-200 dark:border-amber-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    {totalChanges} unsaved change{totalChanges !== 1 ? "s" : ""}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={goBack}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                       border border-gray-300 dark:border-gray-700
                       text-gray-700 dark:text-gray-300
                       bg-white dark:bg-gray-900
                       hover:bg-gray-50 dark:hover:bg-gray-800
                       transition-all duration-150"
                    >
                        <ArrowLeft size={14} />
                        Back
                    </button>
                    {/* <button
                        disabled={!hasChanges || isSubmitting}
                        onClick={handleSubmit}
                        className={`
              flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold
              transition-all duration-150
              ${hasChanges && !isSubmitting
                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200 dark:shadow-blue-900"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                            }
            `}
                    >
                        {isSubmitting
                            ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                            : <><Save size={14} /> Save Changes</>
                        }
                    </button> */}
                </div>
            </div>

            {/* ── Search ── */}
            <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Search menus across all modules…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                     bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100
                     placeholder-gray-400 dark:placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 dark:focus:border-blue-500
                     transition"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* ── Action Legend ── */}
            {/* <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-900
                      border border-gray-200 dark:border-gray-800">
                {actionList.map((a) => {
                    const meta = ACTION_META[a];
                    return (
                        <div key={a} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                            <PermCheckbox checked action={a} disabled={false} onChange={() => { }} />
                            <span className="capitalize font-medium">{meta?.label || a}</span>
                        </div>
                    );
                })}
            </div> */}

            {/* ── Module Cards ── */}
            <div className="space-y-3">
                {Object.entries(localPermissions).map(([moduleName, modMenus]) => {
                    const isOpen = !!expandedModules[moduleName];
                    const stats = getModuleStats(modMenus);
                    const pct = stats.total ? Math.round((stats.enabled / stats.total) * 100) : 0;

                    return (
                        <div key={moduleName}
                            className="rounded-2xl border border-gray-200 dark:border-gray-800
                         bg-white dark:bg-gray-900 overflow-hidden
                         shadow-sm hover:shadow-md dark:hover:shadow-black/20
                         transition-shadow duration-200"
                        >
                            {/* Module Header */}
                            <button
                                type="button"
                                onClick={() => toggleModule(moduleName)}
                                className="w-full flex items-center justify-between px-5 py-4
                           hover:bg-gray-50 dark:hover:bg-gray-800/60
                           transition-colors duration-150 text-left"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    {/* Module icon */}
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900
                                  dark:from-slate-600 dark:to-slate-800
                                  flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <Shield size={14} color="white" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight truncate">
                                            {moduleName}
                                        </h2>
                                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                                            {stats.enabled} of {stats.total} menus with view access
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                                    {/* Progress bar */}
                                    <div className="hidden sm:flex items-center gap-2">
                                        <div className="w-20 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 w-8 text-right">
                                            {pct}%
                                        </span>
                                    </div>

                                    {/* Status icon */}
                                    {pct === 100
                                        ? <ShieldCheck size={16} className="text-emerald-500" />
                                        : pct === 0
                                            ? <ShieldOff size={16} className="text-gray-300 dark:text-gray-600" />
                                            : <Shield size={16} className="text-blue-400" />
                                    }

                                    <ChevronDown
                                        size={16}
                                        className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                                    />
                                </div>
                            </button>

                            {/* Module Body */}
                            {isOpen && (
                                <div className="border-t border-gray-100 dark:border-gray-800">
                                    {["Master", "Transaction", "Report"].map((typeKey) => {
                                        const menusOfType = filterMenus(modMenus).filter(
                                            ([, menu]) => menu.type?.toLowerCase() === typeKey.toLowerCase()
                                        );
                                        if (!menusOfType.length) return null;

                                        const cfg = TYPE_CONFIG[typeKey] || TYPE_CONFIG.Master;
                                        const isTypeOpen = !!expandedTypes?.[moduleName]?.[typeKey];

                                        return (
                                            <div key={typeKey} className="border-t border-gray-100 dark:border-gray-800 first:border-t-0">
                                                {/* Type header */}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleType(moduleName, typeKey)}
                                                    className={`
                            w-full flex items-center justify-between
                            px-5 py-3 text-left
                            ${cfg.bg} transition-colors duration-150
                            hover:brightness-95 dark:hover:brightness-110
                          `}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs font-bold uppercase tracking-wider ${cfg.text}`}>
                                                            {typeKey}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.badge}`}>
                                                            {menusOfType.length} menu{menusOfType.length !== 1 ? "s" : ""}
                                                        </span>
                                                    </div>
                                                    <ChevronDown
                                                        size={14}
                                                        className={`${cfg.text} transition-transform duration-200 ${isTypeOpen ? "rotate-180" : ""}`}
                                                    />
                                                </button>

                                                {/* Table */}
                                                {isTypeOpen && (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm min-w-[640px]">
                                                            <thead>
                                                                <tr className="bg-gray-50 dark:bg-gray-800/80">
                                                                    <th className="text-left py-2.5 px-5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[200px]">
                                                                        Menu
                                                                    </th>
                                                                    <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[100px]">
                                                                        Type
                                                                    </th>
                                                                    {actionList.map((a) => (
                                                                        <th key={a} className="text-center py-2.5 px-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                            {ACTION_META[a]?.label || a}
                                                                        </th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                                {menusOfType.map(([menuId, { name, type, actions }]) => {
                                                                    const hasView = actions?.includes("view");
                                                                    return (
                                                                        <tr
                                                                            key={menuId}
                                                                            className={`
                                        transition-colors duration-100
                                        ${hasView
                                                                                    ? "bg-white dark:bg-gray-900 hover:bg-blue-50/40 dark:hover:bg-blue-950/20"
                                                                                    : "bg-gray-50/60 dark:bg-gray-900/60 hover:bg-gray-50 dark:hover:bg-gray-800/40"
                                                                                }
                                      `}
                                                                        >
                                                                            {/* Menu name */}
                                                                            <td className="py-3 px-5">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${hasView ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"}`} />
                                                                                    <span className={`font-medium text-sm ${hasView ? "text-gray-800 dark:text-gray-200" : "text-gray-500 dark:text-gray-500"}`}>
                                                                                        {name}
                                                                                    </span>
                                                                                </div>
                                                                            </td>

                                                                            {/* Type badge */}
                                                                            <td className="py-3 px-3">
                                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.badge}`}>
                                                                                    {type}
                                                                                </span>
                                                                            </td>

                                                                            {/* Action checkboxes */}
                                                                            {actionList.map((action) => (
                                                                                <td key={action} className="py-3 px-2 text-center">
                                                                                    <div className="flex justify-center">
                                                                                        <PermCheckbox
                                                                                            checked={!!actions?.includes(action)}
                                                                                            disabled={action !== "view" && !actions?.includes("view")}
                                                                                            onChange={() => handleCheckboxChange(moduleName, menuId, action)}
                                                                                            action={action}
                                                                                        />
                                                                                    </div>
                                                                                </td>
                                                                            ))}
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ── Sticky bottom bar (only when changes) ── */}
            {hasChanges && (
                <div className="sticky bottom-0 left-0 right-0 z-50
                        flex items-center justify-between gap-4
                        px-5 py-3 rounded-2xl
                        bg-white dark:bg-gray-900
                        border border-amber-200 dark:border-amber-800
                        shadow-lg shadow-amber-100/50 dark:shadow-amber-900/20
                        backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="font-medium">
                            {totalChanges} unsaved change{totalChanges !== 1 ? "s" : ""}
                        </span>
                        <span className="text-amber-500/60 dark:text-amber-600">·</span>
                        <span className="text-amber-600/80 dark:text-amber-400/80 text-xs">
                            Don't forget to save
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={goBack}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium
                         text-gray-600 dark:text-gray-400
                         hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        >
                            Discard
                        </button>
                        <button
                            disabled={isSubmitting}
                            onClick={handleSubmit}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold
                         bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
                        >
                            {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                            {isSubmitting ? "Saving…" : "Save Changes"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserPermissionForm;