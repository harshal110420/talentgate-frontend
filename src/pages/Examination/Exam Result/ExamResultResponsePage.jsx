// src/pages/Exams/ExamResultResponsePage.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { fetchExamResultById } from "../../../features/Exams/examResultDetailSlice";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Info,
  Clock,
  Target,
  TrendingUp,
  BarChart3,
  Calendar,
  User,
  Mail,
  FileText,
  Download,
  Share2,
  Eye,
  EyeOff,
  StepBack,
} from "lucide-react";
import SkeletonPage from "../../../components/skeletons/skeletonPage";

const ExamResultResponsePage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.examResultDetail);
  const navigate = useNavigate();
  const [showAnswers, setShowAnswers] = useState(true);

  useEffect(() => {
    dispatch(fetchExamResultById(id));
  }, [dispatch, id]);

  if (loading) return <SkeletonPage rows={6} columns={10} />;
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 text-lg">{error || "Something went wrong"}</p>
        </div>
      </div>
    );
  if (!data)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-400">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No data found for this exam result.</p>
        </div>
      </div>
    );

  const {
    candidateName,
    examName,
    resultStatus,
    score,
    totalQuestions,
    candidateResponses,
    candidate,
    skipped = 0,
    correctAnswers,
    incorrectAnswers,
    exam,
    submittedAt,
    timeTaken,
  } = data;

  const positiveMarking = exam?.positiveMarking ?? 1;
  const negativeMarking = exam?.negativeMarking ?? 0;
  const passingScore = exam?.passingScore ?? 0;
  const totalMarks = totalQuestions * positiveMarking;

  // 💡 Derived scoring details
  const totalPositive = correctAnswers * positiveMarking;
  const totalNegative = incorrectAnswers * negativeMarking;
  const finalScore = parseFloat(score.toFixed(2));
  const percentage = ((finalScore / totalMarks) * 100).toFixed(1);
  const accuracyRate = totalQuestions > 0
    ? ((correctAnswers / (totalQuestions - skipped)) * 100).toFixed(1)
    : 0;

  // Performance grade
  const getGrade = (percentage) => {
    if (percentage >= 90) return { grade: "A+", color: "text-green-600", bg: "bg-green-100" };
    if (percentage >= 80) return { grade: "A", color: "text-green-600", bg: "bg-green-100" };
    if (percentage >= 70) return { grade: "B", color: "text-blue-600", bg: "bg-blue-100" };
    if (percentage >= 60) return { grade: "C", color: "text-yellow-600", bg: "bg-yellow-100" };
    if (percentage >= 50) return { grade: "D", color: "text-orange-600", bg: "bg-orange-100" };
    return { grade: "F", color: "text-red-600", bg: "bg-red-100" };
  };

  const gradeInfo = getGrade(percentage);

  const renderJournalEntry = (value) => {
    if (!value) return null;

    let parsed = value;

    // If string → parse JSON
    if (typeof value === "string") {
      try {
        parsed = JSON.parse(value);
      } catch {
        return value; // fallback
      }
    }

    if (!parsed.drLines && !parsed.crLines) return value;

    const { drLines = [], crLines = [] } = parsed;

    return (
      <div className="text-xs space-y-1">
        {drLines.map((line, i) => (
          <div key={`dr-${i}`} className="flex justify-between">
            <span>
              {line.account} <span className="font-semibold">Dr</span>
            </span>
            <span>{line.amount}</span>
          </div>
        ))}

        {crLines.map((line, i) => (
          <div key={`cr-${i}`} className="flex justify-between pl-6">
            <span>
              To {line.account}
            </span>
            <span>{line.amount}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1 h-6 rounded-full bg-indigo-500 inline-block" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
                Exam Results
              </h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 ml-3">
              Detailed performance analysis
            </p>
          </div>
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAnswers(!showAnswers)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
            >
              {showAnswers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showAnswers ? "Hide" : "Show"} Answers
            </button>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all shadow-sm hover:shadow-md"
            >
              <StepBack className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>

        {/* Hero Card - Pass/Fail Status */}
        <div className={`relative overflow-hidden rounded-2xl shadow-xl mb-6 ${resultStatus === "pass"
          ? "bg-gradient-to-br from-green-500 to-emerald-600"
          : "bg-gradient-to-br from-red-500 to-rose-600"
          }`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative px-8 py-10 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

              {/* Left: Status & Score */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  {resultStatus === "pass" ? (
                    <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                  ) : (
                    <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                      <XCircle className="w-8 h-8" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm opacity-90 font-medium">Result Status</p>
                    <h2 className="text-3xl font-bold">{resultStatus.toUpperCase()}</h2>
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-6xl font-bold">{finalScore}</span>
                  <span className="text-3xl opacity-75">/ {totalMarks}</span>
                </div>
                <p className="text-lg opacity-90">
                  {percentage}% · Grade: {gradeInfo.grade}
                </p>
              </div>

              {/* Right: Exam Info */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 md:min-w-[300px]">
                <h3 className="text-xl font-semibold mb-4">{examName}</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 opacity-75" />
                    <div>
                      <p className="opacity-75">Candidate</p>
                      <p className="font-medium">{candidateName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 opacity-75" />
                    <div>
                      <p className="opacity-75">Email</p>
                      <p className="font-medium">{candidate?.email}</p>
                    </div>
                  </div>
                  {submittedAt && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 opacity-75" />
                      <div>
                        <p className="opacity-75">Submitted</p>
                        <p className="font-medium">
                          {new Date(submittedAt).toLocaleDateString("en-GB")} at{" "}
                          {new Date(submittedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  )}
                  {timeTaken && (
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 opacity-75" />
                      <div>
                        <p className="opacity-75">Time Taken</p>
                        <p className="font-medium">{timeTaken}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">

          {/* Correct Answers */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                +{totalPositive}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Correct Answers</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {correctAnswers}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {correctAnswers} × {positiveMarking} marks
            </p>
          </div>

          {/* Incorrect Answers */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                -{totalNegative}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Incorrect Answers</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {incorrectAnswers}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {incorrectAnswers} × {negativeMarking} marks
            </p>
          </div>

          {/* Skipped Questions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <MinusCircle className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <span className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                0
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Skipped Questions</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {skipped}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              No marks awarded
            </p>
          </div>

          {/* Accuracy Rate */}
          {/* <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {accuracyRate}%
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Accuracy Rate</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {correctAnswers}/{totalQuestions - skipped}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Attempted questions
            </p>
          </div> */}
        </div>

        {/* Performance Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* Score Breakdown Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Score Breakdown
              </h3>
            </div>

            {/* Visual Progress Bars */}
            <div className="space-y-5">
              {/* Correct */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Correct Answers
                  </span>
                  <span className="text-sm font-semibold text-green-600">
                    {correctAnswers}/{totalQuestions} ({((correctAnswers / totalQuestions) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${(correctAnswers / totalQuestions) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Incorrect */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Incorrect Answers
                  </span>
                  <span className="text-sm font-semibold text-red-600">
                    {incorrectAnswers}/{totalQuestions} ({((incorrectAnswers / totalQuestions) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${(incorrectAnswers / totalQuestions) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Skipped */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Skipped Questions
                  </span>
                  <span className="text-sm font-semibold text-gray-600">
                    {skipped}/{totalQuestions} ({((skipped / totalQuestions) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gray-400 to-gray-500 rounded-full transition-all duration-500"
                    style={{ width: `${(skipped / totalQuestions) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Marks Summary */}
            <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Marks Gained</p>
                <p className="text-2xl font-bold text-green-600">+{totalPositive}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Marks Lost</p>
                <p className="text-2xl font-bold text-red-600">-{totalNegative}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Final Score</p>
                <p className="text-2xl font-bold text-blue-600">{finalScore}</p>
              </div>
            </div>
          </div>

          {/* Grade Card & Key Metrics */}
          <div className="space-y-4">

            {/* Grade Display */}
            <div className={`${gradeInfo.bg} dark:bg-opacity-20 rounded-xl p-6 border-2 ${gradeInfo.grade === "F" ? "border-red-300" :
              gradeInfo.grade.includes("A") ? "border-green-300" :
                gradeInfo.grade === "B" ? "border-blue-300" :
                  gradeInfo.grade === "C" ? "border-yellow-300" :
                    "border-orange-300"
              } dark:border-opacity-50`}>
              <div className="text-center">
                <Award className={`w-12 h-12 mx-auto mb-3 ${gradeInfo.color}`} />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Candidate Grade</p>
                <p className={`text-6xl font-bold ${gradeInfo.color}`}>{gradeInfo.grade}</p>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-2">
                  {percentage}%
                </p>
              </div>
            </div>

            {/* Pass/Fail Info */}
            {/* <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">Passing Score</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {passingScore} marks
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">Candidate Score</span>
                <span className={`text-sm font-semibold ${finalScore >= passingScore ? "text-green-600" : "text-red-600"
                  }`}>
                  {finalScore} marks
                </span>
              </div>
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Difference</span>
                  <span className={`text-sm font-bold ${finalScore >= passingScore ? "text-green-600" : "text-red-600"
                    }`}>
                    {finalScore >= passingScore ? "+" : ""}{(finalScore - passingScore).toFixed(1)} marks
                  </span>
                </div>
              </div>
            </div> */}

            {/* Marking Scheme */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                Marking Scheme
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Correct Answer</span>
                  <span className="font-medium text-green-600">+{positiveMarking}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Wrong Answer</span>
                  <span className="font-medium text-red-600">-{negativeMarking}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Skipped</span>
                  <span className="font-medium text-gray-600">0</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Responses Section */}
        {showAnswers && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Detailed Question Review
                  </h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {totalQuestions} questions
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[300px]">
                      Question
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Candidate Answer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Correct Answer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Result
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {candidateResponses.map((q, index) => {
                    const selected =
                      typeof q.selectedOption === "string"
                        ? q.selectedOption.trim()
                        : q.selectedOption
                          ? JSON.stringify(q.selectedOption)
                          : null;

                    const correct =
                      typeof q.correctAnswer === "string"
                        ? q.correctAnswer.trim()
                        : q.correctAnswer
                          ? JSON.stringify(q.correctAnswer)
                          : null;

                    let resultDisplay = null;
                    let scoreDisplay = null;
                    let rowClass = "";

                    if (!selected) {
                      rowClass = "bg-gray-50/50 dark:bg-gray-800/30";
                      resultDisplay = (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          <MinusCircle className="w-3.5 h-3.5" />
                          Skipped
                        </span>
                      );
                      scoreDisplay = <span className="text-gray-500">0</span>;
                    } else if (selected === correct) {
                      rowClass = "bg-green-50/50 dark:bg-green-900/10";
                      resultDisplay = (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Correct
                        </span>
                      );
                      scoreDisplay = <span className="text-green-600 font-semibold">+{positiveMarking}</span>;
                    } else {
                      rowClass = "bg-red-50/50 dark:bg-red-900/10";
                      resultDisplay = (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                          <XCircle className="w-3.5 h-3.5" />
                          Incorrect
                        </span>
                      );
                      scoreDisplay = <span className="text-red-600 font-semibold">-{negativeMarking}</span>;
                    }

                    return (
                      <tr key={q.questionId} className={`${rowClass} hover:bg-opacity-75 transition-colors`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {q.question}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {selected ? (
                            typeof selected === "string" && selected.startsWith("{") ? (
                              renderJournalEntry(selected)
                            ) : (
                              <span
                                className={`font-medium ${selected === correct
                                  ? "text-green-700 dark:text-green-400"
                                  : "text-red-700 dark:text-red-400"
                                  }`}
                              >
                                {selected}
                              </span>
                            )
                          ) : (
                            <em className="text-gray-400">Not answered</em>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-blue-600 dark:text-blue-400">
                          {typeof correct === "string" && correct.startsWith("{")
                            ? renderJournalEntry(correct)
                            : correct}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {resultDisplay}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                          {scoreDisplay}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer Summary */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Correct: <span className="font-semibold text-gray-900 dark:text-gray-100">{correctAnswers}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Incorrect: <span className="font-semibold text-gray-900 dark:text-gray-100">{incorrectAnswers}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Skipped: <span className="font-semibold text-gray-900 dark:text-gray-100">{skipped}</span>
                    </span>
                  </div>
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Total Questions: <span className="font-semibold text-gray-900 dark:text-gray-100">{totalQuestions}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>This is a detailed analysis of candidate exam performance. Results are final and cannot be modified.</p>
        </div>
      </div>
    </div>
  );
};

export default ExamResultResponsePage;