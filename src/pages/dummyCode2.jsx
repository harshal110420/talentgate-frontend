import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import QuestionCard from "../components/QuestionCards";
import QuestionTimer from "../components/QuestionTimer";
import Timebar from "../components/common/Timebar";
import axiosInstance from "../api/axiosInstance";

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

    const isSubmittingRef = useRef(false);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    /* ---------- FETCH EXAM ---------- */
    useEffect(() => {
        if (!token) {
            navigate("/exam-completed", { replace: true });
            return;
        }

        const fetchExam = async () => {
            try {
                const res = await axiosInstance.get(`/exam/start-ui?token=${token}`);
                setQuestions(res.data.exam?.questions || []);
            } catch {
                navigate("/exam-completed", { replace: true });
            } finally {
                setLoading(false);
            }
        };

        fetchExam();
    }, [token, navigate]);

    /* ---------- CAMERA & MIC (OWNED HERE) ---------- */
    useEffect(() => {
        let active = true;

        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "user" },
                    audio: true,
                });

                if (!active) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }

                streamRef.current = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current.play().catch(() => { });
                    };
                }

                stream.getVideoTracks()[0].onended = () => {
                    submitExam(true);
                };
            } catch {
                submitExam(true);
            }
        };

        startCamera();

        return () => {
            active = false;
            streamRef.current?.getTracks().forEach((t) => t.stop());
        };
    }, []);

    /* ---------- SUBMIT ---------- */
    const submitExam = async (auto = false) => {
        if (isSubmittingRef.current) return;

        isSubmittingRef.current = true;
        setIsSubmitting(true);

        try {
            await axiosInstance.post("/exam/submit-exam", {
                token,
                responses: Object.entries(responses).map(([qid, opt]) => ({
                    questionId: Number(qid),
                    selectedOption: opt,
                })),
                skippedQuestions,
                submissionType: auto ? "AUTO" : "MANUAL",
            });
        } finally {
            navigate("/exam-completed", { replace: true });
        }
    };

    /* ---------- SECURITY ---------- */
    useEffect(() => {
        const autoSubmit = () => submitExam(true);
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) autoSubmit();
        });
        window.addEventListener("blur", autoSubmit);

        return () => {
            document.removeEventListener("visibilitychange", autoSubmit);
            window.removeEventListener("blur", autoSubmit);
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Loading exam...
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Timebar
                key={questions[currentQIndex]?.id}
                questionId={questions[currentQIndex]?.id}
                timeLimit={questions[currentQIndex]?.timeLimit || 20}
                onTimeUp={() => submitExam(true)}
            />

            <div className="flex-1 p-6">
                <QuestionCard
                    question={questions[currentQIndex]}
                    questionNumber={currentQIndex + 1}
                    selectedOption={responses[questions[currentQIndex]?.id]}
                    onSelect={(opt) =>
                        setResponses((p) => ({
                            ...p,
                            [questions[currentQIndex].id]: opt,
                        }))
                    }
                />
            </div>

            {/* 🎥 LIVE CAMERA */}
            <div className="fixed top-4 right-4 bg-black rounded-lg shadow-lg z-50">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-36 h-28 object-cover rounded-lg"
                />
                <div className="text-white text-xs text-center py-1">
                    Live Camera
                </div>
            </div>
        </div>
    );
};

export default ExamUIPreview;
