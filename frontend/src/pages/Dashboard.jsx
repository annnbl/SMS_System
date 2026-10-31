import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import {
  TrendingUp,
  DollarSign,
  Repeat,
  Clock,
  Play,
  RotateCw,
  AlertTriangle,
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
      setCronFeedback(`Running ${jobName}...`);
      const res = await api.post(`/cron/trigger/${jobName}`, {});
      setCronFeedback(`Job ${jobName} completed (${res.result?.count ?? 0} processed)`);
      fetchMetrics();
      setTimeout(() => setCronFeedback(''), 4000);
    } catch (err) {
      setCronFeedback(`Error: ${err.message}`);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <RotateCw className="animate-spin" size={14} />
          <span>Loading metrics...</span>
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
    <div className="space-y-5">
      {/* Top Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Key financial indicators, MRR analytics, and overdue receivables
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-600"
          >
            <option value="">All Plans</option>
            {plans.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.billingPeriod})
              </option>
            ))}
          </select>

          <button
            onClick={fetchMetrics}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Refresh"
          >
            <RotateCw size={14} />
          </button>
        </div>
      </div>

      {/* Cron Trigger Utility Bar */}
      <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <Clock className="text-blue-600 dark:text-blue-400 h-4 w-4" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Manual Scheduled Jobs:
          </span>
          {cronFeedback && (
            <span className="text-xs text-blue-600 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
              {cronFeedback}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => triggerCronJob('billing')}
            className="px-2.5 py-1 text-xs rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Play size={11} className="text-blue-600" />
            <span>Run Billing</span>
          </button>
          <button
            onClick={() => triggerCronJob('expiry')}
            className="px-2.5 py-1 text-xs rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Play size={11} className="text-amber-600" />
            <span>Run Expiry</span>
          </button>
          <button
            onClick={() => triggerCronJob('overdue')}
            className="px-2.5 py-1 text-xs rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Play size={11} className="text-rose-600" />
            <span>Run Overdue</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Monthly Recurring Revenue
            </span>
            <TrendingUp size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              ${(summary.mrr || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ARR: ${(summary.arr || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Revenue Collected */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Revenue Collected
            </span>
            <DollarSign size={16} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              ${(summary.revenueCollected || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              From {summary.invoiceCount || 0} invoices
            </p>
          </div>
        </div>

        {/* Amount Outstanding */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Amount Outstanding
            </span>
            <Clock size={16} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              ${(summary.amountOutstanding || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">Pending payments</p>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Active Subscriptions
            </span>
            <Repeat size={16} className="text-slate-600 dark:text-slate-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {summary.activeSubscriptions || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Of {summary.totalSubscriptions || 0} total contracts
            </p>
          </div>
        </div>
      </div>

      {/* Subscription Status Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
          Subscription Status Breakdown
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
          {Object.entries(summary.statusBreakdown || {}).map(([st, cnt]) => (
            <div
              key={st}
              className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
            >
              <div className="text-[11px] text-slate-500 font-medium">{st}</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{cnt}</div>
              <Badge status={st} className="mt-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Overdue Invoices & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Overdue Invoices */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="text-rose-600 dark:text-rose-400 h-4 w-4" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Overdue Receivables
                </h3>
              </div>
              <span className="text-xs text-rose-700 dark:text-rose-300 font-medium">
                {overdueInvoices.length} invoices
              </span>
            </div>

            {overdueInvoices.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                No overdue receivables. All invoices are settled or within terms.
              </div>
            ) : (
              <div className="space-y-2">
                {overdueInvoices.map((inv) => (
                  <div
                    key={inv._id}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {inv.invoiceNumber}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {inv.customer?.name} ({inv.customer?.company || 'No Company'})
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-rose-600 dark:text-rose-400">
                        ${inv.amountDue?.toFixed(2)} due
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Due {new Date(inv.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate && onNavigate('invoices')}
            className="mt-3 w-full py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium transition-colors"
          >
            View Invoices
          </button>
        </div>

        {/* Recent Payments */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Recent Payments
              </h3>
              <span className="text-xs text-slate-500">Latest settled</span>
            </div>

            {recentPayments.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                No recent transactions recorded.
              </div>
            ) : (
              <div className="space-y-2">
                {recentPayments.map((pay) => (
                  <div
                    key={pay._id}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {pay.paymentNumber}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {pay.customer?.name} · {pay.method.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">
                        +${pay.amount?.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400">
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
            className="mt-3 w-full py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium transition-colors"
          >
            View Payments
          </button>
        </div>
      </div>
    </div>
  );
};
