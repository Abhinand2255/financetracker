import React, { useState, useEffect } from "react";
import api from "../../api/client";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";
import {
  Receipt,
  Search,
  Filter,
  PlusCircle,
  Repeat,
  Trash2,
  Edit,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Play,
} from "lucide-react";

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState("all"); // "all" or "recurring"
  const [transactions, setTransactions] = useState([]);
  const [recurringTxs, setRecurringTxs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ordering, setOrdering] = useState("-date");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

  // Recurring Modal
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [recTitle, setRecTitle] = useState("");
  const [recAmount, setRecAmount] = useState("");
  const [recType, setRecType] = useState("EXPENSE");
  const [recCategory, setRecCategory] = useState("");
  const [recFreq, setRecFreq] = useState("MONTHLY");
  const [recStartDate, setRecStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [recEndDate, setRecEndDate] = useState("");
  const [submittingRec, setSubmittingRec] = useState(false);

  const fetchTransactions = async () => {
    try {
      let url = `/transactions/?page=${page}&ordering=${ordering}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (typeFilter) url += `&type=${typeFilter}`;
      if (categoryFilter) url += `&category=${categoryFilter}`;
      if (startDate) url += `&start_date=${startDate}`;
      if (endDate) url += `&end_date=${endDate}`;

      const res = await api.get(url);
      setTransactions(res.data.results || res.data || []);
      setCount(res.data.count || res.data.length || 0);
    } catch (err) {
      toast.error("Failed to load transactions.");
    }
  };

  const fetchRecurring = async () => {
    try {
      const res = await api.get("/transactions/recurring/");
      setRecurringTxs(res.data.results || res.data || []);
    } catch (err) {
      // quiet
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/transactions/categories/");
      setCategories(res.data || []);
    } catch (err) {
      // quiet
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchTransactions(), fetchRecurring(), fetchCategories()]).finally(() =>
      setLoading(false)
    );
  }, [page, ordering, typeFilter, categoryFilter, startDate, endDate, search]);

  const handleProcessRecurring = async () => {
    try {
      const res = await api.post("/transactions/recurring/process/");
      toast.success(res.data.message || "Recurring items processed.");
      fetchTransactions();
      fetchRecurring();
    } catch (err) {
      toast.error("Failed to process recurring transactions.");
    }
  };

  const handleCreateRecurring = async (e) => {
    e.preventDefault();
    setSubmittingRec(true);
    try {
      await api.post("/transactions/recurring/", {
        title: recTitle,
        amount: parseFloat(recAmount),
        type: recType,
        category_id: recCategory ? parseInt(recCategory) : null,
        frequency: recFreq,
        start_date: recStartDate,
        next_run_date: recStartDate,
        end_date: recEndDate || null,
      });
      toast.success("Recurring transaction scheduled!");
      setIsRecurringModalOpen(false);
      setRecTitle("");
      setRecAmount("");
      fetchRecurring();
    } catch (err) {
      toast.error("Failed to schedule recurring transaction.");
    } finally {
      setSubmittingRec(false);
    }
  };

  const handleDeleteTx = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await api.delete(`/transactions/${id}/`);
      toast.success("Transaction deleted.");
      fetchTransactions();
    } catch (err) {
      toast.error("Failed to delete transaction.");
    }
  };

  const handleDeleteRecurring = async (id) => {
    if (!window.confirm("Cancel this recurring schedule?")) return;
    try {
      await api.delete(`/transactions/recurring/${id}/`);
      toast.success("Recurring schedule removed.");
      fetchRecurring();
    } catch (err) {
      toast.error("Failed to remove recurring schedule.");
    }
  };

  const totalPages = Math.ceil(count / 10);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Transaction History
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete audit trail of all earnings, expenses, and automated subscriptions
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center space-x-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "all"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            All Transactions
          </button>
          <button
            onClick={() => setActiveTab("recurring")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "recurring"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Recurring Schedules ({recurringTxs.length})
          </button>
        </div>
      </div>

      {activeTab === "all" ? (
        /* Unified Transactions Table */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">All Types</option>
                <option value="INCOME">Income (+)</option>
                <option value="EXPENSE">Expense (-)</option>
              </select>
            </div>

            <div>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type === "INCOME" ? "Income" : "Expense"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={ordering}
                onChange={(e) => setOrdering(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="-date">Date: Newest First</option>
                <option value="date">Date: Oldest First</option>
                <option value="-amount">Amount: High to Low</option>
                <option value="amount">Amount: Low to High</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400">
                    <th className="pb-3">Title & Details</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Payment</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5">
                        <p className="font-semibold text-slate-900 dark:text-white">{tx.title}</p>
                        {tx.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                            {tx.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            tx.type === "INCOME"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3.5 text-xs text-slate-600 dark:text-slate-400">
                        {tx.category_details?.name || "General"}
                      </td>
                      <td className="py-3.5 text-xs text-slate-500 dark:text-slate-400">
                        {tx.date}
                      </td>
                      <td className="py-3.5 text-xs text-slate-600 dark:text-slate-300">
                        {tx.payment_method}
                      </td>
                      <td
                        className={`py-3.5 text-right font-bold text-sm ${
                          tx.type === "INCOME"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {tx.type === "INCOME" ? "+" : "-"}₹{Number(tx.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteTx(tx.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-500">
                    Page {page} of {totalPages} ({count} total records)
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              title="No transactions found"
              description="Adjust your search filters or click Add Transaction to log an entry."
            />
          )}
        </div>
      ) : (
        /* Recurring Transactions Tab */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Automated & Recurring Transactions
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Salaries, rents, and utility bills scheduled to process automatically
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleProcessRecurring}
                className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <Play className="w-3.5 h-3.5 text-blue-600" />
                <span>Run Due Checks Now</span>
              </button>
              <button
                onClick={() => setIsRecurringModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Schedule</span>
              </button>
            </div>
          </div>

          {recurringTxs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400">
                    <th className="pb-3">Title</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Frequency</th>
                    <th className="pb-3">Next Run Date</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {recurringTxs.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">
                        {item.title}
                      </td>
                      <td className="py-3 text-xs">
                        <span
                          className={`font-bold ${
                            item.type === "INCOME" ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-slate-600 dark:text-slate-400 capitalize">
                        {item.frequency.toLowerCase()}
                      </td>
                      <td className="py-3 text-xs text-slate-600 dark:text-slate-300">
                        {item.next_run_date}
                      </td>
                      <td className="py-3 text-xs">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                          Active
                        </span>
                      </td>
                      <td className="py-3 text-right font-bold text-sm">
                        ₹{Number(item.amount).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDeleteRecurring(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No recurring schedules"
              description="Schedule recurring income like salaries or recurring expenses like rent and subscriptions."
              actionLabel="+ Schedule Recurring"
              onAction={() => setIsRecurringModalOpen(true)}
            />
          )}
        </div>
      )}

      {/* Schedule Recurring Modal */}
      <Modal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        title="Schedule Recurring Transaction"
      >
        <form onSubmit={handleCreateRecurring} className="space-y-4">
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setRecType("EXPENSE")}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                recType === "EXPENSE" ? "bg-rose-500 text-white" : "text-slate-600"
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setRecType("INCOME")}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                recType === "INCOME" ? "bg-emerald-500 text-white" : "text-slate-600"
              }`}
            >
              Income
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Netflix Subscription or Monthly Salary"
              value={recTitle}
              onChange={(e) => setRecTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={recAmount}
                onChange={(e) => setRecAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Frequency *
              </label>
              <select
                value={recFreq}
                onChange={(e) => setRecFreq(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start / Next Run Date *
              </label>
              <input
                type="date"
                required
                value={recStartDate}
                onChange={(e) => setRecStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={recEndDate}
                onChange={(e) => setRecEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsRecurringModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingRec}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              {submittingRec ? "Scheduling..." : "Save Schedule"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
