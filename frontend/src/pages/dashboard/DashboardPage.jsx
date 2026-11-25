import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import StatCard from "../../components/common/StatCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Percent,
  Calendar,
  ArrowRight,
  PlusCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("this_month");

  const fetchDashboardData = async () => {
    try {
      const res = await api.get(`/dashboard/?range=${range}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const handleUpdate = () => fetchDashboardData();
    window.addEventListener("fintrack:transaction_updated", handleUpdate);
    return () => window.removeEventListener("fintrack:transaction_updated", handleUpdate);
  }, [range]);

  if (loading && !data) {
    return <LoadingSpinner text="Loading financial analytics from TiDB Cloud..." />;
  }

  const summary = data?.summary || {
    total_balance: 0,
    total_income: 0,
    total_expenses: 0,
    total_savings: 0,
    savings_rate: 0,
  };

  const monthlyOverview = data?.monthly_overview || [];
  const expenseCategories = data?.expense_categories || [];
  const incomeCategories = data?.income_categories || [];
  const recentTransactions = data?.recent_transactions || [];
  const budgets = data?.budgets_overview || [];
  const goals = data?.goals_overview || [];

  const pieColors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header & Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time overview of your balances, cash flows, and investments
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xs">
          <Calendar className="w-4 h-4 ml-2 text-slate-400" />
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="text-xs font-semibold bg-transparent text-slate-700 dark:text-slate-300 pr-3 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="last_3_months">Last 3 Months</option>
            <option value="this_year">This Year</option>
          </select>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Balance"
          amount={summary.total_balance}
          icon={Wallet}
          color="blue"
          subtitle="Net cash balance (Income - Expense)"
        />
        <StatCard
          title="Period Income"
          amount={summary.total_income}
          icon={TrendingUp}
          color="emerald"
          subtitle="Earnings in selected period"
        />
        <StatCard
          title="Period Expenses"
          amount={summary.total_expenses}
          icon={TrendingDown}
          color="rose"
          subtitle="Total spend in selected period"
        />
        <StatCard
          title="Savings Rate"
          amount={`${summary.savings_rate}%`}
          currency=""
          icon={Percent}
          color="amber"
          subtitle="Proportion of income saved"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend: Income vs Expense (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Income vs Expense Overview
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Past 6 months trend
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyOverview} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val) => `₹${Number(val).toLocaleString("en-IN")}`}
                  contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "12px", color: "#fff" }}
                />
                <Legend />
                <Area type="monotone" dataKey="income" name="Income" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#incomeGrad)" />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#EF4444" strokeWidth={2.5} fillOpacity={1} fill="url(#expenseGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Pie Chart (1 col) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Expense by Category
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Spending distribution
          </p>

          {expenseCategories.length > 0 ? (
            <div className="flex-1 flex flex-col justify-between">
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseCategories}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {expenseCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => `₹${Number(val).toLocaleString("en-IN")}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 mt-2 max-h-36 overflow-y-auto pr-1">
                {expenseCategories.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                        {cat.name}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      ₹{cat.amount.toLocaleString("en-IN")} ({cat.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState title="No expenses recorded" description="Add expenses to see category breakdown." />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Recent Transactions & Active Budgets/Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Recent Transactions
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Latest transactions from your database
              </p>
            </div>
            <Link
              to="/transactions"
              className="inline-flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          {recentTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400">
                    <th className="pb-3">Transaction</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {recentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3">
                        <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                          {tx.title}
                        </p>
                        <span className="text-[11px] text-slate-400">{tx.payment_method}</span>
                      </td>
                      <td className="py-3 text-xs text-slate-600 dark:text-slate-400">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium">
                          {tx.category_details?.name || "General"}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-slate-500 dark:text-slate-400">
                        {tx.date}
                      </td>
                      <td className={`py-3 text-right font-bold text-sm ${
                        tx.type === "INCOME"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}>
                        {tx.type === "INCOME" ? "+" : "-"}₹{Number(tx.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No recent transactions"
              description="Click Add Transaction to record your first entry."
            />
          )}
        </div>

        {/* Budgets & Savings Progress (1 col) */}
        <div className="space-y-6">
          {/* Active Budgets Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Monthly Budgets
              </h3>
              <Link to="/budgets" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                Manage
              </Link>
            </div>

            {budgets.length > 0 ? (
              <div className="space-y-4">
                {budgets.slice(0, 3).map((b) => (
                  <div key={b.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-800 dark:text-slate-200">{b.category_name}</span>
                      <span className="text-slate-500">
                        ₹{b.spent_amount.toLocaleString("en-IN")} / ₹{b.budget_amount.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          b.utilization_percentage >= 100
                            ? "bg-rose-500"
                            : b.utilization_percentage >= 80
                            ? "bg-amber-500"
                            : "bg-blue-600"
                        }`}
                        style={{ width: `${Math.min(100, b.utilization_percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-slate-500 mb-2">No monthly budgets configured.</p>
                <Link to="/budgets" className="text-xs font-semibold text-blue-600 hover:underline">
                  + Create budget
                </Link>
              </div>
            )}
          </div>

          {/* Active Goals Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Savings Goals
              </h3>
              <Link to="/savings-goals" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                View all
              </Link>
            </div>

            {goals.length > 0 ? (
              <div className="space-y-3.5">
                {goals.map((g) => (
                  <div key={g.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{g.name}</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{g.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${g.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-slate-500 mb-2">No savings goals created.</p>
                <Link to="/savings-goals" className="text-xs font-semibold text-blue-600 hover:underline">
                  + Add goal
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
