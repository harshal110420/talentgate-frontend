import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyInterviews } from "../../../features/HR_Slices/Interview/InterviewSlice";
import { useNavigate } from "react-router-dom";
import { getModulePathByMenu } from "../../../utils/navigation";
import SkeletonPage from "../../../components/skeletons/skeletonPage";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  STATUS META                                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */
const statusMeta = {
    Scheduled: {
        dot: "bg-amber-400",
        badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-700",
    },
    Rescheduled: {
        dot: "bg-orange-400",
        badge: "bg-orange-50 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:ring-orange-700",
    },
    Completed: {
        dot: "bg-emerald-500",
        badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-700",
    },
    Locked: {
        dot: "bg-gray-500",
        badge: "bg-gray-100 text-gray-600 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700",
    },
    Cancelled: {
        dot: "bg-red-400",
        badge: "bg-red-50 text-red-600 ring-1 ring-red-200 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-700",
    },
};
const getStatusMeta = (s) =>
    statusMeta[s] || { dot: "bg-gray-300", badge: "bg-gray-100 text-gray-500 ring-1 ring-gray-200" };

/* ─────────────────────────────────────────────────────────────────────────── */
/*  ROUND BADGE                                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */
const roundColors = {
    Technical: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
    HR: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
    Managerial: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
};
const getRoundColor = (r) => roundColors[r] || "bg-gray-100 text-gray-600 ring-1 ring-gray-200";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  HELPERS                                                                     */
/* ─────────────────────────────────────────────────────────────────────────── */
const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const formatTime = (t) =>
    new Date(`1970-01-01T${t}`).toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", hour12: true,
    });

/* ─────────────────────────────────────────────────────────────────────────── */
/*  FILTER SELECT                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */
const FilterSelect = ({ value, onChange, placeholder, options }) => (
    <select
        value={value}
        onChange={onChange}
        className="
      w-full px-3 py-2.5 text-sm rounded-xl
      bg-white dark:bg-gray-900
      border border-gray-200 dark:border-gray-700
      text-gray-700 dark:text-gray-300
      focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
      transition-all
    "
    >
        <option value="">{placeholder}</option>
        {options.map((opt, i) => (
            <option key={i} value={opt.value}>{opt.label}</option>
        ))}
    </select>
);

