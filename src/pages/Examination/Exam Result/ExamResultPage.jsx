import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchExamResultsGrouped } from "../../../features/Exams/examResultSlice";
import { useNavigate } from "react-router-dom";
import { Eye, Search, Users, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import SkeletonPage from "../../../components/skeletons/skeletonPage";
import { getModulePathByMenu } from "../../../utils/navigation";

const ExamResultsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { groupedList, loading, error } = useSelector(
    (state) => state.examResult
  );
  const modules = useSelector((state) => state.modules.list);
  const menu = useSelector((state) => state.menus.list);
  const modulePath = getModulePathByMenu("exam_results", modules, menu);

  const [filters, setFilters] = useState({
    search: "",
    department: "all",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;

  useEffect(() => {
    dispatch(fetchExamResultsGrouped());
  }, [dispatch]);

  const departments = useMemo(() => {
    const unique = new Set();
    groupedList?.forEach((c) => {
      if (c.candidateDepartment) unique.add(c.candidateDepartment);
    });
    return ["all", ...Array.from(unique)];
  }, [groupedList]);

  const filteredData = useMemo(() => {
    let data = groupedList || [];
    if (filters.department !== "all") {
      data = data.filter((c) => c.candidateDepartment === filters.department);
    }
    if (filters.search.trim()) {
      const term = filters.search.toLowerCase();
      data = data.filter(
        (c) =>
          c.candidateName.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term)
      );
    }
    return data;
  }, [groupedList, filters]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentExamResults = filteredData.slice(startIndex, startIndex + rowsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-6 py-6 font-sans text-gray-800 dark:text-gray-100">

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Exam Results
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Overview of all candidate exam performances
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 mb-5 flex flex-wrap gap-3 items-center shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={(e) => {
              setFilters({ ...filters, search: e.target.value });
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
        <select
          value={filters.department}
          onChange={(e) => {
            setFilters({ ...filters, department: e.target.value });
            setCurrentPage(1);
          }}
          className="py-2 px-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition min-w-[160px]"
        >
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept === "all" ? "All Departments" : dept}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[700px] w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Candidate
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Exams
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky right-0 bg-gray-50 dark:bg-gray-800/60 border-l border-gray-200 dark:border-gray-800">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <SkeletonPage rows={8} columns={4} />
              ) : error ? (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-red-500 text-sm">
                    {error}
                  </td>
                </tr>
              ) : !currentExamResults.length ? (
                <tr>
                  <td colSpan="4" className="text-center py-14">
                    <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
                      <BookOpen className="w-8 h-8 opacity-40" />
                      <p className="text-sm font-medium">No results found</p>
                      <p className="text-xs">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentExamResults.map((res) => (
                  <tr
                    key={res.candidateId}
                    className="hover:bg-blue-50/50 dark:hover:bg-gray-800/50 transition-colors duration-100 group"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-[13px]">
                            {res.candidateName}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{res.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {res.candidateDepartment ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                          {res.candidateDepartment}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold">
                        {res.exams?.length || 0}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center sticky right-0 bg-white dark:bg-gray-900 group-hover:bg-blue-50/50 dark:group-hover:bg-gray-800/50 border-l border-gray-100 dark:border-gray-800 transition-colors">
                      <button
                        onClick={() =>
                          navigate(
                            `/module/${modulePath}/exam_results/${res.candidateId}`
                          )
                        }
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-100 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 transition-all"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination inside card */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50 dark:bg-gray-900">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Showing{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {startIndex + 1}–{Math.min(startIndex + rowsPerPage, filteredData.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {filteredData.length}
              </span>{" "}
              candidates
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-200 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - currentPage) <= 1
                )
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "..." ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 text-gray-400 text-sm"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => handlePageChange(item)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition ${currentPage === item
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                    >
                      {item}
                    </button>
                  )
                )}

              <button
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-200 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamResultsPage;