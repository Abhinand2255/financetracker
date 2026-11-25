import React, { useState, useEffect } from "react";
import api from "../../api/client";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";
import {
  Wallet,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit,
} from "lucide-react";

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchBudgets = async () => {
    try {
      const [resBudgets, resCat] = await Promise.all([
        api.get(`/budgets/?month=${selectedMonth}&year=${selectedYear}`),
        api.get("/transactions/categories/?type=EXPENSE"),
      ]);
      setBudgets(resBudgets.data.results || resBudgets.data || []);
      setCategories(resCat.data || []);
      if (resCat.data?.length > 0 && !categoryId) {
        setCategoryId(resCat.data[0].id);
      }
    } catch (err) {
      toast.error("Failed to load budgets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth, selectedYear]);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setCategoryId(item.category || item.category_details?.id);
      setAmount(item.amount);
    } else {
      setEditingId(null);
      setCategoryId(categories[0]?.id || "");
      setAmount("");
    }
    setIsModalOpen(true);
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!amount || !categoryId) {
      toast.error("Please enter amount and category.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        category_id: parseInt(categoryId),
        amount: parseFloat(amount),
        month: selectedMonth,
        year: selectedYear,
      };

      if (editingId) {
        await api.put(`/budgets/${editingId}/`, payload);
        toast.success("Budget updated!");
      } else {
        await api.post("/budgets/", payload);
        toast.success("Budget created!");
      }
      setIsModalOpen(false);
      fetchBudgets();
    } catch (err) {
      toast.error(err.response?.data?.non_field_errors?.[0] || "Failed to save budget.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm("Delete this budget?")) return;
    try {
      await api.delete(`/budgets/${id}/`);
      toast.success("Budget deleted.");
      fetchBudgets();
    } catch (err) {
      toast.error("Failed to delete budget.");
    }
  };

  const totalBudgeted = budgets.reduce((acc, b) => acc + parseFloat(b.amount || 0), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + parseFloat(b.spent_amount || 0), 0);
  const overallPercentage = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  if (loading && budgets.length === 0) {
    return <LoadingSpinner text="Loading budget utilization..." />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Budget Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Establish category limits with real-time alerts at 50%, 75%, 90% and 100%
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          {/* Month / Year Selector */}
          <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1 shadow-xs">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="text-xs font-semibold bg-transparent text-slate-700 dark:text-slate-300 py-1 focus:outline-none"
            >
              {[
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
              ].map((m, idx) => (
                <option key={idx} value={idx + 1}>{m}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="text-xs font-semibold bg-transparent text-slate-700 dark:text-slate-300 py-1 focus:outline-none"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Budget</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-600/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
              Monthly Budget Utilization
            </span>
            <h2 className="text-3xl font-extrabold mt-1">
              ₹{totalSpent.toLocaleString("en-IN")} / ₹{totalBudgeted.toLocaleString("en-IN")}
            </h2>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black">{overallPercentage}%</span>
            <p className="text-xs text-blue-200">
              ₹{Math.max(0, totalBudgeted - totalSpent).toLocaleString("en-IN")} Remaining
            </p>
          </div>
        </div>
        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              overallPercentage >= 100
                ? "bg-rose-400"
                : overallPercentage >= 75
                ? "bg-amber-400"
                : "bg-emerald-400"
            }`}
            style={{ width: `${Math.min(100, overallPercentage)}%` }}
          />
        </div>
      </div>

      {/* Category Budgets Grid */}
      {budgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((item) => {
            const isExceeded = item.utilization_percentage >= 100;
            const isWarning = item.utilization_percentage >= 75 && !isExceeded;

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm transition-all ${
                  isExceeded
                    ? "border-rose-300 dark:border-rose-900/60"
                    : isWarning
                    ? "border-amber-300 dark:border-amber-900/60"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {item.category_details?.name}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Budget: ₹{Number(item.amount).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBudget(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">
                      Spent: ₹{Number(item.spent_amount).toLocaleString("en-IN")}
                    </span>
                    <span
                      className={`font-bold ${
                        isExceeded
                          ? "text-rose-600"
                          : isWarning
                          ? "text-amber-600"
                          : "text-blue-600"
                      }`}
                    >
                      {item.utilization_percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isExceeded
                          ? "bg-rose-500"
                          : isWarning
                          ? "bg-amber-500"
                          : "bg-blue-600"
                      }`}
                      style={{ width: `${Math.min(100, item.utilization_percentage)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Remaining</span>
                  <span className={`font-bold ${isExceeded ? "text-rose-600" : "text-slate-900 dark:text-white"}`}>
                    {isExceeded ? "Exceeded limit!" : `₹${Number(item.remaining_amount).toLocaleString("en-IN")}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No budgets set for this month"
          description="Create spending thresholds for Food, Rent, Entertainment, and other categories."
          actionLabel="+ Create Budget"
          onAction={() => handleOpenModal()}
        />
      )}

      {/* Add / Edit Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Budget" : "Set Monthly Category Budget"}
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Expense Category *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Monthly Budget Limit (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="e.g. 10000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-xs text-blue-700 dark:text-blue-300">
            Automated alerts will notify you when spending reaches 50%, 75%, 90%, and 100% of this budget.
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              {submitting ? "Saving..." : "Save Budget"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
