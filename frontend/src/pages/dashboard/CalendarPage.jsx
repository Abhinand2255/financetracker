import React, { useState, useEffect } from "react";
import api from "../../api/client";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Modal from "../../components/common/Modal";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected date modal
  const [selectedDayTxs, setSelectedDayTxs] = useState(null);
  const [selectedDateStr, setSelectedDateStr] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchMonthTransactions = async () => {
    setLoading(true);
    try {
      const start = new Date(year, month, 1).toISOString().split("T")[0];
      const end = new Date(year, month + 1, 0).toISOString().split("T")[0];
      const res = await api.get(`/transactions/?start_date=${start}&end_date=${end}&ordering=date`);
      setTransactions(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthTransactions();
  }, [year, month]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthName = currentDate.toLocaleString("default", { month: "long" });

  // Map transactions by day
  const txByDay = {};
  transactions.forEach((tx) => {
    const day = parseInt(tx.date.split("-")[2], 10);
    if (!txByDay[day]) txByDay[day] = [];
    txByDay[day].push(tx);
  });

  const handleDayClick = (day) => {
    const dayTxs = txByDay[day] || [];
    const formatted = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDateStr(formatted);
    setSelectedDayTxs(dayTxs);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Financial Calendar
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Explore daily cash inflows and outflows on your timeline
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 shadow-xs self-start sm:self-auto">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-slate-900 dark:text-white min-w-[130px] text-center">
            {monthName} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-2 mb-3 text-center text-xs font-bold text-slate-400">
          <div>SUN</div>
          <div>MON</div>
          <div>TUE</div>
          <div>WED</div>
          <div>THU</div>
          <div>FRI</div>
          <div>SAT</div>
        </div>

        {/* Month Cells */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[90px] rounded-xl bg-slate-50/50 dark:bg-slate-950/30" />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayTxs = txByDay[day] || [];
            const incCount = dayTxs.filter((t) => t.type === "INCOME").length;
            const expCount = dayTxs.filter((t) => t.type === "EXPENSE").length;

            return (
              <div
                key={day}
                onClick={() => handleDayClick(day)}
                className={`min-h-[90px] p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between cursor-pointer transition-all hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md ${
                  dayTxs.length > 0
                    ? "bg-white dark:bg-slate-800/40"
                    : "bg-slate-50/40 dark:bg-slate-900/40 opacity-75"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {day}
                  </span>
                  {dayTxs.length > 0 && (
                    <span className="text-[10px] font-semibold text-slate-400">
                      {dayTxs.length} tx
                    </span>
                  )}
                </div>

                {/* Day Activity Indicators */}
                <div className="space-y-1">
                  {incCount > 0 && (
                    <div className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 truncate">
                      +{incCount} Inc
                    </div>
                  )}
                  {expCount > 0 && (
                    <div className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 truncate">
                      -{expCount} Exp
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date Transactions Modal */}
      <Modal
        isOpen={!!selectedDayTxs}
        onClose={() => setSelectedDayTxs(null)}
        title={`Transactions on ${selectedDateStr}`}
      >
        {selectedDayTxs && selectedDayTxs.length > 0 ? (
          <div className="space-y-3">
            {selectedDayTxs.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
              >
                <div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">
                    {t.title}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                    <span>{t.category_details?.name || "General"}</span>
                    <span>•</span>
                    <span>{t.payment_method}</span>
                  </div>
                </div>
                <span
                  className={`text-sm font-extrabold ${
                    t.type === "INCOME" ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {t.type === "INCOME" ? "+" : "-"}₹{Number(t.amount).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-slate-500 py-6">
            No transactions recorded on this date.
          </p>
        )}
      </Modal>
    </div>
  );
}