/* ─────────────────────────────────────────────────────────────────────────── */
/*  MAIN COMPONENT                                                              */
/* ─────────────────────────────────────────────────────────────────────────── */
const MyInterviews = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { myInterviews, loading } = useSelector((state) => state.candidatesOverview);
    console.log("interview assigned to you:", myInterviews)
    const modules = useSelector((state) => state.modules.list);
    const menus = useSelector((state) => state.menus.list);
    const modulePath = getModulePathByMenu("interview_evaluation", modules, menus);

    const [filters, setFilters] = useState({ search: "", job: "", round: "", status: "" });

    useEffect(() => {
        dispatch(fetchMyInterviews());
    }, [dispatch]);

    const getUniqueValues = (key) => {
        if (key === "jobOpening") {
            const countMap = {};
            myInterviews.forEach((i) => {
                const title = i.jobOpening?.title;
                if (title) countMap[title] = (countMap[title] || 0) + 1;
            });
            return Object.entries(countMap).map(([title, count]) => ({
                label: `${title} (${count})`, value: title,
            }));
        }
        return [...new Set(myInterviews.map((i) => i[key]))]
            .filter(Boolean)
            .map((item) => ({ label: item, value: item }));
    };

    const filteredInterviews = useMemo(() => {
        const s = filters.search.toLowerCase();
        return myInterviews.filter((iv) => {
            const candidate = iv.candidate?.name?.toLowerCase() || "";
            const job = iv.jobOpening?.title?.toLowerCase() || "";
            const round = iv.round?.toLowerCase() || "";
            const status = iv.status?.toLowerCase() || "";
            return (
                (candidate.includes(s) || job.includes(s) || round.includes(s)) &&
                (filters.job ? job === filters.job.toLowerCase() : true) &&
                (filters.round ? round === filters.round.toLowerCase() : true) &&
                (filters.status ? status === filters.status.toLowerCase() : true)
            );
        });
    }, [filters, myInterviews]);

    const pendingCount = myInterviews.filter((i) => ["Scheduled", "Rescheduled"].includes(i.status)).length;
    const completedCount = myInterviews.filter((i) => i.status === "Completed").length;

    const getAction = (interview) => {
        const scoreStatus = interview.interviewScore?.status;
        const interviewStatus = interview.status;
        const isView =
            scoreStatus === "Locked" ||
            scoreStatus === "Submitted" ||
            (interviewStatus === "Completed" && scoreStatus !== "Draft");
        if (interview.candidate?.applicationStage === "Rejected" && !isView) {
            return null;
        }
        return {
            label: isView ? "View Score" : "Add Score",
            path: isView
                ? `/module/${modulePath}/assigned_interviews/view-score/${interview.id}`
                : `/module/${modulePath}/assigned_interviews/enter-score/${interview.id}`,
            variant: isView ? "view" : "add",
        };
    };

    return (
        <div className="min-h-screen bg-gray-50/60 dark:bg-gray-950 px-6 py-6 font-sans">

            {/* ── PAGE HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-1 h-6 rounded-full bg-indigo-500 inline-block" />
                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
                            My Assigned Interviews
                        </h1>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 ml-3">
                        Interviews where you are assigned as a panel member
                    </p>
                </div>

                {!loading && myInterviews.length > 0 && (
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm text-[12px]">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            <span className="text-gray-500">Pending</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-100">{pendingCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm text-[12px]">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-gray-500">Completed</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-100">{completedCount}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* ── FILTERS ── */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 mb-5 shadow-sm space-y-3">
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by candidate, job or round..."
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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <FilterSelect value={filters.job} onChange={(e) => setFilters({ ...filters, job: e.target.value })} placeholder="All Jobs" options={getUniqueValues("jobOpening")} />
                    <FilterSelect value={filters.round} onChange={(e) => setFilters({ ...filters, round: e.target.value })} placeholder="All Rounds" options={getUniqueValues("round")} />
                    <FilterSelect value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} placeholder="All Statuses" options={getUniqueValues("status")} />
                </div>
            </div>

            {/* ── TABLE ── */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-[900px] w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/60">
                                {["Candidate", "Job", "Round", "Date", "Time", "Status", "Action"].map((h, i) => (
                                    <th
                                        key={h}
                                        className={`
                      px-4 py-3.5 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider
                      ${i === 6 ? "w-[120px] text-center sticky right-0 bg-gray-50/80 dark:bg-gray-800/60 z-20" : ""}
                    `}
                                        style={i === 6 ? { boxShadow: "-4px 0 10px -4px rgba(0,0,0,0.06)" } : {}}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/80">
                            {loading ? (
                                <SkeletonPage rows={5} columns={7} />
                            ) : filteredInterviews.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                            <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="text-sm">No interviews assigned yet</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredInterviews.map((interview) => {
                                    const { dot, badge } = getStatusMeta(interview.status);
                                    const action = getAction(interview);

                                    return (
                                        <tr
                                            key={interview.id}
                                            className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group"
                                        >
                                            {/* Candidate */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-2.5">
                                                    {/* <span className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                                        {interview.candidate?.name?.[0]?.toUpperCase() || "?"}
                                                    </span> */}
                                                    <span className="text-[13px] font-medium text-gray-800 dark:text-gray-100">
                                                        {interview.candidate?.name}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Job */}
                                            <td className="px-4 py-3.5">
                                                <span className="text-[13px] text-gray-600 dark:text-gray-300">
                                                    {interview.jobOpening?.title || <span className="text-gray-300">—</span>}
                                                </span>
                                            </td>

                                            {/* Round */}
                                            <td className="px-4 py-3.5">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold ${getRoundColor(interview.round)}`}>
                                                    {interview.round}
                                                </span>
                                            </td>

                                            {/* Date */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-1.5">
                                                    <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                                                    </svg>
                                                    <span className="text-[13px] text-gray-700 dark:text-gray-300 font-medium">
                                                        {formatDate(interview.interviewDate)}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Time */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-1.5">
                                                    <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" />
                                                    </svg>
                                                    <span className="text-[13px] text-gray-600 dark:text-gray-300">
                                                        {formatTime(interview.startTime)} – {formatTime(interview.endTime)}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-3.5">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap ${badge}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                                                    {interview.status}
                                                </span>
                                            </td>

                                            {/* Action */}
                                            <td
                                                className="w-[120px] px-3 py-3.5 text-center sticky right-0 bg-white dark:bg-gray-900 group-hover:bg-indigo-50/30 dark:group-hover:bg-indigo-900/10 z-10"
                                                style={{ boxShadow: "-4px 0 10px -4px rgba(0,0,0,0.06)" }}
                                            >
                                                {action ? (
                                                    <button
                                                        onClick={() => navigate(action.path)}
                                                        className={`
                            inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg
                            border transition-all hover:scale-[1.02] active:scale-[0.97]
                            ${action.variant === "view"
                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700"
                                                                : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700"
                                                            }
                          `}
                                                    >
                                                        {action.variant === "view" ? (
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" d="M12 4v16m8-8H4" />
                                                            </svg>
                                                        )}
                                                        {action.label}
                                                    </button>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-red-50 text-red-400 ring-1 ring-red-200 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-800">
                                                        Rejected
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default MyInterviews;