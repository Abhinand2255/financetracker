import React, { useState, useEffect } from "react";
import api from "../../api/client";
import StatCard from "../../components/common/StatCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";
import {
  TrendingDown,
  PlusCircle,
  Search,
  Trash2,
  Edit,
  Tag,
} from "lucide-react";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
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
  const [paymentMethod, setPaymentMethod] = useState("Card");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // Custom Category Modal
  const [isCustomCategoryModalOpen, setIsCustomCategoryModalOpen] = useState(false);
  const [customCatName, setCustomCatName] = useState("");
  const [customCatColor, setCustomCatColor] = useState("#EF4444");

  const fetchExpenseData = async () => {
    try {
      let url = `/transactions/?type=EXPENSE&ordering=${ordering}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (categoryFilter) url += `&category=${categoryFilter}`;

      const [resList, resSummary, resCat] = await Promise.all([
        api.get(url),
        api.get("/transactions/summary/?type=EXPENSE"),
        api.get("/transactions/categories/?type=EXPENSE"),
      ]);

      setExpenses(resList.data.results || resList.data || []);
      setSummary(resSummary.data);
      setCategories(resCat.data || []);
    } catch (err) {
      toast.error("Failed to load expense records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenseData();
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
      setPaymentMethod("Card");
      setDescription("");
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      type: "EXPENSE",
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
        toast.success("Expense record updated!");
      } else {
        await api.post("/transactions/", payload);
        toast.success("Expense record added!");
      }
      setIsModalOpen(false);
      fetchExpenseData();
      window.dispatchEvent(new Event("fintrack:transaction_updated"));
    } catch (err) {
      toast.error("Failed to save expense record.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense entry?")) return;
    try {
      await api.delete(`/transactions/${id}/`);
      toast.success("Expense record deleted.");
      fetchExpenseData();
      window.dispatchEvent(new Event("fintrack:transaction_updated"));
    } catch (err) {
      toast.error("Failed to delete record.");
    }
  };

  const handleCreateCustomCategory = async (e) => {
    e.preventDefault();
    if (!customCatName.trim()) return;
    try {
      const res = await api.post("/transactions/categories/", {
        name: customCatName.trim(),
        type: "EXPENSE",
        color: customCatColor,
        icon: "Tag",
      });
      toast.success("Custom category created!");
      setIsCustomCategoryModalOpen(false);
      setCustomCatName("");
      fetchExpenseData();
    } catch (err) {
      toast.error("Category name already exists.");
    }
  };

  if (loading && !summary) {
    return <LoadingSpinner text="Loading expense records..." />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Expense Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Control your spending, track budget thresholds, and manage custom categories
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={() => setIsCustomCategoryModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>New Category</span>
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-500/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Aggregate Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Daily Expenses" amount={summary?.daily || 0} color="rose" subtitle="Spent today" />
        <StatCard title="Weekly Expenses" amount={summary?.weekly || 0} color="rose" subtitle="Last 7 days" />
        <StatCard title="Monthly Expenses" amount={summary?.monthly || 0} color="rose" subtitle="Current month" />
        <StatCard title="Yearly Expenses" amount={summary?.yearly || 0} color="rose" subtitle="Current year" />
        <StatCard title="Total Expenses" amount={summary?.total || 0} color="rose" subtitle="All time recorded" />
      </div>

      {/* Filter and Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.is_default ? "" : "(Custom)"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
            >
              <option value="-date">Sort by: Date (Newest first)</option>
              <option value="date">Sort by: Date (Oldest first)</option>
              <option value="-amount">Sort by: Amount (Highest first)</option>
              <option value="amount">Sort by: Amount (Lowest first)</option>
            </select>
          </div>
        </div>

        {/* Expenses Table */}
        {expenses.length > 0 ? (
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
                {expenses.map((item) => (
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
                      <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/50">
                        {item.category_details?.name || "General Expense"}
                      </span>
                    </td>
                    <td className="py-3.5 text-xs text-slate-500 dark:text-slate-400">
                      {item.date}
                    </td>
                    <td className="py-3.5 text-xs text-slate-600 dark:text-slate-300">
                      {item.payment_method}
                    </td>
                    <td className="py-3.5 text-right font-bold text-sm text-rose-600 dark:text-rose-400">
                      -₹{Number(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
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
            title="No expense transactions found"
            description="Add your daily expenses to track spending and stay within budget."
            actionLabel="+ Add Expense"
            onAction={() => handleOpenModal()}
          />
        )}
      </div>

      {/* Add / Edit Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Expense" : "Add New Expense"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Electricity Bill, Coffee, Dinner"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
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
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
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
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
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
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
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
              className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Expense"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Custom Category Modal */}
      <Modal
        isOpen={isCustomCategoryModalOpen}
        onClose={() => setIsCustomCategoryModalOpen(false)}
        title="Create Custom Expense Category"
      >
        <form onSubmit={handleCreateCustomCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Pet Care, Gaming, Subscriptions"
              value={customCatName}
              onChange={(e) => setCustomCatName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Color Theme
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={customCatColor}
                onChange={(e) => setCustomCatColor(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
              />
              <span className="text-xs text-slate-500 font-mono">{customCatColor}</span>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCustomCategoryModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-all"
            >
              Create Category
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
