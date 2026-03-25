import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import SkeletonForm from "../../../components/skeletons/skeletonForm";
import FormActionButtons from "../../../components/common/FormActionButtons";
import { getModulePathByMenu } from "../../../utils/navigation";
import {
  createExam,
  updateExam,
  fetchExamById,
} from "../../../features/Exams/examSlice";
import { fetchAllDepartments } from "../../../features/department/departmentSlice";
import { fetchAllLevels } from "../../../features/level/levelSlice";
import { fetchSubjectsByDepartment } from "../../../features/subject/subjectSlice";
import axiosInstance from "../../../api/axiosInstance";

const initialFormData = {
  name: "",
  departmentId: "",
  levelId: "",
  positiveMarking: 1,
  negativeMarking: 0,
  isActive: true,
  questionIds: [],
};

const steps = ["Basic Info", "Add Questions", "Random Questions"];

// ─── Skeleton card shown while fetching questions ───────────────────────────
const QuestionSkeletonCard = () => (
  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-800 animate-pulse">
    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
    <div className="flex justify-between items-center">
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12" />
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-10" />
    </div>
  </div>
);

// ─── Inline spinner icon ─────────────────────────────────────────────────────
const Spinner = ({ size = "sm", color = "white" }) => {
  const sizeClass = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const colorClass = color === "white" ? "text-white" : "text-purple-600";
  return (
    <svg
      className={`${sizeClass} animate-spin ${colorClass}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
};

// ─── Question details block (shared by manual + random lists) ────────────────
const QuestionDetails = ({ q }) => (
  <div className="p-3 pt-0 text-sm space-y-1">
    {q.questionType === "JOURNAL_ENTRY" ? (
      q.options.map((opt, idx) => (
        <div
          key={idx}
          className={`px-2 py-1 rounded-md text-xs font-mono ${String(idx) === String(q.correct)
            ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium"
            : "text-gray-600 dark:text-gray-400"
            }`}
        >
          <span className="font-semibold mr-2">Option {idx + 1}:</span>
          {opt?.drLines?.map((l, i) => (
            <span key={i} className="block pl-2">{l.account} Dr — {l.amount}</span>
          ))}
          {opt?.crLines?.map((l, i) => (
            <span key={i} className="block pl-6">To {l.account} — {l.amount}</span>
          ))}
        </div>
      ))
    ) : (
      q.options.map((opt, idx) => (
        <p
          key={idx}
          className={`px-2 py-1 rounded-md text-xs ${String(opt).trim() === String(q.correct).trim()
            ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium"
            : "text-gray-600 dark:text-gray-400"
            }`}
        >
          {opt}
        </p>
      ))
    )}
  </div>
);

// ─── Reusable collapsible question row ──────────────────────────────────────
const QuestionRow = ({ q, index, onRemove, hoverColor = "blue" }) => (
  <details
    key={q.id}
    className="group border-b border-gray-200 dark:border-gray-700"
  >
    <summary
      className={`flex justify-between items-center cursor-pointer select-none p-3 hover:bg-${hoverColor}-50 dark:hover:bg-gray-800 transition-all duration-150`}
    >
      <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
        {index + 1}. {q.question}
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(q.id); }}
          className="text-red-500 text-[11px] font-semibold px-2 py-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
        >
          Remove
        </button>
        <svg
          className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform"
          xmlns="http://www.w3.org/2000/svg"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </summary>
    <QuestionDetails q={q} />
  </details>
);

// ────────────────────────────────────────────────────────────────────────────
const ExamForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const { selected: examData, loading } = useSelector((s) => s.exam);
  const departments = useSelector((s) => s.department.list);
  const levels = useSelector((s) => s.level.list);
  const { list: subjectsByDept, loading: subjectLoading } = useSelector((s) => s.subjects);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingQuestions, setIsFetchingQuestions] = useState(false);   // ✅ manual fetch loader
  const [isFetchingRandom, setIsFetchingRandom] = useState(false);         // ✅ random fetch loader

  const [formData, setFormData] = useState(initialFormData);
  const [initialValues, setInitialValues] = useState(initialFormData);
  const [currentStep, setCurrentStep] = useState(0);
  const [questionBank, setQuestionBank] = useState([]);
  const [manuallySelectedQuestions, setManuallySelectedQuestions] = useState([]);
  const [randomSelectedQuestions, setRandomSelectedQuestions] = useState([]);

  const [questionFilters, setQuestionFilters] = useState({
    questionDepartmentId: "",
    subjectId: "",
    levelId: "",
    count: "",
  });

  const [randomConfig, setRandomConfig] = useState({
    count: "",
    levelId: "",
    subjectId: "",
  });

  const [randomSubjects, setRandomSubjects] = useState([]);
  const [randomSubjectsLoading, setRandomSubjectsLoading] = useState(false);

  const modules = useSelector((s) => s.modules.list);
  const menus = useSelector((s) => s.menus.list);
  const modulePath = getModulePathByMenu("exam_management", modules, menus);

  // ── Initial data load ──────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchAllDepartments());
    dispatch(fetchAllLevels());
  }, [dispatch]);

  // ── Subjects for manual section ───────────────────────────────────────────
  useEffect(() => {
    if (questionFilters.questionDepartmentId) {
      dispatch(fetchSubjectsByDepartment(questionFilters.questionDepartmentId));
    }
  }, [questionFilters.questionDepartmentId, dispatch]);

  // ── Subjects for random section (based on exam departmentId) ──────────────
  useEffect(() => {
    if (!formData.departmentId) {
      setRandomSubjects([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setRandomSubjectsLoading(true);
      try {
        const res = await axiosInstance.get(
          `/subject/by-department/${formData.departmentId}`
        );
        if (!cancelled) setRandomSubjects(res.data?.subjects || res.data || []);
      } catch {
        if (!cancelled) setRandomSubjects([]);
      } finally {
        if (!cancelled) setRandomSubjectsLoading(false);
      }
    };
    load();
    setRandomConfig((prev) => ({ ...prev, subjectId: "" }));
    return () => { cancelled = true; };
  }, [formData.departmentId]);

  // ── Fetch exam in edit mode ───────────────────────────────────────────────
  useEffect(() => {
    if (isEditMode) dispatch(fetchExamById(id));
  }, [dispatch, id, isEditMode]);

  // ── Populate form in edit mode ────────────────────────────────────────────
  useEffect(() => {
    if (isEditMode && examData) {
      const loadedData = {
        name: examData.name || "",
        departmentId: examData.departmentId || "",
        levelId: examData.levelId || "",
        positiveMarking: examData.positiveMarking || 1,
        negativeMarking: examData.negativeMarking || 0,
        isActive: examData.isActive ?? true,
        questionIds: examData.questionIds || [],
      };
      setFormData(loadedData);
      setInitialValues(loadedData);
      setManuallySelectedQuestions(examData.questions || []);
      setRandomSelectedQuestions([]);
    }
  }, [examData, isEditMode]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getExcludedIds = useCallback(() =>
    new Set([
      ...manuallySelectedQuestions.map((q) => q.id),
      ...randomSelectedQuestions.map((q) => q.id),
    ]),
    [manuallySelectedQuestions, randomSelectedQuestions]
  );

  // ── Fetch manual questions ────────────────────────────────────────────────
  const fetchQuestions = async () => {
    if (!formData.departmentId) { toast.warn("Select exam department first"); return; }
    if (!questionFilters.questionDepartmentId || !questionFilters.subjectId) {
      toast.warn("Select department & subject"); return;
    }

    setIsFetchingQuestions(true);
    setQuestionBank([]); // clear old results immediately
    try {
      const params = {
        subjectId: questionFilters.subjectId,
        levelId: questionFilters.levelId || undefined,
        departmentId: questionFilters.questionDepartmentId,
        limit: Number(questionFilters.count) || 10,
      };
      const res = await axiosInstance.get("/exam/fetch-questions", { params });

      if (!res.data.questions?.length) { toast.info("No questions found"); return; }

      const excluded = getExcludedIds();
      const filtered = res.data.questions.filter((q) => !excluded.has(q.id));
      setQuestionBank(filtered);
      toast.success(`${filtered.length} questions fetched`);
    } catch {
      toast.error("Failed to fetch questions");
    } finally {
      setIsFetchingQuestions(false);
    }
  };

  // ── Fetch random questions ────────────────────────────────────────────────
  const fetchRandomQuestions = async () => {
    if (!formData.departmentId) { toast.warn("Select exam department first"); return; }
    if (!randomConfig.count || Number(randomConfig.count) <= 0) {
      toast.warn("Enter question count"); return;
    }

    setIsFetchingRandom(true);
    try {
      const params = {
        departmentId: formData.departmentId,
        levelId: randomConfig.levelId || undefined,
        subjectId: randomConfig.subjectId || undefined,
        limit: Number(randomConfig.count),
      };
      const res = await axiosInstance.get("/exam/random-questions", { params });

      if (!res.data.questions?.length) { toast.info("No random questions found"); return; }

      const excluded = getExcludedIds();
      const filtered = res.data.questions.filter((q) => !excluded.has(q.id));

      if (!filtered.length) { toast.info("All random questions already exist"); return; }

      setRandomSelectedQuestions((prev) => [...prev, ...filtered]);
      toast.success(`${filtered.length} random questions added`);
    } catch {
      toast.error("Failed to fetch random questions");
    } finally {
      setIsFetchingRandom(false);
    }
  };

  const addQuestion = useCallback((q) => {
    setManuallySelectedQuestions((prev) => {
      if (prev.find((x) => x.id === q.id)) return prev;
      if (randomSelectedQuestions.find((x) => x.id === q.id)) return prev;
      return [...prev, q];
    });
    // Also remove from bank so card disappears instantly
    setQuestionBank((prev) => prev.filter((x) => x.id !== q.id));
  }, [randomSelectedQuestions]);

  const removeQuestion = useCallback((qId) => {
    setManuallySelectedQuestions((prev) => prev.filter((q) => q.id !== qId));
    setRandomSelectedQuestions((prev) => prev.filter((q) => q.id !== qId));
  }, []);

  // ── Form handlers ─────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setQuestionFilters((prev) => ({ ...prev, [name]: value }));
  };

  const hasChanges = () => {
    const formChanged = Object.keys(formData).some((key) =>
      Array.isArray(formData[key])
        ? JSON.stringify(formData[key]) !== JSON.stringify(initialValues[key])
        : formData[key] !== initialValues[key]
    );
    const originalIds = (examData?.questions || []).map((q) => q.id);
    const currentIds = [
      ...manuallySelectedQuestions,
      ...randomSelectedQuestions,
    ].map((q) => q.id);
    return formChanged || JSON.stringify(originalIds) !== JSON.stringify(currentIds);
  };

  const isFormValid = () => {
    const ok =
      formData.name.trim() !== "" &&
      formData.departmentId !== "" &&
      formData.levelId !== "" &&
      formData.positiveMarking !== "" &&
      formData.negativeMarking !== "";
    return ok && (!isEditMode || hasChanges());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const allSelected = [...manuallySelectedQuestions, ...randomSelectedQuestions];
    if (!formData.name || !formData.departmentId || !formData.levelId || !allSelected.length) {
      toast.error("Please fill all required fields and add at least one question");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      ...formData,
      departmentId: Number(formData.departmentId),
      levelId: Number(formData.levelId),
      positiveMarking: Number(formData.positiveMarking),
      negativeMarking: Number(formData.negativeMarking),
      questionIds: allSelected.map((q) => ({ questionId: q.id })),
    };

    try {
      const action = isEditMode ? updateExam : createExam;
      const data = isEditMode ? { id, data: payload } : payload;
      await dispatch(action(data)).unwrap();
      toast.success(`Exam ${isEditMode ? "updated" : "created"} successfully`);
      navigate(`/module/${modulePath}/exam_management`);
    } catch (err) {
      toast.error(err?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <SkeletonForm />;

  const allSelectedCount = manuallySelectedQuestions.length + randomSelectedQuestions.length;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col flex-grow max-w-full pt-5 pr-5 pl-5 pb-2 bg-white dark:bg-gray-900 rounded-lg shadow-md"
        noValidate
      >
        {/* ── Header & step tabs ── */}
        <div>
          <div className="flex items-center justify-between border-b pb-3 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
              {isEditMode ? "Edit Exam" : "Create New Exam"}
            </h2>
            {/* ✅ Total questions badge */}
            {allSelectedCount > 0 && (
              <span className="text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-3 py-1 rounded-full">
                {allSelectedCount} question{allSelectedCount !== 1 ? "s" : ""} selected
              </span>
            )}
          </div>

          <div className="flex border-b border-gray-300 dark:border-gray-700 mb-6 overflow-x-auto">
            {steps.map((step, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentStep(index)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-all duration-200 rounded-t-md
                  ${currentStep === index
                    ? "border-blue-600 text-blue-600 dark:text-blue-300 dark:border-blue-400 bg-gray-100 dark:bg-gray-800"
                    : "border-transparent text-gray-500 dark:text-gray-300 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
              >
                {step}
                {/* ✅ Small count badge on step tabs */}
                {index === 1 && manuallySelectedQuestions.length > 0 && (
                  <span className="ml-1.5 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {manuallySelectedQuestions.length}
                  </span>
                )}
                {index === 2 && randomSelectedQuestions.length > 0 && (
                  <span className="ml-1.5 bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {randomSelectedQuestions.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-grow overflow-auto">

          {/* ══ Step 1 — Basic Info ══════════════════════════════════════════ */}
          {currentStep === 0 && (
            <section className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-700 dark:text-white border-b pb-2">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Exam Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Aptitude Test"
                    className="block w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:bg-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Exam Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleChange}
                    required
                    className="block w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:bg-gray-900"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Exam Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="levelId"
                    value={formData.levelId}
                    onChange={handleChange}
                    required
                    className="block w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:bg-gray-900"
                  >
                    <option value="">Select Level</option>
                    {levels.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Positive Marks <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="positiveMarking"
                    value={formData.positiveMarking}
                    onChange={handleChange}
                    min="0"
                    className="block w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:bg-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Negative Marks <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="negativeMarking"
                    value={formData.negativeMarking}
                    onChange={handleChange}
                    min="0"
                    className="block w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:bg-gray-900"
                  />
                </div>

                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-5 h-5"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">Active?</label>
                </div>
              </div>
            </section>
          )}

          {/* ══ Step 2 — Manual Questions ════════════════════════════════════ */}
          {currentStep === 1 && (
            <section className="space-y-4">
              <h3 className="text-xl font-semibold border-b pb-2">
                {isEditMode ? "Edit Questions" : "Add Questions"}
              </h3>

              {/* Filters */}
              <div className="flex flex-wrap gap-4 items-end mb-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Questions Department</label>
                  <select
                    value={questionFilters.questionDepartmentId || ""}
                    onChange={(e) =>
                      setQuestionFilters((prev) => ({
                        ...prev,
                        questionDepartmentId: e.target.value,
                        subjectId: "",
                      }))
                    }
                    className="w-full border px-2 py-1.5 rounded text-sm"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Subject</label>
                  <select
                    name="subjectId"
                    value={questionFilters.subjectId}
                    onChange={handleFilterChange}
                    disabled={!questionFilters.questionDepartmentId || subjectLoading}
                    className="w-full border px-2 py-1.5 rounded text-sm"
                  >
                    <option value="">
                      {subjectLoading ? "Loading..." : "Select Subject"}
                    </option>
                    {subjectsByDept.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Question Level</label>
                  <select
                    name="levelId"
                    value={questionFilters.levelId}
                    onChange={handleFilterChange}
                    className="rounded-md border px-2 py-1 text-sm"
                  >
                    <option value="">Select Level</option>
                    {levels.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">No. of Questions</label>
                  <input
                    type="number"
                    name="count"
                    value={questionFilters.count}
                    onChange={handleFilterChange}
                    min="1"
                    placeholder="e.g. 10"
                    className="rounded-md border px-2 py-1 text-sm w-24"
                  />
                </div>

                {/* ✅ Fetch button with spinner */}
                <button
                  type="button"
                  onClick={fetchQuestions}
                  disabled={isFetchingQuestions}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-md text-sm transition-colors"
                >
                  {isFetchingQuestions ? (
                    <><Spinner /> Fetching...</>
                  ) : (
                    "Fetch Questions"
                  )}
                </button>
              </div>

              {/* ✅ Question Bank — skeleton while loading, cards when done */}
              <div className="max-h-[400px] overflow-y-auto border rounded-md p-2 bg-gray-50 dark:bg-gray-900 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {isFetchingQuestions ? (
                  // Show 6 skeleton cards
                  Array.from({ length: 6 }).map((_, i) => (
                    <QuestionSkeletonCard key={i} />
                  ))
                ) : questionBank.length === 0 ? (
                  <p className="col-span-3 text-center text-sm text-gray-400 py-8">
                    No questions fetched yet. Use filters above and click "Fetch Questions".
                  </p>
                ) : (
                  questionBank.map((q) => (
                    <div
                      key={q.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-1 line-clamp-2">
                        {q.question}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {q.level?.name || q.level || "—"}
                        </span>
                        <button
                          type="button"
                          onClick={() => addQuestion(q)}
                          className="px-2 py-0.5 rounded text-xs bg-green-600 hover:bg-green-700 text-white transition"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Manually selected questions list */}
              {manuallySelectedQuestions.length > 0 && (
                <>
                  <h4 className="font-semibold mt-6 mb-3 text-blue-700 text-sm uppercase tracking-wide">
                    📝 Manually Added Questions ({manuallySelectedQuestions.length})
                  </h4>
                  <div className="max-h-[450px] overflow-y-auto border rounded-lg bg-white dark:bg-gray-900 shadow-sm">
                    {manuallySelectedQuestions.map((q, index) => (
                      <QuestionRow
                        key={q.id}
                        q={q}
                        index={index}
                        onRemove={removeQuestion}
                        hoverColor="blue"
                      />
                    ))}
                  </div>
                </>
              )}
            </section>
          )}

          {/* ══ Step 3 — Random Questions ════════════════════════════════════ */}
          {currentStep === 2 && (
            <section className="space-y-4">
              <div className="flex flex-wrap gap-4 items-end mb-4">

                {/* Subject dropdown */}
                <div>
                  <label className="block text-xs font-medium mb-1">Subject</label>
                  <select
                    value={randomConfig.subjectId}
                    onChange={(e) =>
                      setRandomConfig((prev) => ({ ...prev, subjectId: e.target.value }))
                    }
                    disabled={!formData.departmentId || randomSubjectsLoading}
                    className="rounded-md border px-2 py-1 text-sm min-w-[160px]"
                  >
                    <option value="">
                      {randomSubjectsLoading
                        ? "Loading subjects..."
                        : !formData.departmentId
                          ? "Select exam dept first"
                          : "Any Subject"}
                    </option>
                    {randomSubjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Level dropdown */}
                <div>
                  <label className="block text-xs font-medium mb-1">Level</label>
                  <select
                    value={randomConfig.levelId}
                    onChange={(e) =>
                      setRandomConfig((prev) => ({ ...prev, levelId: e.target.value }))
                    }
                    className="rounded-md border px-2 py-1 text-sm"
                  >
                    <option value="">Any Level</option>
                    {levels.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                {/* Count input */}
                <div>
                  <label className="block text-xs font-medium mb-1">No. of Questions</label>
                  <input
                    type="number"
                    value={randomConfig.count}
                    onChange={(e) =>
                      setRandomConfig((prev) => ({ ...prev, count: e.target.value }))
                    }
                    min="1"
                    placeholder="e.g. 5"
                    className="rounded-md border px-2 py-1 text-sm w-24"
                  />
                </div>

                {/* ✅ Add Random button with spinner */}
                <button
                  type="button"
                  onClick={fetchRandomQuestions}
                  disabled={isFetchingRandom}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-md text-sm transition-colors"
                >
                  {isFetchingRandom ? (
                    <><Spinner /> Adding...</>
                  ) : (
                    "Add Random Questions"
                  )}
                </button>
              </div>

              {/* ✅ Loading overlay for random section */}
              {isFetchingRandom && (
                <div className="flex items-center gap-3 px-4 py-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg text-purple-700 dark:text-purple-300 text-sm">
                  <Spinner size="sm" color="purple" />
                  <span>Fetching random questions, please wait...</span>
                </div>
              )}

              {/* Randomly selected questions list */}
              {randomSelectedQuestions.length > 0 && (
                <>
                  <h4 className="font-semibold mt-6 mb-3 text-purple-700 text-sm uppercase tracking-wide">
                    🎲 Randomly Added Questions ({randomSelectedQuestions.length})
                  </h4>
                  <div className="max-h-[450px] overflow-y-auto border rounded-lg bg-white dark:bg-gray-900 shadow-sm">
                    {randomSelectedQuestions.map((q, index) => (
                      <QuestionRow
                        key={q.id}
                        q={q}
                        index={index}
                        onRemove={removeQuestion}
                        hoverColor="purple"
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Empty state */}
              {!isFetchingRandom && randomSelectedQuestions.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-8">
                  No random questions added yet. Configure above and click "Add Random Questions".
                </p>
              )}
            </section>
          )}
        </div>

        <FormActionButtons
          loading={loading}
          isSubmitting={isSubmitting}
          isEditMode={isEditMode}
          currentStep={currentStep}
          totalSteps={steps.length}
          isLastStep={currentStep === steps.length - 1}
          isFormValid={isFormValid()}
          hideSubmit={false}
          onPrevious={() => setCurrentStep((p) => p - 1)}
          onNext={() => setCurrentStep((p) => p + 1)}
          onSubmitClick={() => { }}
        />
      </form>
    </div>
  );
};

export default ExamForm;
