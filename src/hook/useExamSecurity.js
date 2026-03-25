import { useEffect } from "react";

const useExamSecurity = ({ submitExam, isSubmittingRef }) => {
  useEffect(() => {
    /* ---------------- FULLSCREEN EXIT ---------------- */
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !isSubmittingRef.current) {
        submitExam(false, true);
      }
    };

    /* ---------------- TAB SWITCH / MINIMIZE ---------------- */
    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmittingRef.current) {
        submitExam(false, true);
      }
    };

    const handleBlur = () => {
      if (!isSubmittingRef.current) {
        submitExam(false, true);
      }
    };

    /* ---------------- ESC / RELOAD KEYS ---------------- */
    const handleKeyDown = (e) => {
      const isReload =
        (e.ctrlKey && e.key.toLowerCase() === "r") ||
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "r") ||
        e.key === "F5";

      const isEscape = e.key === "Escape";

      if ((isReload || isEscape) && !isSubmittingRef.current) {
        e.preventDefault();
        submitExam(true, true);
      }
    };

    /* ---------------- HARD RELOAD DETECTION ---------------- */
    const handleBeforeUnload = (e) => {
      if (!isSubmittingRef.current) {
        sessionStorage.setItem("reloadAttempt", "true");
        e.preventDefault();
        e.returnValue = "";
      }
    };

    /* ---------------- LISTENERS ---------------- */
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [submitExam, isSubmittingRef]);

  /* ---------------- AFTER RELOAD CHECK ---------------- */
  useEffect(() => {
    const reloadAttempt = sessionStorage.getItem("reloadAttempt");

    if (reloadAttempt && !isSubmittingRef.current) {
      sessionStorage.removeItem("reloadAttempt");
      submitExam(true, true);
    }
  }, [submitExam, isSubmittingRef]);
};

export default useExamSecurity;
