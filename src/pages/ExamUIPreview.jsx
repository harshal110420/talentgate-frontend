import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import QuestionCard from "../components/QuestionCards";
import QuestionTimer from "../components/QuestionTimer";
import Timebar from "../components/common/Timebar";
import axiosInstance from "../api/axiosInstance";
import useExamSecurity from "../hook/useExamSecurity";
import { AlertTriangle, ChevronRight, SkipForward, CheckCircle, Loader2 } from "lucide-react";

/* ─── Styles ─────────────────────────────────────────────────── */
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');`;

const CSS = `
  * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
  .mono { font-family: 'JetBrains Mono', monospace; }

  :root {
    --navy:  #0a1628;
    --blue:  #1d4ed8;
    --blue-l:#3b82f6;
    --bg:    #f8fafc;
  }

  @keyframes pulseRing {
    0%   { transform: scale(1);   opacity: .5; }
    100% { transform: scale(1.6); opacity: 0;  }
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .exam-bg {
    min-height: 100vh;
    background: #f1f5f9;
    display: flex;
    flex-direction: column;
  }

  /* ── Top bar ── */
  .top-bar {
    position: sticky;
    top: 0;
    z-index: 100;
    background: linear-gradient(135deg, #0a1628, #0f2040);
    border-bottom: 1px solid #1e3a5f;
    padding: 0;
  }

  /* ── Camera + timer — MOBILE: inline bar, DESKTOP: floating ── */

  /* Mobile inline bar (default) */
  .cam-timer-wrap {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    background: #0f2040;
    border-bottom: 1px solid #1e3a5f;
    padding: 8px 14px;
    width: 100%;
    animation: slideDown .4s ease both;
    /* NOT fixed on mobile */
    position: relative;
    z-index: 90;
  }
  .cam-box {
    width: 72px;
    height: 54px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px #0a162860;
    border: 2px solid #1e3a5f;
    background: #0a1628;
    flex-shrink: 0;
  }
  .cam-box video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scaleX(-1);
  }
  .timer-box {
    background: #1e3a5f;
    border-radius: 10px;
    border: 1.5px solid #2d5a8e;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 14px;
    flex: 1;
    gap: 8px;
  }
  .timer-label {
    font-size: 11px;
    color: #93c5fd;
    font-weight: 500;
  }

  /* Desktop: restore floating behaviour */
  @media (min-width: 640px) {
    .cam-timer-wrap {
      position: fixed;
      top: 68px;
      right: 16px;
      width: auto;
      background: transparent;
      border-bottom: none;
      padding: 0;
      flex-direction: row;
      align-items: center;
      gap: 8px;
      z-index: 200;
    }
    .cam-box {
      width: 96px;
      height: 72px;
    }
    .timer-box {
      background: white;
      border: 1.5px solid #e2e8f0;
      box-shadow: 0 4px 16px #0a162820;
      flex: none;
      padding: 6px 10px;
    }
    .timer-label { display: none; }
  }

  /* ── Progress bar ── */
  .progress-track {
    height: 3px;
    background: #1e3a5f;
    width: 100%;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #60a5fa);
    transition: width .4s ease;
  }

  /* ── Content area ── */
  .content-area {
    flex: 1;
    padding: 16px 16px 100px;
    max-width: 720px;
    width: 100%;
    margin: 0 auto;
    animation: fadeIn .35s ease;
  }

  /* ── Question meta pill ── */
  .q-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
    flex-wrap: wrap;
    gap: 8px;
  }
  .q-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
  }
  .q-badge.num {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
  }
  .q-badge.brand {
    background: linear-gradient(135deg, #0a1628, #0f2040);
    color: #93c5fd;
    font-size: 11px;
    letter-spacing: .04em;
  }

  /* ── Question card wrapper ── */
  .q-card {
    background: white;
    border-radius: 16px;
    border: 1.5px solid #e2e8f0;
    box-shadow: 0 2px 12px #0a162810;
    overflow: hidden;
  }

  /* ── Last question warning ── */
  .last-warn {
    position: fixed;
    top: 68px;
    left: 50%;
    transform: translateX(-50%);
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 20px;
    padding: 6px 16px;
    font-size: 12px;
    font-weight: 600;
    color: #92400e;
    display: flex;
    align-items: center;
    gap: 6px;
    z-index: 300;
    box-shadow: 0 4px 12px #fde68a60;
    white-space: nowrap;
    animation: slideDown .3s ease;
  }

  /* ── Bottom action bar ── */
  .action-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-top: 1.5px solid #e2e8f0;
    box-shadow: 0 -4px 20px #0a162812;
    z-index: 100;
    padding: 12px 16px;
  }
  .action-inner {
    max-width: 720px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .btn-skip {
    flex: 1;
    padding: 12px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    border: 1.5px solid #e2e8f0;
    background: #f8fafc;
    color: #64748b;
    cursor: pointer;
    transition: all .2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .btn-skip:hover:not(:disabled) {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #475569;
  }
  .btn-skip:disabled { opacity: .5; cursor: not-allowed; }

  .btn-next {
    flex: 2;
    padding: 12px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    transition: all .2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: linear-gradient(135deg, #1d4ed8, #2563eb);
    color: white;
    box-shadow: 0 4px 14px #1d4ed830;
  }
  .btn-next:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px #1d4ed840; }
  .btn-next:active:not(:disabled) { transform: translateY(0); }
  .btn-next:disabled { background: #93c5fd; cursor: not-allowed; box-shadow: none; }

  .btn-submit {
    flex: 2;
    padding: 12px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    transition: all .2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: linear-gradient(135deg, #059669, #10b981);
    color: white;
    box-shadow: 0 4px 14px #05966930;
  }
  .btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px #05966940; }
  .btn-submit:disabled { background: #6ee7b7; cursor: not-allowed; box-shadow: none; }

  /* ── Loading screen ── */
  .loading-screen {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8fafc;
    flex-direction: column;
    gap: 14px;
  }
  .loading-spinner {
    width: 52px; height: 52px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1d4ed8, #3b82f6);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px #1d4ed840;
    position: relative;
  }
  .loading-spinner::before {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 3px solid #bfdbfe;
    animation: pulseRing 1.4s ease-out infinite;
  }

  /* ── Responsive ── */
  @media (min-width: 640px) {
    .cam-box { width: 96px; height: 72px; }
    .cam-timer-wrap { flex-direction: row; align-items: center; top: 68px; right: 16px; }
    .timer-box { min-width: auto; }
    .content-area { padding: 20px 24px 100px; }
    .btn-skip, .btn-next, .btn-submit { font-size: 14px; padding: 13px 20px; }
  }
`;

