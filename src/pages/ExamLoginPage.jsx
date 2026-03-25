import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import {
  ShieldCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  Camera,
  Mic,
  AlertTriangle,
  Monitor,
  Wifi,
  Eye,
  Clock,
  Maximize,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ExamAccessDenied from "../components/common/ExamAccessDenied";

/* ─── Shared styles ─────────────────────────────────────────── */
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');`;

const CSS = `
  * { font-family: 'Plus Jakarta Sans', sans-serif; }
  .mono { font-family: 'JetBrains Mono', monospace; }

  :root {
    --navy:   #0a1628;
    --navy2:  #0f2040;
    --blue:   #1d4ed8;
    --blue-l: #3b82f6;
    --slate:  #64748b;
    --border: #e2e8f0;
  }

  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulseRing {
    0%   { transform: scale(1);   opacity: .6; }
    100% { transform: scale(1.5); opacity: 0;  }
  }

  .animate-fadeUp { animation: fadeUp .5s ease both; }

  .rule-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 14px;
    border-radius: 10px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    font-size: 13px;
    color: #334155;
    line-height: 1.5;
    transition: background .2s;
  }
  .rule-item:hover { background: #f1f5f9; }
  .rule-item.danger { background: #fff5f5; border-color: #fecaca; }
  .rule-item.danger:hover { background: #fee2e2; }

  .step-dot {
    width: 28px; height: 28px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700;
    flex-shrink: 0;
  }
  .step-line {
    flex: 1; height: 2px; border-radius: 2px;
  }

  .permission-box {
    border-radius: 12px;
    border: 1.5px solid #e2e8f0;
    padding: 14px 16px;
    background: #f8fafc;
    transition: all .25s;
  }
  .permission-box.granted {
    border-color: #86efac;
    background: #f0fdf4;
  }
  .permission-box.error {
    border-color: #fca5a5;
    background: #fff5f5;
  }

  .start-btn {
    width: 100%;
    padding: 14px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.02em;
    transition: all .2s;
    border: none;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }
  .start-btn.active {
    background: linear-gradient(135deg, #1d4ed8, #2563eb);
    color: white;
    box-shadow: 0 4px 20px #1d4ed840;
  }
  .start-btn.active:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 24px #1d4ed855;
  }
  .start-btn.active:active { transform: translateY(0); }
  .start-btn.inactive {
    background: #e2e8f0;
    color: #94a3b8;
    cursor: not-allowed;
  }

  /* Mobile tweaks */
  @media (max-width: 480px) {
    .rules-grid { grid-template-columns: 1fr !important; }
  }
`;

/* ─── Subcomponents ─────────────────────────────────────────── */

const BrandLogo = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
    <div style={{
      width: 38, height: 38, borderRadius: 10,
      background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 4px 12px #1d4ed840",
    }}>
      <ShieldCheck size={20} color="white" />
    </div>
    <div>
      <div style={{ fontWeight: 800, fontSize: 17, color: "#0a1628", letterSpacing: "-0.02em" }}>
        Talent Gate
      </div>
      <div className="mono" style={{ fontSize: 10, color: "#64748b", letterSpacing: "0.1em" }}>
        SECURE ASSESSMENT PLATFORM
      </div>
    </div>
  </div>
);

