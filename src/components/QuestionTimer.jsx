import React, { useEffect, useState } from "react";

const QuestionTimer = ({ questionIndex, onTimeUp, timeLimit = 20, darkMode = false }) => {
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  useEffect(() => {
    setTimeLeft(timeLimit);
  }, [questionIndex, timeLimit]);

  useEffect(() => {
    if (timeLeft === 0) {
      onTimeUp?.();
      return;
    }
    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, onTimeUp]);

  const percentage = (timeLeft / timeLimit) * 100;

  // Dark mode (mobile bar) — light stroke colors
  // Light mode (desktop float) — original colors
  const timerColor = darkMode
    ? percentage > 60
      ? "stroke-green-400"
      : percentage > 30
        ? "stroke-yellow-300"
        : "stroke-red-400"
    : percentage > 60
      ? "stroke-green-500"
      : percentage > 30
        ? "stroke-yellow-500"
        : "stroke-red-600";

  const trackColor = darkMode ? "stroke-white/20" : "stroke-gray-300";
  const textColor = darkMode ? "#ffffff" : "#1e293b";
  const labelColor = darkMode ? "#ffffff" : "#64748b";

  return (
    <div className="flex items-center gap-2">
      {/* Circular Timer */}
      <div className="relative w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="40%"
            className={trackColor}
            strokeWidth="4"
            fill="none"
          />
          <circle
            cx="50%"
            cy="50%"
            r="40%"
            className={`${timerColor} transition-all duration-300`}
            strokeWidth="4"
            fill="none"
            strokeDasharray="125.6"
            strokeDashoffset={125.6 - (percentage / 100) * 125.6}
            strokeLinecap="round"
          />
        </svg>

        <div
          className="absolute inset-0 flex items-center justify-center text-xs font-semibold"
          style={{ color: textColor }}
        >
          {timeLeft}s
        </div>
      </div>

      {/* "Time left" label */}
      <div
        className="text-[10px] sm:text-xs font-medium"
        style={{ color: labelColor }}
      >
        Time left
      </div>
    </div>
  );
};

export default QuestionTimer;
