import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCandidatesOverview } from "../../../features/HR_Slices/Interview/InterviewSlice";
import { rejectCandidate, markInterviewCompleted, markSelected, markHired, markInterviewCancelled } from "../../../features/Candidate/candidateSlice";
import SkeletonPage from "../../../components/skeletons/skeletonPage";
import ButtonWrapper from "../../../components/ButtonWrapper";
import { toast } from "react-toastify";
import CustomCalendar from "../../../components/common/CustomCalendar";
import { createInterview, rescheduleInterview } from "../../../features/Interview/InterviewSlice";
import { fetchUsers } from "../../../features/users/userSlice";
import Select from "react-select";
import { fetchAllInterviews } from "../../../features/HR_Slices/Interview/InterviewSlice";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  DESIGN TOKENS & HELPERS                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

const stageMeta = {
  "Shortlisted for Interview": {
    dot: "bg-violet-500",
    badge: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  },
  "Interview Scheduled": {
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  },
  "Interview Completed": {
    dot: "bg-cyan-500",
    badge: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",
  },
  "Selected": {
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  },
  "Hired": {
    dot: "bg-green-600",
    badge: "bg-green-50 text-green-700 ring-1 ring-green-200 font-semibold",
  },
  "Rejected": {
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-600 ring-1 ring-red-200",
  },
};

const stageBadge = (stage) =>
  (stageMeta[stage] || { badge: "bg-gray-100 text-gray-500 ring-1 ring-gray-200" }).badge;

const stageDot = (stage) =>
  (stageMeta[stage] || { dot: "bg-gray-400" }).dot;

/* ─────────────────────────────────────────────────────────────────────────── */
/*  ACTION BUTTON                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */
const ActionBtn = ({ onClick, variant = "default", children, title }) => {
  const variants = {
    green:
      "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 dark:hover:bg-emerald-800/60",
    yellow:
      "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-800/60",
    indigo:
      "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700 dark:hover:bg-indigo-800/60",
    emerald:
      "bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 hover:border-teal-300 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700 dark:hover:bg-teal-800/60",
    red:
      "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700 dark:hover:bg-red-800/60",
    ghost:
      "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700",
  };

  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg text-[11px] font-medium
        transition-all duration-150 hover:scale-[1.02] active:scale-[0.97] whitespace-nowrap
        ${variants[variant] || variants.ghost}
      `}
    >
      {children}
    </button>
  );
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  FILTER SELECT                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */
const FilterSelect = ({ value, onChange, children }) => (
  <select
    value={value}
    onChange={onChange}
    className="
      w-full px-3 py-2 text-sm rounded-xl bg-white dark:bg-gray-900
      border border-gray-200 dark:border-gray-700
      text-gray-700 dark:text-gray-300
      focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
      transition-all duration-150
    "
  >
    {children}
  </select>
);

/* ─────────────────────────────────────────────────────────────────────────── */
/*  MODAL WRAPPER                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */
const Modal = ({ onClose, children, width = "max-w-md" }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
    <div
      className={`
        ${width} w-full mx-4 bg-white dark:bg-gray-900
        rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800
        overflow-hidden flex flex-col max-h-[92vh]
        animate-[fadeSlideUp_0.22s_cubic-bezier(0.4,0,0.2,1)]
      `}
    >
      {children}
    </div>
    <style>{`
      @keyframes fadeSlideUp {
        from { opacity:0; transform:translateY(12px) scale(0.98); }
        to   { opacity:1; transform:translateY(0)    scale(1);    }
      }
    `}</style>
  </div>
);

const ModalHeader = ({ title, subtitle, onClose }) => (
  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80">
    <div>
      <h2 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
    <button
      onClick={onClose}
      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
);

const ModalFooter = ({ children }) => (
  <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80">
    {children}
  </div>
);

const Label = ({ children, required }) => (
  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
    {children}{required && <span className="text-red-400 ml-0.5">*</span>}
  </label>
);

const FormInput = ({ className = "", ...props }) => (
  <input
    {...props}
    className={`
      w-full px-3 py-2.5 text-sm rounded-xl
      bg-white dark:bg-gray-800
      border border-gray-200 dark:border-gray-700
      text-gray-800 dark:text-gray-100
      placeholder-gray-400 dark:placeholder-gray-600
      focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
      transition-all ${className}
    `}
  />
);

const FormSelect = ({ className = "", children, ...props }) => (
  <select
    {...props}
    className={`
      w-full px-3 py-2.5 text-sm rounded-xl
      bg-white dark:bg-gray-800
      border border-gray-200 dark:border-gray-700
      text-gray-800 dark:text-gray-100
      focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
      transition-all ${className}
    `}
  >
    {children}
  </select>
);

const FormTextarea = ({ className = "", ...props }) => (
  <textarea
    {...props}
    className={`
      w-full px-3 py-2.5 text-sm rounded-xl
      bg-white dark:bg-gray-800
      border border-gray-200 dark:border-gray-700
      text-gray-800 dark:text-gray-100
      placeholder-gray-400 dark:placeholder-gray-600
      focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
      resize-none transition-all ${className}
    `}
  />
);

const PrimaryBtn = ({ onClick, children, className = "", color = "indigo", disabled = false }) => {
  const colors = {
    indigo: "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500",
    red: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
    amber: "bg-amber-500 hover:bg-amber-600 focus:ring-amber-400",
    teal: "bg-teal-600 hover:bg-teal-700 focus:ring-teal-500",
    emerald: "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-5 py-2.5 text-sm font-medium text-white rounded-xl
        ${colors[color] || colors.indigo}
        focus:outline-none focus:ring-2 focus:ring-offset-1
        transition-all hover:scale-[1.01] active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${className}
      `}
    >
      {children}
    </button>
  );
};

