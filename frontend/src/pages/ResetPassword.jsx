import React, { useState } from 'react';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, AlertCircle, CheckCircle, Check, X } from 'lucide-react';

export const ResetPassword = ({ token: initialToken, onComplete }) => {
  const { theme, toggleTheme } = useTheme();
  const [token, setToken] = useState(initialToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const checks = {
    length: newPassword.length > 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(newPassword),
    match: newPassword.length > 0 && newPassword === confirmPassword,
  };
  const isPasswordValid = checks.length && checks.upper && checks.lower && checks.special && checks.match;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Please fulfill all password requirements.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword,
      });
      setSuccess(true);
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
            Reset Password
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
            Configure new account password
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          {success ? (
            <div className="text-center space-y-3">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Password Updated</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Your password has been changed. You can now log in.
              </p>
              <button
                onClick={onComplete}
                className="w-full mt-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
              >
                Sign In
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
                  Reset Token
                </label>
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste token"
                  className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
                <div className={`flex items-center gap-1.5 ${checks.length ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {checks.length ? <Check size={12} /> : <X size={12} />}
                  <span>&gt; 8 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${checks.upper ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {checks.upper ? <Check size={12} /> : <X size={12} />}
                  <span>One uppercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${checks.lower ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {checks.lower ? <Check size={12} /> : <X size={12} />}
                  <span>One lowercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${checks.special ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {checks.special ? <Check size={12} /> : <X size={12} />}
                  <span>One special character</span>
                </div>
                <div className={`flex items-center gap-1.5 ${checks.match ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {checks.match ? <Check size={12} /> : <X size={12} />}
                  <span>Passwords match</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isPasswordValid}
                className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors disabled:opacity-40"
              >
                {loading ? 'Saving...' : 'Set Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
