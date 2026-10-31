import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Check, X } from 'lucide-react';

export const Plans = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    price: '',
    billingPeriod: 'monthly',
    minQuantity: 1,
    autoCloseOnEnd: true,
    allowEarlyClose: true,
    allowPause: true,
    allowRenew: true,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/plans');
      if (res.success) setPlans(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openNewModal = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      price: '',
      billingPeriod: 'monthly',
      minQuantity: 1,
      autoCloseOnEnd: true,
      allowEarlyClose: true,
      allowPause: true,
      allowRenew: true,
    });
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      code: plan.code,
      description: plan.description || '',
      price: plan.price.toString(),
      billingPeriod: plan.billingPeriod,
      minQuantity: plan.minQuantity || 1,
      autoCloseOnEnd: !!plan.autoCloseOnEnd,
      allowEarlyClose: !!plan.allowEarlyClose,
      allowPause: !!plan.allowPause,
      allowRenew: !!plan.allowRenew,
    });
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        minQuantity: parseInt(formData.minQuantity, 10),
      };

      if (editingPlan) {
        await api.put(`/plans/${editingPlan._id}`, payload);
      } else {
        await api.post('/plans', payload);
      }

      setModalOpen(false);
      fetchPlans();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Subscription Plans
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Billing periods, renewals, and cancellation policies
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openNewModal}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={15} />
            <span>Create Plan</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading ? (
          <div className="col-span-3 text-center py-8 text-xs text-slate-400">Loading plans...</div>
        ) : plans.length === 0 ? (
          <div className="col-span-3 text-center py-8 text-xs text-slate-400">No plans configured.</div>
        ) : (
          plans.map((p) => (
            <div
              key={p._id}
              className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {p.code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">{p.name}</h3>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                </div>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">${p.price}</span>
                  <span className="text-xs text-slate-400 uppercase font-medium">
                    / {p.billingPeriod}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {p.description || 'Standard plan.'}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    Policies
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>Auto-close on end:</span>
                    <span className={p.autoCloseOnEnd ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
                      {p.autoCloseOnEnd ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>Early close:</span>
                    <span className={p.allowEarlyClose ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
                      {p.allowEarlyClose ? 'Allowed' : 'Locked'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>Pause:</span>
                    <span className={p.allowPause ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
                      {p.allowPause ? 'Allowed' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>Renew:</span>
                    <span className={p.allowRenew ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
                      {p.allowRenew ? 'Allowed' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPlan ? 'Edit Plan' : 'Create Plan'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Plan Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enterprise Pro"
                className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Plan Code *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="ENT-PRO"
                className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Base Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="299"
                className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Billing Period *
              </label>
              <select
                value={formData.billingPeriod}
                onChange={(e) => setFormData({ ...formData, billingPeriod: e.target.value })}
                className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs text-slate-900 dark:text-white"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoCloseOnEnd}
                onChange={(e) => setFormData({ ...formData, autoCloseOnEnd: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-0"
              />
              <span className="text-slate-700 dark:text-slate-300">Auto-close when expiry date is reached</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowEarlyClose}
                onChange={(e) => setFormData({ ...formData, allowEarlyClose: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-0"
              />
              <span className="text-slate-700 dark:text-slate-300">Allow early cancellation</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowPause}
                onChange={(e) => setFormData({ ...formData, allowPause: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-0"
              />
              <span className="text-slate-700 dark:text-slate-300">Allow pausing contract</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowRenew}
                onChange={(e) => setFormData({ ...formData, allowRenew: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-0"
              />
              <span className="text-slate-700 dark:text-slate-300">Allow self-service renewal</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors disabled:opacity-50"
          >
            {submitting ? 'Saving...' : editingPlan ? 'Update Plan' : 'Save Plan'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