const GhostBtn = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="
      px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300
      rounded-xl border border-gray-200 dark:border-gray-700
      hover:bg-gray-100 dark:hover:bg-gray-800
      transition-all
    "
  >
    {children}
  </button>
);

/* ─────────────────────────────────────────────────────────────────────────── */
/*  MAIN COMPONENT                                                              */
/* ─────────────────────────────────────────────────────────────────────────── */
const CandidatesOverviewPage = () => {
  const dispatch = useDispatch();

  const [filters, setFilters] = useState({
    search: "",
    departmentId: "",
    examId: "",
    sortBy: "name",
    sortOrder: "asc",
    applicationStage: "",
  });

  const [interviewForm, setInterviewForm] = useState({
    interviewDate: "",
    startTime: "",
    endTime: "",
    round: "",
    interviewType: "Online",
    locationOrLink: "",
    panel: [],
    notes: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;
  const { userList = [] } = useSelector((state) => state.users);
  const { candidates, loading } = useSelector((state) => state.candidatesOverview);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectRemark, setRejectRemark] = useState("");
  const [selectedRejectCandidate, setSelectedRejectCandidate] = useState(null);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [selectedInterviewCandidate, setSelectedInterviewCandidate] = useState(null);
  const [showHireModal, setShowHireModal] = useState(false);
  const [hireCandidateId, setHireCandidateId] = useState(null);
  const [joiningDate, setJoiningDate] = useState("");
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedRescheduleInterview, setSelectedRescheduleInterview] = useState(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const { allInterviews } = useSelector((state) => state.candidatesOverview);
  const departments = useSelector((state) => state.department.list);
  const exams = useSelector((state) => state.exam.list);

  const panelOptions = userList.map((user) => ({
    value: user.id,
    label: `${user.firstName} ${user.lastName || ""}`,
  }));

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchCandidatesOverview());
    dispatch(fetchAllInterviews());
  }, [dispatch]);

  useEffect(() => {
    if (interviewModalOpen) {
      setInterviewForm({
        interviewDate: "", startTime: "", endTime: "", round: "",
        interviewType: "Online", locationOrLink: "", panel: [], notes: "",
      });
    }
  }, [interviewModalOpen]);

  const filteredList = useMemo(() => {
    let data = [...candidates];
    if (filters.search.trim()) {
      const s = filters.search.toLowerCase();
      data = data.filter(
        (i) => i.name?.toLowerCase().includes(s) || i.email?.toLowerCase().includes(s) || i.mobile?.toLowerCase().includes(s)
      );
    }
    if (filters.departmentId) data = data.filter((i) => i.department?.id == filters.departmentId);
    if (filters.examId) data = data.filter((i) => i.job?.id == filters.examId);
    if (filters.applicationStage) data = data.filter((i) => i.applicationStage === filters.applicationStage);

    data.sort((a, b) => {
      let valA, valB;
      if (filters.sortBy === "name") { valA = a.name || ""; valB = b.name || ""; }
      else if (filters.sortBy === "date") { valA = new Date(a.created_at); valB = new Date(b.created_at); }
      else return 0;
      return filters.sortOrder === "asc" ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
    return data;
  }, [candidates, filters]);

  const totalPages = Math.ceil(filteredList.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentRows = filteredList.slice(startIndex, startIndex + rowsPerPage);

  const getInterviewInfo = (interviews = []) => {
    if (!interviews.length) return { activeInterview: null, lastInterview: null, canScheduleNext: true };
    const activeInterview = interviews.find((i) => ["Scheduled", "Rescheduled"].includes(i.status));
    const sorted = [...interviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return { activeInterview, lastInterview: sorted[0], canScheduleNext: !activeInterview };
  };

  const calculateDuration = (start, end) => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const diff = eh * 60 + em - (sh * 60 + sm);
    if (diff <= 0) return "Invalid range";
    return `${Math.floor(diff / 60) ? `${Math.floor(diff / 60)}h ` : ""}${diff % 60}m`;
  };

  /* ─── HANDLERS ─── */
  const handleRejectCandidate = async () => {
    if (!rejectRemark.trim()) { toast.error("Please enter rejection remark"); return; }
    try {
      await dispatch(rejectCandidate({ id: selectedRejectCandidate.id, remarks: rejectRemark })).unwrap();
      toast.success("Candidate rejected successfully");
      dispatch(fetchCandidatesOverview()); dispatch(fetchAllInterviews());
    } catch (err) { toast.error(err || "Failed to reject candidate"); }
    finally { setRejectModalOpen(false); setRejectRemark(""); setSelectedRejectCandidate(null); }
  };

  const handleScheduleInterview = async () => {
    if (!interviewForm.interviewDate) { toast.error("Please select an interview date from the calendar"); return; }
    if (!interviewForm.round) { toast.error("Please select interview round"); return; }
    if (!interviewForm.panel?.length) { toast.error("Please select interview panel"); return; }
    if (!interviewForm.startTime || !interviewForm.endTime) {
      toast.error("Please fill all required interview details"); return;
    }
    setIsScheduling(true);
    try {
      await dispatch(createInterview({
        candidateId: selectedInterviewCandidate.id,
        jobId: selectedInterviewCandidate.job?.id,
        round: interviewForm.round,
        interviewType: interviewForm.interviewType,
        interviewDate: interviewForm.interviewDate,
        startTime: interviewForm.startTime,
        endTime: interviewForm.endTime,
        meetingLink: interviewForm.interviewType === "Online" ? interviewForm.locationOrLink : null,
        location: interviewForm.interviewType !== "Online" ? interviewForm.locationOrLink : null,
        panel: interviewForm.panel,
        notes: interviewForm.notes,
      })).unwrap();
      toast.success("Interview scheduled successfully");
      dispatch(fetchCandidatesOverview()); dispatch(fetchAllInterviews());
      setInterviewModalOpen(false); setSelectedInterviewCandidate(null);
    } catch (err) { toast.error(err || "Failed to schedule interview"); }
    finally { setIsScheduling(false); }
  };

  const handleCancelInterview = async () => {
    if (!cancelReason.trim()) { toast.error("Please provide a cancellation reason"); return; }
    try {
      await dispatch(markInterviewCancelled({ interviewId: selectedInterviewId, cancelReason })).unwrap();
      toast.success("Interview cancelled successfully");
      dispatch(fetchCandidatesOverview()); dispatch(fetchAllInterviews());
      setCancelModalOpen(false); setCancelReason(""); setSelectedInterviewId(null);
    } catch (err) { toast.error(err || "Failed to cancel interview"); }
  };

  const handleSelectCandidate = async (id) => {
    try {
      await dispatch(markSelected(id)).unwrap();
      toast.success("Candidate Selected");
      dispatch(fetchCandidatesOverview()); dispatch(fetchAllInterviews());
    } catch (err) { toast.error(err || "Failed"); }
  };

  const openHireModal = (id) => { setHireCandidateId(id); setJoiningDate(""); setShowHireModal(true); };

  const submitHiring = async () => {
    if (!joiningDate) { toast.error("Joining date required"); return; }
    try {
      await dispatch(markHired({ id: hireCandidateId, joiningDate })).unwrap();
      toast.success("Candidate Hired Successfully");
      dispatch(fetchCandidatesOverview()); setShowHireModal(false); setHireCandidateId(null);
    } catch (err) { toast.error(err); }
  };

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  RENDER                                                                   */
  /* ─────────────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50/60 dark:bg-gray-950 px-6 py-6 font-sans">

      {/* ── PAGE HEADER ── */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Interview Management
          </h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage candidates across all interview stages
        </p>
      </div>

      {/* ── FILTERS ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 mb-5 shadow-sm">
        <div className="flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email or mobile..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="
                w-full pl-9 pr-4 py-2.5 text-sm rounded-xl
                bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                text-gray-800 dark:text-gray-100 placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all
              "
            />
          </div>

          {/* Grid filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <FilterSelect value={filters.departmentId} onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}>
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </FilterSelect>

            <FilterSelect value={filters.applicationStage} onChange={(e) => setFilters({ ...filters, applicationStage: e.target.value })}>
              <option value="">All Stages</option>
              {Object.keys(stageMeta).map((s) => <option key={s} value={s}>{s}</option>)}
            </FilterSelect>

            <FilterSelect value={filters.sortBy} onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}>
              <option value="name">Sort by Name</option>
              <option value="score">Sort by Score</option>
              <option value="date">Sort by Date</option>
            </FilterSelect>

            <FilterSelect value={filters.sortOrder} onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value })}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </FilterSelect>
          </div>
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1380px] w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/60">
                {[
                  "Candidate", "Department", "Exam Result", "Stage",
                  "Position", "Interview Status", "Round",
                  "Quick Actions", "Actions",
                ].map((h, i) => (
                  <th
                    key={h}
                    className={`
                      px-4 py-3.5 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider
                      ${i >= 7 ? "sticky bg-gray-50 dark:bg-gray-800 z-20" : ""}
                      ${i === 7 ? "right-[120px] text-center w-[170px]" : ""}
                      ${i === 8 ? "right-0 text-center w-[120px]" : ""}
                    `}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/80">
              {loading ? (
                <SkeletonPage rows={4} columns={9} />
              ) : currentRows.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm">No candidates found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                currentRows.map((row) => {
                  const { activeInterview, lastInterview, canScheduleNext } = getInterviewInfo(row.interviews);
                  const scheduleLabel = lastInterview ? "Next Round" : "Schedule";

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors group"
                    >
                      {/* Candidate */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100 text-[13px]">{row.name}</p>
                            <p className="text-[11px] text-gray-400">{row.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400 text-[13px]">
                        {row.department?.name ?? <span className="text-gray-300">—</span>}
                      </td>

                      {/* Exam Result */}
                      <td className="px-4 py-3.5 text-center">
                        {row.examResults?.[0]?.resultStatus ? (
                          <span className={`
                            inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold
                            ${row.examResults[0].resultStatus === "pass"
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                              : "bg-red-50 text-red-600 ring-1 ring-red-200"}
                          `}>
                            <span className={`w-1.5 h-1.5 rounded-full ${row.examResults[0].resultStatus === "pass" ? "bg-emerald-500" : "bg-red-500"}`} />
                            {row.examResults[0].resultStatus}
                          </span>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>

                      {/* Stage */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap ${stageBadge(row.applicationStage)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${stageDot(row.applicationStage)}`} />
                          {row.applicationStage}
                        </span>
                      </td>

                      {/* Position */}
                      <td className="px-4 py-3.5">
                        <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200">{row.job?.title ?? "—"}</p>
                        <p className="text-[11px] text-gray-400">{row.job?.designation}</p>
                      </td>

                      {/* Interview Status */}
                      <td className="px-4 py-3.5 text-center">
                        {activeInterview ? (
                          <span className="text-amber-600 font-semibold text-[12px]">{activeInterview.status}</span>
                        ) : lastInterview ? (
                          <span className={`font-semibold text-[12px] ${lastInterview.status === "Completed" ? "text-emerald-600" : "text-red-500"}`}>
                            {lastInterview.status}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-[12px]">Not Started</span>
                        )}
                      </td>

                      {/* Round */}
                      <td className="px-4 py-3.5">
                        <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
                          {activeInterview?.round || lastInterview?.round || <span className="text-gray-300">—</span>}
                        </span>
                      </td>

                      {/* Quick Actions */}
                      <td className="w-[170px] px-3 py-3 text-center sticky right-[120px] bg-white dark:bg-gray-900 group-hover:bg-blue-50 dark:group-hover:bg-blue-900 z-10" style={{ boxShadow: "-4px 0 10px -4px rgba(0,0,0,0.06)" }}>
                        <div className="flex flex-col items-center gap-1.5">
                          <ButtonWrapper subModule="Interview Management" permission="edit">

                            {canScheduleNext &&
                              row.applicationStage !== "Selected" &&
                              row.applicationStage !== "Hired" &&
                              row.applicationStage !== "Rejected" && (
                                <ActionBtn variant="green" onClick={() => { setSelectedInterviewCandidate(row); setInterviewModalOpen(true); }}>
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" d="M12 4v16m8-8H4" />
                                  </svg>
                                  {scheduleLabel}
                                </ActionBtn>
                              )}

                            {row.applicationStage === "Interview Scheduled" && (
                              <ActionBtn variant="yellow" onClick={() => { setSelectedRescheduleInterview(row.interviews?.[0]); setRescheduleModalOpen(true); }}>
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Reschedule
                              </ActionBtn>
                            )}

                            {(row.applicationStage === "Interview Scheduled" || row.applicationStage === "Interview Rescheduled") && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-amber-600 bg-amber-50 border border-amber-200">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4l3 3" />
                                </svg>
                                Review Pending
                              </span>
                            )}

                            {(() => {
                              const { lastInterview } = getInterviewInfo(row.interviews);
                              return (
                                lastInterview &&
                                ["HR", "Managerial", "Technical"].includes(lastInterview.round) &&
                                lastInterview.status === "Completed" &&
                                row.applicationStage !== "Selected" &&
                                row.applicationStage !== "Rejected" &&
                                row.applicationStage !== "Hired" && (
                                  <ActionBtn variant="indigo" onClick={() => handleSelectCandidate(row.id)}>
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Select
                                  </ActionBtn>
                                )
                              );
                            })()}

                            {row.applicationStage === "Selected" && (
                              <ActionBtn variant="emerald" onClick={() => openHireModal(row.id)}>
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Hire
                              </ActionBtn>
                            )}

                          </ButtonWrapper>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="w-[120px] px-3 py-3 text-center sticky right-0 bg-white dark:bg-gray-900 group-hover:bg-blue-50 dark:group-hover:bg-blue-900 z-20" style={{ boxShadow: "-4px 0 12px -4px rgba(0,0,0,0.08)" }}>
                        <div className="flex flex-col items-center gap-1.5">
                          <ButtonWrapper subModule="Interview Management" permission="edit">
                            {row.applicationStage !== "Hired" && row.applicationStage !== "Rejected" && (
                              <ActionBtn variant="red" onClick={() => { setSelectedRejectCandidate(row); setRejectModalOpen(true); }}>
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Reject
                              </ActionBtn>
                            )}
                          </ButtonWrapper>

                          {row.applicationStage === "Interview Scheduled" && (
                            <ActionBtn variant="red" onClick={() => { setSelectedInterviewId(row.interviews?.[0]?.id); setCancelModalOpen(true); }}>
                              Cancel Interview
                            </ActionBtn>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── PAGINATION ── */}
      {
        totalPages > 1 && (
          <div className="mt-5 flex justify-center items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`
                w-8 h-8 rounded-lg text-sm font-medium transition-all
                ${currentPage === i + 1
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "border border-gray-200 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"}
              `}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )
      }

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/*  MODALS                                                                */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {/* ── REJECT MODAL ── */}
      {
        rejectModalOpen && (
          <Modal onClose={() => { setRejectModalOpen(false); setRejectRemark(""); setSelectedRejectCandidate(null); }}>
            <ModalHeader
              title="Reject Candidate"
              subtitle={selectedRejectCandidate?.name}
              onClose={() => { setRejectModalOpen(false); setRejectRemark(""); setSelectedRejectCandidate(null); }}
            />
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 p-3.5 bg-red-50 rounded-xl border border-red-100">
                <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">
                  This will permanently mark the candidate as <strong>Rejected</strong>. Please provide a reason.
                </p>
              </div>
              <div>
                <Label required>Rejection Reason</Label>
                <FormTextarea
                  rows={4}
                  value={rejectRemark}
                  onChange={(e) => setRejectRemark(e.target.value)}
                  placeholder="Describe the reason for rejection..."
                />
              </div>
            </div>
            <ModalFooter>
              <GhostBtn onClick={() => { setRejectModalOpen(false); setRejectRemark(""); setSelectedRejectCandidate(null); }}>Cancel</GhostBtn>
              <PrimaryBtn color="red" onClick={handleRejectCandidate}>Confirm Rejection</PrimaryBtn>
            </ModalFooter>
          </Modal>
        )
      }

      {/* ── HIRE MODAL ── */}
      {
        showHireModal && (
          <Modal onClose={() => setShowHireModal(false)}>
            <ModalHeader title="Confirm Hiring" subtitle="Set the joining date for this candidate" onClose={() => setShowHireModal(false)} />
            <div className="p-6 space-y-4">
              <div>
                <Label required>Joining Date</Label>
                <FormInput type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} />
              </div>
            </div>
            <ModalFooter>
              <GhostBtn onClick={() => setShowHireModal(false)}>Cancel</GhostBtn>
              <PrimaryBtn color="emerald" onClick={submitHiring}>Confirm Hire</PrimaryBtn>
            </ModalFooter>
          </Modal>
        )
      }

      {/* ── CANCEL INTERVIEW MODAL ── */}
      {
        cancelModalOpen && (
          <Modal onClose={() => { setCancelModalOpen(false); setCancelReason(""); setSelectedInterviewId(null); }}>
            <ModalHeader
              title="Cancel Interview"
              subtitle="This action cannot be undone"
              onClose={() => { setCancelModalOpen(false); setCancelReason(""); setSelectedInterviewId(null); }}
            />
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 p-3.5 bg-amber-50 rounded-xl border border-amber-100">
                <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-amber-700">Cancelling will notify the candidate and update the interview status.</p>
              </div>
              <div>
                <Label required>Cancellation Reason</Label>
                <FormTextarea
                  rows={4}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Candidate unavailable, interviewer conflict..."
                />
              </div>
            </div>
            <ModalFooter>
              <GhostBtn onClick={() => { setCancelModalOpen(false); setCancelReason(""); setSelectedInterviewId(null); }}>Close</GhostBtn>
              <PrimaryBtn color="red" onClick={handleCancelInterview}>Confirm Cancellation</PrimaryBtn>
            </ModalFooter>
          </Modal>
        )
      }

      {/* ── SCHEDULE INTERVIEW MODAL ── */}
      {
        interviewModalOpen && (
          <Modal onClose={() => setInterviewModalOpen(false)} width="max-w-5xl">
            <ModalHeader
              title="Schedule Interview"
              subtitle={selectedInterviewCandidate?.name}
              onClose={() => setInterviewModalOpen(false)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 overflow-y-auto">
              {/* LEFT – Calendar */}
              <div className="p-6 border-r border-gray-100 dark:border-gray-800">
                <Label>Select Interview Date</Label>
                <CustomCalendar
                  selectedDate={interviewForm.interviewDate}
                  onSelect={(date) => setInterviewForm({ ...interviewForm, interviewDate: date })}
                  scheduledInterviews={allInterviews}
                />
              </div>

              {/* RIGHT – Details */}
              <div className="p-6 space-y-4 overflow-y-auto">

                <div>
                  <Label required>Interview Round</Label>
                  <FormSelect
                    value={interviewForm.round}
                    onChange={(e) => setInterviewForm({ ...interviewForm, round: e.target.value })}
                  >
                    <option value="" disabled>Select round</option>
                    <option value="Technical">Technical</option>
                    <option value="HR">HR</option>
                    <option value="Managerial">Managerial</option>
                  </FormSelect>
                </div>

                {/* Time slot */}
                <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-100 dark:border-gray-700 space-y-3">
                  <Label>Time Slot</Label>
                  <div className="grid grid-cols-[1fr_28px_1fr] items-center gap-2">
                    <div>
                      <p className="text-[11px] text-gray-400 mb-1">Start</p>
                      <FormInput type="time" value={interviewForm.startTime} onChange={(e) => setInterviewForm({ ...interviewForm, startTime: e.target.value })} />
                    </div>
                    <div className="text-gray-300 text-center mt-4 font-light">→</div>
                    <div>
                      <p className="text-[11px] text-gray-400 mb-1">End</p>
                      <FormInput type="time" value={interviewForm.endTime} onChange={(e) => setInterviewForm({ ...interviewForm, endTime: e.target.value })} />
                    </div>
                  </div>
                  {interviewForm.startTime && interviewForm.endTime && (
                    <p className="text-xs text-indigo-600 font-medium">
                      Duration: {calculateDuration(interviewForm.startTime, interviewForm.endTime)}
                    </p>
                  )}
                </div>

                <div>
                  <Label required>Interview Mode</Label>
                  <FormSelect value={interviewForm.interviewType} onChange={(e) => setInterviewForm({ ...interviewForm, interviewType: e.target.value })}>
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="Telephonic">Telephonic</option>
                  </FormSelect>
                </div>

                <div>
                  <Label>{interviewForm.interviewType === "Online" ? "Meeting Link" : "Location"}</Label>
                  <FormInput
                    placeholder={interviewForm.interviewType === "Online" ? "https://meet.google.com/..." : "Office address or room"}
                    value={interviewForm.locationOrLink}
                    onChange={(e) => setInterviewForm({ ...interviewForm, locationOrLink: e.target.value })}
                  />
                </div>

                {/* Panel */}
                <div>
                  <Label required>Interview Panel</Label>
                  <Select
                    isMulti
                    options={panelOptions}
                    placeholder="Search and select panel members..."
                    value={panelOptions.filter((opt) => interviewForm.panel.some((p) => p.userId === opt.value))}
                    onChange={(selectedOptions) => {
                      setInterviewForm({
                        ...interviewForm,
                        panel: selectedOptions.map((opt, i) => {
                          const existing = interviewForm.panel.find((p) => p.userId === opt.value);
                          return existing || { userId: opt.value, role: i === 0 ? "Lead" : "Panelist" };
                        }),
                      });
                    }}
                    classNamePrefix="react-select"
                    styles={{
                      control: (b) => ({ ...b, borderRadius: "12px", borderColor: "#e5e7eb", minHeight: "42px", boxShadow: "none", "&:hover": { borderColor: "#a5b4fc" } }),
                      multiValue: (b) => ({ ...b, borderRadius: "8px", background: "#eef2ff" }),
                      multiValueLabel: (b) => ({ ...b, color: "#4338ca", fontSize: "12px" }),
                      menu: (b) => ({ ...b, borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }),
                    }}
                  />

                  {interviewForm.panel.length > 0 && (
                    <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 dark:bg-gray-800/60 dark:border-gray-700 p-3 space-y-2">
                      {interviewForm.panel.map((member) => {
                        const user = userList.find((u) => u.id === member.userId);
                        return (
                          <div key={member.userId} className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-3 py-2">
                            <div className="flex items-center gap-2.5">
                              <span className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold">
                                {user?.firstName?.[0]?.toUpperCase()}
                              </span>
                              <div>
                                <p className="text-[12px] font-medium text-gray-800 dark:text-gray-100">{user?.firstName} {user?.lastName}</p>
                                <p className="text-[10px] text-gray-400">Panel Member</p>
                              </div>
                            </div>
                            <FormSelect
                              value={member.role}
                              onChange={(e) => setInterviewForm({ ...interviewForm, panel: interviewForm.panel.map((p) => p.userId === member.userId ? { ...p, role: e.target.value } : p) })}
                              className="!w-auto !py-1 !px-2 !text-xs"
                            >
                              <option value="Lead">Lead</option>
                              <option value="Panelist">Panelist</option>
                              <option value="Observer">Observer</option>
                            </FormSelect>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Notes (optional)</Label>
                  <FormTextarea rows={3} placeholder="Any special instructions or remarks..." value={interviewForm.notes} onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })} />
                </div>
              </div>
            </div>

            <ModalFooter>
              <GhostBtn onClick={() => setInterviewModalOpen(false)}>Cancel</GhostBtn>
              <PrimaryBtn
                color="teal"
                onClick={handleScheduleInterview}
                disabled={isScheduling}
              >
                {isScheduling ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Scheduling...
                  </span>
                ) : "Schedule Interview"}
              </PrimaryBtn>
            </ModalFooter>
          </Modal>
        )
      }

      {/* ── RESCHEDULE MODAL ── */}
      {
        rescheduleModalOpen && (
          <Modal onClose={() => { setRescheduleModalOpen(false); setSelectedRescheduleInterview(null); }} width="max-w-4xl">
            <ModalHeader
              title="Reschedule Interview"
              subtitle="Select a new date and time"
              onClose={() => { setRescheduleModalOpen(false); setSelectedRescheduleInterview(null); }}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 overflow-y-auto">
              {/* Calendar */}
              <div className="p-6 border-r border-gray-100 dark:border-gray-800">
                <Label>New Interview Date</Label>
                <CustomCalendar
                  selectedDate={interviewForm.interviewDate}
                  onSelect={(date) => setInterviewForm({ ...interviewForm, interviewDate: date })}
                />
              </div>

              {/* Details */}
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-100 dark:border-gray-700 space-y-3">
                  <Label>New Time Slot</Label>
                  <div className="grid grid-cols-[1fr_28px_1fr] items-center gap-2">
                    <div>
                      <p className="text-[11px] text-gray-400 mb-1">Start</p>
                      <FormInput type="time" value={interviewForm.startTime} onChange={(e) => setInterviewForm({ ...interviewForm, startTime: e.target.value })} />
                    </div>
                    <div className="text-gray-300 text-center mt-4 font-light">→</div>
                    <div>
                      <p className="text-[11px] text-gray-400 mb-1">End</p>
                      <FormInput type="time" value={interviewForm.endTime} onChange={(e) => setInterviewForm({ ...interviewForm, endTime: e.target.value })} />
                    </div>
                  </div>
                  {interviewForm.startTime && interviewForm.endTime && (
                    <p className="text-xs text-amber-600 font-medium">
                      Duration: {calculateDuration(interviewForm.startTime, interviewForm.endTime)}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Reason / Notes</Label>
                  <FormTextarea
                    rows={4}
                    placeholder="Mention reason for rescheduling..."
                    value={interviewForm.notes}
                    onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <ModalFooter>
              <GhostBtn onClick={() => { setRescheduleModalOpen(false); setSelectedRescheduleInterview(null); }}>Cancel</GhostBtn>
              <PrimaryBtn color="amber" onClick={async () => {
                if (!interviewForm.interviewDate) { toast.error("Please select a new interview date from the calendar"); return; }
                if (!interviewForm.startTime || !interviewForm.endTime) { toast.error("Please fill start and end time"); return; }
                setIsRescheduling(true);
                try {
                  await dispatch(rescheduleInterview({
                    interviewId: selectedRescheduleInterview.id,
                    payload: { interviewDate: interviewForm.interviewDate, startTime: interviewForm.startTime, endTime: interviewForm.endTime, notes: interviewForm.notes },
                  })).unwrap();
                  toast.success("Interview rescheduled successfully");
                  dispatch(fetchCandidatesOverview());
                  setRescheduleModalOpen(false); setSelectedRescheduleInterview(null);
                } catch (err) { toast.error(err); }
                finally { setIsRescheduling(false); }
              }} disabled={isRescheduling}>
                {isRescheduling ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Rescheduling...
                  </span>
                ) : "Confirm Reschedule"}
              </PrimaryBtn>
            </ModalFooter>
          </Modal>
        )
      }

    </div >
  );
};

export default CandidatesOverviewPage;
