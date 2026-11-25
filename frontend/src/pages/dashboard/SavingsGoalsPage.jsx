import React, { useState, useEffect } from "react";
import api from "../../api/client";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";
import { Target, PlusCircle, CheckCircle, Trash2, Calendar, DollarSign } from "lucide-react";

export default function SavingsGoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Goal Modal
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [description, setDescription] = useState("");
  const [submittingGoal, setSubmittingGoal] = useState(false);

  // Contribute Modal
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [contribAmount, setContribAmount] = useState("");
  const [contribNote, setContribNote] = useState("");
  const [submittingContrib, setSubmittingContrib] = useState(false);

  const fetchGoals = async () => {
    try {
      const res = await api.get("/goals/");
      setGoals(res.data.results || res.data || []);
    } catch (err) {
      toast.error("Failed to load savings goals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    setSubmittingGoal(true);
    try {
      await api.post("/goals/", {
        name: goalName,
        target_amount: parseFloat(targetAmount),
        target_date: targetDate,
        description,
      });
      toast.success("Savings goal created!");
      setIsGoalModalOpen(false);
      setGoalName("");
      setTargetAmount("");
      setTargetDate("");
      setDescription("");
      fetchGoals();
    } catch (err) {
      toast.error("Failed to create goal.");
    } finally {
      setSubmittingGoal(false);
    }
  };

  const handleOpenContribute = (goal) => {
    setSelectedGoal(goal);
    setContribAmount("");
    setContribNote("");
    setIsContributeModalOpen(true);
  };

  const handleContribute = async (e) => {
    e.preventDefault();
    if (!contribAmount || parseFloat(contribAmount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    setSubmittingContrib(true);
    try {
      const res = await api.post(`/goals/${selectedGoal.id}/contribute/`, {
        amount: parseFloat(contribAmount),
        date: new Date().toISOString().split("T")[0],
        note: contribNote,
      });
      toast.success(res.data.message || "Contribution recorded!");
      setIsContributeModalOpen(false);
      fetchGoals();
    } catch (err) {
      toast.error("Failed to add contribution.");
    } finally {
      setSubmittingContrib(false);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm("Delete this savings goal?")) return;
    try {
      await api.delete(`/goals/${id}/`);
      toast.success("Goal deleted.");
      fetchGoals();
    } catch (err) {
      toast.error("Failed to delete goal.");
    }
  };

  if (loading && goals.length === 0) {
    return <LoadingSpinner text="Loading savings goals..." />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Savings Goals
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Build your emergency fund, vacation dreams, or major milestones with atomic savings tracking
          </p>
        </div>

        <button
          onClick={() => setIsGoalModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* Goals Grid */}
      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((g) => {
            const isCompleted = g.status === "COMPLETED";

            return (
              <div
                key={g.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {g.name}
                      </h3>
                      {g.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {g.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteGoal(g.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Amounts */}
                  <div className="flex items-baseline justify-between mb-3">
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                      ₹{Number(g.current_amount).toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      Target: ₹{Number(g.target_amount).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-500">Progress</span>
                      <span className="text-blue-600 dark:text-blue-400">
                        {g.percentage_completed}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? "bg-emerald-500" : "bg-blue-600"
                        }`}
                        style={{ width: `${g.percentage_completed}%` }}
                      />
                    </div>
                  </div>

                  {/* Target Date */}
                  <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-6">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Target Date: {g.target_date}</span>
                  </div>
                </div>

                {/* Bottom Action */}
                <div>
                  {isCompleted ? (
                    <div className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-900">
                      <CheckCircle className="w-4 h-4" />
                      <span>Goal Achieved!</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenContribute(g)}
                      className="w-full py-2.5 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-600 dark:text-blue-400 text-xs font-bold transition-colors"
                    >
                      + Add Contribution
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No savings goals created"
          description="Create a goal for your emergency fund, gadget upgrade, or vacation."
          actionLabel="+ New Savings Goal"
          onAction={() => setIsGoalModalOpen(true)}
        />
      )}

      {/* Create Goal Modal */}
      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        title="Create New Savings Goal"
      >
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Goal Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. New Laptop, Emergency Fund, Vacation"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="50000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Date *
              </label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description / Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Why are you saving for this?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsGoalModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingGoal}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              {submittingGoal ? "Creating..." : "Save Goal"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Contribute Modal */}
      <Modal
        isOpen={isContributeModalOpen}
        onClose={() => setIsContributeModalOpen(false)}
        title={`Add Savings to "${selectedGoal?.name}"`}
      >
        <form onSubmit={handleContribute} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Contribution Amount (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="1000"
              value={contribAmount}
              onChange={(e) => setContribAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Monthly salary savings"
              value={contribNote}
              onChange={(e) => setContribNote(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsContributeModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingContrib}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
            >
              {submittingContrib ? "Recording..." : "Save Contribution"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
