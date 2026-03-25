import React from "react";

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

/* ─── Passage Block ──────────────────────────────────────────── */
const PassageBlock = ({ passage }) => (
  <div style={{ marginBottom: 20, borderRadius: 12, border: "1.5px solid #bfdbfe", background: "linear-gradient(135deg, #eff6ff, #f0f9ff)", overflow: "hidden" }}>
    <div style={{ padding: "8px 16px", background: "linear-gradient(135deg, #1d4ed8, #2563eb)", display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 13 }}>📄</span>
      <span style={{ color: "white", fontWeight: 700, fontSize: 12, letterSpacing: "0.04em" }}>READ THE PASSAGE</span>
      {passage.title && <span style={{ color: "#bfdbfe", fontSize: 11, fontWeight: 400, marginLeft: 4 }}>— {passage.title}</span>}
    </div>
    <div style={{ padding: "14px 16px" }}>
      <p style={{ fontSize: 13.5, color: "#1e3a5f", lineHeight: 1.8, margin: 0, whiteSpace: "pre-wrap", fontStyle: "italic" }}>
        {passage.content}
      </p>
    </div>
  </div>
);

/* ─── Fill in the Blank ──────────────────────────────────────── */
const FillBlankQuestion = ({ text }) => {
  const parts = text.split(/(_{3,})/g);
  return (
    <p style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", lineHeight: 1.75, margin: 0 }}>
      {parts.map((part, i) =>
        /_{3,}/.test(part) ? (
          <span key={i} style={{
            display: "inline-block", minWidth: 80,
            borderBottom: "2.5px solid #1d4ed8", background: "#eff6ff",
            borderRadius: "4px 4px 0 0", padding: "0 10px",
            color: "#1d4ed8", fontWeight: 700, fontSize: 13,
            letterSpacing: "0.1em", verticalAlign: "middle", margin: "0 4px",
          }}>?</span>
        ) : <span key={i}>{part}</span>
      )}
    </p>
  );
};

