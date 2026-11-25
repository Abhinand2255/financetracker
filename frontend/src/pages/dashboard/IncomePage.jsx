import React, { useState, useEffect } from "react";
import api from "../../api/client";
import StatCard from "../../components/common/StatCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";
import {
  TrendingUp,
  PlusCircle,
  Search,
  Filter,
  Trash2,
  Edit,
  DollarSign,
  Calendar,
} from "lucide-react";

export default function IncomePage() {
  const [incomes, setIncomes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [ordering, setOrdering] = useState("-date");

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [dateVal, setDateVal] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchIncomeData = async () => {
    try {
      let url = `/transactions/?type=INCOME&ordering=${ordering}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (categoryFilter) url += `&category=${categoryFilter}`;

      const [resList, resSummary, resCat] = await Promise.all([
        api.get(url),
        api.get("/transactions/summary/?type=INCOME"),
        api.get("/transactions/categories/?type=INCOME"),
      ]);

      setIncomes(resList.data.results || resList.data || []);
      setSummary(resSummary.data);
      setCategories(resCat.data || []);
    } catch (err) {
      toast.error("Failed to load income records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomeData();
  }, [search, categoryFilter, ordering]);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setTitle(item.title);
      setAmount(item.amount);
      setCategoryId(item.category || item.category_details?.id || "");
      setDateVal(item.date);
      setPaymentMethod(item.payment_method);
      setDescription(item.description);
    } else {
      setEditingId(null);
      setTitle("");
      setAmount("");
      setCategoryId(categories[0]?.id || "");
      setDateVal(new Date().toISOString().split("T")[0]);
      setPaymentMethod("Bank Transfer");
      setDescription("");
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      type: "INCOME",
      title,
      amount: parseFloat(amount),
      category_id: categoryId ? parseInt(categoryId) : null,
      date: dateVal,
      payment_method: paymentMethod,
      description,
    };

    try {
      if (editingId) {
        await api.put(`/transactions/${editingId}/`, payload);
        toast.success("Income record updated!");
      } else {
        await api.post("/transactions/", payload);
        toast.success("Income record added!");
      }
      setIsModalOpen(false);
      fetchIncomeData();
      window.dispatchEvent(new Event("fintrack:transaction_updated"));
    } catch (err) {
      toast.error("Failed to save income record.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this income entry?")) return;
    try {
      await api.delete(`/transactions/${id}/`);
      toast.success("Income record deleted.");
      fetchIncomeData();
      window.dispatchEvent(new Event("fintrack:transaction_updated"));
    } catch (err) {
      toast.error("Failed to delete record.");
    }
  };

  if (loading && !summary) {
    return <LoadingSpinner text="Loading income records..." />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Income Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track, categorize, and forecast your earnings
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-500/20 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Income</span>
        </button>
      </div>

      {/* Aggregate Metrics (Daily, Weekly, Monthly, Yearly, Total) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Daily Income" amount={summary?.daily || 0} color="emerald" subtitle="Earned today" />
        <StatCard title="Weekly Income" amount={summary?.weekly || 0} color="emerald" subtitle="Last 7 days" />
        <StatCard title="Monthly Income" amount={summary?.monthly || 0} color="emerald" subtitle="Current month" />
        <StatCard title="Yearly Income" amount={summary?.yearly || 0} color="emerald" subtitle="Current year" />
        <StatCard title="Total Income" amount={summary?.total || 0} color="blue" subtitle="All time recorded" />
      </div>

      {/* Filter and Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search income by title or note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="-date">Sort by: Date (Newest first)</option>
              <option value="date">Sort by: Date (Oldest first)</option>
              <option value="-amount">Sort by: Amount (Highest first)</option>
              <option value="amount">Sort by: Amount (Lowest first)</option>
            </select>
          </div>
        </div>

        {/* Incomes Table */}
        {incomes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400">
                  <th className="pb-3">Title & Notes</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {incomes.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5">
                      <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                          {item.description}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50">
                        {item.category_details?.name || "Income"}
                      </span>
                    </td>
                    <td className="py-3.5 text-xs text-slate-500 dark:text-slate-400">
                      {item.date}
                    </td>
                    <td className="py-3.5 text-xs text-slate-600 dark:text-slate-300">
                      {item.payment_method}
                    </td>
                    <td className="py-3.5 text-right font-bold text-sm text-emerald-600 dark:text-emerald-400">
                      +₹{Number(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No income transactions found"
            description="Add your salary, freelance earnings, or investment returns to get started."
            actionLabel="+ Add Income"
            onAction={() => handleOpenModal()}
          />
        )}
      </div>

      {/* Add / Edit Income Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Income Record" : "Add New Income"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. November Salary or Client Project"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={dateVal}
                onChange={(e) => setDateVal(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              placeholder="Optional details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Record"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
