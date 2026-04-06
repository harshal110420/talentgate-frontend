import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { FileDown, Sheet } from "lucide-react";

import ReportFilterPanel from "../../../components/common/ReportFilterPanel";
import ReportTable from "../../../components/common/ReportTable";
import DetailedReportTable from "../../../pages/Examination/Question/DetailedReportTable";
import { fetchQuestionsReport, fetchDetailedQuestionsReport } from "../../../services/reportService";
import { fetchAllDepartments } from "../../../features/department/departmentSlice";
import { fetchAllSubjects } from "../../../features/subject/subjectSlice";

const LABELS = ["A", "B", "C", "D", "E"];

const formatOptionsForExport = (options) => {
  if (!options || options.length === 0) return "-";
  return options.map((opt, i) => {
    if (typeof opt === "object" && opt?.drLines) {
      const dr = opt.drLines.map((l) => `Dr: ${l.account} ${l.amount}`).join(", ");
      const cr = opt.crLines.map((l) => `Cr: ${l.account} ${l.amount}`).join(", ");
      return `${LABELS[i]}: ${dr} | ${cr}`;
    }
    return `${LABELS[i]}: ${opt}`;
  }).join("\n");
};

const getCorrectForExport = (options, correctIdx) => {
  if (!options || options.length === 0) return "-";
  const opt = options[correctIdx];
  if (typeof opt === "object") return `Option ${LABELS[correctIdx]}`;
  return opt || "-";
};

const QuestionReportPage = () => {
  const dispatch = useDispatch();
  const printRef = useRef();

  const [filters, setFilters] = useState({});
  const [data, setData] = useState([]);
  const [reportType, setReportType] = useState("summary");

  const departments = useSelector((state) => state.department?.list || []);
  const subjects = useSelector((state) => state.subjects?.list || []);

  const onSearch = async () => {
    const res = reportType === "summary"
      ? await fetchQuestionsReport(filters)
      : await fetchDetailedQuestionsReport(filters);
    setData(res);
  };

  useEffect(() => {
    dispatch(fetchAllDepartments());
    dispatch(fetchAllSubjects());
  }, [dispatch]);

  const handleExcelExport = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Question Report");

    sheet.columns = [
      { header: "#", key: "num", width: 5 },
      { header: "Department", key: "department", width: 22 },
      { header: "Subject", key: "subject", width: 28 },
      { header: "Level", key: "level", width: 14 },
      { header: "Question", key: "question", width: 55 },
      { header: "Options", key: "options", width: 70 },
      { header: "Correct Answer", key: "correct", width: 22 },
    ];

    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, size: 10, color: { argb: "FF1F3864" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = {
        top: { style: "thin" }, bottom: { style: "thin" },
        left: { style: "thin" }, right: { style: "thin" },
      };
    });
    sheet.getRow(1).height = 22;

    data.forEach((row, idx) => {
      const opts = Array.isArray(row.options)
        ? row.options
        : (() => { try { return JSON.parse(row.options); } catch { return []; } })();

      const optionsText = formatOptionsForExport(opts);
      const correctText = getCorrectForExport(opts, row.correct);

      const excelRow = sheet.addRow({
        num: idx + 1,
        department: row.department_name || "-",
        subject: row.subject_name || "-",
        level: row.level_name || "-",
        question: row.question || "-",
        options: optionsText,
        correct: correctText,
      });

      excelRow.eachCell((cell) => {
        cell.alignment = { vertical: "top", wrapText: true };
        cell.font = { size: 10 };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE0E0E0" } },
          bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
          left: { style: "thin", color: { argb: "FFE0E0E0" } },
          right: { style: "thin", color: { argb: "FFE0E0E0" } },
        };
      });

      const correctCell = excelRow.getCell("correct");
      correctCell.font = { bold: true, size: 10, color: { argb: "FF166534" } };
      correctCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };

      const lineCount = optionsText.split("\n").length;
      excelRow.height = Math.max(40, lineCount * 28);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "question_report.xlsx");
  };

  const handlePdfExport = () => {
    const printContent = printRef.current?.innerHTML;
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>Question Report</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 20px; }
            h2 { font-size: 14px; font-weight: 600; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; }
            th { font-size: 10px; font-weight: 600; text-transform: uppercase; background: #f3f4f6; padding: 6px 8px; text-align: left; border: 1px solid #e5e7eb; }
            td { font-size: 10px; padding: 6px 8px; border: 1px solid #e5e7eb; vertical-align: top; line-height: 1.5; }
            .je-block { margin-bottom: 4px; border: 1px solid #e5e7eb; border-radius: 3px; overflow: hidden; }
            .je-header { font-size: 9px; font-weight: 600; padding: 2px 6px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
            .je-header.correct { background: #dcfce7; color: #166534; }
            .je-inner { width: 100%; border-collapse: collapse; }
            .je-inner td { border: none; border-bottom: 1px solid #f3f4f6; padding: 2px 6px; font-size: 9px; }
            .dr { color: #991b1b; font-weight: 600; }
            .cr { color: #065f46; font-weight: 600; }
            .correct-badge { background: #dcfce7; color: #166534; padding: 1px 6px; border-radius: 3px; font-weight: 600; }
          </style>
        </head>
        <body>
          <h2>Question Report — Detailed View (${data.length} questions)</h2>
          ${printContent}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const showExportButtons = reportType === "detailed" && data.length > 0;

  return (
    <div className="max-w-full px-5 py-5 font-sans text-gray-800 dark:text-gray-100">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Question Report
        </h1>

        <div className="flex items-center gap-2">
          {/* Export Buttons — sirf detailed + data hone par */}
          {showExportButtons && (
            <>
              <button
                onClick={handleExcelExport}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-lg shadow-sm transition"
              >
                <Sheet className="w-4 h-4" />
                Export Excel
              </button>
              <button
                onClick={handlePdfExport}
                className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white text-sm font-medium px-3 py-2 rounded-lg shadow-sm transition"
              >
                <FileDown className="w-4 h-4" />
                Export PDF
              </button>
            </>
          )}

          {/* Report Type Toggle */}
          <div className="flex items-center gap-2">
            <label htmlFor="reportType" className="text-sm text-gray-600 dark:text-gray-400">
              Report Type:
            </label>
            <select
              id="reportType"
              value={reportType}
              onChange={(e) => { setReportType(e.target.value); setData([]); }}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-800"
            >
              <option value="summary">Summary (Count)</option>
              <option value="detailed">Detailed (Full Data)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 mb-5">
        <ReportFilterPanel
          filters={filters}
          setFilters={setFilters}
          departments={departments}
          subjects={subjects}
          onSearch={onSearch}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-900">
        {reportType === "summary" ? (
          <ReportTable data={data} />
        ) : (
          <DetailedReportTable data={data} printRef={printRef} />
        )}
      </div>

    </div>
  );
};

export default QuestionReportPage;