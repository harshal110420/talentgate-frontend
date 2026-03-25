import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllInterviews } from "../../../features/HR_Slices/Interview/InterviewSlice";
import SkeletonPage from "../../../components/skeletons/skeletonPage";
import { getModulePathByMenu } from "../../../utils/navigation";
import { StepBack } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  STATUS META                                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */
const statusMeta = {
    Scheduled: {
        dot: "bg-amber-400",
        badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    },
    Rescheduled: {
        dot: "bg-orange-400",
        badge: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
    },
    Completed: {
        dot: "bg-emerald-500",
        badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    },
    Cancelled: {
        dot: "bg-red-400",
        badge: "bg-red-50 text-red-600 ring-1 ring-red-200",
    },
};

const getStatusMeta = (status) =>
    statusMeta[status] || { dot: "bg-gray-400", badge: "bg-gray-100 text-gray-500 ring-1 ring-gray-200" };

/* ─────────────────────────────────────────────────────────────────────────── */
/*  ROUND BADGE COLOR                                                           */
/* ─────────────────────────────────────────────────────────────────────────── */
const roundColors = {
    Technical: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
    HR: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
    Managerial: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
};
const getRoundColor = (round) => roundColors[round] || "bg-gray-100 text-gray-600 ring-1 ring-gray-200";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  TYPE BADGE                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */
const typeIcons = {
    Online: "🌐",
    Offline: "🏢",
    Telephonic: "📞",
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  HELPERS                                                                     */
/* ─────────────────────────────────────────────────────────────────────────── */
const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
    });

const formatTime = (timeStr) =>
    new Date(`1970-01-01T${timeStr}`).toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", hour12: true,
    });

