import React from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileDown, Sheet } from "lucide-react";

const ReportTable = ({ data = [] }) => {
  const exportToExcel = () => {
    const rows = data.map((item, idx) => ({
      "#": idx + 1,
      Department: item.department_name,
      Subject: item.subject_name,
      "Total Questions": item.total_questions,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 4 }, { wch: 25 }, { wch: 30 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Question Report");
    XLSX.writeFile(wb, "question_report_summary.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(13);
    doc.text("Question Report — Summary", 14, 15);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Total: ${data.length} records`, 14, 22);
    autoTable(doc, {
      startY: 27,
      head: [["#", "Department", "Subject", "Total Questions"]],
      body: data.map((item, idx) => [
        idx + 1,
        item.department_name,
        item.subject_name,
        item.total_questions,
      ]),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [31, 56, 100], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: { 0: { halign: "center", cellWidth: 10 }, 3: { halign: "center" } },
    });
    doc.save("question_report_summary.pdf");
  };

  return (
    <div className="max-w-full">
      {/* Export buttons */}
      {data.length > 0 && (
        <div className="flex justify-end gap-2 px-4 pt-4 pb-2">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-lg shadow-sm transition"
          >
            <Sheet className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white text-sm font-medium px-3 py-2 rounded-lg shadow-sm transition"
          >
            <FileDown className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      )}

      {/* Table */}
      <table className="min-w-full w-full text-sm">
        <thead className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase tracking-wide text-[11px] font-medium">
          <tr>
            <th className="px-4 py-3 text-center">#</th>
            <th className="px-4 py-3 text-left">Department</th>
            <th className="px-4 py-3 text-left">Subject</th>
            <th className="px-4 py-3 text-center">Total Questions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-center py-8 text-gray-400 text-sm">
                No data found. Apply filters and click Search.
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={idx}
                className={`transition-colors duration-150 ${idx % 2 === 0
                  ? "bg-white dark:bg-gray-900"
                  : "bg-gray-50 dark:bg-gray-800"
                  } hover:bg-blue-50 dark:hover:bg-gray-700`}
              >
                <td className="px-4 py-2.5 text-center text-gray-400 text-xs">{idx + 1}</td>
                <td className="px-4 py-2.5">
                  <span className="text-[11px] font-medium bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded">
                    {row.department_name}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{row.subject_name}</td>
                <td className="px-4 py-2.5 text-center">
                  <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
                    {row.total_questions}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Footer count */}
      {data.length > 0 && (
        <div className="px-4 py-2.5 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 text-right">
          {data.length} records found
        </div>
      )}
    </div>
  );
};

export default ReportTable;