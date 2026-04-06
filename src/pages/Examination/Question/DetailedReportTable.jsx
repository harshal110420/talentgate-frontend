import React from "react";
import { format } from "date-fns";

const LABELS = ["A", "B", "C", "D", "E"];

const JournalEntryOption = ({ opt, index, isCorrect }) => (
  <div style={{
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  }}>
    <div style={{
      fontSize: 10, fontWeight: 500, padding: "3px 7px",
      background: isCorrect ? "#EAF3DE" : "var(--color-background-secondary)",
      color: isCorrect ? "#3B6D11" : "var(--color-text-secondary)",
      borderBottom: "0.5px solid var(--color-border-tertiary)",
    }}>
      Option {LABELS[index]}{isCorrect ? " ✓" : ""}
    </div>
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <tbody>
        {opt.drLines?.map((line, j) => (
          <tr key={`dr-${j}`} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
            <td style={{ padding: "2px 7px", width: 28 }}>
              <span style={{ fontSize: 9, fontWeight: 500, color: "#A32D2D", background: "#FCEBEB", borderRadius: 2, padding: "0 4px" }}>Dr</span>
            </td>
            <td style={{ fontSize: 10, padding: "2px 7px", color: "var(--color-text-primary)" }}>{line.account}</td>
            <td style={{ fontSize: 10, padding: "2px 7px", textAlign: "right", whiteSpace: "nowrap", color: "var(--color-text-primary)" }}>{line.amount}</td>
          </tr>
        ))}
        {opt.crLines?.map((line, j) => (
          <tr key={`cr-${j}`}>
            <td style={{ padding: "2px 7px" }}>
              <span style={{ fontSize: 9, fontWeight: 500, color: "#0F6E56", background: "#E1F5EE", borderRadius: 2, padding: "0 4px" }}>Cr</span>
            </td>
            <td style={{ fontSize: 10, padding: "2px 7px", color: "var(--color-text-primary)" }}>{line.account}</td>
            <td style={{ fontSize: 10, padding: "2px 7px", textAlign: "right", whiteSpace: "nowrap", color: "var(--color-text-primary)" }}>{line.amount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const renderOptions = (options, correctIdx) => {
  const isJournal = options?.length > 0 && typeof options[0] === "object" && options[0]?.drLines;

  if (isJournal) {
    return (
      <div>
        {options.map((opt, i) => (
          <JournalEntryOption key={i} opt={opt} index={i} isCorrect={String(i) === String(correctIdx)} />
        ))}
      </div>
    );
  }

  return (
    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 3 }}>
      {options.map((opt, i) => {
        const isCorrect = String(i) === String(correctIdx);
        return (
          <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 5, fontSize: 11 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              minWidth: 16, height: 16, borderRadius: 3, fontSize: 10, fontWeight: 500,
              background: isCorrect ? "#EAF3DE" : "var(--color-background-secondary)",
              color: isCorrect ? "#3B6D11" : "var(--color-text-tertiary)",
              border: `0.5px solid ${isCorrect ? "#C0DD97" : "var(--color-border-tertiary)"}`,
              flexShrink: 0, marginTop: 1,
            }}>{LABELS[i]}</span>
            <span style={{ lineHeight: 1.4, color: "var(--color-text-secondary)" }}>{opt}</span>
          </li>
        );
      })}
    </ul>
  );
};

const getCorrectAnswer = (options, correctIdx) => {
  if (!options || options.length === 0) return "-";
  const opt = options[correctIdx];
  if (typeof opt === "object") return `Option ${LABELS[correctIdx]}`;
  return opt || "-";
};

const DetailedReportTable = ({ data = [], printRef }) => {
  if (!data.length) {
    return <p style={{ padding: "1rem", textAlign: "center", color: "var(--color-text-secondary)", fontSize: 13 }}>No records found for the selected filters.</p>;
  }

  return (
    <div ref={printRef} style={{ overflowX: "auto", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", background: "var(--color-background-primary)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: "var(--color-background-secondary)", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
            {["#", "Department", "Subject", "Level", "Question", "Options", "Correct", "Date"].map((h) => (
              <th key={h} style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", padding: "10px 12px", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => {
            const opts = Array.isArray(row.options) ? row.options : (() => { try { return JSON.parse(row.options); } catch { return []; } })();
            return (
              <tr key={idx} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                <td style={{ padding: "10px 12px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 11, verticalAlign: "top" }}>{idx + 1}</td>
                <td style={{ padding: "10px 12px", verticalAlign: "top" }}>
                  <span style={{ fontSize: 10, fontWeight: 500, background: "#E6F1FB", color: "#0C447C", borderRadius: 4, padding: "2px 6px" }}>{row.department_name}</span>
                </td>
                <td style={{ padding: "10px 12px", fontSize: 11, color: "var(--color-text-secondary)", verticalAlign: "top", maxWidth: 110 }}>{row.subject_name}</td>
                <td style={{ padding: "10px 12px", verticalAlign: "top" }}>
                  <span style={{ fontSize: 10, fontWeight: 500, borderRadius: 4, padding: "2px 6px", background: row.level_name?.includes("Senior") ? "#FAEEDA" : "#EAF3DE", color: row.level_name?.includes("Senior") ? "#854F0B" : "#3B6D11" }}>
                    {row.level_name?.replace(" Level", "") || "-"}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", fontSize: 12, lineHeight: 1.5, verticalAlign: "top", maxWidth: 220 }}>{row.question}</td>
                <td style={{ padding: "10px 12px", verticalAlign: "top", minWidth: 200 }}>{renderOptions(opts, row.correct)}</td>
                <td style={{ padding: "10px 12px", verticalAlign: "top" }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: "#3B6D11", background: "#EAF3DE", borderRadius: 4, padding: "2px 7px" }}>{getCorrectAnswer(opts, row.correct)}</span>
                </td>
                <td style={{ padding: "10px 12px", fontSize: 11, color: "var(--color-text-tertiary)", verticalAlign: "top", whiteSpace: "nowrap" }}>
                  {row.created_at ? format(new Date(row.created_at), "dd-MM-yyyy") : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DetailedReportTable;