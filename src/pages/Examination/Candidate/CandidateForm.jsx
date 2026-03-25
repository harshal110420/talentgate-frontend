import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

import { fetchAllDepartments } from "../../../features/department/departmentSlice";
import { fetchAllExams } from "../../../features/Exams/examSlice";
import {
  createCandidate, updateCandidate, fetchCandidateById,
  clearSelectedCandidate, resetCandidateStatus,
} from "../../../features/Candidate/candidateSlice";
import { fetchAllJobOpenings } from "../../../features/HR_Slices/jobOpening/jobOpeningSlice";
import { fetchHRUsers } from "../../../features/HR_Slices/hrUsers/hrUserSlice";
import { getModulePathByMenu } from "../../../utils/navigation";
import SkeletonForm from "../../../components/skeletons/skeletonForm";
import FormActionButtons from "../../../components/common/FormActionButtons";
import { useAuth } from "../../../context/AuthContext";
import {
  User, Mail, Phone, Briefcase, Building2, ArrowLeft,
  Save, Loader2, UserPlus, UserCog, Upload, FileText,
  Search, X, CheckCircle2, ClipboardList, GraduationCap,
  StepBack,
} from "lucide-react";

/* ── Step definitions ─────────────────────────────────────────── */
const STEPS = [
  { label: "Basic Info", icon: User },
  { label: "Job Tracking", icon: Briefcase },
  { label: "Screening / HR Tools", icon: ClipboardList },
  { label: "Exam Info", icon: GraduationCap },
];

const experienceOptions = Array.from({ length: 30 }, (_, i) => ({
  value: `${i}-${i + 1}`, label: `${i}–${i + 1} years`,
}));

const applicationStageOptions = [
  "Applied", "Resume Reviewed", "Shortlisted for Exam", "Exam Assigned", "Exam Completed",
  "Shortlisted for Interview", "Interview Scheduled", "Interview Completed", "Selected", "Rejected", "Hired",
];

const initialForm = {
  name: "", email: "", mobile: "", experience: "", departmentId: "",
  examId: "", isActive: true, resumeFile: null, resumeUrl: "", source: "offline",
  jobId: "", jobCode: "", jobTitle: "", jobDesignation: "",
  assignedRecruiterId: "", remarks: "", hrRating: "",
};

