import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCandidates, fetchCandidateById, reassignExam,
  markResumeReviewed, shortlistCandidateForExam, rejectCandidate,
  shortlistCandidateForInterview, updateCandidateExamStatus,
} from "../../../features/Candidate/candidateSlice";
import { fetchAllDepartments } from "../../../features/department/departmentSlice";
import { fetchAllExams } from "../../../features/Exams/examSlice";
import { useNavigate } from "react-router-dom";
import {
  PlusCircle, Pencil, Eye, UserRoundX, Search, X, Users,
  ChevronLeft, ChevronRight, Mail, RotateCcw, ClipboardCheck,
  UserCheck, CheckCircle2,
} from "lucide-react";
import { toast } from "react-toastify";
import SkeletonPage from "../../../components/skeletons/skeletonPage";
import { sendCandidateExamMail } from "../../../services/candidateService";
import { getModulePathByMenu } from "../../../utils/navigation";
import ButtonWrapper from "../../../components/ButtonWrapper";
import ConfirmModal from "../../../components/common/ConfirmModal";

/* ── Stage config ─────────────────────────────────────────────── */
const STAGE_CFG = {
  "Applied": { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300", border: "border-gray-200 dark:border-gray-700", dot: "bg-gray-400" },
  "Resume Reviewed": { bg: "bg-blue-50 dark:bg-blue-950/50", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800", dot: "bg-blue-500" },
  "Shortlisted for Exam": { bg: "bg-indigo-50 dark:bg-indigo-950/50", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-200 dark:border-indigo-800", dot: "bg-indigo-500" },
  "Exam Assigned": { bg: "bg-amber-50 dark:bg-amber-950/50", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800", dot: "bg-amber-500" },
  "Exam Completed": { bg: "bg-purple-50 dark:bg-purple-950/50", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800", dot: "bg-purple-500" },
  "Shortlisted for Interview": { bg: "bg-violet-50 dark:bg-violet-950/50", text: "text-violet-700 dark:text-violet-300", border: "border-violet-200 dark:border-violet-800", dot: "bg-violet-500" },
  "Interview Scheduled": { bg: "bg-orange-50 dark:bg-orange-950/50", text: "text-orange-700 dark:text-orange-300", border: "border-orange-200 dark:border-orange-800", dot: "bg-orange-500" },
  "Interview Completed": { bg: "bg-teal-50 dark:bg-teal-950/50", text: "text-teal-700 dark:text-teal-300", border: "border-teal-200 dark:border-teal-800", dot: "bg-teal-500" },
  "Selected": { bg: "bg-emerald-50 dark:bg-emerald-950/50", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500" },
  "Hired": { bg: "bg-emerald-50 dark:bg-emerald-950/50", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500" },
  "Rejected": { bg: "bg-red-50 dark:bg-red-950/50", text: "text-red-700 dark:text-red-300", border: "border-red-200 dark:border-red-800", dot: "bg-red-500" },
};
const getStageCfg = (stage) => STAGE_CFG[stage] || STAGE_CFG["Applied"];

/* ── Exam status config ───────────────────────────────────────── */
const EXAM_CFG = {
  "Assigned": { bg: "bg-blue-50 dark:bg-blue-950/50", text: "text-blue-700 dark:text-blue-300", label: "Assigned" },
  "In progress": { bg: "bg-amber-50 dark:bg-amber-950/50", text: "text-amber-700 dark:text-amber-300", label: "In Progress" },
  "Completed": { bg: "bg-emerald-50 dark:bg-emerald-950/50", text: "text-emerald-700 dark:text-emerald-300", label: "Completed" },
  "Expired": { bg: "bg-red-50 dark:bg-red-950/50", text: "text-red-700 dark:text-red-300", label: "Link Expired" },
  "Disqualified": { bg: "bg-red-50 dark:bg-red-950/50", text: "text-red-700 dark:text-red-300", label: "Disqualified" },
};
const getExamCfg = (s) => EXAM_CFG[s] || { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-500 dark:text-gray-400", label: "Not Assigned" };

/* ── Reusable FilterSelect ────────────────────────────────────── */
const FilterSelect = ({ value, onChange, children }) => (
  <select value={value} onChange={onChange}
    className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800
               text-gray-700 dark:text-gray-300 text-sm rounded-lg px-3 py-2 w-full
               focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all duration-150">
    {children}
  </select>
);

/* ── Quick-action pill button ─────────────────────────────────── */
const QBtn = ({ onClick, icon: Icon, label, color = "blue" }) => {
  const c = {
    yellow: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100",
    indigo: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100",
    blue: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100",
    green: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100",
    purple: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100",
    orange: "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800 hover:bg-orange-100",
  };
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border
                  whitespace-nowrap transition-all duration-150 ${c[color]}`}>
      {Icon && <Icon size={10} />}{label}
    </button>
  );
};

/* ── View modal helpers ───────────────────────────────────────── */
const Section = ({ title, children }) => (
  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
    <h4 className="font-semibold mb-3 text-gray-800 dark:text-white text-sm">{title}</h4>
    {children}
  </div>
);
const Grid = ({ children }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-600 dark:text-gray-300">
    {children}
  </div>
);

/* ── Main Component ───────────────────────────────────────────── */
const CandidatePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedReassignCandidate, setSelectedReassignCandidate] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [reassignLoading, setReassignLoading] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectRemark, setRejectRemark] = useState("");
  const [selectedRejectCandidate, setSelectedRejectCandidate] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState({ search: "", departmentId: "", applicationStage: "", isActive: "", source: "", examStatus: "" });
  const [searchInput, setSearchInput] = useState("");

  const modules = useSelector((s) => s.modules.list);
  const menu = useSelector((s) => s.menus.list);
  const modulePath = getModulePathByMenu("candidate_management", modules, menu);
  const isFirstRender = useRef(true);
  const filtersRef = useRef(filters);

  const { list: candidates, loading, selected, pagination } = useSelector((s) => s.candidate);
  const departments = useSelector((s) => s.department.list);

  useEffect(() => {
    filtersRef.current = filters;
    dispatch(fetchCandidates({ ...filters, page: 1, limit: 10 }));
  }, [filters.search, filters.departmentId, filters.applicationStage, filters.isActive, filters.source, filters.examStatus]);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const timer = setTimeout(() => setFilters((p) => ({ ...p, search: searchInput })), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => { dispatch(fetchAllDepartments()); dispatch(fetchAllExams()); }, [dispatch]);

  const handleFilterChange = (key, value) => setFilters((p) => ({ ...p, [key]: value }));
  const handlePageChange = (page) => {
    dispatch(fetchCandidates({ ...filtersRef.current, page, limit: 10 }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasActiveFilters = Object.values(filters).some(Boolean) || searchInput;
  const clearFilters = () => { setFilters({ search: "", departmentId: "", applicationStage: "", isActive: "", source: "", examStatus: "" }); setSearchInput(""); };

  /* ── Action handlers ── */
  // const handleSendMail = async () => {
  //   if (!selectedCandidate) return;
  //   if (!selectedCandidate.examId) { toast.error("No exam assigned."); return; }
  //   dispatch(updateCandidateExamStatus({ candidateId: selectedCandidate.id, examStatus: "In progress", lastMailSentAt: new Date().toISOString() }));
  //   toast.success(`Mail sent to ${selectedCandidate.name}!`);
  //   setConfirmModalOpen(false); setSelectedCandidate(null);
  //   try { await sendCandidateExamMail(selectedCandidate.id); }
  //   catch (e) { toast.error(e?.response?.data?.message || "Failed to send mail."); }
  // };

  const handleSendMail = async () => {
    if (!selectedCandidate) return;
    if (!selectedCandidate.examId) { toast.error("No exam assigned."); return; }

    // ✅ ID pehle save kar lo
    const candidateId = selectedCandidate.id;
    const candidateName = selectedCandidate.name;

    setConfirmModalOpen(false);
    setSelectedCandidate(null);
    setLoadingConfirm(false);

    try {
      // ✅ Pehle actual API call karo
      await sendCandidateExamMail(candidateId);

      // ✅ Sirf success hone pe update karo
      dispatch(updateCandidateExamStatus({
        candidateId,
        examStatus: "In progress",
        lastMailSentAt: new Date().toISOString()
      }));

      toast.success(`Mail sent to ${candidateName}!`);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to send mail.");
    }
  };

  const handleAssignExam = (id) => navigate(`/module/${modulePath}/candidate_management/update/${id}`, { state: { openStep: 3 } });
  const handleResumeReview = async (id) => { try { await dispatch(markResumeReviewed(id)).unwrap(); toast.success("Resume reviewed!"); dispatch(fetchCandidates({ ...filtersRef.current, page: pagination.currentPage, limit: 10 })); } catch (e) { toast.error(e || "Failed"); } };
  const handleShortlistExam = async (id) => { try { await dispatch(shortlistCandidateForExam(id)).unwrap(); toast.success("Shortlisted for exam!"); dispatch(fetchCandidates({ ...filtersRef.current, page: pagination.currentPage, limit: 10 })); } catch (e) { toast.error(e || "Failed"); } };
  const handleShortlistIntv = async (id) => { try { await dispatch(shortlistCandidateForInterview(id)).unwrap(); toast.success("Shortlisted for interview!"); dispatch(fetchCandidates({ ...filtersRef.current, page: pagination.currentPage, limit: 10 })); } catch (e) { toast.error(e || "Failed"); } };

  const handleRejectCandidate = async () => {
    if (!rejectRemark.trim()) { toast.error("Please enter rejection remark"); return; }
    try {
      await dispatch(rejectCandidate({ id: selectedRejectCandidate.id, remarks: rejectRemark })).unwrap();
      toast.success("Candidate rejected");
      dispatch(fetchCandidates({ ...filtersRef.current, page: pagination.currentPage, limit: 10 }));
    } catch (e) { toast.error(e || "Failed to reject"); }
    finally { setRejectModalOpen(false); setRejectRemark(""); setSelectedRejectCandidate(null); }
  };

  const formatToIST = (s) => s ? new Date(s).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }) : "—";
  const formatTime = (t) => new Date(`1970-01-01T${t}`).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  /* ── Render ── */
  return (
    <div className="max-w-full px-5 py-6 font-sans text-gray-800 dark:text-gray-100">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Candidate Management</h1>
          {!loading && pagination?.totalCandidates !== undefined && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {pagination.totalCandidates} total candidate{pagination.totalCandidates !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <ButtonWrapper subModule="Candidate Management" permission="new">
          <button onClick={() => navigate(`/module/${modulePath}/candidate_management/create`)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600
                       hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold
                       px-4 py-2.5 rounded-xl shadow-sm shadow-blue-200 dark:shadow-blue-900/30
                       transition-all duration-150 hover:-translate-y-px">
            <PlusCircle className="w-4 h-4" /> Add Candidate
          </button>
        </ButtonWrapper>
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 mb-5 shadow-sm space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="text" placeholder="Search by name, email or mobile…"
            value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                       bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100
                       placeholder-gray-400 dark:placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition" />
          {searchInput && (
            <button onClick={() => setSearchInput("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={13} /></button>
          )}
        </div>

        {/* Selects */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          <FilterSelect value={filters.source} onChange={(e) => handleFilterChange("source", e.target.value)}>
            <option value="">All Sources</option>
            <option value="offline">Offline</option>
            <option value="online">Online</option>
          </FilterSelect>

          <FilterSelect value={filters.departmentId} onChange={(e) => handleFilterChange("departmentId", e.target.value)}>
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </FilterSelect>

          <FilterSelect value={filters.applicationStage} onChange={(e) => handleFilterChange("applicationStage", e.target.value)}>
            <option value="">All Stages</option>
            {["Applied", "Resume Reviewed", "Shortlisted for Exam", "Exam Assigned", "Exam Completed",
              "Shortlisted for Interview", "Interview Scheduled", "Interview Completed", "Selected", "Rejected", "Hired"]
              .map((s) => <option key={s} value={s}>{s}</option>)}
          </FilterSelect>

          <FilterSelect value={filters.isActive} onChange={(e) => handleFilterChange("isActive", e.target.value)}>
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </FilterSelect>

          <FilterSelect value={filters.examStatus} onChange={(e) => handleFilterChange("examStatus", e.target.value)}>
            <option value="">All Exam Status</option>
            <option value="Assigned">Assigned</option>
            <option value="In progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Disqualified">Disqualified</option>
            <option value="Expired">Link Expired</option>
          </FilterSelect>

          {hasActiveFilters && (
            <button onClick={clearFilters}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
                         text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40
                         border border-red-200 dark:border-red-800 hover:bg-red-100 transition">
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
        <table className="min-w-[1500px] w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-800">
              {["Candidate", "Department", "Stage", "Resume", "Exam Status", "Source", "Last Mail", "Status"].map((h) => (
                <th key={h} className="px-4 py-3.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
              <th className="px-4 py-3.5 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider
                             sticky right-[134px] bg-gray-50 dark:bg-gray-800/80 z-20 shadow-[-6px_0_10px_-6px_rgba(0,0,0,0.12)]">
                Quick Actions
              </th>
              <th className="px-4 py-3.5 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider
                             sticky right-0 bg-gray-50 dark:bg-gray-800/80 z-30 shadow-[-6px_0_10px_-6px_rgba(0,0,0,0.18)]">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <SkeletonPage rows={6} columns={10} />
            ) : candidates.length === 0 ? (
              <tr>
                <td colSpan="10" className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Users size={20} className="text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No candidates found</p>
                    {hasActiveFilters && <button onClick={clearFilters} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Clear filters</button>}
                  </div>
                </td>
              </tr>
            ) : (
              candidates.map((c) => {
                const sc = getStageCfg(c.applicationStage);
                const ec = getExamCfg(c.examStatus);
                const ini = c.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "??";
                return (
                  <tr key={c.id} className="group hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors duration-100">

                    {/* Candidate */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">

                        <div className="min-w-0">
                          <p className="font-semibold text-gray-700 dark:text-gray-100 text-sm truncate leading-tight">{c.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 truncate">{c.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-4 py-3">
                      {c.department?.name
                        ? <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{c.department.name}</span>
                        : <span className="text-gray-400 text-xs">—</span>}
                    </td>

                    {/* Stage */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap ${sc.bg} ${sc.text} ${sc.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sc.dot}`} />
                        {c.applicationStage}
                      </span>
                    </td>

                    {/* Resume */}
                    <td className="px-4 py-3 text-center">
                      {c.resumeUrl
                        ? <a href={c.resumeUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition">
                          Download
                        </a>
                        : <span className="text-gray-400 text-xs">N/A</span>}
                    </td>

                    {/* Exam Status */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${ec.bg} ${ec.text}`}>{ec.label}</span>
                    </td>

                    {/* Source */}
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                        ${c.source === "online"
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                          : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"}`}>
                        {c.source === "online" ? "Online" : "Offline"}
                      </span>
                    </td>

                    {/* Last Mail */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatToIST(c.lastMailSentAt)}</span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border
                        ${c.isActive
                          ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                          : "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Quick Actions */}
                    <td className="px-3 py-3 text-center sticky right-[134px]
                                   bg-white dark:bg-gray-900 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/20
                                   z-10 shadow-[-6px_0_10px_-6px_rgba(0,0,0,0.08)] border-l border-gray-100 dark:border-gray-800 transition-colors duration-100">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <ButtonWrapper subModule="Candidate Management" permission="edit">
                          {c.applicationStage === "Applied" && (
                            <QBtn onClick={() => handleResumeReview(c.id)} icon={ClipboardCheck} label="Review Resume" color="yellow" />
                          )}
                          {c.applicationStage === "Resume Reviewed" && (
                            <QBtn onClick={() => handleShortlistExam(c.id)} icon={CheckCircle2} label="Shortlist For Exam" color="indigo" />
                          )}
                          {c.applicationStage === "Shortlisted for Exam" && c.examStatus === "Not assigned" && (
                            <QBtn onClick={() => handleAssignExam(c.id)} icon={ClipboardCheck} label="Assign Exam" color="blue" />
                          )}
                          {(c.applicationStage === "Shortlisted for Exam" || c.applicationStage === "Exam Assigned") && c.examStatus === "Assigned" && (
                            <QBtn onClick={() => { setSelectedCandidate(c); setConfirmModalOpen(true); }} icon={Mail} label="Send Link" color="green" />
                          )}
                          {c.examStatus === "Expired" && (
                            <QBtn onClick={() => { setSelectedReassignCandidate(c); setReassignModalOpen(true); }} icon={RotateCcw} label="Re-send" color="orange" />
                          )}
                          {c.examStatus === "Completed" && c.applicationStage === "Exam Completed" && (
                            <QBtn onClick={() => handleShortlistIntv(c.id)} icon={UserCheck} label="Shortlist Interview" color="purple" />
                          )}
                        </ButtonWrapper>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3 text-center sticky right-0
                                   bg-white dark:bg-gray-900 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/20
                                   z-20 shadow-[-6px_0_10px_-6px_rgba(0,0,0,0.12)] border-l border-gray-100 dark:border-gray-800 transition-colors duration-100">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { dispatch(fetchCandidateById(c.id)); setViewModalOpen(true); }} title="View"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                          <Eye size={14} />
                        </button>
                        <ButtonWrapper subModule="Candidate Management" permission="edit">
                          <button onClick={() => navigate(`/module/${modulePath}/candidate_management/update/${c.id}`)} title="Edit"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition">
                            <Pencil size={14} />
                          </button>
                        </ButtonWrapper>
                        <ButtonWrapper subModule="Candidate Management" permission="edit">
                          {c.applicationStage !== "Hired" && c.applicationStage !== "Rejected" && (
                            <button onClick={() => { setSelectedRejectCandidate(c); setRejectModalOpen(true); }} title="Reject"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition">
                              <UserRoundX size={14} />
                            </button>
                          )}
                        </ButtonWrapper>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-5 gap-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-700 dark:text-gray-300">{candidates.length}</span> of{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-300">{pagination.totalCandidates}</span> candidates
          </p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition">
              <ChevronLeft size={14} /> Prev
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => {
              const p = i + 1;
              if (p === 1 || p === pagination.totalPages || (p >= pagination.currentPage - 1 && p <= pagination.currentPage + 1)) {
                return (
                  <button key={p} onClick={() => handlePageChange(p)}
                    className={`w-8 h-8 text-xs font-semibold rounded-lg transition-all duration-150
                      ${pagination.currentPage === p
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-200 dark:shadow-blue-900"
                        : "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                    {p}
                  </button>
                );
              } else if (p === pagination.currentPage - 2 || p === pagination.currentPage + 2) {
                return <span key={p} className="text-gray-400 text-xs px-1">…</span>;
              }
              return null;
            })}
            <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition">
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ===== View Modal ===== */}
      {viewModalOpen && selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">

            {/* Modal Header */}
            <div className="px-6 py-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {selected?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight">{selected?.name}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{selected?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {(() => {
                  const cfg = getStageCfg(selected?.applicationStage); return (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>{selected?.applicationStage}</span>
                  );
                })()}
                <button onClick={() => setViewModalOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 transition">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar */}
              <aside className="w-[240px] flex-shrink-0 bg-gray-50 dark:bg-gray-800/60 border-r border-gray-200 dark:border-gray-700 p-5 overflow-y-auto">
                <div className="text-center mb-5">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 text-white text-xl flex items-center justify-center font-bold shadow-md">
                    {selected?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <h3 className="mt-2.5 text-sm font-bold text-gray-800 dark:text-white">{selected?.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{selected?.hrRating ? `⭐ HR Rating: ${selected.hrRating}` : "No HR Rating"}</p>
                </div>
                <div className="space-y-0 text-xs">
                  {[["📱", "Mobile", selected?.mobile], ["💼", "Experience", selected?.experience], ["🔗", "Source", selected?.source], ["👤", "Recruiter", selected?.assignedRecruiterId ? "Assigned" : "N/A"]].map(([icon, label, val]) => (
                    <div key={label} className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-500 flex items-center gap-1">{icon} {label}</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{val || "N/A"}</span>
                    </div>
                  ))}
                </div>
                {selected?.resumeUrl && (
                  <a href={selected.resumeUrl} target="_blank" rel="noreferrer"
                    className="block mt-5 text-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2.5 rounded-xl text-xs font-semibold transition">
                    📄 View Resume
                  </a>
                )}
              </aside>

              {/* Main content */}
              <section className="flex-1 flex flex-col overflow-hidden">
                {/* Tabs */}
                <div className="flex gap-1 px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-x-auto flex-shrink-0">
                  {["overview", "selection", "notes", "timeline", "system"].map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap
                        ${activeTab === tab ? "bg-blue-600 text-white" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700"}`}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {activeTab === "overview" && (<>
                    <Section title="Job Details">
                      <Grid>
                        <p><b>Job Code:</b> {selected?.job?.jobCode || selected?.jobCode || "N/A"}</p>
                        <p><b>Job Title:</b> {selected?.job?.title || "N/A"}</p>
                        <p><b>Department:</b> {selected?.department?.name || "N/A"}</p>
                      </Grid>
                    </Section>
                    <Section title="Current Status">
                      <Grid>
                        <p><b>Exam Status:</b> {selected?.examStatus || "N/A"}</p>
                        <p><b>Application Stage:</b> {selected?.applicationStage || "N/A"}</p>
                        <p><b>Joining Date:</b> {selected?.joiningDate || "N/A"}</p>
                      </Grid>
                    </Section>
                  </>)}

                  {activeTab === "selection" && (<>
                    <Section title="Exam Details">
                      <Grid>
                        <p><b>Exam:</b> {selected?.exam?.name || "Not Assigned"}</p>
                        <p><b>Status:</b> {selected?.examStatus || "N/A"}</p>
                        <p><b>Last Mail:</b> {selected?.lastMailSentAt ? new Date(selected.lastMailSentAt).toLocaleString() : "N/A"}</p>
                        {selected?.examResults?.length > 0 && (<>
                          <p><b>Score:</b> {selected.examResults[0].score || 0}</p>
                          <p><b>Result:</b> {selected.examResults[0].resultStatus || "Pending"}</p>
                          <p><b>Attempted:</b> {selected.examResults[0].attempted || 0}/{selected.examResults[0].totalQuestions || 0}</p>
                        </>)}
                      </Grid>
                    </Section>
                    <Section title="Interview Details">
                      {selected?.interviews?.length ? (
                        <div className="space-y-3">
                          {selected.interviews.map((intv, idx) => (
                            <div key={intv.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-900">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-sm">Round {idx + 1}: {intv.round}</h4>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${intv.status === "Completed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{intv.status}</span>
                              </div>
                              <Grid>
                                <p><b>Type:</b> {intv.interviewType}</p>
                                <p><b>Date:</b> {new Date(intv.interviewDate).toLocaleDateString("en-IN")}</p>
                                <p><b>Time:</b> {formatTime(intv.startTime)} – {formatTime(intv.endTime)}</p>
                                <p><b>Completed:</b> {intv.completedAt ? new Date(intv.completedAt).toLocaleString() : "No"}</p>
                                <p><b>Scheduled By:</b> {intv.scheduler?.firstName} {intv.scheduler?.lastName}</p>
                                <p><b>Meeting Link:</b> {intv.meetingLink || "N/A"}</p>
                              </Grid>
                              {intv.panel?.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Panel</p>
                                  <ul className="space-y-0.5">
                                    {intv.panel.map((p) => (
                                      <li key={p.id} className="text-xs text-gray-600 dark:text-gray-300">
                                        {p.user.firstName} {p.user.lastName} <span className="text-gray-400">({p.role})</span> — {p.status}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-sm text-gray-500">No interviews scheduled</p>}
                    </Section>
                  </>)}

                  {activeTab === "notes" && (
                    <Section title="HR Remarks">
                      <textarea disabled value={selected?.remarks || "No remarks added"}
                        className="w-full min-h-[140px] border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 resize-none" />
                    </Section>
                  )}

                  {activeTab === "timeline" && (
                    <Section title="Candidate Timeline">
                      <ul className="space-y-0">
                        {[["Resume Reviewed", selected?.resumeReviewedAt], ["Shortlisted For Exam", selected?.shortlistedForExamAt],
                        ["Exam Assigned", selected?.examAssignedAt], ["Exam Completed", selected?.examCompletedAt],
                        ["Shortlisted For Interview", selected?.shortlistedForInterviewAt], ["Interview Scheduled", selected?.interviewScheduledAt],
                        ["Interview Completed", selected?.interviewCompletedAt], ["Selected", selected?.selectedAt], ["Rejected", selected?.rejectedAt],
                        ].map(([label, date]) => (
                          <li key={label} className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-gray-800 text-sm">
                            <span className="text-gray-700 dark:text-gray-300 font-medium">{label}</span>
                            <span className={`text-xs ${date ? "text-blue-600 dark:text-blue-400 font-medium" : "text-gray-400"}`}>{date ? formatToIST(date) : "N/A"}</span>
                          </li>
                        ))}
                      </ul>
                    </Section>
                  )}

                  {activeTab === "system" && (
                    <Section title="System Metadata">
                      <Grid>
                        <p><b>Resume Reviewed:</b> {selected?.resumeReviewed ? "Yes" : "No"}</p>
                        <p><b>Active:</b> {selected?.isActive ? "Yes" : "No"}</p>
                        <p><b>Created By:</b> {selected?.created_by}</p>
                        <p><b>Updated By:</b> {selected?.updated_by}</p>
                        <p><b>Created At:</b> {new Date(selected?.created_at).toLocaleString()}</p>
                        <p><b>Updated At:</b> {new Date(selected?.updated_at).toLocaleString()}</p>
                      </Grid>
                    </Section>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* ===== Reject Modal ===== */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center flex-shrink-0">
                <UserRoundX size={16} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Reject Candidate</h3>
                <p className="text-xs text-gray-500">For: <b>{selectedRejectCandidate?.name}</b></p>
              </div>
            </div>
            <textarea rows={4} value={rejectRemark} onChange={(e) => setRejectRemark(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm mb-4
                         bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none
                         focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-400"
              placeholder="Enter rejection reason…" />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setRejectModalOpen(false); setRejectRemark(""); setSelectedRejectCandidate(null); }}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                Cancel
              </button>
              <button onClick={handleRejectCandidate}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition">
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal open={confirmModalOpen} title="Send Exam Mail"
        message={`Send exam link to ${selectedCandidate?.name}?`}
        onConfirm={handleSendMail} loading={loadingConfirm}
        onCancel={() => { if (!loadingConfirm) { setConfirmModalOpen(false); setSelectedCandidate(null); } }} />

      <ConfirmModal open={reassignModalOpen} title="Reassign Exam"
        message={`Reassign exam to ${selectedReassignCandidate?.name}?`}
        onConfirm={handleReassign} loading={reassignLoading}
        onCancel={() => { if (!reassignLoading) { setReassignModalOpen(false); setSelectedReassignCandidate(null); } }} />
    </div>
  );
};

export default CandidatePage;
