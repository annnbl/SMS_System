import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { Tag, Plus, Trash2, Calendar, CheckCircle } from 'lucide-react';

export const Discounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    type: 'percentage',
    value: '',
    minPurchaseAmount: 0,
    minQuantity: 1,
    usageLimit: 50,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/discounts');
      if (res.success) setDiscounts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/discounts', {
        ...formData,
        code: formData.code.toUpperCase(),
        value: parseFloat(formData.value),
        minPurchaseAmount: parseFloat(formData.minPurchaseAmount || 0),
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit, 10) : null,
      });
      setModalOpen(false);
      fetchDiscounts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete discount?')) return;
    try {
      await api.delete(`/discounts/${id}`);
      fetchDiscounts();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Discounts & Promo Rules</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Admin-only coupon management, minimum cart rules, and atomic usage counting
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              code: '',
              description: '',
              type: 'percentage',
              value: '',
              minPurchaseAmount: 0,
              minQuantity: 1,
              usageLimit: 50,
            });
            setError('');
            setModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all shadow-lg shadow-brand-500/25 flex items-center gap-2"
        >
          <Plus size={16} />
          <span>New Discount</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400">Loading coupons...</div>
        ) : discounts.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-400">No discounts active.</div>
        ) : (
          discounts.map((d) => (
            <div
              key={d._id}
              className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-brand-300 bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20">
                    {d.code}
                  </span>
                  <button
                    onClick={() => handleDelete(d._id)}
                    className="p-1 text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="mt-3">
                  <span className="text-2xl font-black text-white">
                    {d.type === 'percentage' ? `${d.value}% OFF` : `$${d.value} FLAT OFF`}
                  </span>
                  <p className="text-xs text-slate-400 mt-1">{d.description || 'General discount'}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Min Purchase:</span>
                    <span>${d.minPurchaseAmount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Redemption Usage:</span>
                    <span className="font-mono text-emerald-400">
                      {d.usageCount} / {d.usageLimit !== null ? d.usageLimit : '∞'} used
                    </span>
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
        title="Create Promotional Discount"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Coupon Code *</label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. FLASH25"
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs font-mono text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Value *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="20"
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs font-mono text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Min Purchase ($)</label>
              <input
                type="number"
                value={formData.minPurchaseAmount}
                onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                placeholder="100"
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Usage Limit</label>
              <input
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                placeholder="100"
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. 20% discount on initial orders"
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-brand-500/25 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Save Discount'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