/* ─────────────────────────────────────────────────────────────────────────── */
/*  MAIN COMPONENT                                                              */
/* ─────────────────────────────────────────────────────────────────────────── */
const CandidateInterviewRounds = () => {
    const { candidateId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { allInterviews, loading } = useSelector((state) => state.candidatesOverview);
    const modules = useSelector((state) => state.modules.list);
    const menus = useSelector((state) => state.menus.list);
    const modulePath = getModulePathByMenu("interview_evaluation", modules, menus);

    useEffect(() => {
        dispatch(fetchAllInterviews());
    }, [dispatch]);

    const candidateRounds = allInterviews?.filter(
        (item) => item.candidateId === Number(candidateId)
    );

    const sortedRounds = candidateRounds?.sort(
        (a, b) => new Date(a.interviewDate) - new Date(b.interviewDate)
    );

    const candidate = sortedRounds?.[0]?.candidate;
    const job = sortedRounds?.[0]?.jobOpening;
    const completedCount = sortedRounds?.filter((r) => r.status === "Completed").length ?? 0;
    const totalCount = sortedRounds?.length ?? 0;

    return (
        <div className="min-h-screen bg-gray-50/60 dark:bg-gray-950 px-6 py-6 font-sans">

            {/* ── PAGE HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-1 h-6 rounded-full bg-indigo-500 inline-block" />
                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
                            {candidate?.name
                                ? `Interview Rounds — ${candidate.name}`
                                : "Interview Rounds"}
                        </h1>
                    </div>

                    {job && (
                        <div className="ml-3 flex items-center gap-2 flex-wrap mt-1">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                Applied for
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:ring-indigo-700">
                                {job.title}
                                {job.jobCode && (
                                    <span className="text-indigo-400 font-normal">· {job.jobCode}</span>
                                )}
                            </span>
                        </div>
                    )}
                </div>

                {/* Stats + Back button */}
                <div className="flex items-center gap-3 shrink-0">
                    {/* Progress pill */}
                    {totalCount > 0 && (
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
                            <div className="flex gap-0.5">
                                {sortedRounds.map((r, i) => (
                                    <span
                                        key={i}
                                        className={`w-2 h-2 rounded-full transition-all ${r.status === "Completed"
                                            ? "bg-emerald-500"
                                            : r.status === "Scheduled" || r.status === "Rescheduled"
                                                ? "bg-amber-400"
                                                : "bg-gray-200"
                                            }`}
                                    />
                                ))}
                            </div>
                            <span className="text-[12px] font-medium text-gray-600 dark:text-gray-400">
                                {completedCount}/{totalCount} done
                            </span>
                        </div>
                    )}

                    <button
                        onClick={() => navigate(-1)}
                        className="
              inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
              text-indigo-600 dark:text-indigo-400
              bg-indigo-50 dark:bg-indigo-900/20
              border border-indigo-200 dark:border-indigo-700
              rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/30
              transition-all shadow-sm hover:shadow-md
            "
                    >
                        <StepBack className="w-4 h-4" />
                        Back
                    </button>
                </div>
            </div>

            {/* ── TABLE ── */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/60">
                                {["#", "Round", "Type", "Date", "Time", "Panel Members", "Status", "Action"].map((h, i) => (
                                    <th
                                        key={h}
                                        className="px-4 py-3.5 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/80">
                            {loading && <SkeletonPage rows={4} columns={8} />}

                            {!loading && sortedRounds?.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                            <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="text-sm">No interview rounds found for this candidate</span>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {!loading && sortedRounds?.map((round, index) => {
                                const { dot, badge } = getStatusMeta(round.status);

                                return (
                                    <tr
                                        key={round.id}
                                        className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group"
                                    >
                                        {/* # */}
                                        <td className="px-4 py-3.5">
                                            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                                                {index + 1}
                                            </span>
                                        </td>

                                        {/* Round */}
                                        <td className="px-4 py-3.5">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[12px] font-semibold ${getRoundColor(round.round)}`}>
                                                {round.round}
                                            </span>
                                        </td>

                                        {/* Type */}
                                        <td className="px-4 py-3.5">
                                            <span className="inline-flex items-center gap-1.5 text-[13px] text-gray-600 dark:text-gray-300">
                                                <span>{typeIcons[round.interviewType] || "📋"}</span>
                                                {round.interviewType}
                                            </span>
                                        </td>

                                        {/* Date */}
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                                                </svg>
                                                <span className="text-[13px] text-gray-700 dark:text-gray-300 font-medium">
                                                    {formatDate(round.interviewDate)}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Time */}
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" />
                                                </svg>
                                                <span className="text-[13px] text-gray-700 dark:text-gray-300">
                                                    {formatTime(round.startTime)} – {formatTime(round.endTime)}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Panel Members */}
                                        <td className="px-4 py-3.5">
                                            <div className="flex flex-col gap-1.5">
                                                {round.panel?.map((p) => {
                                                    const initials = `${p.user?.firstName?.[0] ?? ""}${p.user?.lastName?.[0] ?? ""}`.toUpperCase();
                                                    const fullName = `${p.user?.firstName ?? ""} ${p.user?.lastName ?? ""}`.trim();
                                                    const isLead = p.role === "Lead";

                                                    return (
                                                        <div
                                                            key={p.id}
                                                            className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 px-2 py-1.5 rounded-lg"
                                                        >
                                                            <span className={`
                                w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
                                ${isLead
                                                                    ? "bg-gradient-to-br from-indigo-400 to-violet-500 text-white"
                                                                    : "bg-gradient-to-br from-gray-300 to-gray-400 text-white"}
                              `}>
                                                                {initials}
                                                            </span>
                                                            <div className="flex flex-col leading-tight min-w-0">
                                                                <span className="text-[11px] font-medium text-gray-800 dark:text-gray-100 truncate max-w-[120px]">
                                                                    {fullName}
                                                                </span>
                                                                <span className={`text-[10px] font-medium ${isLead ? "text-indigo-500" : "text-gray-400"}`}>
                                                                    {p.role}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3.5">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap ${badge}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                                                {round.status}
                                            </span>
                                        </td>

                                        {/* Action */}
                                        <td className="px-4 py-3.5">
                                            {round.status === "Completed" ? (
                                                <button
                                                    onClick={() => navigate(`/module/${modulePath}/interview_evaluation/review/${round.id}`)}
                                                    className="
                            inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium
                            text-indigo-600 dark:text-indigo-400
                            bg-indigo-50 dark:bg-indigo-900/20
                            border border-indigo-200 dark:border-indigo-700
                            rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40
                            transition-all hover:scale-[1.02] active:scale-[0.98]
                          "
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    View Feedback
                                                </button>
                                            ) : (
                                                <span className="text-[11px] text-gray-300 dark:text-gray-600">—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default CandidateInterviewRounds;