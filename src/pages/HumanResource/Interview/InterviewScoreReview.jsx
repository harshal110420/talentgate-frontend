import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchAllScores,
    lockInterviewScores,
} from "../../../features/HR_Slices/Interview_scores/interviewScoreSlice";
import { useParams, useNavigate } from "react-router-dom";
import { StepBack } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  HELPERS                                                                     */
/* ─────────────────────────────────────────────────────────────────────────── */
const recommendationMeta = {
    "Strongly Recommend": { badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" },
    "Recommend": { badge: "bg-green-50 text-green-700 ring-1 ring-green-200", dot: "bg-green-400" },
    "Neutral": { badge: "bg-gray-100 text-gray-600 ring-1 ring-gray-200", dot: "bg-gray-400" },
    "Not Recommend": { badge: "bg-red-50 text-red-600 ring-1 ring-red-200", dot: "bg-red-400" },
};
const getRecMeta = (r) =>
    recommendationMeta[r] || { badge: "bg-gray-100 text-gray-500 ring-1 ring-gray-200", dot: "bg-gray-300" };

const scoreColor = (pct) => {
    if (pct >= 80) return { bar: "bg-emerald-500", text: "text-emerald-600" };
    if (pct >= 60) return { bar: "bg-indigo-500", text: "text-indigo-600" };
    if (pct >= 40) return { bar: "bg-amber-500", text: "text-amber-600" };
    return { bar: "bg-red-500", text: "text-red-600" };
};

const formatSubmittedAt = (iso) =>
    new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });

/* ─────────────────────────────────────────────────────────────────────────── */
/*  SKELETON CARD                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */
const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 flex flex-col gap-4 animate-pulse">
        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded-full self-end" />
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-3 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-2.5 w-40 bg-gray-100 dark:bg-gray-800 rounded" />
                <div className="flex gap-2 mt-1">
                    <div className="h-4 w-16 bg-gray-100 dark:bg-gray-800 rounded-full" />
                    <div className="h-4 w-16 bg-gray-100 dark:bg-gray-800 rounded-full" />
                </div>
            </div>
        </div>
        <div className="space-y-1.5">
            <div className="h-2.5 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="flex items-center gap-2">
                <div className="h-5 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-2 flex-1 bg-gray-100 dark:bg-gray-800 rounded-full" />
            </div>
        </div>
        {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
                <div className="h-2.5 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
        ))}
        <div className="h-2.5 w-32 bg-gray-100 dark:bg-gray-800 rounded mt-2" />
    </div>
);

/* ─────────────────────────────────────────────────────────────────────────── */
/*  INFO ROW (label + value)                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */
const InfoRow = ({ label, value, valueClass = "" }) => (
    <div className="space-y-1">
        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {label}
        </p>
        <p className={`text-[13px] text-gray-700 dark:text-gray-300 leading-snug ${valueClass}`}>
            {value || <span className="text-gray-300 dark:text-gray-600">—</span>}
        </p>
    </div>
);

/* ─────────────────────────────────────────────────────────────────────────── */
/*  SCORE CARD                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */
const ScoreCard = ({ score }) => {
    const initials = `${score.interviewer?.firstName?.[0] ?? ""}${score.interviewer?.lastName?.[0] ?? ""}`.toUpperCase();
    const pct = score.score * 10;
    const { bar, text } = scoreColor(pct);
    const recMeta = getRecMeta(score.recommendation);
    const isSubmitted = score.status === "Submitted";

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-800 transition-all duration-200 p-5 flex flex-col gap-4 relative">

            {/* ── STATUS BADGE (top-right) ── */}
            {/* <span className={`
        absolute top-4 right-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide
        ${isSubmitted
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"}
      `}>
                <span className={`w-1.5 h-1.5 rounded-full ${isSubmitted ? "bg-emerald-500" : "bg-amber-400"}`} />
                {score.status}
            </span> */}

            {/* ── INTERVIEWER INFO ── */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 rounded-xl">
                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {initials || "?"}
                </span>
                <div className="flex flex-col leading-tight min-w-0">
                    <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                        {score.interviewer?.firstName} {score.interviewer?.lastName}
                    </span>
                    <span className="text-[11px] text-gray-400 truncate max-w-[200px]">
                        {score.interviewer?.mail}
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {score.interviewer?.department?.name && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:ring-indigo-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                {score.interviewer.department.name}
                            </span>
                        )}
                        {score.interviewer?.role?.displayName && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 ring-1 ring-teal-100 dark:bg-teal-900/30 dark:text-teal-300 dark:ring-teal-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                                {score.interviewer.role.displayName}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ── OVERALL SCORE ── */}
            <div className="bg-gray-50 dark:bg-gray-800/40 rounded-xl p-3 border border-gray-100 dark:border-gray-700/60">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Overall Score
                </p>
                <div className="flex items-center gap-3">
                    <span className={`text-2xl font-bold tabular-nums ${text}`}>
                        {pct.toFixed(0)}%
                    </span>
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${bar}`}
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <span className="text-[11px] text-gray-400 shrink-0">{score.score}/10</span>
                </div>
            </div>

            {/* ── RECOMMENDATION ── */}
            <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Recommendation
                </p>
                {score.recommendation ? (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium ${recMeta.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${recMeta.dot}`} />
                        {score.recommendation}
                    </span>
                ) : (
                    <span className="text-gray-300 dark:text-gray-600 text-[13px]">—</span>
                )}
            </div>

            {/* ── DIVIDER ── */}
            <div className="border-t border-gray-100 dark:border-gray-800" />

            {/* ── STRENGTHS / WEAKNESSES / COMMENTS ── */}
            <InfoRow label="Strengths" value={score.strengths} />
            <InfoRow label="Weaknesses / Areas of Improvement" value={score.weaknesses} />
            <InfoRow label="Additional Comments" value={score.comments} />

            {/* ── SUBMITTED AT ── */}
            <div className="pt-2 border-t border-gray-50 dark:border-gray-800">
                <p className={`text-[11px] flex items-center gap-1.5 ${isSubmitted ? "text-gray-400" : "text-amber-500"}`}>
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" />
                    </svg>
                    {score.submittedAt
                        ? `Submitted on ${formatSubmittedAt(score.submittedAt)}`
                        : "Not submitted yet"}
                </p>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  MAIN COMPONENT                                                              */
