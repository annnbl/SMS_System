import React, { useState } from 'react';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

export const ForgotPassword = ({ onSwitchToLogin, onOpenResetWithToken }) => {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [devToken, setDevToken] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      if (res.resetToken) {
        setDevToken(res.resetToken);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors">
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          title="Toggle Light / Dark mode"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors shadow-sm"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-base mb-3 shadow-sm">
            B
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Forgot Password
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
            Reset password link verification
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          {submitted ? (
            <div className="text-center space-y-3">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Link Dispatched</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                If an account exists for <span className="font-semibold text-slate-900 dark:text-white">{email}</span>, a secure password reset link expiring in 1 hour has been generated.
              </p>

              {devToken && (
                <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-left">
                  <div className="text-[11px] font-medium text-blue-700 dark:text-blue-300 mb-1">
                    Development Shortcut:
                  </div>
                  <button
                    onClick={() => onOpenResetWithToken(devToken)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Click to test reset with token immediately
                  </button>
                </div>
              )}

              <button
                onClick={onSwitchToLogin}
                className="w-full mt-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@brightloop.io"
                  className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <button
                type="button"
                onClick={onSwitchToLogin}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 pt-1 transition-colors"
              >
                <ArrowLeft size={13} />
                <span>Back to Sign In</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
