import React, { useState } from 'react';
import { api } from '../services/api';
import { Layers, ArrowLeft, Mail, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

export const ForgotPassword = ({ onSwitchToLogin, onOpenResetWithToken }) => {
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-xl shadow-brand-500/25 mb-3">
            <Layers className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Forgot Password</h1>
          <p className="text-slate-400 text-xs mt-1">We'll email you an expiring single-use reset link</p>
        </div>

        <div className="glass-panel rounded-2xl p-7 shadow-2xl border border-slate-800">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Reset Link Dispatched</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                If an account exists for <span className="font-semibold text-white">{email}</span>, a secure single-use password reset link expiring in 1 hour has been transmitted.
              </p>

              {devToken && (
                <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/30 text-left">
                  <div className="text-[11px] font-semibold text-brand-400 mb-1">
                    Direct Test Shortcut:
                  </div>
                  <button
                    onClick={() => onOpenResetWithToken(devToken)}
                    className="text-xs text-brand-300 hover:text-white underline flex items-center gap-1"
                  >
                    <span>Click here to test Reset Password immediately</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              )}

              <button
                onClick={onSwitchToLogin}
                className="w-full mt-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
              >
                Return to Sign In
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
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-500 h-4 w-4" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@brightloop.io"
                    className="w-full rounded-xl bg-slate-900/80 border border-slate-700 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-all shadow-lg shadow-brand-500/25 disabled:opacity-50"
              >
                {loading ? 'Sending Link...' : 'Send Password Reset Link'}
              </button>

              <button
                type="button"
                onClick={onSwitchToLogin}
                className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white pt-2 transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Back to Sign In</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
