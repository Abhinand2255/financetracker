import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  TrendingUp,
  PieChart,
  Target,
  FileCheck,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 md:py-20 text-center">
      {/* Badge */}
      <div className="inline-flex items-center space-x-2 px-3 py-1 mb-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-200 dark:border-blue-900">
        <ShieldCheck className="w-4 h-4 text-blue-500" />
        <span>Enterprise-grade TiDB Cloud Cloud Starter Security</span>
      </div>

      {/* Hero Headline */}
      <h1 className="max-w-4xl text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
        Master Your Money with{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
          Intelligent Financial Clarity
        </span>
      </h1>

      <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-300 mb-10 leading-relaxed">
        Track real-time income and expenses, set smart category budgets, automate savings goals, and generate audited PDF & Excel financial statements.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-16">
        <Link
          to="/register"
          className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-500/25 transition-all w-full sm:w-auto"
        >
          <span>Start Free Account</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/login"
          className="inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all w-full sm:w-auto"
        >
          Sign in to FinTrack
        </Link>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl w-full text-left">
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="p-3 w-fit rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 mb-4">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            Real-Time Tracking
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Log income & expenses with automated calculations for daily, weekly, and monthly totals.
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="p-3 w-fit rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 mb-4">
            <PieChart className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            Budget Alerts
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Automated alerts at 50%, 75%, 90%, and 100% threshold utilization to keep you on budget.
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="p-3 w-fit rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 mb-4">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            Savings Goals
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track goals with percentage progress bars and atomic contribution ledgers.
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="p-3 w-fit rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 mb-4">
            <FileCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            Statement Exports
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Export authenticated PDF statements, Excel workbooks, and CSV records in one click.
          </p>
        </div>
      </div>
    </div>
  );
}
