import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Layers, ArrowRight, Lock, Mail, User, Building, Phone, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export const Register = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password rules validation on client
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-xl shadow-brand-500/25 mb-3">
            <Layers className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Create Customer Account</h1>
          <p className="text-slate-400 text-xs mt-1">Get immediate access to Brightloop Software subscriptions</p>
        </div>

        <div className="glass-panel rounded-2xl p-7 shadow-2xl border border-slate-800">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-sm">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-500 h-4 w-4" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Jane Doe"
                    className="w-full rounded-xl bg-slate-900/80 border border-slate-700 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-500 h-4 w-4" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane@company.com"
                    className="w-full rounded-xl bg-slate-900/80 border border-slate-700 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Company Name
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 text-slate-500 h-4 w-4" />
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Acme Inc."
                    className="w-full rounded-xl bg-slate-900/80 border border-slate-700 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-slate-500 h-4 w-4" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full rounded-xl bg-slate-900/80 border border-slate-700 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-500 h-4 w-4" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Create a strong password"
                  className="w-full rounded-xl bg-slate-900/80 border border-slate-700 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* Password requirement checklist */}
              <div className="mt-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] space-y-1">
                <div className="font-semibold text-slate-400 mb-1">Password Requirements:</div>
                <div className={`flex items-center gap-1.5 ${checks.length ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {checks.length ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  <span>More than 8 characters ({pass.length}/9 minimum)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${checks.upper ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {checks.upper ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  <span>At least one uppercase letter (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${checks.lower ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {checks.lower ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  <span>At least one lowercase letter (a-z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${checks.special ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {checks.special ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  <span>At least one special character (!@#$%^&*...)</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordValid}
              className="w-full mt-3 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-brand-400 hover:text-brand-300 font-semibold"
            >
              Sign In here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
