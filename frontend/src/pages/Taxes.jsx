import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { Plus, Trash2 } from 'lucide-react';

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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Tax Rules
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Admin tax percentages applied automatically to subscription lines and invoices
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus size={15} />
          <span>New Tax Rule</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading ? (
          <div className="col-span-3 text-center py-8 text-xs text-slate-400">Loading taxes...</div>
        ) : taxes.length === 0 ? (
          <div className="col-span-3 text-center py-8 text-xs text-slate-400">No tax rules defined.</div>
        ) : (
          taxes.map((t) => (
            <div
              key={t._id}
              className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</h3>
                  <button
                    onClick={() => handleDelete(t._id)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{t.rate}%</span>
                  <span className="text-xs text-slate-400 uppercase font-medium">Percentage</span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Default for new lines:</span>
                  <span className={t.isDefault ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-400'}>
                    {t.isDefault ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Tax Rule" maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tax Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sales Tax (10%)"
              className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Rate (%) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="10"
              className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs font-mono text-slate-900 dark:text-white"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-0"
            />
            <span className="text-xs text-slate-700 dark:text-slate-300">Set as default tax rule</span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Tax Rule'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
