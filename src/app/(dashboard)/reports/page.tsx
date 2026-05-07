"use client";

import { Download, FileSpreadsheet, FileText, Send } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { reports } from "@/data/dashboard-data";
import { notify } from "@/components/dashboard/toast-host";

export default function ReportsPage() {
  return (
    <div className="mt-7 space-y-5">
      <Card className="p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <CardTitle>Reports</CardTitle>
            <p className="mt-1 text-sm font-medium text-slate-500">Download historical plant health, failure analysis, and energy reports.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => notify("PDF export queued", "The weekly plant health PDF is being prepared.")}>
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
            <Button onClick={() => notify("Report shared", "Maintenance leadership will receive the latest dashboard summary.")}>
              <Send className="h-4 w-4" />
              Share Summary
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {reports.map((report, index) => {
          const Icon = report.type === "XLSX" ? FileSpreadsheet : FileText;
          return (
            <motion.div key={report.name} whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 240, damping: 24 }}>
              <Card className="h-full p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                    <Icon className="h-7 w-7" />
                  </div>
                  <Badge tone={report.type === "PDF" ? "red" : "green"}>{report.type}</Badge>
                </div>
                <h2 className="mt-6 text-lg font-extrabold tracking-[-0.02em] text-slate-950">{report.name}</h2>
                <p className="mt-2 text-sm font-semibold text-slate-500">{report.date} • {report.size}</p>
                <Button
                  variant="outline"
                  className="mt-6 w-full text-blue-700"
                  onClick={() => notify("Download started", `${report.name} is downloading.`)}
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="p-5">
        <CardHeader className="mb-5">
          <CardTitle>Historical Reports</CardTitle>
          <Badge tone="blue">Last 30 days</Badge>
        </CardHeader>
        <div className="overflow-x-auto scrollbar-none">
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
              {reports.concat(reports.slice(0, 2)).map((report, index) => (
                <tr key={`${report.name}-${index}`} className="font-semibold text-slate-800">
                  <td className="py-3">{report.name}</td>
                  <td className="py-3"><Badge tone={report.type === "PDF" ? "red" : "green"}>{report.type}</Badge></td>
                  <td className="py-3">{report.date}</td>
                  <td className="py-3">{report.size}</td>
                  <td className="py-3">
                    <button className="font-extrabold text-blue-700 hover:text-blue-900" onClick={() => notify("Download started", `${report.name} is downloading.`)}>
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