/* ── Reusable field label ─────────────────────────────────────── */
const FieldLabel = ({ htmlFor, children, required }) => (
  <label htmlFor={htmlFor}
    className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
    {children}{required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

/* ── Text input ───────────────────────────────────────────────── */
const InputField = ({ icon: Icon, id, name, type = "text", value, onChange, placeholder, disabled }) => (
  <div className="relative">
    {Icon && (
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
        <Icon size={14} />
      </div>
    )}
    <input type={type} id={id} name={name} value={value} onChange={onChange}
      placeholder={placeholder} disabled={disabled}
      className={`block w-full rounded-xl border px-3 py-2.5 text-sm
        text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
        focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400
        dark:focus:border-blue-500 transition-all duration-150
        ${Icon ? "pl-9" : ""}
        ${disabled
          ? "bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed border-dashed"
          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
        }`} />
  </div>
);

/* ── Select field ─────────────────────────────────────────────── */
const SelectField = ({ icon: Icon, id, name, value, onChange, children }) => (
  <div className="relative">
    {Icon && (
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none z-10">
        <Icon size={14} />
      </div>
    )}
    <select id={id} name={name} value={value} onChange={onChange}
      className={`block w-full rounded-xl border px-3 py-2.5 text-sm appearance-none cursor-pointer
        text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800
        border-gray-200 dark:border-gray-700
        focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400
        dark:focus:border-blue-500 transition-all duration-150
        ${Icon ? "pl-9" : ""}`}>
      {children}
    </select>
    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M6 8L1 3h10L6 8z" /></svg>
    </div>
  </div>
);

/* ── Section card wrapper ─────────────────────────────────────── */
const StepCard = ({ icon: Icon, title, desc, children }) => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm flex-shrink-0">
          {Icon && <Icon size={12} color="white" />}
        </div>
        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{title}</span>
      </div>
      {desc && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 ml-8">{desc}</p>}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

/* ── Step Progress Bar ────────────────────────────────────────── */
const StepBar = ({ currentStep, totalSteps, steps, onStepClick }) => (
  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden mb-5">
    <div className="flex">
      {steps.map((step, idx) => {
        const done = idx < currentStep;
        const active = idx === currentStep;
        const StepIcon = step.icon;
        return (
          <button key={idx} type="button" onClick={() => onStepClick(idx)}
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 px-3 py-3.5 text-xs font-semibold
                        transition-all duration-150 border-b-2 relative
                        ${active ? "border-blue-600 text-blue-700 dark:text-blue-300 bg-blue-50/60 dark:bg-blue-950/30" :
                done ? "border-emerald-400 text-emerald-600 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20" :
                  "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold
              ${active ? "bg-blue-600 text-white" : done ? "bg-emerald-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
              {done ? <CheckCircle2 size={12} /> : idx + 1}
            </div>
            <span className="hidden sm:block truncate">{step.label}</span>
          </button>
        );
      })}
    </div>
  </div>
);

/* ── Main Component ───────────────────────────────────────────── */
const CandidateForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [initialValues, setInitialValues] = useState(initialForm);
  const [currentStep, setCurrentStep] = useState(location.state?.openStep ?? 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobSearch, setJobSearch] = useState("");
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const { user: loggedInUser } = useAuth();
  const { selected, loading } = useSelector((s) => s.candidate);
  const departments = useSelector((s) => s.department.list);
  const deptLoading = useSelector((s) => s.department.loading);
  const exams = useSelector((s) => s.exam.list);
  const examLoading = useSelector((s) => s.exam.loading);
  const { jobOpenings = [] } = useSelector((s) => s.jobOpening);
  const { list: hrUsers, loading: hrLoading } = useSelector((s) => s.hrUsers);
  const modules = useSelector((s) => s.modules.list);
  const menus = useSelector((s) => s.menus.list);
  const modulePath = getModulePathByMenu("candidate_management", modules, menus);

  /* ── Data fetches ── */
  useEffect(() => {
    dispatch(fetchAllDepartments());
    dispatch(fetchAllExams());
    dispatch(fetchAllJobOpenings());
    dispatch(fetchHRUsers());
    if (isEditMode) dispatch(fetchCandidateById(id));
    return () => { dispatch(clearSelectedCandidate()); dispatch(resetCandidateStatus()); };
  }, [dispatch, id, isEditMode]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsSearching(true);
      await dispatch(fetchAllJobOpenings({ search: jobSearch, page: 1, limit: 20 }));
      setIsSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [jobSearch, dispatch]);

  useEffect(() => {
    if (location.state?.openStep !== undefined) setCurrentStep(location.state.openStep);
  }, [location.state]);

  /* ── Populate edit mode ── */
  useEffect(() => {
    if (isEditMode && selected) {
      const d = {
        name: selected.name || "", email: selected.email || "", mobile: selected.mobile || "",
        experience: selected.experience || "", departmentId: selected.departmentId ? String(selected.departmentId) : "",
        examId: selected.examId ? String(selected.examId) : "",
        isActive: typeof selected.isActive === "boolean" ? selected.isActive : true,
        resumeUrl: selected.resumeUrl || "", resumeFile: null,
        jobCode: selected.job?.jobCode || "", jobTitle: selected.job?.title || "",
        jobDesignation: selected.job?.designation || "", jobId: selected.job?.id ? String(selected.job.id) : "",
        assignedRecruiterId: selected.assignedRecruiterId || "",
        remarks: selected.remarks || "", hrRating: selected.hrRating || "",
        source: selected.source || "offline",
      };
      setForm(d); setInitialValues(d);
    }
  }, [selected, isEditMode]);

  useEffect(() => {
    if (!isEditMode && loggedInUser?.id)
      setForm((p) => ({ ...p, assignedRecruiterId: String(loggedInUser.id) }));
  }, [loggedInUser, isEditMode]);

  /* ── Job search filter ── */
  useEffect(() => {
    if (!jobSearch) return setFilteredJobs([]);
    const q = jobSearch.toLowerCase();
    setFilteredJobs(jobOpenings.filter((j) =>
      j.jobCode?.toLowerCase().includes(q) || j.title?.toLowerCase().includes(q) || j.designation?.toLowerCase().includes(q)
    ));
  }, [jobSearch, jobOpenings]);

  /* ── Handlers ── */
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "file") setForm((p) => ({ ...p, resumeFile: files[0] }));
    else setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleJobSelect = (job) => {
    setForm((p) => ({ ...p, jobCode: job.jobCode, jobTitle: job.title, jobDesignation: job.designation, jobId: job.id }));
    setJobSearch(""); setFilteredJobs([]);
  };

  const clearSelectedJob = () => {
    setForm((p) => ({ ...p, jobCode: "", jobTitle: "", jobDesignation: "", jobId: "" }));
    setJobSearch(""); setFilteredJobs([]);
  };

  const hasChanges = () => Object.keys(form).some((k) => {
    if (Array.isArray(form[k])) return JSON.stringify(form[k]) !== JSON.stringify(initialValues[k]);
    return form[k] !== initialValues[k];
  });

  const isFormValid = () => {
    const ok = form.name.trim() !== "" && form.email.trim() !== "" && form.experience !== "" && form.departmentId !== "";
    return ok && (!isEditMode || hasChanges());
  };

  const getOriginalFileName = (url) => url ? url.split("/").pop().replace(/^\d+-/, "") : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const formData = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      if (key === "resumeFile" || key === "resumeUrl") return;
      if (key === "examId") { formData.append(key, value ?? ""); return; }
      if (["departmentId", "assignedRecruiterId", "hrRating", "jobId"].includes(key)) {
        if (value !== "" && value !== null && value !== undefined) formData.append(key, value);
        return;
      }
      if (typeof value === "boolean") { formData.append(key, value); return; }
      if (value !== null && value !== undefined) formData.append(key, value);
    });

    if (form.resumeFile) formData.append("resume", form.resumeFile);

    try {
      if (isEditMode) {
        await dispatch(updateCandidate({ id, data: formData })).unwrap();
        toast.success("Candidate updated successfully");
      } else {
        await dispatch(createCandidate(formData)).unwrap();
        toast.success("Candidate created successfully");
        setForm(initialForm);
      }
      navigate(`/module/${modulePath}/candidate_management`);
    } catch (err) {
      toast.error(typeof err === "string" ? err : err?.error || err?.message || err?.response?.data?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || deptLoading || examLoading) return <SkeletonForm />;

  const displayJobs = jobSearch.trim() ? filteredJobs : jobOpenings;
  const selectedExam = exams.find((e) => e.id === Number(form.examId));

  return (
    <div className="max-w-full px-5 py-6 font-sans text-gray-800 dark:text-gray-100">
      <form onSubmit={handleSubmit} noValidate>

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1 h-6 rounded-full bg-indigo-500 inline-block" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
                {isEditMode ? (form.name || "Edit Candidate") : "Create New Candidate"}
              </h1>
            </div>

            {/* Subtitle + badges */}
            <div className="flex items-center gap-2 ml-3 flex-wrap">
              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                {isEditMode ? <UserCog size={13} /> : <UserPlus size={13} />}
                {isEditMode ? "Editing candidate profile" : "Fill in the details below"}
              </span>

              {form.departmentId && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700">
                  {departments.find((d) => String(d.id) === form.departmentId)?.name}
                </span>
              )}

              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1
        ${form.isActive
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-700"
                  : "bg-red-50 text-red-600 ring-red-200 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-700"
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${form.isActive ? "bg-emerald-500" : "bg-red-400"}`} />
                {form.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Back Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigate(`/module/${modulePath}/candidate_management`)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all shadow-sm hover:shadow-md"
            >
              <StepBack size={14} />
              Back
            </button>
          </div>
        </div>

        {/* ── Step Progress Bar ── */}
        <StepBar currentStep={currentStep} totalSteps={STEPS.length} steps={STEPS} onStepClick={setCurrentStep} />

        {/* ─────────────────── STEP 0: Basic Info ─────────────────── */}
        {currentStep === 0 && (
          <StepCard icon={User} title="Basic Information" desc="Fields marked * are required">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">

              <div>
                <FieldLabel htmlFor="name" required>Full Name</FieldLabel>
                <InputField icon={User} id="name" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Rahul Sharma" />
              </div>

              <div>
                <FieldLabel htmlFor="email" required>Email Address</FieldLabel>
                <InputField icon={Mail} id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="e.g. rahul@email.com" />
              </div>

              <div>
                <FieldLabel htmlFor="mobile">Mobile</FieldLabel>
                <InputField icon={Phone} id="mobile" name="mobile" value={form.mobile} onChange={handleChange} placeholder="e.g. 9876543210" />
              </div>

              <div>
                <FieldLabel htmlFor="experience" required>Experience</FieldLabel>
                <SelectField icon={Briefcase} id="experience" name="experience" value={form.experience} onChange={handleChange}>
                  <option value="">Select Experience</option>
                  {experienceOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </SelectField>
              </div>

              <div>
                <FieldLabel htmlFor="departmentId" required>Department</FieldLabel>
                <SelectField icon={Building2} id="departmentId" name="departmentId" value={form.departmentId} onChange={handleChange}>
                  <option value="">Select Department</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </SelectField>
              </div>

              <div>
                <FieldLabel htmlFor="source">Source</FieldLabel>
                <SelectField id="source" name="source" value={form.source} onChange={handleChange}>
                  <option value="offline">Offline</option>
                  <option value="online">Online</option>
                </SelectField>
              </div>

              {/* Resume Upload */}
              <div className="lg:col-span-2">
                <FieldLabel htmlFor="resume">Resume</FieldLabel>
                <label htmlFor="resume"
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700
                             bg-gray-50 dark:bg-gray-800/60 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/40 transition-all duration-150">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
                    <Upload size={14} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {form.resumeFile ? form.resumeFile.name : "Click to upload resume"}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">PDF, DOC, DOCX supported</p>
                  </div>
                  {form.resumeUrl && !form.resumeFile && (
                    <span className="ml-auto flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 flex-shrink-0">
                      <FileText size={11} /> {getOriginalFileName(form.resumeUrl)}
                    </span>
                  )}
                  <input id="resume" type="file" accept=".pdf,.doc,.docx" className="sr-only"
                    onChange={(e) => setForm((p) => ({ ...p, resumeFile: e.target.files[0] }))} />
                </label>
              </div>

              {/* Active Toggle */}
              <div className="flex items-end">
                <label htmlFor="isActive"
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 cursor-pointer transition-all duration-200
                    ${form.isActive
                      ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/30"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60"}`}>
                  <div className={`relative w-10 h-5 rounded-full flex-shrink-0 transition-colors duration-200 ${form.isActive ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${form.isActive ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold leading-tight ${form.isActive ? "text-emerald-700 dark:text-emerald-300" : "text-gray-600 dark:text-gray-400"}`}>
                      {form.isActive ? "Active Candidate" : "Inactive Candidate"}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                      {form.isActive ? "Visible in pipeline" : "Hidden from pipeline"}
                    </p>
                  </div>
                  <input type="checkbox" id="isActive" name="isActive" checked={form.isActive} onChange={handleChange} className="sr-only" />
                </label>
              </div>
            </div>
          </StepCard>
        )}

        {/* ─────────────────── STEP 1: Job Tracking ─────────────────── */}
        {currentStep === 1 && (
          <StepCard icon={Briefcase} title="Job Tracking" desc="Search and select a job opening for this candidate">
            {/* Search bar */}
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input type="text" value={jobSearch} onChange={(e) => setJobSearch(e.target.value)}
                  placeholder="Search by job code, title or designation…"
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                             bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100
                             placeholder-gray-400 dark:placeholder-gray-500
                             focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition" />
                {jobSearch && (
                  <button type="button" onClick={() => setJobSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={13} /></button>
                )}
              </div>
              {form.jobCode && (
                <button type="button" onClick={clearSelectedJob}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 transition whitespace-nowrap">
                  <X size={11} /> Clear Job
                </button>
              )}
            </div>

            {/* Job table */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="w-8 px-4 py-2.5" />
                      {["Job Code", "Title", "Designation"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {displayJobs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                          {jobSearch.trim() ? "No jobs found matching your search." : "No job openings available."}
                        </td>
                      </tr>
                    ) : displayJobs.map((job) => {
                      const sel = String(form.jobId) === String(job.id);
                      return (
                        <tr key={job.id} onClick={() => handleJobSelect(job)}
                          className={`cursor-pointer transition-colors duration-100 ${sel ? "bg-blue-50 dark:bg-blue-950/30" : "hover:bg-gray-50 dark:hover:bg-gray-800/60"}`}>
                          <td className="px-4 py-3">
                            <span className={`inline-flex w-4 h-4 rounded-full border-2 items-center justify-center flex-shrink-0 ${sel ? "border-blue-600 bg-blue-600" : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"}`}>
                              {sel && <span className="block w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                          </td>
                          <td className={`px-4 py-3 font-semibold text-sm ${sel ? "text-blue-700 dark:text-blue-300" : "text-gray-800 dark:text-gray-100"}`}>{job.jobCode}</td>
                          <td className={`px-4 py-3 text-sm ${sel ? "text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-200"}`}>{job.title}</td>
                          <td className={`px-4 py-3 text-sm ${sel ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}>{job.designation}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-between text-xs text-gray-400 dark:text-gray-500">
                <span>{jobSearch.trim() ? `${filteredJobs.length} result${filteredJobs.length !== 1 ? "s" : ""} for "${jobSearch}"` : `${jobOpenings.length} job opening${jobOpenings.length !== 1 ? "s" : ""}`}</span>
                {form.jobCode && <span className="text-blue-500 dark:text-blue-400 font-medium">✓ {form.jobCode} selected</span>}
              </div>
            </div>

            {/* Selected job preview */}
            {form.jobCode && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/30">
                {[["Job Code", form.jobCode], ["Title", form.jobTitle], ["Designation", form.jobDesignation]].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-xs font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{val || "—"}</p>
                  </div>
                ))}
              </div>
            )}
          </StepCard>
        )}

        {/* ─────────────────── STEP 2: Screening / HR Tools ─────────── */}
        {currentStep === 2 && (
          <StepCard icon={ClipboardList} title="Screening / HR Tools" desc="Recruiter assignment, rating and remarks">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">

              <div>
                <FieldLabel htmlFor="assignedRecruiterId">Assigned Recruiter</FieldLabel>
                <SelectField icon={User} id="assignedRecruiterId" name="assignedRecruiterId" value={form.assignedRecruiterId} onChange={handleChange}>
                  <option value="">Select Recruiter</option>
                  {hrUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}{String(u.id) === String(loggedInUser?.id) ? " (You)" : ""}
                    </option>
                  ))}
                </SelectField>
                {!hrLoading && hrUsers.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">No HR recruiters found.</p>
                )}
              </div>

              <div>
                <FieldLabel htmlFor="hrRating">HR Rating</FieldLabel>
                <SelectField id="hrRating" name="hrRating" value={form.hrRating} onChange={handleChange}>
                  <option value="">Select Rating</option>
                  {[1, 2, 3, 4, 5].map((r) => <option key={r} value={r}>{"⭐".repeat(r)} {r}/5</option>)}
                </SelectField>
              </div>

              <div className="lg:col-span-3">
                <FieldLabel htmlFor="remarks">Remarks</FieldLabel>
                <textarea id="remarks" name="remarks" value={form.remarks} onChange={handleChange}
                  placeholder="Any notes or remarks about this candidate…" rows={4}
                  className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm
                             text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800
                             placeholder-gray-400 dark:placeholder-gray-500 resize-none
                             focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition" />
              </div>
            </div>
          </StepCard>
        )}

        {/* ─────────────────── STEP 3: Exam Info ───────────────────── */}
        {currentStep === 3 && (
          <StepCard icon={GraduationCap} title="Assign Exam" desc="Select the exam to assign to this candidate">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

              <div className="md:col-span-2">
                <FieldLabel htmlFor="examId">Exam</FieldLabel>
                <SelectField icon={GraduationCap} id="examId" name="examId" value={form.examId} onChange={handleChange}>
                  <option value="">Select Exam</option>
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.name}{exam.totalQuestions ? ` • ${exam.totalQuestions} Q` : ""}{exam.duration ? ` • ${exam.duration} mins` : ""}
                    </option>
                  ))}
                </SelectField>
                {!form.examId && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">Leave blank if you don't want to assign an exam yet.</p>}
              </div>

              {/* Exam preview */}
              {selectedExam && (
                <div className="md:col-span-2">
                  <div className="p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/30">
                    <p className="text-xs font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wider mb-2">Selected Exam</p>
                    <p className="text-base font-bold text-blue-700 dark:text-blue-300 mb-2">{selectedExam.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedExam.totalQuestions && (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {selectedExam.totalQuestions} Questions
                        </span>
                      )}
                      {selectedExam.duration && (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {selectedExam.duration} Minutes
                        </span>
                      )}
                      {selectedExam.positiveMarking && (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          +{selectedExam.positiveMarking} Positive
                        </span>
                      )}
                      {selectedExam.negativeMarking && (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                          -{selectedExam.negativeMarking} Negative
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {exams.length === 0 && (
                <div className="md:col-span-2 p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-sm text-amber-700 dark:text-amber-300">
                  No exams available. Please create an exam first.
                </div>
              )}
            </div>
          </StepCard>
        )}

        {/* ── Bottom Navigation ── */}
        <div className="mt-5">
          <FormActionButtons
            loading={loading} isSubmitting={isSubmitting} isEditMode={isEditMode}
            currentStep={currentStep} totalSteps={STEPS.length}
            isLastStep={currentStep === STEPS.length - 1}
            isFormValid={isFormValid()} hideSubmit={false}
            // onPrevious={() => setCurrentStep((p) => p - 1)}
            onNext={() => setCurrentStep((p) => p + 1)}
            onSubmitClick={() => { }}
          />
        </div>

      </form>
    </div>
  );
};

export default CandidateForm;
