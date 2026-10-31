import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Calendar, Plus, Check, X, Edit2, Trash2 } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Subscription Plans</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure pricing intervals, lifecycle policies (pause, renew, early close, auto-close)
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openNewModal}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all shadow-lg shadow-brand-500/25 flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Create Plan</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400">Loading plans...</div>
        ) : plans.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-400">No plans configured yet.</div>
        ) : (
          plans.map((p) => (
            <div
              key={p._id}
              className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between hover:border-brand-500/50 transition-all shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                      {p.code}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-2">{p.name}</h3>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>

                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-white">${p.price}</span>
                  <span className="text-xs text-slate-400 uppercase font-medium">
                    / {p.billingPeriod}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                  {p.description || 'Flexible subscription contract.'}
                </p>

                {/* Plan Lifecycle Policy Matrix */}
                <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2 text-xs">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Plan Policies
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Auto-close on expiry:</span>
                    {p.autoCloseOnEnd ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check size={14} /> Yes
                      </span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-1">
                        <X size={14} /> No
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Allow early termination:</span>
                    {p.allowEarlyClose ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check size={14} /> Allowed
                      </span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-1">
                        <X size={14} /> Locked
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Allow pause:</span>
                    {p.allowPause ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check size={14} /> Allowed
                      </span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-1">
                        <X size={14} /> No
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Allow self-renew:</span>
                    {p.allowRenew ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check size={14} /> Allowed
                      </span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-1">
                        <X size={14} /> No
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Plan Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enterprise Pro"
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="ENT-PRO"
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs font-mono text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Base Price ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="299"
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Billing Period *</label>
              <select
                value={formData.billingPeriod}
                onChange={(e) => setFormData({ ...formData, billingPeriod: e.target.value })}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Full tier access, priority support..."
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2 text-xs text-white"
            />
          </div>

          {/* Lifecycle Toggles */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
            <span className="font-semibold text-slate-300 block mb-1">Lifecycle Configurations:</span>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoCloseOnEnd}
                onChange={(e) => setFormData({ ...formData, autoCloseOnEnd: e.target.checked })}
                className="rounded border-slate-700 text-brand-600 focus:ring-0"
              />
              <span className="text-slate-300">Auto-close subscription when expiry date passes</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowEarlyClose}
                onChange={(e) => setFormData({ ...formData, allowEarlyClose: e.target.checked })}
                className="rounded border-slate-700 text-brand-600 focus:ring-0"
              />
              <span className="text-slate-300">Allow early cancellation before contract term</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowPause}
                onChange={(e) => setFormData({ ...formData, allowPause: e.target.checked })}
                className="rounded border-slate-700 text-brand-600 focus:ring-0"
              />
              <span className="text-slate-300">Allow customer / staff to pause subscription</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowRenew}
                onChange={(e) => setFormData({ ...formData, allowRenew: e.target.checked })}
                className="rounded border-slate-700 text-brand-600 focus:ring-0"
              />
              <span className="text-slate-300">Allow subscription renewal</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-brand-500/25 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : editingPlan ? 'Update Plan' : 'Save Plan'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
