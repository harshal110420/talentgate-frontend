import { useState } from "react";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  HELPERS                                                                     */
/* ─────────────────────────────────────────────────────────────────────────── */
const ACTIVE_STATUSES = ["Scheduled", "Rescheduled"];

const formatTo12Hour = (time24) => {
    if (!time24) return "";
    const [hour, minute] = time24.split(":");
    let h = parseInt(hour);
    const suffix = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${minute} ${suffix}`;
};

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

/* ─────────────────────────────────────────────────────────────────────────── */
/*  INTERVIEW INFO MODAL                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */
const InterviewInfoModal = ({ interviews, onClose }) => (
    <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[3px] flex items-center justify-center z-[200]"
        onClick={onClose}
    >
        <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-100 dark:border-gray-800"
            style={{ animation: "fadeSlideUp 0.2s cubic-bezier(0.4,0,0.2,1)" }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <div>
                    <h2 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">
                        Scheduled Interviews
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">{interviews[0]?.interviewDate}</p>
                </div>
                <button
                    onClick={onClose}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                {interviews.map((interview, idx) => (
                    <div
                        key={idx}
                        className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 hover:border-indigo-200 dark:hover:border-indigo-700 transition-all"
                    >
                        {/* Candidate */}
                        <div className="flex items-center gap-2.5 mb-3">
                            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {interview.candidate?.name?.[0]?.toUpperCase() || "?"}
                            </span>
                            <div>
                                <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                                    {interview.candidate?.name}
                                </p>
                                <p className="text-[11px] text-gray-400">{interview.candidate?.email}</p>
                            </div>
                        </div>

                        {/* Info grid */}
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg px-2.5 py-2">
                                <p className="text-gray-400 text-[10px] uppercase tracking-wide mb-0.5">Time</p>
                                <p className="font-semibold text-gray-800 dark:text-gray-100">
                                    {formatTo12Hour(interview.startTime)} – {formatTo12Hour(interview.endTime)}
                                </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg px-2.5 py-2">
                                <p className="text-gray-400 text-[10px] uppercase tracking-wide mb-0.5">Round</p>
                                <p className="font-semibold text-gray-800 dark:text-gray-100">{interview.round}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg px-2.5 py-2">
                                <p className="text-gray-400 text-[10px] uppercase tracking-wide mb-0.5">Mode</p>
                                <p className="font-semibold text-gray-800 dark:text-gray-100">{interview.interviewType}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg px-2.5 py-2">
                                <p className="text-gray-400 text-[10px] uppercase tracking-wide mb-0.5">Position</p>
                                <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{interview.jobOpening?.title || "—"}</p>
                            </div>
                        </div>

                        {/* Panel */}
                        {interview.panel?.length > 0 && (
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">Panel</p>
                                <div className="flex flex-wrap gap-1">
                                    {interview.panel.map((p, i) => {
                                        const u = p.user;
                                        if (!u) return null;
                                        const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
                                        return (
                                            <span
                                                key={i}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:ring-indigo-700"
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                                {name}
                                                <span className="text-indigo-400">· {p.role}</span>
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <style>{`
        @keyframes fadeSlideUp {
          from { opacity:0; transform:translateY(10px) scale(0.98); }
          to   { opacity:1; transform:translateY(0)    scale(1);    }
        }
      `}</style>
        </div>
    </div>
);

/* ─────────────────────────────────────────────────────────────────────────── */
/*  MAIN CALENDAR                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */
const CustomCalendar = ({ selectedDate, onSelect, scheduledInterviews = [] }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showInterviewModal, setShowInterviewModal] = useState(false);
    const [selectedDayInterviews, setSelectedDayInterviews] = useState([]);

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isPastDate = (day) => {
        if (!day) return false;
        const d = new Date(year, month, day);
        d.setHours(0, 0, 0, 0);
        return d < today;
    };

    const isToday = (day) => {
        if (!day) return false;
        const d = new Date(year, month, day);
        return d.toDateString() === today.toDateString();
    };

    const isSelected = (day) => {
        if (!day || !selectedDate) return false;
        const d = new Date(selectedDate);
        return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    };

    const getInterviewsForDay = (day) => {
        if (!day || !Array.isArray(scheduledInterviews)) return [];
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return scheduledInterviews.filter(
            (i) => i.interviewDate === dateStr && ACTIVE_STATUSES.includes(i.status)
        );
    };

    const selectDate = (day) => {
        if (!day || isPastDate(day)) return;
        const d = new Date(year, month, day);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        onSelect(`${yyyy}-${mm}-${dd}`);
    };

    const handleDotClick = (e, dayInterviews) => {
        e.stopPropagation();
        setSelectedDayInterviews(dayInterviews);
        setShowInterviewModal(true);
    };

    const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

    /* ─── Selected date display ─── */
    const formattedSelected = selectedDate
        ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
            weekday: "short", day: "numeric", month: "long", year: "numeric",
        })
        : null;

    return (
        <>
            <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">

                {/* ── HEADER ── */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-700">
                    <button
                        onClick={prevMonth}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">
                        {MONTH_NAMES[month]} {year}
                    </span>

                    <button
                        onClick={nextMonth}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* ── WEEKDAYS ── */}
                <div className="grid grid-cols-7 px-3 pt-3 pb-1">
                    {WEEK_DAYS.map((d) => (
                        <div key={d} className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                            {d}
                        </div>
                    ))}
                </div>

                {/* ── DAYS ── */}
                <div className="grid grid-cols-7 gap-y-0.5 px-3 pb-3">
                    {days.map((day, idx) => {
                        const dayInterviews = getInterviewsForDay(day);
                        const past = isPastDate(day);
                        const todayDay = isToday(day);
                        const selected = isSelected(day);

                        return (
                            <div key={idx} className="flex flex-col items-center py-0.5">
                                <button
                                    onClick={() => selectDate(day)}
                                    disabled={!day || past}
                                    className={`
                    relative w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-medium transition-all
                    ${!day ? "invisible" : ""}
                    ${past
                                            ? "text-gray-200 dark:text-gray-700 cursor-not-allowed"
                                            : selected
                                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900 scale-105"
                                                : todayDay
                                                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-700 hover:bg-indigo-100"
                                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        }
                  `}
                                >
                                    {day}
                                </button>

                                {/* Interview dot indicator */}
                                {dayInterviews.length > 0 && (
                                    <button
                                        onClick={(e) => handleDotClick(e, dayInterviews)}
                                        className="group flex items-center gap-0.5 mt-0.5"
                                        title={`${dayInterviews.length} interview(s) scheduled`}
                                    >
                                        {dayInterviews.length <= 3
                                            ? Array.from({ length: dayInterviews.length }).map((_, i) => (
                                                <span key={i} className="w-1 h-1 rounded-full bg-teal-500 group-hover:bg-teal-600 transition-colors" />
                                            ))
                                            : (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-teal-500" />
                                                    <span className="text-[8px] text-teal-600 font-semibold leading-none">+{dayInterviews.length}</span>
                                                </>
                                            )
                                        }
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* ── DATE STATUS BANNER ── */}
                <div className={`
          px-4 py-2.5 border-t transition-all duration-200
          ${formattedSelected
                        ? "border-gray-100 dark:border-gray-700 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-amber-100 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20"
                    }
        `}>
                    {formattedSelected ? (
                        /* ✅ Date selected — show confirmation */
                        <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </span>
                            <span className="text-[12px] font-medium text-indigo-700 dark:text-indigo-300">
                                {formattedSelected}
                            </span>
                        </div>
                    ) : (
                        /* ⚠️ No date selected — prompt user */
                        <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shrink-0 animate-pulse">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </span>
                            <span className="text-[12px] font-medium text-amber-700 dark:text-amber-400">
                                Please select an interview date to continue
                            </span>
                        </div>
                    )}
                </div>

                {/* ── LEGEND ── */}
                <div className="px-4 py-2 border-t border-gray-50 dark:border-gray-800 flex items-center gap-4 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-indigo-600 inline-block" />
                        Selected
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-indigo-50 ring-1 ring-indigo-200 inline-block" />
                        Today
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block" />
                        Interviews
                    </span>
                </div>
            </div>

            {/* ── INTERVIEW INFO MODAL ── */}
            {showInterviewModal && selectedDayInterviews.length > 0 && (
                <InterviewInfoModal
                    interviews={selectedDayInterviews}
                    onClose={() => { setShowInterviewModal(false); setSelectedDayInterviews([]); }}
                />
            )}
        </>
    );
};

export default CustomCalendar;
