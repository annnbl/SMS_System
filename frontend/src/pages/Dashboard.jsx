import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Repeat,
  Calendar,
  CheckCircle,
  Clock,
  Play,
  RotateCw,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';

export const Dashboard = ({ onNavigate }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [cronFeedback, setCronFeedback] = useState('');

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const query = selectedPlan ? `?planId=${selectedPlan}` : '';
      const [res, planRes] = await Promise.all([
        api.get(`/reports/dashboard${query}`),
        api.get('/plans'),
      ]);
      if (res.success) setData(res.data);
      if (planRes.success) setPlans(planRes.data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [selectedPlan]);

  const triggerCronJob = async (jobName) => {
    try {
      setCronFeedback(`Triggering ${jobName} job...`);
      const res = await api.post(`/cron/trigger/${jobName}`, {});
      setCronFeedback(`Job ${jobName} completed: ${JSON.stringify(res.result)}`);
      fetchMetrics();
      setTimeout(() => setCronFeedback(''), 4000);
    } catch (err) {
      setCronFeedback(`Error: ${err.message}`);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-slate-400 animate-pulse flex items-center gap-2">
          <RotateCw className="animate-spin" size={16} />
          <span>Crunching financial aggregations...</span>
        </div>
      </div>
    );
  }

  const { summary, overdueInvoices, recentPayments } = data || {
    summary: {},
    overdueInvoices: [],
    recentPayments: [],
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time financial indicators, MRR analytics, and overdue receivables
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="rounded-xl bg-slate-900 border border-slate-700/80 px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
          >
            <option value="">All Subscription Plans</option>
            {plans.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.billingPeriod})
              </option>
            ))}
          </select>

          <button
            onClick={fetchMetrics}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
            title="Refresh metrics"
          >
            <RotateCw size={16} />
          </button>
        </div>
      </div>

      {/* Manual Cron Testing Bar (Admin feature) */}
      <div className="p-3.5 rounded-2xl glass-panel border border-brand-500/30 flex flex-wrap items-center justify-between gap-3 bg-brand-950/20">
        <div className="flex items-center gap-2">
          <Clock className="text-brand-400 h-4 w-4" />
          <span className="text-xs font-semibold text-white">Manual Scheduled Jobs Dispatcher:</span>
          {cronFeedback && (
            <span className="text-xs text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              {cronFeedback}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => triggerCronJob('billing')}
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Play size={12} className="text-brand-400" />
            <span>Run Billing Job</span>
          </button>
          <button
            onClick={() => triggerCronJob('expiry')}
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Play size={12} className="text-amber-400" />
            <span>Run Expiry Job</span>
          </button>
          <button
            onClick={() => triggerCronJob('overdue')}
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Play size={12} className="text-rose-400" />
            <span>Run Overdue Job</span>
          </button>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR */}
        <div className="glass-card rounded-2xl p-5 shadow-lg border border-slate-800 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Recurring Revenue</span>
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white tracking-tight">
              ${(summary.mrr || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-brand-300 mt-1 flex items-center gap-1 font-medium">
              <span>ARR: ${(summary.arr || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-brand-500/5 rounded-full pointer-events-none group-hover:scale-125 transition-transform" />
        </div>

        {/* Revenue Collected */}
        <div className="glass-card rounded-2xl p-5 shadow-lg border border-slate-800 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Revenue Collected</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-400 tracking-tight">
              ${(summary.revenueCollected || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              From {summary.invoiceCount || 0} issued invoices
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/5 rounded-full pointer-events-none group-hover:scale-125 transition-transform" />
        </div>

        {/* Amount Outstanding */}
        <div className="glass-card rounded-2xl p-5 shadow-lg border border-slate-800 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount Outstanding</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-400 tracking-tight">
              ${(summary.amountOutstanding || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Pending customer settlement</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-500/5 rounded-full pointer-events-none group-hover:scale-125 transition-transform" />
        </div>

        {/* Active Subscriptions */}
        <div className="glass-card rounded-2xl p-5 shadow-lg border border-slate-800 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Subscriptions</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Repeat size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white tracking-tight">
              {summary.activeSubscriptions || 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Out of {summary.totalSubscriptions || 0} total subscriptions
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-indigo-500/5 rounded-full pointer-events-none group-hover:scale-125 transition-transform" />
        </div>
      </div>

      {/* Subscription Status Pipeline Bar */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Subscription Lifecycle Pipeline</h3>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {Object.entries(summary.statusBreakdown || {}).map(([st, cnt]) => (
            <div key={st} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase font-medium">{st}</div>
              <div className="text-xl font-bold text-white mt-1">{cnt}</div>
              <Badge status={st} className="mt-1.5" />
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout: Overdue Invoices Alert & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Invoices */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="text-rose-400 h-5 w-5" />
                <h3 className="text-base font-bold text-white">Overdue Invoices Alert</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {overdueInvoices.length} Overdue
              </span>
            </div>

            {overdueInvoices.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800/80">
                <CheckCircle className="mx-auto h-8 w-8 text-emerald-400 mb-2 opacity-80" />
                No overdue receivables! All customer accounts are up to date.
              </div>
            ) : (
              <div className="space-y-2.5">
                {overdueInvoices.map((inv) => (
                  <div
                    key={inv._id}
                    className="p-3 rounded-xl bg-slate-900/70 border border-rose-900/30 flex items-center justify-between hover:border-rose-500/50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white">{inv.invoiceNumber}</span>
                        <Badge status="Overdue" />
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {inv.customer?.name} ({inv.customer?.company || 'No Company'})
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-rose-400">
                        ${inv.amountDue?.toFixed(2)} due
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Due: {new Date(inv.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate && onNavigate('invoices')}
            className="mt-4 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <span>View All Invoices in Operations</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        {/* Recent Payments Stream */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="text-emerald-400 h-5 w-5" />
                <h3 className="text-base font-bold text-white">Recent Payment Receipts</h3>
              </div>
              <span className="text-xs text-slate-400">Settled recently</span>
            </div>

            {recentPayments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800/80">
                No recent transactions recorded yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentPayments.map((pay) => (
                  <div
                    key={pay._id}
                    className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-xs text-white">{pay.paymentNumber}</div>
                      <div className="text-[11px] text-slate-400">
                        {pay.customer?.name} · {pay.method.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-400">
                        +${pay.amount?.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(pay.paymentDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate && onNavigate('payments')}
            className="mt-4 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Open Payment Ledger</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
