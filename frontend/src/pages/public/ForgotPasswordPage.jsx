import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import toast from "react-hot-toast";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [devResetData, setDevResetData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password/", { email });
      setSubmitted(true);
      toast.success("Instructions sent if the account exists.");
      if (res.data?.dev_reset_data) {
        setDevResetData(res.data.dev_reset_data);
      }
    } catch (err) {
      toast.error("Unable to process request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl">
        <Link
          to="/login"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Login
        </Link>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Forgot Password
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enter your email to receive a password reset link
          </p>
        </div>

        {submitted ? (
          <div className="text-center space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-2xl text-sm border border-emerald-200 dark:border-emerald-800">
              If an account with <strong>{email}</strong> exists, we've dispatched password reset instructions.
            </div>

            {devResetData && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-left rounded-xl text-xs border border-blue-200 dark:border-blue-800">
                <p className="font-bold text-blue-800 dark:text-blue-300 mb-1">
                  Development Mode Helper:
                </p>
                <Link
                  to={`/reset-password?uid=${devResetData.uid}&token=${devResetData.token}`}
                  className="text-blue-600 underline font-medium"
                >
                  Click here to proceed directly to Reset Password
                </Link>
              </div>
            )}

            <Link
              to="/login"
              className="inline-block mt-4 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {loading ? "Sending link..." : "Send Reset Link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