const StepBar = () => {
  const steps = ["Verify", "Instructions", "Launch"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div className="step-dot" style={{
              background: i <= 1 ? "linear-gradient(135deg,#1d4ed8,#3b82f6)" : "#e2e8f0",
              color: i <= 1 ? "white" : "#94a3b8",
            }}>
              {i + 1}
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: i <= 1 ? "#1d4ed8" : "#94a3b8", whiteSpace: "nowrap" }}>
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="step-line" style={{
              background: i === 0 ? "linear-gradient(90deg,#3b82f6,#93c5fd)" : "#e2e8f0",
              margin: "0 6px", marginBottom: 18,
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const rules = [
  { icon: <Wifi size={14} />, text: "Stable, uninterrupted internet connection is mandatory throughout the exam.", danger: false },
  { icon: <Monitor size={14} />, text: "Do NOT refresh, close, or navigate away from this browser tab once the exam starts.", danger: true },
  { icon: <Eye size={14} />, text: "Screen and webcam must remain unobstructed at all times. Session may be recorded.", danger: false },
  { icon: <Camera size={14} />, text: "Camera and microphone must remain ON throughout. Audio/video monitoring is active.", danger: false },
  { icon: <Maximize size={14} />, text: "Exiting Fullscreen mode will result in automatic exam submission.", danger: true },
  { icon: <AlertTriangle size={14} />, text: "Tab switching, new windows, or ALT+TAB will trigger automatic submission.", danger: true },
  { icon: <Monitor size={14} />, text: "Minimizing the browser window will auto-submit the exam.", danger: true },
  { icon: <Clock size={14} />, text: "Use only one device and one window for the entire exam session.", danger: false },
];

/* ─── Main ──────────────────────────────────────────────────── */
const ExamLoginPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);

  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [permissionError, setPermissionError] = useState("");

  /* token verify */
  useEffect(() => {
    const verifyToken = async () => {
      try {
        await axiosInstance.post("/candidate/verify-token", { token });
        setValid(true);
      } catch {
        setError("Invalid or expired exam link.");
      } finally {
        setLoading(false);
      }
    };
    if (token) verifyToken();
    else { setError("No token provided."); setLoading(false); }
  }, [token]);

  /* checkbox + permission */
  const handleCheckboxChange = async (e) => {
    const isChecked = e.target.checked;
    setAccepted(isChecked);
    if (!isChecked) { setPermissionGranted(false); setPermissionError(""); return; }

    setPermissionLoading(true);
    setPermissionError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
      sessionStorage.setItem("mediaPermissionGranted", "true");
      setPermissionGranted(true);
      // stream.getTracks().forEach((t) => t.stop());
    } catch (err) {
      setAccepted(false);
      setPermissionGranted(false);
      let msg = "Camera and Microphone access is required.";
      if (err.name === "NotAllowedError") msg = "Please allow camera & microphone in your browser settings.";
      else if (err.name === "NotFoundError") msg = "No camera or microphone found on your device.";
      setPermissionError(msg);
    } finally {
      setPermissionLoading(false);
    }
  };

  /* start exam */
  const handleStartExam = async () => {
    if (!accepted || !permissionGranted) return;
    try {
      try {
        if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
        else if (document.documentElement.webkitRequestFullscreen) await document.documentElement.webkitRequestFullscreen();
      } catch (fsErr) { console.warn("Fullscreen failed:", fsErr); }
      await new Promise((r) => setTimeout(r, 200));
      await axiosInstance.post("/candidate/start-exam", { token });
      navigate(`/exam-ui?token=${token}`);
    } catch (err) {
      console.error(err);
      alert("Failed to start exam. Please try again.");
      if (document.fullscreenElement) document.exitFullscreen();
    }
  };

  /* ── States ── */
  if (loading) return (
    <>
      <style>{FONTS}{CSS}</style>
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ position: "relative", width: 48, height: 48, margin: "0 auto 16px" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid #dbeafe", animation: "pulseRing 1.2s ease-out infinite" }} />
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Loader2 size={22} color="white" style={{ animation: "spin 1s linear infinite" }} />
            </div>
          </div>
          <p style={{ color: "#64748b", fontSize: 14, fontWeight: 500 }}>Verifying your exam link…</p>
        </div>
      </div>
    </>
  );

  if (!valid) return <ExamAccessDenied reason={error || "invalid"} />;

  /* ── Main UI ── */
  return (
    <>
      <style>{FONTS}{CSS}</style>

      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #f0f4ff 0%, #f8fafc 50%, #eef2ff 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px 16px",
      }}>
        {/* Decorative blobs */}
        <div style={{ position: "fixed", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, #bfdbfe40, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "fixed", bottom: -60, left: -60, width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, #c7d2fe40, transparent 70%)", pointerEvents: "none" }} />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          style={{
            background: "white",
            borderRadius: 20,
            boxShadow: "0 8px 40px #0a162818, 0 2px 8px #0a16280a",
            border: "1px solid #e2e8f0",
            width: "100%",
            maxWidth: 560,
            overflow: "hidden",
          }}
        >
          {/* Navy top bar */}
          <div style={{ background: "linear-gradient(135deg, #0a1628, #0f2040)", padding: "20px 24px" }}>
            <BrandLogo />
            <StepBar />
            <div style={{
              background: "#ffffff18", borderRadius: 10, padding: "10px 14px",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80" }} />
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#4ade80", animation: "pulseRing 1.5s ease-out infinite" }} />
              </div>
              <p style={{ fontSize: 12, color: "#93c5fd", fontWeight: 500, margin: 0 }}>
                Exam link verified — please read all instructions before proceeding
              </p>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "24px 24px 28px" }}>

            {/* Section label */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 3, height: 18, borderRadius: 2, background: "linear-gradient(#1d4ed8,#3b82f6)" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0a1628", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Exam Rules & Precautions
              </span>
            </div>

            {/* Rules */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
              {rules.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`rule-item${r.danger ? " danger" : ""}`}
                >
                  <span style={{ color: r.danger ? "#ef4444" : "#3b82f6", marginTop: 1, flexShrink: 0 }}>{r.icon}</span>
                  <span>{r.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Permission box */}
            <AnimatePresence mode="wait">
              <motion.div
                key={permissionGranted ? "granted" : permissionError ? "error" : "idle"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`permission-box${permissionGranted ? " granted" : permissionError ? " error" : ""}`}
                style={{ marginBottom: 18 }}
              >
                {/* Checkbox row */}
                <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
                  <div style={{ position: "relative", marginTop: 1, flexShrink: 0 }}>
                    <input
                      type="checkbox"
                      checked={accepted}
                      onChange={handleCheckboxChange}
                      disabled={permissionLoading}
                      style={{ width: 18, height: 18, accentColor: "#1d4ed8", cursor: permissionLoading ? "not-allowed" : "pointer" }}
                    />
                  </div>
                  <span style={{ fontSize: 13, color: "#1e293b", lineHeight: 1.55, fontWeight: 500 }}>
                    I have read all instructions and consent to camera & microphone monitoring during the exam.
                  </span>
                </label>

                {/* Permission feedback */}
                {permissionLoading && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "#eff6ff" }}>
                    <Loader2 size={14} color="#3b82f6" style={{ animation: "spin 1s linear infinite" }} />
                    <span style={{ fontSize: 12, color: "#2563eb", fontWeight: 500 }}>Requesting camera & microphone access…</span>
                  </div>
                )}

                {permissionGranted && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "#dcfce7" }}>
                    <CheckCircle2 size={14} color="#16a34a" />
                    <span style={{ fontSize: 12, color: "#15803d", fontWeight: 600 }}>Permissions granted — you're ready to begin</span>
                  </div>
                )}

                {permissionError && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "#fee2e2" }}>
                    <XCircle size={14} color="#dc2626" style={{ marginTop: 1, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#b91c1c", fontWeight: 500 }}>{permissionError}</span>
                  </div>
                )}

                {/* Device indicators */}
                {permissionGranted && (
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    {[{ icon: <Camera size={12} />, label: "Camera" }, { icon: <Mic size={12} />, label: "Microphone" }].map((d) => (
                      <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: "#bbf7d0", border: "1px solid #86efac" }}>
                        <span style={{ color: "#15803d" }}>{d.icon}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#15803d" }}>{d.label} ✓</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* CTA button */}
            <button
              className={`start-btn ${accepted && permissionGranted ? "active" : "inactive"}`}
              disabled={!accepted || !permissionGranted}
              onClick={handleStartExam}
            >
              {!accepted
                ? "Accept rules to continue"
                : !permissionGranted
                  ? "⏳ Waiting for permissions…"
                  : "🚀 Launch Exam"}
            </button>

            {/* Footer note */}
            <p className="mono" style={{ textAlign: "center", fontSize: 10, color: "#94a3b8", marginTop: 14 }}>
              Proctored · Encrypted · Secure Session
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default ExamLoginPage;
