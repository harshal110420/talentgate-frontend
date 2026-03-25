import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createQuestion,
  updateQuestion,
  getQuestionById,
  clearSelectedQuestion,
} from "../../../features/questions/questionsSlice";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchAllSubjects } from "../../../features/subject/subjectSlice";
import { fetchAllLevels } from "../../../features/level/levelSlice";
import { fetchAllDepartments } from "../../../features/department/departmentSlice";
import { getModulePathByMenu } from "../../../utils/navigation";
import SkeletonForm from "../../../components/skeletons/skeletonForm";
import { fetchSubjectsByDepartment } from "../../../features/subject/subjectSlice";
import FormActionButtons from "../../../components/common/FormActionButtons";

// ─── Constants ───────────────────────────────────────────────
const QUESTION_TYPES = [
  { value: "MCQ", label: "MCQ (Multiple Choice)" },
  { value: "PASSAGE", label: "Passage Based" },
  { value: "JOURNAL_ENTRY", label: "Journal Entry" },
  { value: "FILL_IN_BLANK", label: "Fill in the Blank" },
];

const emptyJournalOption = () => ({
  drLines: [{ account: "", amount: "" }],
  crLines: [{ account: "", amount: "" }],
});

const initialJournalOptions = () => [
  emptyJournalOption(),
  emptyJournalOption(),
  emptyJournalOption(),
  emptyJournalOption(),
];

const initialFormData = {
  question: "",
  options: ["", "", "", ""],
  correct: "",
  timeLimit: "",
  subjectId: "",
  levelId: "",
  departmentId: "",
  isActive: true,
  questionType: "MCQ",
  metadata: null,
  // Passage helper fields
  passageContent: "",
  passageTitle: "",
  passageGroupId: "",
  // Journal options (structured)
  journalOptions: initialJournalOptions(),
};

const steps = ["Basic Info"];

const QuestionForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const { selectedQuestion, loading } = useSelector((state) => state.questions);
  const levels = useSelector((state) => state.level?.list || []);
  const departments = useSelector((state) => state.department?.list || []);
  const modules = useSelector((state) => state.modules.list);
  const menus = useSelector((state) => state.menus.list);
  const modulePath = getModulePathByMenu("question_management", modules, menus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { list: subjectsByDept, loading: subjectLoading } = useSelector(
    (state) => state.subjects
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState(initialFormData);
  const [initialValues, setInitialValues] = useState(initialFormData);

  useEffect(() => {
    dispatch(fetchAllSubjects());
    dispatch(fetchAllLevels());
    dispatch(fetchAllDepartments());
  }, [dispatch]);

  useEffect(() => {
    if (id) dispatch(getQuestionById(id));
    return () => dispatch(clearSelectedQuestion());
  }, [id, dispatch]);

  // Edit mode load
  useEffect(() => {
    if (selectedQuestion && id) {
      const qType = selectedQuestion.questionType || "MCQ";
      const meta = selectedQuestion.metadata || null;

      // Journal options load — check if options are structured
      let loadedJournalOptions = initialJournalOptions();
      if (qType === "JOURNAL_ENTRY" && Array.isArray(selectedQuestion.options)) {
        const isStructured = selectedQuestion.options[0]?.drLines !== undefined;
        if (isStructured) {
          loadedJournalOptions = selectedQuestion.options;
        }
      }

      const loadedData = {
        question: selectedQuestion.question || "",
        options: qType === "JOURNAL_ENTRY" ? ["", "", "", ""] : (selectedQuestion.options || ["", "", "", ""]),
        correct: selectedQuestion.correct || "",
        timeLimit: selectedQuestion.timeLimit || "",
        subjectId: selectedQuestion.subjectId || "",
        levelId: selectedQuestion.levelId || "",
        departmentId: selectedQuestion.departmentId || "",
        isActive: typeof selectedQuestion.isActive === "boolean" ? selectedQuestion.isActive : true,
        questionType: qType,
        metadata: meta,
        passageContent: qType === "PASSAGE" ? meta?.passage?.content || "" : "",
        passageTitle: qType === "PASSAGE" ? meta?.passage?.title || "" : "",
        passageGroupId: qType === "PASSAGE" ? meta?.passage?.passageGroupId || "" : "",
        journalOptions: loadedJournalOptions,
      };
      setForm(loadedData);
      setInitialValues(loadedData);
    }
  }, [selectedQuestion, id]);

  useEffect(() => {
    if (form.departmentId) {
      dispatch(fetchSubjectsByDepartment(form.departmentId));
    }
  }, [form.departmentId, dispatch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleQuestionTypeChange = (e) => {
    const newType = e.target.value;
    setForm((prev) => ({
      ...prev,
      questionType: newType,
      correct: "",
      passageContent: "",
      passageTitle: "",
      passageGroupId: "",
      journalOptions: initialJournalOptions(),
      options: ["", "", "", ""],
      metadata: null,
    }));
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...form.options];
    updatedOptions[index] = value;
    setForm((prev) => ({ ...prev, options: updatedOptions, correct: "" }));
  };

  // ─── Journal Option Handlers ──────────────────────────────
  const handleJournalOptDrChange = (optIdx, lineIdx, field, value) => {
    const updated = form.journalOptions.map((opt, i) =>
      i !== optIdx ? opt : {
        ...opt,
        drLines: opt.drLines.map((line, j) =>
          j === lineIdx ? { ...line, [field]: value } : line
        ),
      }
    );
    setForm((p) => ({ ...p, journalOptions: updated }));
  };

  const handleJournalOptCrChange = (optIdx, lineIdx, field, value) => {
    const updated = form.journalOptions.map((opt, i) =>
      i !== optIdx ? opt : {
        ...opt,
        crLines: opt.crLines.map((line, j) =>
          j === lineIdx ? { ...line, [field]: value } : line
        ),
      }
    );
    setForm((p) => ({ ...p, journalOptions: updated }));
  };

  const addJournalOptDrLine = (optIdx) => {
    const updated = form.journalOptions.map((opt, i) =>
      i === optIdx ? { ...opt, drLines: [...opt.drLines, { account: "", amount: "" }] } : opt
    );
    setForm((p) => ({ ...p, journalOptions: updated }));
  };

  const addJournalOptCrLine = (optIdx) => {
    const updated = form.journalOptions.map((opt, i) =>
      i === optIdx ? { ...opt, crLines: [...opt.crLines, { account: "", amount: "" }] } : opt
    );
    setForm((p) => ({ ...p, journalOptions: updated }));
  };

  const removeJournalOptDrLine = (optIdx, lineIdx) => {
    const updated = form.journalOptions.map((opt, i) =>
      i === optIdx && opt.drLines.length > 1
        ? { ...opt, drLines: opt.drLines.filter((_, j) => j !== lineIdx) }
        : opt
    );
    setForm((p) => ({ ...p, journalOptions: updated }));
  };

  const removeJournalOptCrLine = (optIdx, lineIdx) => {
    const updated = form.journalOptions.map((opt, i) =>
      i === optIdx && opt.crLines.length > 1
        ? { ...opt, crLines: opt.crLines.filter((_, j) => j !== lineIdx) }
        : opt
    );
    setForm((p) => ({ ...p, journalOptions: updated }));
  };

  // ─── Validation ───────────────────────────────────────────
  const hasChanges = () => {
    return Object.keys(form).some((key) => {
      if (Array.isArray(form[key])) {
        return JSON.stringify(form[key]) !== JSON.stringify(initialValues[key]);
      }
      return form[key] !== initialValues[key];
    });
  };

  const isFormValid = () => {
    const base =
      form.question.trim() !== "" &&
      form.correct !== "" &&
      form.timeLimit !== "" &&
      form.subjectId !== "" &&
      form.levelId !== "" &&
      form.departmentId !== "";

    if (!base) return false;

    if (form.questionType === "PASSAGE") {
      if (!form.passageContent.trim() || !form.passageGroupId.trim()) return false;
    }

    if (form.questionType === "JOURNAL_ENTRY") {
      const hasData = form.journalOptions.some((opt) =>
        opt.drLines.some((l) => l.account.trim() !== "") ||
        opt.crLines.some((l) => l.account.trim() !== "")
      );
      if (!hasData) return false;
    }

    return !isEditMode || hasChanges();
  };

  // ─── Build metadata ───────────────────────────────────────
  const buildMetadata = () => {
    if (form.questionType === "PASSAGE") {
      return {
        passage: {
          title: form.passageTitle.trim() || null,
          content: form.passageContent.trim(),
          passageGroupId: form.passageGroupId.trim(),
        },
      };
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const payload = {
      question: form.question,
      options: form.questionType === "JOURNAL_ENTRY" ? form.journalOptions : form.options,
      correct: form.correct,
      timeLimit: parseInt(form.timeLimit),
      subjectId: form.subjectId,
      levelId: form.levelId,
      departmentId: form.departmentId,
      isActive: form.isActive,
      questionType: form.questionType,
      metadata: buildMetadata(),
    };

    try {
      if (id) {
        await dispatch(updateQuestion({ id, ...payload })).unwrap();
        toast.success("Question updated successfully");
      } else {
        await dispatch(createQuestion(payload)).unwrap();
        toast.success("Question created successfully");
        setForm(initialFormData);
      }
      navigate(`/module/${modulePath}/question_management`);
    } catch (err) {
      toast.error(err || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <SkeletonForm />;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col flex-grow max-w-full pt-5 pr-5 pl-5 pb-2 bg-white dark:bg-gray-900 rounded-lg shadow-md"
        noValidate
      >
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 border-b pb-3 mb-6">
          {isEditMode ? "Edit Question" : "Create New Question"}
        </h2>

        {/* Steps Tabs */}
        <div className="flex border-b border-gray-300 dark:border-gray-700 mb-6 overflow-x-auto">
          {steps.map((step, index) => (
            <button key={index} type="button" onClick={() => setCurrentStep(index)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-all duration-200 rounded-t-md focus:outline-none
                ${currentStep === index
                  ? "border-blue-600 text-blue-600 dark:text-blue-300 dark:border-blue-400 bg-gray-100 dark:bg-gray-800"
                  : "border-transparent text-gray-500 dark:text-gray-300 hover:text-blue-500"}`}
            >
              {step}
            </button>
          ))}
        </div>

        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-white border-b pb-2">
            Basic Information
          </h3>

          {/* Department, Subject, Level */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                Department <span className="text-red-500">*</span>
              </label>
              <select name="departmentId" value={form.departmentId} onChange={handleChange} required
                className="w-full border px-2 py-1.5 text-sm rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <select name="subjectId" value={form.subjectId} onChange={handleChange} required
                disabled={!form.departmentId || subjectLoading}
                className="w-full border px-2 py-1.5 text-sm rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Subject</option>
                {subjectsByDept.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                Level <span className="text-red-500">*</span>
              </label>
              <select name="levelId" value={form.levelId} onChange={handleChange} required
                className="w-full border px-2 py-1.5 text-sm rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Level</option>
                {levels.map((lvl) => <option key={lvl.id} value={lvl.id}>{lvl.name}</option>)}
              </select>
            </div>
          </div>

          {/* Question Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                Question Type <span className="text-red-500">*</span>
              </label>
              <select name="questionType" value={form.questionType} onChange={handleQuestionTypeChange}
                className="w-full border px-2 py-1.5 text-sm rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {QUESTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* PASSAGE UI */}
          {form.questionType === "PASSAGE" && (
            <div className="border border-blue-200 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-950 space-y-3">
              <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">📄 Passage Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                    Passage Title <span className="text-gray-400">(optional)</span>
                  </label>
                  <input type="text" name="passageTitle" value={form.passageTitle} onChange={handleChange}
                    placeholder="e.g. The Importance of Reading"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                    Passage Group ID <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="passageGroupId" value={form.passageGroupId} onChange={handleChange}
                    placeholder="e.g. passage_english_001"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
                  <p className="text-xs text-gray-400 mt-1">Provide same ID for all questions in the same passage.</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                  Passage Content <span className="text-red-500">*</span>
                </label>
                <textarea name="passageContent" value={form.passageContent} onChange={handleChange} rows={6}
                  placeholder="Type or paste the passage content here..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
              </div>
            </div>
          )}

          {/* Question Text */}
          <div>
            <label className="block font-medium text-sm text-gray-700 dark:text-white mb-1">
              {form.questionType === "PASSAGE" ? "Question (based on above passage)" : "Question"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <textarea name="question" value={form.question} onChange={handleChange} required rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
          </div>

          {/* ─── JOURNAL ENTRY Options UI ─── */}
          {form.questionType === "JOURNAL_ENTRY" ? (
            <div className="space-y-4">
              <label className="block font-medium text-sm text-gray-700 dark:text-white">
                Journal Entry Options <span className="text-red-500">*</span>
              </label>
              {form.journalOptions.map((opt, optIdx) => (
                <div key={optIdx}
                  className={`border rounded-lg p-4 space-y-3 transition-all ${form.correct === String(optIdx)
                    ? "border-green-400 bg-green-50 dark:bg-green-950"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                    }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700 dark:text-white">
                      Option {optIdx + 1}
                    </span>
                    {form.correct === String(optIdx) && (
                      <span className="text-xs bg-green-100 text-green-700 border border-green-300 px-2 py-0.5 rounded-full font-semibold">
                        ✓ Correct
                      </span>
                    )}
                  </div>

                  {/* Dr Lines */}
                  <div>
                    <p className="text-xs font-semibold text-red-600 mb-2">Dr Side (Debit)</p>
                    {opt.drLines.map((line, lineIdx) => (
                      <div key={lineIdx} className="flex gap-2 mb-2 items-center">
                        <input type="text" placeholder="Account name (e.g. Bank A/c)"
                          value={line.account}
                          onChange={(e) => handleJournalOptDrChange(optIdx, lineIdx, "account", e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-red-400" />
                        <input type="text" placeholder="Amount"
                          value={line.amount}
                          onChange={(e) => handleJournalOptDrChange(optIdx, lineIdx, "amount", e.target.value)}
                          className="w-28 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-1 focus:ring-red-400" />
                        <button type="button" onClick={() => removeJournalOptDrLine(optIdx, lineIdx)}
                          disabled={opt.drLines.length <= 1}
                          className="text-red-400 hover:text-red-600 text-lg font-bold px-1 disabled:opacity-30">✕</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addJournalOptDrLine(optIdx)}
                      className="text-xs text-red-600 hover:underline font-medium">+ Add Dr Line</button>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-600" />

                  {/* Cr Lines */}
                  <div>
                    <p className="text-xs font-semibold text-blue-600 mb-2">Cr Side (Credit)</p>
                    {opt.crLines.map((line, lineIdx) => (
                      <div key={lineIdx} className="flex gap-2 mb-2 items-center">
                        <input type="text" placeholder="Account name (e.g. To Cash A/c)"
                          value={line.account}
                          onChange={(e) => handleJournalOptCrChange(optIdx, lineIdx, "account", e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                        <input type="text" placeholder="Amount"
                          value={line.amount}
                          onChange={(e) => handleJournalOptCrChange(optIdx, lineIdx, "amount", e.target.value)}
                          className="w-28 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-400" />
                        <button type="button" onClick={() => removeJournalOptCrLine(optIdx, lineIdx)}
                          disabled={opt.crLines.length <= 1}
                          className="text-red-400 hover:text-red-600 text-lg font-bold px-1 disabled:opacity-30">✕</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addJournalOptCrLine(optIdx)}
                      className="text-xs text-blue-600 hover:underline font-medium">+ Add Cr Line</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Normal MCQ / PASSAGE / FILL_IN_BLANK options */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {form.options.map((opt, idx) => (
                <div key={idx}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                    Option {idx + 1} <span className="text-red-500">*</span>
                  </label>
                  <textarea value={opt} onChange={(e) => handleOptionChange(idx, e.target.value)} required rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
                </div>
              ))}
            </div>
          )}

          {/* Correct Answer + Time Limit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-sm text-gray-700 dark:text-white mb-1">
                Correct Answer <span className="text-red-500">*</span>
              </label>
              <select name="correct" value={form.correct} onChange={handleChange} required
                className="w-full border px-2 py-1.5 text-sm rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select correct option</option>
                {form.questionType === "JOURNAL_ENTRY"
                  ? form.journalOptions.map((_, idx) => (
                    <option key={idx} value={String(idx)}>Option {idx + 1}</option>
                  ))
                  : form.options.map((opt, idx) => (
                    <option key={idx} value={String(idx)}>{opt ? `Option ${idx + 1}: ${opt}` : `Option ${idx + 1}`}</option>
                  ))
                }
              </select>
            </div>
            <div>
              <label className="block font-medium text-sm text-gray-700 dark:text-white mb-1">
                Time Limit (seconds) <span className="text-red-500">*</span>
              </label>
              <input type="number" name="timeLimit" value={form.timeLimit} onChange={handleChange} required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex items-center space-x-2 pt-3">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange}
                className="h-4 w-4 border-gray-300 rounded text-green-600" />
              <label className="text-sm text-gray-700 dark:text-white">Active Question</label>
            </div>
          </div>
        </section>

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

export default QuestionForm;