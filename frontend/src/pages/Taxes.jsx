import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { Percent, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export const Taxes = () => {
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTaxes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/taxes');
      if (res.success) setTaxes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/taxes', {
        name,
        rate: parseFloat(rate),
        type: 'percentage',
        isDefault,
      });
      setModalOpen(false);
      setName('');
      setRate('');
      setIsDefault(false);
      fetchTaxes();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this tax rule?')) return;
    try {
      await api.delete(`/taxes/${id}`);
      fetchTaxes();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Tax Rules</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Admin-defined tax percentages applied automatically to subscription lines and invoices
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all shadow-lg shadow-brand-500/25 flex items-center gap-2"
        >
          <Plus size={16} />
          <span>New Tax Rule</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400">Loading taxes...</div>
        ) : taxes.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-400">No tax rules defined.</div>
        ) : (
          taxes.map((t) => (
            <div
              key={t._id}
              className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">{t.name}</h3>
                  <button
                    onClick={() => handleDelete(t._id)}
                    className="p-1 text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-brand-400">{t.rate}%</span>
                  <span className="text-xs text-slate-400 uppercase font-medium">Percentage</span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Default for New Subscriptions:</span>
                  {t.isDefault ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={14} /> Default
                    </span>
                  ) : (
                    <span className="text-slate-500">Standard</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Tax Rule" maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tax Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. State Sales Tax (8.5%)"
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tax Rate (%) *</label>
            <input
              type="number"
              step="0.01"
              required
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="10"
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white font-mono"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded border-slate-700 text-brand-600 focus:ring-0"
            />
            <span className="text-xs text-slate-300">Set as default tax for new subscriptions</span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-brand-500/25 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Tax Rule'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
