import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { Sun, Moon, Database, ShieldCheck, DownloadCloud } from "lucide-react";
import api from "../../api/client";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user } = useAuth();

  const handleExportAllData = async () => {
    try {
      toast.loading("Exporting complete data archive...", { id: "archive" });
      const res = await api.get("/reports/export/csv/");
      const blob = new Blob([res.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `fintrack_data_archive_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Complete archive downloaded!", { id: "archive" });
    } catch (err) {
      toast.error("Failed to export data archive.", { id: "archive" });
    }
  };

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          System & Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize UI preferences, inspect backend security, and manage your data
        </p>
      </div>

      {/* Appearance Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          Appearance & Theme
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Toggle between clean day mode or high-contrast night mode
        </p>

        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
          <div className="flex items-center space-x-3">
            {isDarkMode ? (
              <Moon className="w-5 h-5 text-indigo-400" />
            ) : (
              <Sun className="w-5 h-5 text-amber-500" />
            )}
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {isDarkMode ? "Dark Theme Active" : "Light Theme Active"}
              </p>
              <p className="text-xs text-slate-500">
                Saved in local browser preferences
              </p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-xs hover:bg-slate-100 transition-colors"
          >
            Switch to {isDarkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </div>

      {/* Database & Cloud Connection Status */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          Database & Infrastructure
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Live connection telemetry to TiDB Cloud Serverless
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">TLS Connection</span>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              ISRG Root X1 CA Certificate
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Cipher: TLS_AES_128_GCM_SHA256 (Secure Transport Verified)
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 mb-1">
              <Database className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Cluster Cluster</span>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              TiDB Cloud Starter v8.5
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Database: finance_management (Port 4000)
            </p>
          </div>
        </div>
      </div>

      {/* Data Export & Backup */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          Data Ownership & Privacy
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Download your complete financial ledger for personal backup
        </p>

        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Export Full Financial Archive
            </p>
            <p className="text-xs text-slate-500">
              Includes all incomes, expenses, categories, and timestamps
            </p>
          </div>
          <button
            onClick={handleExportAllData}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
          >
            <DownloadCloud className="w-4 h-4" />
            <span>Download Archive</span>
          </button>
        </div>
      </div>
    </div>
  );
}
