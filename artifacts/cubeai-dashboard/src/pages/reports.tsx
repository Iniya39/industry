import { Download, FileSpreadsheet, FileText, RefreshCw, Send } from "lucide-react";
import { motion } from "framer-motion";
import { DashCard, DashCardHeader, DashCardTitle } from "@/components/dashboard/card";
import { DashBadge } from "@/components/dashboard/badge";
import { reports } from "@/data/dashboard-data";
import { notify } from "@/components/dashboard/toast-host";

export default function ReportsPage() {
  const handleDownload = (report: typeof reports[0]) => {
    notify("Download started", `${report.name} is being downloaded.`);
  };

  const handleExportPDF = () => {
    notify("Exporting PDF", "Generating the latest weekly plant health report.");
  };

  const handleShareSummary = () => {
    notify("Report shared", "Maintenance leadership will receive the latest dashboard summary.");
  };

  return (
    <div className="mt-7 space-y-5">
      <DashCard className="p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <DashCardTitle>Live AI Reports</DashCardTitle>
            <p className="mt-1 text-sm font-medium text-slate-500">Download real-time plant health, failure analysis, and energy reports generated from live AI predictions.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              onClick={handleExportPDF}
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </button>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              onClick={handleShareSummary}
            >
              <Send className="h-4 w-4" />
              Share Summary
            </button>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              onClick={() => notify("Reports refreshed", "All reports have been updated with the latest AI predictions.")}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Reports
            </button>
          </div>
        </div>
      </DashCard>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {reports.map((report) => {
          const Icon = report.type === "XLSX" ? FileSpreadsheet : FileText;
          return (
            <motion.div key={report.name} whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 240, damping: 24 }}>
              <DashCard className="h-full p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                    <Icon className="h-7 w-7" />
                  </div>
                  <DashBadge tone={report.type === "PDF" ? "red" : "green"}>{report.type}</DashBadge>
                </div>
                <h2 className="mt-6 text-lg font-extrabold tracking-[-0.02em] text-slate-950">{report.name}</h2>
                <p className="mt-2 text-sm font-semibold text-slate-500">{report.date} • {report.size}</p>
                <button
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
                  onClick={() => handleDownload(report)}
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </DashCard>
            </motion.div>
          );
        })}
      </div>

      <DashCard className="p-5">
        <DashCardHeader className="mb-5">
          <DashCardTitle>Historical Reports</DashCardTitle>
          <DashBadge tone="blue">Last 30 days</DashBadge>
        </DashCardHeader>
        <div className="overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs font-semibold text-slate-500">
              <tr>
                <th className="pb-3">Report</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Generated</th>
                <th className="pb-3">Size</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...reports, ...reports.slice(0, 2)].map((report, index) => (
                <tr key={`${report.name}-${index}`} className="font-semibold text-slate-800">
                  <td className="py-3">{report.name}</td>
                  <td className="py-3"><DashBadge tone={report.type === "PDF" ? "red" : "green"}>{report.type}</DashBadge></td>
                  <td className="py-3">{report.date}</td>
                  <td className="py-3">{report.size}</td>
                  <td className="py-3">
                    <button
                      className="font-extrabold text-blue-700 hover:text-blue-900"
                      onClick={() => handleDownload(report)}
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashCard>
    </div>
  );
}
