import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    clearMyScore,
    fetchMyScore,
    saveDraftScore,
    submitFinalScore,
} from "../../../features/HR_Slices/Interview_scores/interviewScoreSlice";
import { useParams, useNavigate } from "react-router-dom";
import {
    StepBack,
    Award,
    ThumbsUp,
    ThumbsDown,
    MessageSquare,
    Star,
    TrendingUp,
    Save,
    Send,
    Lock,
    CheckCircle2,
    AlertCircle,
    Lightbulb,
    Target,
    Sparkles,
    FileText
} from "lucide-react";

const InterviewScoreForm = () => {
    const { interviewId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [scoreError, setScoreError] = useState("");
    const [currentInterviewId, setCurrentInterviewId] = useState(null);

    const { myScore, loading } = useSelector((state) => state.interviewScores);

    const [form, setForm] = useState({
        score: "",
        recommendation: "",
        strengths: "",
        weaknesses: "",
        comments: "",
    });

    useEffect(() => {
        setCurrentInterviewId(interviewId);
        dispatch(clearMyScore());
        dispatch(fetchMyScore(interviewId));

        return () => {
            setForm({
                score: "",
                recommendation: "",
                strengths: "",
                weaknesses: "",
                comments: "",
            });
        };
    }, [interviewId, dispatch]);

    useEffect(() => {
        if (!loading && myScore?.id === currentInterviewId) {
            setForm({
                score: myScore.score ?? "",
                recommendation: myScore.recommendation ?? "",
                strengths: myScore.strengths ?? "",
                weaknesses: myScore.weaknesses ?? "",
                comments: myScore.comments ?? "",
            });
        } else if (!loading) {
            setForm({
                score: "",
                recommendation: "",
                strengths: "",
                weaknesses: "",
                comments: "",
            });
        }
    }, [loading, myScore, currentInterviewId]);

    const isLocked =
        myScore?.status === "Submitted" || myScore?.status === "Locked";

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "score") {
            const numericValue = Number(value);

            if (numericValue < 0 || numericValue > 10) {
                setScoreError("Score must be between 0 and 10");
                return;
            } else {
                setScoreError("");
            }
        }
        setForm({ ...form, [name]: value });
    };

    const saveDraft = () => {
        dispatch(saveDraftScore({ interviewId, payload: form }));
    };

    const submitFinal = () => {
        dispatch(submitFinalScore({ interviewId, payload: form }));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading evaluation form...</p>
                </div>
            </div>
        );
    }

    const strengthsSuggestions = [
        "Quick learner",
        "Strong analytical thinking",
        "Clear communication",
        "Attention to detail",
        "Ownership mindset",
        "Problem solving ability",
        "Adaptable to challenges",
        "Team player",
        "Technical expertise",
    ];

    const weaknessesSuggestions = [
        "Needs more technical depth",
        "Limited project experience",
        "Communication could improve",
        "Lacks domain knowledge",
        "Time management",
    ];

    const addSuggestion = (field, value) => {
        setForm(prev => ({
            ...prev,
            [field]: prev[field]
                ? `${prev[field]}\n• ${value}`
                : `• ${value}`
        }));
    };

    // Get score color and label
    const getScoreInfo = (score) => {
        const num = Number(score);
        if (num >= 8) return { color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30", label: "Excellent" };
        if (num >= 6) return { color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30", label: "Good" };
        if (num >= 4) return { color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900/30", label: "Average" };
        return { color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30", label: "Below Average" };
    };

    const scoreInfo = form.score ? getScoreInfo(form.score) : null;

    // Get recommendation color
    const getRecommendationColor = (rec) => {
        if (rec === "Strong Yes") return "text-green-600 bg-green-100 dark:bg-green-900/30";
        if (rec === "Yes") return "text-blue-600 bg-blue-100 dark:bg-blue-900/30";
        if (rec === "Neutral") return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30";
        if (rec === "No") return "text-orange-600 bg-orange-100 dark:bg-orange-900/30";
        if (rec === "Strong No") return "text-red-600 bg-red-100 dark:bg-red-900/30";
        return "text-gray-600 bg-gray-100 dark:bg-gray-700";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">

                {/* ==== HEADER ==== */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors shadow-sm"
                            >
                                <StepBack className="w-4 h-4" />
                                Back
                            </button>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <Award className="w-7 h-7 text-blue-600" />
                                    Interview Evaluation
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Provide comprehensive feedback to support hiring decisions
                                </p>
                            </div>
                        </div>

                        {/* Status Badge */}
                        {myScore?.status && (
                            <div className="flex items-center gap-2">
                                {myScore.status === "Draft" && (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 rounded-lg">
                                        <FileText className="w-4 h-4" />
                                        <span className="text-sm font-medium">Draft</span>
                                    </div>
                                )}
                                {myScore.status === "Submitted" && (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="text-sm font-medium">Submitted</span>
                                    </div>
                                )}
                                {myScore.status === "Locked" && (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg">
                                        <Lock className="w-4 h-4" />
                                        <span className="text-sm font-medium">Locked</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ==== READ ONLY NOTICE ==== */}
                {isLocked && (
                    <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                    Evaluation Finalized
                                </h3>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                    This score sheet has been submitted and locked. No further changes can be made.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ==== MAIN CONTENT GRID ==== */}
                <div className="grid lg:grid-cols-[320px,1fr] gap-6">

                    {/* ==== LEFT SIDEBAR - SUMMARY PANEL ==== */}
                    <aside className="space-y-6">

                        {/* Score Summary Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Target className="w-5 h-5 text-blue-600" />
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                                    Evaluation Summary
                                </h3>
                            </div>

                            {/* Score Display */}
                            <div className="mb-6">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Overall Score</p>
                                {form.score ? (
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-4xl font-bold ${scoreInfo?.color}`}>
                                            {form.score}
                                        </span>
                                        <span className="text-lg text-gray-400">/10</span>
                                    </div>
                                ) : (
                                    <div className="text-2xl text-gray-400">—</div>
                                )}
                                {scoreInfo && (
                                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${scoreInfo.bg} ${scoreInfo.color}`}>
                                        {scoreInfo.label}
                                    </span>
                                )}
                            </div>

                            {/* Score Bar */}
                            {form.score && (
                                <div className="mb-6">
                                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                                            style={{ width: `${(Number(form.score) / 10) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {/* Recommendation */}
                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Recommendation</p>
                                {form.recommendation ? (
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${getRecommendationColor(form.recommendation)}`}>
                                        {form.recommendation === "Strong Yes" && <CheckCircle2 className="w-4 h-4" />}
                                        {form.recommendation === "Yes" && <ThumbsUp className="w-4 h-4" />}
                                        {form.recommendation === "No" && <ThumbsDown className="w-4 h-4" />}
                                        {form.recommendation === "Strong No" && <AlertCircle className="w-4 h-4" />}
                                        {form.recommendation}
                                    </span>
                                ) : (
                                    <span className="text-gray-400">Not selected</span>
                                )}
                            </div>
                        </div>

                        {/* Quick Tips Card */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2 mb-3">
                                <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                    Evaluation Tips
                                </h4>
                            </div>
                            <ul className="space-y-2 text-xs text-blue-700 dark:text-blue-300">
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 mt-0.5">•</span>
                                    <span>Be specific with examples</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 mt-0.5">•</span>
                                    <span>Focus on observable behaviors</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 mt-0.5">•</span>
                                    <span>Save drafts frequently</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 mt-0.5">•</span>
                                    <span>Review before final submission</span>
                                </li>
                            </ul>
                        </div>

                        {/* Progress Indicator */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                                Completion Status
                            </h4>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600 dark:text-gray-400">Score</span>
                                    {form.score ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                                    )}
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600 dark:text-gray-400">Recommendation</span>
                                    {form.recommendation ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                                    )}
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600 dark:text-gray-400">Strengths</span>
                                    {form.strengths ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                                    )}
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600 dark:text-gray-400">Improvements</span>
                                    {form.weaknesses ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </aside>

                    {/* ==== RIGHT SIDE - FORM SECTIONS ==== */}
                    <div className="space-y-6">

                        {/* SCORE SECTION */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Star className="w-5 h-5 text-yellow-500" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Overall Score
                                </h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Rate the candidate's overall performance from 0 to 10
                            </p>

                            <div className="flex items-start gap-4">
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="score"
                                        min="0"
                                        max="10"
                                        step="0.5"
                                        value={form.score}
                                        onChange={handleChange}
                                        disabled={isLocked}
                                        className={`w-32 px-4 py-3 text-lg font-semibold border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-all ${scoreError
                                            ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                                            : "border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                            }`}
                                        placeholder="0.0"
                                    />
                                    {scoreError && (
                                        <div className="absolute top-full left-0 mt-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs px-3 py-2 rounded-lg shadow-sm flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            {scoreError}
                                        </div>
                                    )}
                                </div>

                                {/* Score Range Reference */}
                                <div className="flex-1 grid grid-cols-5 gap-2 text-xs">
                                    <div className="text-center">
                                        <div className="w-full h-2 bg-red-500 rounded mb-1"></div>
                                        <span className="text-gray-600 dark:text-gray-400">0-2</span>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-full h-2 bg-orange-500 rounded mb-1"></div>
                                        <span className="text-gray-600 dark:text-gray-400">2-4</span>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-full h-2 bg-yellow-500 rounded mb-1"></div>
                                        <span className="text-gray-600 dark:text-gray-400">4-6</span>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-full h-2 bg-blue-500 rounded mb-1"></div>
                                        <span className="text-gray-600 dark:text-gray-400">6-8</span>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-full h-2 bg-green-500 rounded mb-1"></div>
                                        <span className="text-gray-600 dark:text-gray-400">8-10</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RECOMMENDATION SECTION */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="w-5 h-5 text-green-500" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Hiring Recommendation
                                </h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Your final judgment on whether to proceed with this candidate
                            </p>

                            <select
                                name="recommendation"
                                value={form.recommendation}
                                onChange={handleChange}
                                disabled={isLocked}
                                className="w-full sm:w-auto min-w-[240px] px-4 py-3 text-sm font-medium border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed dark:bg-gray-700 transition-all"
                            >
                                <option value="">Select recommendation</option>
                                <option value="Strong Yes">✅ Strong Yes - Excellent Fit</option>
                                <option value="Yes">👍 Yes - Good Candidate</option>
                                <option value="Neutral">⚖️ Neutral - Uncertain</option>
                                <option value="No">👎 No - Not Suitable</option>
                                <option value="Strong No">❌ Strong No - Poor Fit</option>
                            </select>
                        </div>

                        {/* STRENGTHS SECTION */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <ThumbsUp className="w-5 h-5 text-green-500" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Strengths & Positive Attributes
                                </h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                What impressed you about this candidate?
                            </p>

                            <textarea
                                name="strengths"
                                rows="4"
                                value={form.strengths}
                                onChange={handleChange}
                                disabled={isLocked}
                                className="w-full px-4 py-3 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed dark:bg-gray-700 transition-all"
                                placeholder="Example: Strong communication skills, demonstrated deep understanding of core concepts, showed excellent problem-solving approach..."
                            />

                            {!isLocked && (
                                <>
                                    <div className="flex items-center gap-2 mt-4 mb-3">
                                        <Sparkles className="w-4 h-4 text-blue-600" />
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                            Quick Add Suggestions:
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {strengthsSuggestions.map((item) => (
                                            <button
                                                key={item}
                                                type="button"
                                                onClick={() => addSuggestion("strengths", item)}
                                                className="px-3 py-1.5 text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                                            >
                                                + {item}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* WEAKNESSES SECTION */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <ThumbsDown className="w-5 h-5 text-orange-500" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Areas for Improvement
                                </h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Where could this candidate develop or improve?
                            </p>

                            <textarea
                                name="weaknesses"
                                rows="4"
                                value={form.weaknesses}
                                onChange={handleChange}
                                disabled={isLocked}
                                placeholder="Example: Could benefit from more hands-on project experience, needs to develop stronger testing practices..."
                                className="w-full px-4 py-3 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed dark:bg-gray-700 transition-all"
                            />

                            {!isLocked && (
                                <>
                                    <div className="flex items-center gap-2 mt-4 mb-3">
                                        <Sparkles className="w-4 h-4 text-orange-600" />
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                            Common Areas:
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {weaknessesSuggestions.map((item) => (
                                            <button
                                                key={item}
                                                type="button"
                                                onClick={() => addSuggestion("weaknesses", item)}
                                                className="px-3 py-1.5 text-xs font-medium bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 rounded-full hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                                            >
                                                + {item}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* COMMENTS SECTION */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <MessageSquare className="w-5 h-5 text-blue-500" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Additional Comments
                                </h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Any other important observations or notes for the hiring team?
                            </p>

                            <textarea
                                name="comments"
                                rows="4"
                                value={form.comments}
                                onChange={handleChange}
                                disabled={isLocked}
                                placeholder="Share any additional context, concerns, or recommendations that would help in the final hiring decision..."
                                className="w-full px-4 py-3 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed dark:bg-gray-700 transition-all"
                            />
                        </div>

                    </div>
                </div>

                {/* ==== ACTION BUTTONS ==== */}
                {!isLocked && (
                    <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                <p className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Review your evaluation carefully before submitting
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={saveDraft}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 active:scale-95 transition-all shadow-sm"
                                >
                                    <Save className="w-4 h-4" />
                                    Save as Draft
                                </button>

                                <button
                                    onClick={submitFinal}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg active:scale-95 transition-all shadow-md hover:shadow-lg"
                                >
                                    <Send className="w-4 h-4" />
                                    Submit Final Evaluation
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default InterviewScoreForm;