import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { FileSpreadsheet, Plus, Trash2, Calendar, FileText } from 'lucide-react';

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
  const [terms, setTerms] = useState('Payment due per subscription agreement.');
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Quotation Templates</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Pre-assembled proposal packages with default plans, line items, and expiration validity
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all shadow-lg shadow-brand-500/25 flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Create Template</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-400">No quotation templates configured yet.</div>
        ) : (
          templates.map((t) => (
            <div
              key={t._id}
              className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="text-base font-bold text-white">{t.name}</h3>
                  <span className="text-[10px] font-semibold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                    {t.validityDays} Days Validity
                  </span>
                </div>

                <div className="mt-2 text-xs text-slate-400">
                  Plan: <span className="text-white font-semibold">{t.plan?.name}</span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Bundled Products ({t.lines?.length || 0}):
                  </span>
                  {(t.lines || []).map((l, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-slate-900/60 border border-slate-800"
                    >
                      <span className="text-slate-300 truncate max-w-[180px]">
                        {l.product?.name || 'Software Line'} ({l.quantity}x)
                      </span>
                      <span className="text-white font-mono font-bold">
                        ${(l.unitPrice * l.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-slate-500 mt-3 italic line-clamp-2">
                  Terms: {t.terms}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Quotation Template"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Template Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Enterprise Cloud Modernization Stack"
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Default Plan *</label>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white"
              >
                {plans.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} (${p.price}/{p.billingPeriod})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Validity (Days) *</label>
              <input
                type="number"
                required
                min="1"
                value={validityDays}
                onChange={(e) => setValidityDays(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Standard Terms</label>
            <textarea
              rows="2"
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2 text-xs text-white"
            />
          </div>

          {/* Add product lines */}
          <div className="pt-3 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-300 block mb-2">Include Products</span>
            <div className="flex gap-2 mb-2">
              <select
                value={tempProduct}
                onChange={(e) => setTempProduct(e.target.value)}
                className="flex-1 rounded-xl bg-slate-900 border border-slate-700 p-2 text-xs text-white"
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
                className="w-20 rounded-xl bg-slate-900 border border-slate-700 p-2 text-xs text-white font-mono"
              />
              <button
                type="button"
                onClick={handleAddLine}
                className="px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white font-semibold"
              >
                Add Line
              </button>
            </div>

            {lines.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {lines.map((l, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                  >
                    <span>
                      {l.name} x{l.quantity} (${(l.unitPrice * l.quantity).toFixed(2)})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(i)}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-brand-500/25 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Quotation Template'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
