import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllInterviews } from "../../../features/HR_Slices/Interview/InterviewSlice";
import { useNavigate } from "react-router-dom";
import { getModulePathByMenu } from "../../../utils/navigation";
import SkeletonPage from "../../../components/skeletons/skeletonPage";
import { Eye, CalendarDays, Users } from "lucide-react";

const AllInterviews = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { allInterviews, loading } = useSelector(
        (state) => state.candidatesOverview
    );

    const modules = useSelector((state) => state.modules.list);
    const menus = useSelector((state) => state.menus.list);
    const modulePath = getModulePathByMenu(
        "interview_evaluation",
        modules,
        menus
    );

    useEffect(() => {
        dispatch(fetchAllInterviews());
    }, [dispatch]);

    // ===== Group interviews by candidate =====
    const candidatesWithInterviews = useMemo(() => {
        const map = {};
        allInterviews?.forEach((item) => {
            const cid = item.candidateId;
            if (!map[cid]) {
                map[cid] = {
                    candidate: item.candidate,
                    jobOpening: item.jobOpening,
                    interviews: [],
                };
            }
            map[cid].interviews.push(item);
        });
        return Object.values(map);
    }, [allInterviews]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-6 py-6 font-sans text-gray-800 dark:text-gray-100">
            {/* Header */}
            <div className="mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                        Interviews
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        All scheduled & completed interviews across hiring pipeline
                    </p>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-[900px] w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Candidate
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Job
                                </th>
                                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Rounds
                                </th>
                                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Last Interview
                                </th>
                                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky right-0 bg-gray-50 dark:bg-gray-800/60 border-l border-gray-200 dark:border-gray-800">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <SkeletonPage rows={6} columns={6} />
                            ) : candidatesWithInterviews?.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-14">
                                        <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
                                            <Users className="w-8 h-8 opacity-40" />
                                            <p className="text-sm font-medium">
                                                No interviews found
                                            </p>
                                            <p className="text-xs">
                                                Interviews will appear here once scheduled
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                candidatesWithInterviews.map((item) => {
                                    const sortedRounds = [...item.interviews].sort(
                                        (a, b) =>
                                            new Date(a.interviewDate) -
                                            new Date(b.interviewDate)
                                    );

                                    const lastInterview =
                                        sortedRounds[sortedRounds.length - 1];

                                    return (
                                        <tr
                                            key={item.candidate.id}
                                            className="hover:bg-blue-50/50 dark:hover:bg-gray-800/50 transition-colors duration-100 group"
                                        >
                                            {/* Candidate */}
                                            <td className="px-5 py-3">
                                                <p className="font-semibold text-gray-900 dark:text-white text-[13px]">
                                                    {item.candidate?.name}
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                                    {item.candidate?.email}
                                                </p>
                                            </td>

                                            {/* Job */}
                                            <td className="px-5 py-3">
                                                <span className="text-gray-700 dark:text-gray-300 text-sm">
                                                    {item.jobOpening?.title}
                                                </span>
                                            </td>

                                            {/* Rounds */}
                                            <td className="px-5 py-3 text-center">
                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold">
                                                    {item.interviews.length}
                                                </span>
                                            </td>

                                            {/* Last Interview Date */}
                                            <td className="px-5 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                                                {new Date(
                                                    lastInterview.interviewDate
                                                ).toLocaleDateString("en-GB", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-3 text-center">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                            ${lastInterview.status === "Scheduled"
                                                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800"
                                                            : lastInterview.status === "Completed"
                                                                ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-100 dark:border-green-800"
                                                                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                                                        }`}
                                                >
                                                    {lastInterview.status}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-3 text-center sticky right-0 bg-white dark:bg-gray-900 group-hover:bg-blue-50/50 dark:group-hover:bg-gray-800/50 border-l border-gray-100 dark:border-gray-800 transition-colors">
                                                <button
                                                    onClick={() =>
                                                        navigate(
                                                            `/module/${modulePath}/interview_evaluation/interviews/${item.candidate.id}`
                                                        )
                                                    }
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-100 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 transition-all"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
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

export default AllInterviews;