/* ─── Journal Option Renderer ────────────────────────────────── */
const JournalOptionContent = ({ opt, isSelected }) => {
  const textColor = isSelected ? "#1e3a5f" : "#374151";
  const crColor = isSelected ? "#1d4ed8" : "#4b5563";

  return (
    <div style={{ flex: 1, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: 1.9 }}>
      {/* Dr Lines */}
      {opt.drLines.map((line, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ color: textColor }}>
            {line.account}{" "}
            <span style={{ color: "#dc2626", fontWeight: 700, fontSize: 11 }}>  ....Dr</span>
          </span>
          <span style={{ fontWeight: 600, color: textColor, marginLeft: 12, whiteSpace: "nowrap", paddingRight: 50 }}>
            {line.amount}
          </span >
        </div>
      ))}
      {/* Cr Lines — indented */}
      {opt.crLines.map((line, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingLeft: 20 }}>
          <span style={{ color: crColor }}>
            To {line.account}
            <span style={{ color: "#dc2626", fontWeight: 700, fontSize: 11 }}>  ....Cr</span>
          </span>
          <span style={{ fontWeight: 600, color: textColor, marginLeft: 12, whiteSpace: "nowrap" }}>
            {line.amount}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ─── Main QuestionCard ──────────────────────────────────────── */
const QuestionCard = ({ question, selectedOption, onSelect, questionNumber }) => {
  const qType = question.questionType || "MCQ";
  const meta = question.metadata || null;

  // Check if options are journal structured
  const isJournalType = qType === "JOURNAL_ENTRY";
  const hasStructuredOptions = isJournalType &&
    Array.isArray(question.options) &&
    question.options[0]?.drLines !== undefined;

  return (
    <div style={{ padding: "20px 20px 24px" }}>

      {/* ══ PASSAGE block ══ */}
      {qType === "PASSAGE" && meta?.passage && (
        <PassageBlock passage={meta.passage} />
      )}

      {/* ══ Question Type Badge ══ */}
      {qType !== "MCQ" && (
        <div style={{ marginBottom: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
            padding: "2px 8px", borderRadius: 20,
            ...(qType === "PASSAGE"
              ? { background: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe" }
              : qType === "JOURNAL_ENTRY"
                ? { background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" }
                : { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }),
          }}>
            {qType === "PASSAGE" && "📄 PASSAGE BASED"}
            {qType === "JOURNAL_ENTRY" && "📒 JOURNAL ENTRY"}
            {qType === "FILL_IN_BLANK" && "✏️ FILL IN THE BLANK"}
          </span>
        </div>
      )}

      {/* ══ Question Text ══ */}
      <div style={{ marginBottom: 20 }}>
        {qType === "FILL_IN_BLANK" ? (
          <div>
            <span style={{
              display: "inline-block", marginRight: 8, padding: "2px 9px",
              borderRadius: 6, background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
              color: "white", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
              verticalAlign: "middle", marginBottom: 6,
            }}>Q{questionNumber}</span>
            <FillBlankQuestion text={question.question} />
          </div>
        ) : (
          <p style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", lineHeight: 1.65, margin: 0 }}>
            <span style={{
              display: "inline-block", marginRight: 8, padding: "2px 9px",
              borderRadius: 6, background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
              color: "white", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
              verticalAlign: "middle", marginBottom: 2,
            }}>Q{questionNumber}</span>
            {question.question}
          </p>
        )}
      </div>

      {/* ══ Options ══ */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {question.options.map((opt, idx) => {
          // Journal: index based selection, others: value based
          const isSelected = selectedOption === String(idx);

          const selectValue = String(idx);

          return (
            <label key={idx} style={{
              display: "flex", alignItems: "flex-start", gap: 4,
              padding: "11px 14px", borderRadius: 11,
              border: isSelected ? "1.5px solid #3b82f6" : "1.5px solid #e2e8f0",
              background: isSelected ? "linear-gradient(135deg, #eff6ff, #dbeafe)" : "#fafafa",
              cursor: "pointer", transition: "all .18s ease",
              boxShadow: isSelected ? "0 2px 8px #3b82f625" : "none",
            }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = "#f1f5f9";
                  e.currentTarget.style.borderColor = "#cbd5e1";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = "#fafafa";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }
              }}
            >
              <input type="radio" name={`question-${question.id}`}
                value={selectValue} checked={isSelected}
                onChange={() => onSelect(selectValue)}
                style={{ display: "none" }} />

              {/* Radio circle */}
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                border: isSelected ? "2px solid #3b82f6" : "2px solid #cbd5e1",
                background: isSelected ? "#3b82f6" : "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginTop: 1, transition: "all .18s ease",
                boxShadow: isSelected ? "0 0 0 3px #bfdbfe" : "none",
              }}>
                {isSelected && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "white" }} />}
              </div>

              {/* Label + content */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flex: 1 }}>
                {/* <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: isSelected ? "#1d4ed8" : "#94a3b8",
                  background: isSelected ? "#dbeafe" : "#f1f5f9",
                  border: isSelected ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                  borderRadius: 5, padding: "1px 6px",
                  flexShrink: 0, marginTop: 1, transition: "all .18s",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {OPTION_LABELS[idx]}
                </span> */}

                {/* ✅ Journal structured render */}
                {hasStructuredOptions && typeof opt === "object" && opt.drLines ? (
                  <JournalOptionContent opt={opt} isSelected={isSelected} />
                ) : (
                  <span style={{
                    fontSize: 14, color: isSelected ? "#1e3a5f" : "#374151",
                    lineHeight: 1.6, fontWeight: isSelected ? 500 : 400,
                    whiteSpace: "pre-wrap", flex: 1, transition: "color .18s",
                  }}>
                    {opt}
                  </span>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionCard;