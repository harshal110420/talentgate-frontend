import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers } from "../../../features/users/userSlice";
import { useNavigate } from "react-router-dom";
import ButtonWrapper from "../../../components/ButtonWrapper";
import {
  PlusCircle, Pencil, Key,
  ChevronLeft, ChevronRight,
  Search, Users, X, SlidersHorizontal,
} from "lucide-react";
import { getModulePathByMenu } from "../../../utils/navigation";
import SkeletonPage from "../../../components/skeletons/skeletonPage";

/* ── Filter Select ────────────────────────────────────────────── */
const FilterSelect = ({ value, onChange, children, className = "" }) => (
  <select
    value={value}
    onChange={onChange}
    className={`
      border border-gray-200 dark:border-gray-700
      bg-white dark:bg-gray-800
      text-gray-700 dark:text-gray-300
      text-sm rounded-lg px-3 py-2
      focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400
      transition-all duration-150
      ${className}
    `}
  >
    {children}
  </select>
);

/* ── Main Component ───────────────────────────────────────────── */
const UsersPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { userList = [], pagination, loading, error } = useSelector((s) => s.users);
  const modules = useSelector((s) => s.modules.list);
  const menus = useSelector((s) => s.menus.list);
  const modulePath = getModulePathByMenu("user_management", modules, menus);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState({ role: "", isActive: "", department: "" });

  useEffect(() => {
    dispatch(fetchUsers({
      page: currentPage,
      limit: 10,
      search: searchText,
      roleId: filters.role,
      departmentId: filters.department,
      isActive: filters.isActive,
    }));
  }, [dispatch, currentPage, searchText, filters]);

  useEffect(() => {
    const timer = setTimeout(() => setCurrentPage(1), 300);
    return () => clearTimeout(timer);
  }, [searchText, filters]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) setCurrentPage(newPage);
  };

  const departmentOptions = Array.from(
    new Map(userList.filter((u) => u.department).map((u) => [u.department.id, u.department])).values()
  );
  const roleOptions = Array.from(
    new Map(userList.filter((u) => u.role).map((u) => [u.role.id, u.role])).values()
  );

  const hasActiveFilters = filters.role || filters.isActive || filters.department || searchText;
  const clearFilters = () => {
    setFilters({ role: "", isActive: "", department: "" });
    setSearchText("");
    setCurrentPage(1);
  };

  /* ── Render ── */
  return (
    <div className="max-w-full px-5 py-6 font-sans text-gray-800 dark:text-gray-100">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            User Management
          </h1>
          {!loading && pagination?.totalUsers !== undefined && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {pagination.totalUsers} total user{pagination.totalUsers !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <ButtonWrapper subModule="User Management" permission="new">
          <button
            onClick={() => navigate(`/module/${modulePath}/user_management/create`)}
            className="flex items-center gap-2
              bg-gradient-to-r from-blue-600 to-indigo-600
              hover:from-blue-700 hover:to-indigo-700
              text-white text-sm font-semibold
              px-4 py-2.5 rounded-xl shadow-sm
              shadow-blue-200 dark:shadow-blue-900/30
              transition-all duration-150 hover:-translate-y-px"
          >
            <PlusCircle className="w-4 h-4" />
            Add User
          </button>
        </ButtonWrapper>
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800
                      rounded-2xl p-4 mb-5 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by username, email or mobile…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-9 pr-9 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                         bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100
                         placeholder-gray-400 dark:placeholder-gray-500
                         focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400
                         transition"
            />
            {searchText && (
              <button
                onClick={() => setSearchText("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Selects */}
          <FilterSelect value={filters.department} onChange={(e) => handleFilterChange("department", e.target.value)}>
            <option value="">All Departments</option>
            {departmentOptions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </FilterSelect>

          <FilterSelect value={filters.role} onChange={(e) => handleFilterChange("role", e.target.value)}>
            <option value="">All Roles</option>
            {roleOptions.map((r) => <option key={r.id} value={r.id}>{r.displayName}</option>)}
          </FilterSelect>

          <FilterSelect value={filters.isActive} onChange={(e) => handleFilterChange("isActive", e.target.value)}>
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </FilterSelect>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
                         text-red-600 dark:text-red-400
                         bg-red-50 dark:bg-red-950/40
                         border border-red-200 dark:border-red-800
                         hover:bg-red-100 dark:hover:bg-red-950/60 transition"
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800
                      shadow-sm bg-white dark:bg-gray-900">
        <table className="min-w-[800px] w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-800">
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Department
              </th>
              <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3.5 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider
                             sticky right-0 bg-gray-50 dark:bg-gray-800/80 border-l border-gray-200 dark:border-gray-800">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <SkeletonPage rows={6} columns={5} />
            ) : error ? (
              <tr>
                <td colSpan="5" className="text-center py-10 text-red-500 dark:text-red-400 text-sm">
                  {error}
                </td>
              </tr>
            ) : userList.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Users size={20} className="text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No users found</p>
                    {hasActiveFilters && (
                      <button onClick={clearFilters} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                        Clear filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              userList.map((user, idx) => (
                <tr
                  key={user.id || idx}
                  className="group hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors duration-100"
                >
                  {/* User Info */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate leading-tight">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {user.mail}
                          {user.mobile && (
                            <span className="text-gray-300 dark:text-gray-600 mx-1">·</span>
                          )}
                          {user.mobile}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="px-4 py-3">
                    {user.department?.name
                      ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium
                                         bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300
                                         border border-slate-200 dark:border-slate-700">
                          {user.department.name}
                        </span>
                      )
                      : <span className="text-gray-400 dark:text-gray-600 text-xs">—</span>
                    }
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3">
                    {user.role?.displayName
                      ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium
                                         bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300
                                         border border-indigo-200 dark:border-indigo-800">
                          {user.role.displayName}
                        </span>
                      )
                      : <span className="text-gray-400 dark:text-gray-600 text-xs">—</span>
                    }
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`
                      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                      ${user.isActive
                        ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        : "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                      }
                    `}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${user.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-center sticky right-0
                                 bg-white dark:bg-gray-900
                                 group-hover:bg-blue-50/40 dark:group-hover:bg-blue-950/20
                                 border-l border-gray-100 dark:border-gray-800 transition-colors duration-100">
                    <div className="flex items-center justify-center gap-1">
                      <ButtonWrapper subModule="User Management" permission="edit">
                        <button
                          onClick={() => navigate(`/module/${modulePath}/user_management/update/${user.id}`)}
                          title="Edit User"
                          className="w-8 h-8 rounded-lg flex items-center justify-center
                                     text-blue-600 dark:text-blue-400
                                     hover:bg-blue-100 dark:hover:bg-blue-900/50
                                     transition-colors duration-150"
                        >
                          <Pencil size={14} />
                        </button>
                      </ButtonWrapper>

                      <ButtonWrapper subModule="User Management" permission="edit">
                        <button
                          onClick={() => navigate(`/module/${modulePath}/user_management/permission/${user.id}`)}
                          title="Manage Permissions"
                          className="w-8 h-8 rounded-lg flex items-center justify-center
                                     text-amber-600 dark:text-amber-400
                                     hover:bg-amber-100 dark:hover:bg-amber-900/50
                                     transition-colors duration-150"
                        >
                          <Key size={14} />
                        </button>
                      </ButtonWrapper>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {!loading && userList.length > 0 && pagination && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-5 gap-3">
          {/* Count info */}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {(currentPage - 1) * pagination.limit + 1}–{Math.min(currentPage * pagination.limit, pagination.totalUsers)}
            </span>
            {" "}of{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-300">{pagination.totalUsers}</span>
            {" "}users
          </p>

          {/* Page buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg
                         border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-gray-900
                         text-gray-600 dark:text-gray-400
                         hover:bg-gray-50 dark:hover:bg-gray-800
                         disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={14} /> Prev
            </button>

            {[...Array(pagination.totalPages)].map((_, idx) => {
              const p = idx + 1;
              if (
                p === 1 || p === pagination.totalPages ||
                (p >= currentPage - 1 && p <= currentPage + 1)
              ) {
                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`
                      w-8 h-8 text-xs font-semibold rounded-lg transition-all duration-150
                      ${currentPage === p
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-200 dark:shadow-blue-900"
                        : "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }
                    `}
                  >
                    {p}
                  </button>
                );
              } else if (p === currentPage - 2 || p === currentPage + 2) {
                return <span key={p} className="text-gray-400 text-xs px-1">…</span>;
              }
              return null;
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg
                         border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-gray-900
                         text-gray-600 dark:text-gray-400
                         hover:bg-gray-50 dark:hover:bg-gray-800
                         disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;