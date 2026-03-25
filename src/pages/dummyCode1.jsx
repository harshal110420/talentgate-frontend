import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import {
    ShieldCheck,
    Loader2,
    FileText,
    Rocket,
} from "lucide-react";
import { motion } from "framer-motion";
import ExamAccessDenied from "../components/common/ExamAccessDenied";

/* ------------------ UI PARTS ------------------ */

const BrandingHeader = () => (
    <div className="flex items-center justify-center mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-blue-700 tracking-wide">
            Talent Gate
        </h1>
    </div>
);

const Stepper = () => (
    <div className="flex justify-between items-center mb-6">
        <div className="flex-1 flex items-center gap-2 text-blue-600 font-medium">
            <ShieldCheck className="w-5 h-5" />
            <span>Precautions</span>
        </div>

        <div className="flex-1 flex items-center gap-2 text-blue-600 font-medium">
            <FileText className="w-5 h-5" />
            <span>Instructions</span>
        </div>

        <div className="flex-1 flex items-center gap-2 text-blue-600 font-medium">
            <Rocket className="w-5 h-5" />
            <span>Exam Start</span>
        </div>
    </div>
);

/* ------------------ MAIN COMPONENT ------------------ */

const ExamLoginPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");

    const [loading, setLoading] = useState(true);
    const [valid, setValid] = useState(false);
    const [error, setError] = useState("");
    const [accepted, setAccepted] = useState(false);

    /* ---------- TOKEN VERIFICATION ---------- */
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
        else {
            setError("No token provided.");
            setLoading(false);
        }
    }, [token]);

    /* ---------- START EXAM ---------- */
    const handleStartExam = async () => {
        if (!accepted) return;

        try {
            /**
             * 1️⃣ Trigger permission prompt safely
             *    DO NOT keep stream alive
             */
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });

            // 🔑 Immediately release camera & mic
            stream.getTracks().forEach((track) => track.stop());

            /**
             * 2️⃣ Fullscreen (must be inside user gesture)
             */
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            }

            /**
             * 3️⃣ Notify backend
             */
            await axiosInstance.post("/candidate/start-exam", { token });

            /**
             * 4️⃣ Navigate to exam UI
             */
            navigate(`/exam-ui?token=${token}`);
        } catch {
            alert(
                "Camera, Microphone & Fullscreen access is mandatory to start the exam."
            );
        }
    };

    /* ---------- UI STATES ---------- */

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-blue-600 font-semibold text-lg">
                <Loader2 className="animate-spin w-6 h-6 mr-2" />
                Verifying token...
            </div>
        );
    }

    if (!valid) {
        return <ExamAccessDenied reason={error || "invalid"} />;
    }

    /* ---------- MAIN UI ---------- */

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="bg-white p-5 sm:p-8 rounded-xl shadow-lg max-w-xl w-full border border-gray-200"
            >
                <BrandingHeader />
                <Stepper />

                <p className="text-gray-600 text-sm sm:text-base mb-4">
                    Please read the following instructions carefully before proceeding.
                </p>

                <ul className="list-disc pl-6 text-sm text-gray-700 space-y-2 mb-6">
                    <li>Stable internet connection is mandatory.</li>
                    <li>Do not refresh or close the tab once exam starts.</li>
                    <li>Tab switching or minimizing will auto-submit the exam.</li>
                    <li>Camera & microphone must remain active throughout the exam.</li>
                    <li>Exiting fullscreen will auto-submit the exam.</li>
                </ul>

                <div className="mb-6 flex items-start">
                    <input
                        type="checkbox"
                        checked={accepted}
                        onChange={(e) => setAccepted(e.target.checked)}
                        className="mt-1 w-4 h-4 mr-2"
                    />
                    <label className="text-sm text-gray-800">
                        I have read and accept all the above rules.
                    </label>
                </div>

                <button
                    disabled={!accepted}
                    onClick={handleStartExam}
                    className={`w-full py-2 rounded-md text-white font-semibold transition ${accepted
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-300 cursor-not-allowed"
                        }`}
                >
                    🚀 Start Exam
                </button>
            </motion.div>
        </div>
    );
};

export default ExamLoginPage;