/* ─────────────────────────────────────────────────────────────────────────── */
const InterviewScoreReview = () => {
    const { interviewId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [showLockModal, setShowLockModal] = useState(false);

    const { allScores, loading } = useSelector((state) => state.interviewScores);

    useEffect(() => {
        dispatch(fetchAllScores(interviewId));
    }, [interviewId, dispatch]);

    const allSubmitted = allScores.length > 0 && allScores.every((s) => s.status === "Submitted");
    const submittedCount = allScores.filter((s) => s.status === "Submitted").length;
    const avgScore = allScores.length
        ? (allScores.reduce((sum, s) => sum + (s.score || 0), 0) / allScores.length * 10).toFixed(0)
        : null;

    const handleLock = () => {
        dispatch(lockInterviewScores(interviewId));
        setShowLockModal(false);
    };

    return (
        <div className="min-h-screen bg-gray-50/60 dark:bg-gray-950 px-6 py-6 font-sans max-w-6xl mx-auto">

            {/* ── PAGE HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-1 h-6 rounded-full bg-indigo-500 inline-block" />
                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
                            Interview Score Review
                        </h1>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 ml-3">
                        Review scores submitted by each panel member
                    </p>
                </div>

                {/* Stats + Back */}
                <div className="flex items-center gap-3 shrink-0">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all shadow-sm hover:shadow-md"
                    >
                        <StepBack className="w-4 h-4" />
                        Back
                    </button>
                </div>
            </div>

            {/* ── SKELETON GRID ── */}
            {loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            )}

            {/* ── EMPTY STATE ── */}
            {!loading && allScores.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <svg className="w-12 h-12 opacity-30 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm">No scores found for this interview</p>
                </div>
            )}

            {/* ── SCORE CARDS GRID ── */}
            {!loading && allScores.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {allScores.map((score) => (
                        <ScoreCard key={score.id} score={score} />
                    ))}
                </div>
            )}

            {/* ── LOCK BUTTON ── */}
            {allSubmitted && (
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={() => setShowLockModal(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm hover:shadow-md transition-all hover:scale-[1.01] active:scale-[0.98]"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Lock Interview Scores
                    </button>
                </div>
            )}

            {/* ── LOCK CONFIRM MODAL ── */}
            {showLockModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-50">
                    <div
                        className="bg-white dark:bg-gray-900 w-full max-w-md mx-4 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
                        style={{ animation: "fadeSlideUp 0.22s cubic-bezier(0.4,0,0.2,1)" }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-red-50 dark:bg-red-900/20">
                            <div className="flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                                    <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </span>
                                <h3 className="text-[15px] font-semibold text-red-700 dark:text-red-400">
                                    Lock Interview Scores
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowLockModal(false)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5">
                            <div className="flex items-start gap-3 p-3.5 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800 mb-4">
                                <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm text-red-700 dark:text-red-400 leading-relaxed">
                                    Once locked, <strong>no panel member</strong> can update their score. This action is <strong>permanent</strong> and cannot be undone.
                                </p>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Are you sure you want to lock all {allScores.length} score submissions for this interview?
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80">
                            <button
                                onClick={() => setShowLockModal(false)}
                                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLock}
                                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.98]"
                            >
                                Confirm & Lock
                            </button>
                        </div>
                    </div>

                    <style>{`
            @keyframes fadeSlideUp {
              from { opacity:0; transform:translateY(12px) scale(0.98); }
              to   { opacity:1; transform:translateY(0)    scale(1);    }
            }
          `}</style>
                </div>
            )}

        </div>
    );
};

export default InterviewScoreReview;