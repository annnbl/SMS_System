import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2 } from 'lucide-react';

export const Templates = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [templates, setTemplates] = useState([]);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [planId, setPlanId] = useState('');
  const [validityDays, setValidityDays] = useState(30);
  const [terms, setTerms] = useState('Standard subscription terms apply.');
  const [lines, setLines] = useState([]);

  const [tempProduct, setTempProduct] = useState('');
  const [tempQty, setTempQty] = useState(1);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const [tRes, pRes, prRes] = await Promise.all([
        api.get('/quotation-templates'),
        api.get('/plans'),
        api.get('/products?limit=50'),
      ]);
      if (tRes.success) setTemplates(tRes.data);
      if (pRes.success) {
        setPlans(pRes.data);
        if (pRes.data[0]) setPlanId(pRes.data[0]._id);
      }
      if (prRes.success) {
        setProducts(prRes.data);
        if (prRes.data[0]) setTempProduct(prRes.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleAddLine = () => {
    if (!tempProduct) return;
    const prod = products.find((p) => p._id === tempProduct);
    if (!prod) return;

    setLines([
      ...lines,
      {
        product: prod._id,
        name: prod.name,
        quantity: parseInt(tempQty, 10) || 1,
        unitPrice: prod.salesPrice,
        variantName: '',
        variantExtraPrice: 0,
      },
    ]);
  };

  const handleRemoveLine = (idx) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/quotation-templates', {
        name,
        plan: planId,
        validityDays: parseInt(validityDays, 10),
        terms,
        lines: lines.map((l) => ({
          product: l.product,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          variantName: l.variantName || '',
          variantExtraPrice: l.variantExtraPrice || 0,
          description: l.name,
        })),
      });
      setModalOpen(false);
      setName('');
      setLines([]);
      fetchTemplates();
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
            Quotation Templates
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pre-assembled proposal packages with bundled plans, products, and validity
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={15} />
            <span>Create Template</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading ? (
          <div className="col-span-3 text-center py-8 text-xs text-slate-400">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="col-span-3 text-center py-8 text-xs text-slate-400">No quotation templates configured.</div>
        ) : (
          templates.map((t) => (
            <div
              key={t._id}
              className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</h3>
                  <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {t.validityDays} Days
                  </span>
                </div>

                <div className="mt-1.5 text-xs text-slate-500">
                  Plan: <span className="text-slate-800 dark:text-slate-200 font-medium">{t.plan?.name}</span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-medium text-slate-500 block mb-1">
                    Products ({t.lines?.length || 0}):
                  </span>
                  {(t.lines || []).map((l, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs p-1.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    >
                      <span className="text-slate-700 dark:text-slate-300 truncate max-w-[170px]">
                        {l.product?.name || 'Line Item'} (x{l.quantity})
                      </span>
                      <span className="font-mono text-slate-900 dark:text-white font-medium">
                        ${(l.unitPrice * l.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-slate-400 mt-2.5 line-clamp-2">
                  Terms: {t.terms}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Template"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Template Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Enterprise Cloud Stack"
              className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Default Plan *
              </label>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs text-slate-900 dark:text-white"
              >
                {plans.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} (${p.price}/{p.billingPeriod})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Validity (Days) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={validityDays}
                onChange={(e) => setValidityDays(e.target.value)}
                className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Terms
            </label>
            <textarea
              rows="2"
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
              Include Products
            </span>
            <div className="flex gap-2 mb-2">
              <select
                value={tempProduct}
                onChange={(e) => setTempProduct(e.target.value)}
                className="flex-1 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-1.5 text-xs text-slate-900 dark:text-white"
              >
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} - ${p.salesPrice}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={tempQty}
                onChange={(e) => setTempQty(e.target.value)}
                placeholder="Qty"
                className="w-16 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-1.5 text-xs text-slate-900 dark:text-white font-mono"
              />
              <button
                type="button"
                onClick={handleAddLine}
                className="px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Add
              </button>
            </div>

            {lines.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {lines.map((l, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                  >
                    <span>
                      {l.name} x{l.quantity} (${(l.unitPrice * l.quantity).toFixed(2)})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(i)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Template'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
