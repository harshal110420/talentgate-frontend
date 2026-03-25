import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getQuestionById,
  clearSelectedQuestion,
} from "../../../features/questions/questionsSlice";
import { useParams, useNavigate } from "react-router-dom";
import SkeletonPage from "../../../components/skeletons/skeletonPage";
import { ArrowLeft } from "lucide-react";
import { getModulePathByMenu } from "../../../utils/navigation";

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

// ─── Journal Option Renderer ──────────────────────────────────
const JournalOptionView = ({ opt, isCorrect, index }) => (
  <div className={`rounded-xl p-4 border transition-all duration-200 ${isCorrect
      ? "border-green-500 bg-green-50 dark:bg-green-900/30 dark:border-green-400"
      : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
    }`}>
    <div className="flex justify-between items-start mb-2">
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
        Option {index + 1}
      </span>
      {isCorrect && (
        <span className="text-green-600 dark:text-green-400 font-semibold text-sm">
          ✓ Correct
        </span>
      )}
    </div>
    {/* Dr Lines */}
    {opt.drLines?.map((line, i) => (
      <div key={i} style={{
        display: "grid",
        gridTemplateColumns: "1fr 40px 80px",
        fontFamily: "monospace",
        fontSize: 13,
        lineHeight: 1.9,
      }}>
        <span className="text-gray-800 dark:text-gray-200">{line.account}</span>
        <span className="text-red-600 font-bold text-xs">Dr</span>
        <span className="text-gray-800 dark:text-gray-200 font-semibold text-right">{line.amount}</span>
      </div>
    ))}
    {/* Cr Lines — indented */}
    {opt.crLines?.map((line, i) => (
      <div key={i} style={{
        display: "grid",
        gridTemplateColumns: "1fr 40px 80px",
        paddingLeft: 20,
        fontFamily: "monospace",
        fontSize: 13,
        lineHeight: 1.9,
      }}>
        <span className="text-blue-700 dark:text-blue-400">To {line.account}</span>
        <span className="text-blue-600 font-bold text-xs">Cr</span>
        <span className="text-gray-800 dark:text-gray-200 font-semibold text-right">{line.amount}</span>
      </div>
    ))}
  </div>
);

const QuestionDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { selectedQuestion, loading } = useSelector((state) => state.questions);
  const modules = useSelector((state) => state.modules.list);
  const menus = useSelector((state) => state.menus.list);
  const modulePath = getModulePathByMenu("question_management", modules, menus);

  useEffect(() => {
    dispatch(getQuestionById(id));
    return () => dispatch(clearSelectedQuestion());
  }, [dispatch, id]);

  if (loading || !selectedQuestion) return <SkeletonPage />;

  const {
    question,
    options = [],
    correct,
    timeLimit,
    subject,
    level,
    department,
    isActive,
    questionType = "MCQ",
    metadata,
  } = selectedQuestion;

  const isJournal = questionType === "JOURNAL_ENTRY" &&
    options[0]?.drLines !== undefined;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-2">

      {/* ── Top Section ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-3">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(`/module/${modulePath}/question_management`)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            {/* Question Type Badge */}
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${questionType === "MCQ"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                : questionType === "JOURNAL_ENTRY"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                  : questionType === "PASSAGE"
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
              }`}>
              {questionType === "MCQ" && "MCQ"}
              {questionType === "JOURNAL_ENTRY" && "📒 Journal Entry"}
              {questionType === "PASSAGE" && "📄 Passage Based"}
              {questionType === "FILL_IN_BLANK" && "✏️ Fill in the Blank"}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${isActive
                ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200"
                : "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200"
              }`}>
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Question Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Department", value: department?.name || "-" },
            { label: "Subject", value: subject?.name || "-" },
            { label: "Level", value: level?.name || "-" },
            { label: "Time Limit", value: `${timeLimit} seconds` },
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
              <p className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold mb-1">{item.label}</p>
              <p className="text-gray-800 dark:text-gray-100 font-medium">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom Section ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 space-y-8">

        {/* Passage Block — if PASSAGE type */}
        {questionType === "PASSAGE" && metadata?.passage && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
              📄 Passage
            </h3>
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-sm text-blue-900 dark:text-blue-200 leading-relaxed italic whitespace-pre-wrap">
              {metadata.passage.title && (
                <p className="font-bold not-italic mb-2">{metadata.passage.title}</p>
              )}
              {metadata.passage.content}
            </div>
            {metadata.passage.passageGroupId && (
              <p className="text-xs text-gray-400 mt-1">
                Group ID: <span className="font-mono">{metadata.passage.passageGroupId}</span>
              </p>
            )}
          </div>
        )}

        {/* Question */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
            Question
          </h3>
          <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
            {question}
          </div>
        </div>

        {/* Options */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Options
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {options.map((opt, index) => {
              // ✅ Journal Entry — structured render
              if (isJournal) {
                const isCorrect = String(index) === String(correct);
                return (
                  <JournalOptionView
                    key={index}
                    opt={opt}
                    isCorrect={isCorrect}
                    index={index}
                  />
                );
              }

              // ✅ Normal MCQ / PASSAGE / FILL_IN_BLANK
              const isCorrect = String(index) === String(correct);
              return (
                <div key={index} className={`rounded-xl p-4 border text-sm transition-all duration-200 ${isCorrect
                    ? "border-green-500 bg-green-50 dark:bg-green-900/30 dark:border-green-400"
                    : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
                  }`}>
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      <span className="text-gray-500 dark:text-gray-400 mr-1">
                        {OPTION_LABELS[index]}.
                      </span>
                      {typeof opt === "string" ? opt : JSON.stringify(opt)}
                    </p>
                    {isCorrect && (
                      <span className="text-green-600 dark:text-green-400 font-semibold">✓ Correct</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionDetailPage;