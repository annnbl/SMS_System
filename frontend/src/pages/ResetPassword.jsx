import React, { useState } from 'react';
import { api } from '../services/api';
import { Layers, Lock, CheckCircle2, XCircle, AlertCircle, ArrowRight } from 'lucide-react';

export const ResetPassword = ({ token: initialToken, onComplete }) => {
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-xl shadow-brand-500/25 mb-3">
            <Layers className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Set New Password</h1>
          <p className="text-slate-400 text-xs mt-1">Enter your token and configure your new secure password</p>
        </div>

        <div className="glass-panel rounded-2xl p-7 shadow-2xl border border-slate-800">
          {success ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Password Reset Successful</h3>
              <p className="text-xs text-slate-300">
                Your password has been securely updated. You can now log in with your new credentials.
              </p>
              <button
                onClick={onComplete}
                className="w-full mt-4 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors"
              >
                Proceed to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-sm">
                  <AlertCircle size={18} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Reset Token
                </label>
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste your reset token"
                  className="w-full rounded-xl bg-slate-900/80 border border-slate-700 px-3.5 py-2 text-xs font-mono text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-500 h-4 w-4" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full rounded-xl bg-slate-900/80 border border-slate-700 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-500 h-4 w-4" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full rounded-xl bg-slate-900/80 border border-slate-700 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Requirement Checklist */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] space-y-1">
                <div className={`flex items-center gap-1.5 ${checks.length ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {checks.length ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  <span>&gt; 8 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${checks.upper ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {checks.upper ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  <span>Uppercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${checks.lower ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {checks.lower ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  <span>Lowercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${checks.special ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {checks.special ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  <span>Special character</span>
                </div>
                <div className={`flex items-center gap-1.5 ${checks.match ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {checks.match ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  <span>Passwords match</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isPasswordValid}
                className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating Password...' : 'Save New Password'}
                <ArrowRight size={16} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