/* ─── Main Component ──────────────────────────────────────────── */
const ExamUIPreview = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [skippedQuestions, setSkippedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);


  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const isSubmittingRef = useRef(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  /* ── UI theme reset (force light) ── */
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.style.backgroundColor = "#f1f5f9";
    root.style.color = "#111827";
    return () => {
      root.style.backgroundColor = "";
      root.style.color = "";
    };
  }, []);

  /* ── Fetch exam ── */
  useEffect(() => {
    if (!token) { navigate("/exam-completed", { replace: true }); return; }
    const fetchExamData = async () => {
      try {
        const res = await axiosInstance.get(`/exam/start-ui?token=${token}`);
        setQuestions(res.data.exam?.questions || []);
      } catch {
        alert("Invalid or expired exam link.");
        navigate("/exam-completed", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    fetchExamData();
  }, [token, navigate]);

  /* ── Submit ── */
  const submitExam = async (fromReload = false, fromAuto = false) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      await axiosInstance.post("/exam/submit-exam", {
        token,
        responses: Object.entries(responses).map(([qid, selectedOption]) => ({
          questionId: Number(qid),
          selectedOption,
        })),
        skippedQuestions,
        submissionType: fromAuto || fromReload ? "AUTO" : "MANUAL",
      });
      navigate("/exam-completed", { replace: true });
    } catch {
      navigate("/exam-completed", { replace: true });
    }
  };

  useExamSecurity({ submitExam, isSubmittingRef });

  /* ── Camera ── */
  // useEffect(() => {
  //   let active = true;
  //   let retryCount = 0;
  //   const MAX_RETRIES = 3;

  //   const startCamera = async () => {
  //     try {
  //       const stream = await navigator.mediaDevices.getUserMedia({
  //         video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
  //         audio: true,
  //       });
  //       if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
  //       streamRef.current = stream;
  //       if (videoRef.current) {
  //         videoRef.current.srcObject = stream;
  //         videoRef.current.onloadedmetadata = () => {
  //           if (!active) return;
  //           const p = videoRef.current.play();
  //           if (p !== undefined) p.catch(() => {
  //             document.addEventListener("click", () => videoRef.current?.play().catch(() => { }), { once: true });
  //           });
  //         };
  //       }
  //       stream.getVideoTracks()[0].onended = () => {
  //         if (isSubmittingRef.current || !active) return;
  //         submitExam(true);
  //       };
  //     } catch (err) {
  //       console.error("Camera error:", err);
  //       if (retryCount < MAX_RETRIES && active) {
  //         retryCount++;
  //         setTimeout(() => startCamera(), 1000 * retryCount);
  //       } else {
  //         if (!isSubmittingRef.current) {
  //           alert("Unable to access camera. Exam will be submitted.");
  //           submitExam(true);
  //         }
  //       }
  //     }
  //   };

  //   const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  //   const id = setTimeout(() => startCamera(), isMobile ? 1200 : 600);
  //   return () => { active = false; clearTimeout(id); streamRef.current?.getTracks().forEach((t) => t.stop()); };
  // }, []);


  useEffect(() => {
    let active = true;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    const attachStream = (stream) => {
      if (!active) return;

      // videoRef ready nahi hai abhi — retry karo
      if (!videoRef.current) {
        setTimeout(() => attachStream(stream), 100);
        return;
      }

      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        if (!active) return;
        const p = videoRef.current.play();
        if (p !== undefined) {
          p.catch(() => {
            // Autoplay block hua — user interaction pe retry
            document.addEventListener(
              "click",
              () => videoRef.current?.play().catch(() => { }),
              { once: true }
            );
          });
        }
      };

      // Camera physically disconnect ho gaya
      stream.getVideoTracks()[0].onended = () => {
        if (isSubmittingRef.current || !active) return;
        submitExam(true);
      };
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: true,
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        attachStream(stream); // <-- separate function, retry loop ke saath

      } catch (err) {
        console.error("Camera error:", err);

        if (retryCount < MAX_RETRIES && active) {
          retryCount++;
          console.warn(`Camera retry ${retryCount}/${MAX_RETRIES}...`);
          setTimeout(() => startCamera(), 1000 * retryCount); // exponential backoff
        } else {
          if (!isSubmittingRef.current) {
            alert("Unable to access camera. Exam will be submitted.");
            submitExam(true);
          }
        }
      }
    };

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const id = setTimeout(() => startCamera(), isMobile ? 1200 : 600); // ✅ delay badhaaya

    return () => {
      active = false;
      clearTimeout(id);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  /* ── Answer handlers ── */
  const handleOptionSelect = (qid, option) => {
    setResponses((p) => ({ ...p, [qid]: option }));
    setSkippedQuestions((p) => p.filter((id) => id !== qid));
  };

  const handleSkipQuestion = () => {
    const qid = questions[currentQIndex]?.id;
    if (!qid) return;
    if (!responses[qid] && !skippedQuestions.includes(qid))
      setSkippedQuestions((p) => [...p, qid]);
    currentQIndex < questions.length - 1
      ? setCurrentQIndex((p) => p + 1)
      : submitExam();
  };

  const handleAutoSkip = () => {
    const qid = questions[currentQIndex]?.id;
    if (!responses[qid]) setSkippedQuestions((p) => [...p, qid]);
    currentQIndex === questions.length - 1
      ? submitExam(false, true)
      : setCurrentQIndex((p) => p + 1);
  };

  const progressPct = questions.length
    ? Math.round(((currentQIndex + 1) / questions.length) * 100)
    : 0;

  const answeredCount = Object.keys(responses).length;
  const isLastQ = currentQIndex === questions.length - 1;

  /* ── Loading ── */
  if (loading) return (
    <>
      <style>{FONTS}{CSS}</style>
      <div className="loading-screen">
        <div className="loading-spinner">
          <Loader2 size={24} color="white" style={{ animation: "spin 1s linear infinite" }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#1e293b", fontWeight: 600, fontSize: 15, margin: 0 }}>Loading your exam…</p>
          <p style={{ color: "#64748b", fontSize: 12, margin: "4px 0 0" }}>Please wait, do not close this window</p>
        </div>
      </div>
    </>
  );

  /* ── Main exam UI ── */
  return (
    <>
      <style>{FONTS}{CSS}</style>

      <div className="exam-bg">

        {/* ══ TOP BAR ══ */}
        <div className="top-bar">
          {/* Timebar sits at very top */}
          <Timebar
            key={questions[currentQIndex]?.id}
            questionId={questions[currentQIndex]?.id}
            timeLimit={questions[currentQIndex]?.timeLimit || 20}
            onTimeUp={handleAutoSkip}
          />

          {/* Nav row */}
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
          }}>
            {/* Brand */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 12 }}>🛡️</span>
              </div>
              <span style={{ color: "white", fontWeight: 700, fontSize: 14, letterSpacing: "-0.01em" }}>
                Talent Gate
              </span>
              <span className="mono" style={{ color: "white", fontSize: 10 }}>|</span>
              <span style={{ color: "white", fontSize: 11 }}>Assessment</span>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                padding: "4px 10px", borderRadius: 20,
                background: "#ffffff15", border: "1px solid #ffffff20",
                fontSize: 11, color: "#93c5fd", fontWeight: 600,
              }}>
                {currentQIndex + 1} / {questions.length}
              </div>
              <div style={{
                padding: "4px 10px", borderRadius: 20,
                background: "#ffffff10", border: "1px solid #ffffff15",
                fontSize: 11, color: "#4ade80", fontWeight: 600,
              }}>
                ✓ {answeredCount}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* ══ CAMERA + TIMER — mobile: inline under topbar, desktop: fixed float ══ */}
        <div className="cam-timer-wrap">
          {/* Timer */}
          <div className="timer-box">
            {/* <span className="timer-label">⏱ Time left</span> */}
            <QuestionTimer
              key={questions[currentQIndex]?.id}
              questionIndex={currentQIndex}
              timeLimit={questions[currentQIndex]?.timeLimit || 20}
              onTimeUp={handleAutoSkip}
              darkMode={isMobile}
            />
          </div>
          {/* Camera */}
          <div className="cam-box">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              webkit-playsinline="true"
            />
          </div>
        </div>

        {/* ══ LAST QUESTION WARNING ══ */}
        {isLastQ && questions.length > 0 && (
          <div className="last-warn">
            <AlertTriangle size={13} />
            Last question — submit before the timer ends!
          </div>
        )}

        {/* ══ CONTENT ══ */}
        <div className="content-area">

          {/* Question meta */}
          <div className="q-meta">
            <div className="q-badge num">
              Question {currentQIndex + 1} of {questions.length}
            </div>
            {/* <div className="q-badge brand">
              🛡️ TALENT GATE · SECURE
            </div> */}
          </div>

          {/* Question card */}
          <div className="q-card">
            <QuestionCard
              question={questions[currentQIndex]}
              questionNumber={currentQIndex + 1}
              selectedOption={responses[questions[currentQIndex]?.id]}
              onSelect={(opt) => handleOptionSelect(questions[currentQIndex].id, opt)}
            />
          </div>

          {/* Answered progress indicator */}
          <div style={{
            marginTop: 14, display: "flex", alignItems: "center",
            gap: 6, padding: "8px 14px", borderRadius: 10,
            background: "white", border: "1px solid #e2e8f0",
          }}>
            <div style={{
              width: `${answeredCount / Math.max(questions.length, 1) * 100}%`,
              height: 4, borderRadius: 4,
              background: "linear-gradient(90deg,#1d4ed8,#3b82f6)",
              minWidth: 0, transition: "width .4s ease",
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginLeft: "auto", whiteSpace: "nowrap" }}>
              {answeredCount} of {questions.length} answered
            </span>
          </div>
        </div>

        {/* ══ BOTTOM ACTION BAR ══ */}
        <div className="action-bar">
          <div className="action-inner">

            {/* Skip */}
            <button className="btn-skip" onClick={handleSkipQuestion} disabled={isSubmitting}>
              <SkipForward size={14} />
              Skip
            </button>

            {/* Next or Submit */}
            {!isLastQ ? (
              <button
                className="btn-next"
                onClick={() => setCurrentQIndex((p) => p + 1)}
                disabled={isSubmitting}
              >
                Next
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                className="btn-submit"
                onClick={() => submitExam(false)}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Submitting…</>
                  : <><CheckCircle size={14} /> Submit Exam</>
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ExamUIPreview;