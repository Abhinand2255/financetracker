import React, { useState, useEffect } from "react";
import api from "../../api/client";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import StatCard from "../../components/common/StatCard";
import toast from "react-hot-toast";
import {
  FileBarChart,
  Download,
  FileSpreadsheet,
  FileText,
  FileCode,
  Calendar,
  Filter,
} from "lucide-react";

export default function ReportsPage() {
  const [reportType, setReportType] = useState("monthly");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/reports/summary/?report_type=${reportType}&year=${year}&month=${month}`
      );
      setReportData(res.data);
    } catch (err) {
      toast.error("Failed to load report data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, year, month]);

  const handleExport = async (format) => {
    try {
      toast.loading(`Generating ${format.toUpperCase()} statement...`, { id: "export" });
      const response = await api.get(`/reports/export/${format}/`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute(
        "download",
        `FinTrack_Report_${new Date().toISOString().split("T")[0]}.${
          format === "excel" ? "xlsx" : format
        }`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`${format.toUpperCase()} downloaded successfully!`, { id: "export" });
    } catch (err) {
      toast.error(`Failed to export ${format}.`, { id: "export" });
    }
  };

  const summary = reportData?.summary || { income: 0, expenses: 0, net_savings: 0, savings_rate: 0 };
  const categories = reportData?.category_breakdown || [];
  const transactions = reportData?.transactions || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Financial Statements & Exports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate audited monthly reports, category distribution, and download PDF or Excel spreadsheets
          </p>
        </div>

        {/* Download Buttons */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={() => handleExport("pdf")}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 rounded-xl transition-colors border border-rose-200 dark:border-rose-900"
          >
            <FileText className="w-4 h-4" />
            <span>PDF</span>
          </button>
          <button
            onClick={() => handleExport("excel")}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-xl transition-colors border border-emerald-200 dark:border-emerald-900"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => handleExport("csv")}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 rounded-xl transition-colors border border-blue-200 dark:border-blue-900"
          >
            <FileCode className="w-4 h-4" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Report Controls */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Report Scope:
          </span>
        </div>

        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
        >
          <option value="monthly">Monthly Statement</option>
          <option value="yearly">Yearly Overview</option>
        </select>

        {reportType === "monthly" && (
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            {[
              "January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"
            ].map((m, idx) => (
              <option key={idx} value={idx + 1}>{m}</option>
            ))}
          </select>
        )}

        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
        >
          {[2024, 2025, 2026, 2027].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner text="Generating statement data..." />
      ) : (
        <>
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard title="Total Inflow" amount={summary.income} color="emerald" subtitle="Recorded income" />
            <StatCard title="Total Outflow" amount={summary.expenses} color="rose" subtitle="Recorded expenses" />
            <StatCard title="Net Cash Flow" amount={summary.net_savings} color="blue" subtitle="Surplus / Deficit" />
            <StatCard title="Savings Ratio" amount={`${summary.savings_rate}%`} currency="" color="amber" subtitle="Retained savings" />
          </div>

          {/* Category Breakdown & Detailed Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category breakdown (1 col) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                Expense Distribution
              </h3>
              {categories.length > 0 ? (
                <div className="space-y-3">
                  {categories.map((c, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700 dark:text-slate-300">{c.category}</span>
                        <span className="text-slate-900 dark:text-white font-bold">
                          ₹{c.amount.toLocaleString("en-IN")} ({c.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${c.percentage}%`, backgroundColor: c.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4 text-center">No expenses in this period.</p>
              )}
            </div>

            {/* Transactions Statement (2 cols) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                Statement Entries ({transactions.length})
              </h3>
              {transactions.length > 0 ? (
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 font-semibold text-slate-400">
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Description</th>
                        <th className="pb-2">Category</th>
                        <th className="pb-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {transactions.map((t, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-2.5 text-slate-500">{t.date}</td>
                          <td className="py-2.5 font-semibold text-slate-800 dark:text-slate-200">{t.title}</td>
                          <td className="py-2.5 text-slate-500">{t.category}</td>
                          <td
                            className={`py-2.5 text-right font-bold ${
                              t.type === "INCOME" ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {t.type === "INCOME" ? "+" : "-"}₹{t.amount.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-6 text-center">
                  No records found for the selected period.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
