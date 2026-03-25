// components/FormActionButtons.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, ChevronLeft, ChevronRight, Loader2, Save } from "lucide-react";

const FormActionButtons = ({
  loading = false,
  isEditMode = false,
  isSubmitting = false,
  currentStep = 0,
  totalSteps = 1,
  isLastStep = true,
  isFormValid = false,
  hideSubmit = false,
  onBackClick,
  onPrevious,
  onNext,
  onSubmitClick,
}) => {
  const navigate = useNavigate();

  const isMultiStep = totalSteps > 1;
  const showPrevious = isMultiStep && currentStep > 0;
  const showNext = isMultiStep && !isLastStep;
  const showSubmit = isLastStep && !hideSubmit;

  /* ── Step progress dots (only for multi-step) ── */
  const StepDots = () =>
    isMultiStep ? (
      <div className="flex items-center gap-1.5 mr-auto">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${i < currentStep
              ? "w-2 h-2 bg-blue-500"
              : i === currentStep
                ? "w-3 h-2 bg-blue-600"
                : "w-2 h-2 bg-gray-200 dark:bg-gray-700"
              }`}
          />
        ))}
      </div>
    ) : null;

  return (
    <div className="flex items-center gap-2 mt-6 pt-4
                    border-t border-gray-100 dark:border-gray-800">

      <StepDots />

      {/* ── Back ── */}
      <button
        type="button"
        onClick={onBackClick || (() => navigate(-1))}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium
                   border border-gray-200 dark:border-gray-700
                   text-gray-700 dark:text-gray-300
                   bg-white dark:bg-gray-900
                   hover:bg-gray-50 dark:hover:bg-gray-800
                   transition-all duration-150"
      >
        <X size={14} />
        Back
      </button>

      {/* ── Previous ── */}
      {showPrevious && (
        <button
          type="button"
          onClick={onPrevious}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium
                     border border-gray-200 dark:border-gray-700
                     text-gray-700 dark:text-gray-300
                     bg-white dark:bg-gray-900
                     hover:bg-gray-50 dark:hover:bg-gray-800
                     transition-all duration-150"
        >
          <ChevronLeft size={14} />
          Previous
        </button>
      )}

      {/* ── Next ── */}
      {showNext && (
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
                     bg-white dark:bg-gray-900
                     border border-blue-300 dark:border-blue-700
                     text-blue-600 dark:text-blue-400
                     hover:bg-blue-50 dark:hover:bg-blue-950/40
                     transition-all duration-150"
        >
          Next
          <ChevronRight size={14} />
        </button>
      )}

      {/* ── Submit / Update ── */}
      {showSubmit && (
        <button
          type="submit"
          onClick={onSubmitClick}
          disabled={!isFormValid || loading || isSubmitting}
          className={`
            flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold
            transition-all duration-150 shadow-sm
            ${isFormValid && !loading && !isSubmitting
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-200 dark:shadow-blue-900/30 hover:-translate-y-px"
              : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed shadow-none"
            }
          `}
        >
          {isSubmitting || loading
            ? <><Loader2 size={14} className="animate-spin" />
              {isEditMode ? "Updating…" : "Saving…"}
            </>
            : <><Save size={14} />
              {isEditMode ? "Update" : "Submit"}
            </>
          }
        </button>
      )}

    </div>
  );
};

export default FormActionButtons;