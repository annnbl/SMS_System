import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, ArrowRight, AlertCircle, Check, X } from 'lucide-react';

export const Register = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pass = formData.password;
  const checks = {
    length: pass.length > 8,
    upper: /[A-Z]/.test(pass),
    lower: /[a-z]/.test(pass),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pass),
  };
  const isPasswordValid = checks.length && checks.upper && checks.lower && checks.special;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Please satisfy all password criteria before submitting.');
      return;
    }

    setLoading(true);
    try {
      await register(formData);
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

      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-base mb-3 shadow-sm">
            B
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Create Customer Account
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
            Brightloop Software Subscription Portal
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jane Doe"
                  className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jane@company.com"
                  className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Acme Corp"
                  className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Create password"
                className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 font-mono"
              />

              <div className="mt-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
                <div className="font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Password Requirements:
                </div>
                <div className={`flex items-center gap-1.5 ${checks.length ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {checks.length ? <Check size={12} /> : <X size={12} />}
                  <span>More than 8 characters</span>
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
                  <span>One special character (!@#$%^&*)</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordValid}
              className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
              <ArrowRight size={14} />
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
