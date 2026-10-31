import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Package, Plus, Trash2, Edit2, CheckCircle, AlertCircle } from 'lucide-react';

export const Products = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('software');
  const [salesPrice, setSalesPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [variants, setVariants] = useState([]);

  // New variant temp inputs
  const [varAttribute, setVarAttribute] = useState('Brand');
  const [varValue, setVarValue] = useState('');
  const [varExtraPrice, setVarExtraPrice] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products?limit=50');
      if (res.success) setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openNewModal = () => {
    setEditingProduct(null);
    setName('');
    setType('software');
    setSalesPrice('');
    setCostPrice('');
    setNotes('');
    setVariants([]);
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setName(p.name);
    setType(p.type);
    setSalesPrice(p.salesPrice.toString());
    setCostPrice(p.costPrice.toString());
    setNotes(p.notes || '');
    setVariants(p.variants || []);
    setError('');
    setModalOpen(true);
  };

  const handleAddVariant = () => {
    if (!varValue) return;
    const extra = parseFloat(varExtraPrice || '0');
    const varName = `${varAttribute}: ${varValue} (+$${extra})`;
    setVariants([
      ...variants,
      {
        name: varName,
        attribute: varAttribute,
        value: varValue,
        extraPrice: extra,
      },
    ]);
    setVarValue('');
    setVarExtraPrice('');
  };

  const handleRemoveVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        name,
        type,
        salesPrice: parseFloat(salesPrice),
        costPrice: parseFloat(costPrice || '0'),
        notes,
        variants,
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, payload);
      } else {
        await api.post('/products', payload);
      }

      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Products & Variants</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Software licenses, services, and attribute variants (e.g., Odoo Brand +$560)
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openNewModal}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all shadow-lg shadow-brand-500/25 flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400">Loading catalog...</div>
        ) : products.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-400">No products configured yet.</div>
        ) : (
          products.map((p) => (
            <div
              key={p._id}
              className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                      {p.type}
                    </span>
                    <h3 className="text-base font-bold text-white mt-2">{p.name}</h3>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">
                    ${p.salesPrice?.toFixed(2)}
                  </span>
                  {p.costPrice > 0 && (
                    <span className="text-xs text-slate-400">
                      (Cost: ${p.costPrice?.toFixed(2)})
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                  {p.notes || 'No notes provided.'}
                </p>

                {/* Variants List */}
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                    Configured Variants ({p.variants?.length || 0}):
                  </span>
                  {p.variants?.length === 0 ? (
                    <span className="text-[11px] text-slate-500 italic">Standard base variant only</span>
                  ) : (
                    <div className="space-y-1">
                      {p.variants.map((v, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80"
                        >
                          <span className="text-slate-300 font-medium">
                            {v.attribute}: {v.value}
                          </span>
                          <span className="text-brand-400 font-mono font-bold">
                            +${v.extraPrice}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal create / edit */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? 'Edit Product & Pricing' : 'Add New Software Product'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Product Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. BrightCloud ERP Suite"
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white"
              >
                <option value="software">Software</option>
                <option value="service">Service</option>
                <option value="addon">Add-on</option>
                <option value="license">License</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Sales Price ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={salesPrice}
                onChange={(e) => setSalesPrice(e.target.value)}
                placeholder="1200"
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Cost Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="300"
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Product Notes</label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Features, technical notes, deployment details..."
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2 text-xs text-white"
            />
          </div>

          {/* Variants Builder */}
          <div className="pt-3 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-300 block mb-2">
              Attribute Variants (e.g. Brand: Odoo adds +$560)
            </span>

            <div className="grid grid-cols-4 gap-2 mb-3">
              <input
                type="text"
                placeholder="Attribute (e.g. Brand)"
                value={varAttribute}
                onChange={(e) => setVarAttribute(e.target.value)}
                className="rounded-xl bg-slate-900 border border-slate-700 p-2 text-xs text-white"
              />
              <input
                type="text"
                placeholder="Value (e.g. Odoo)"
                value={varValue}
                onChange={(e) => setVarValue(e.target.value)}
                className="rounded-xl bg-slate-900 border border-slate-700 p-2 text-xs text-white"
              />
              <input
                type="number"
                placeholder="+Extra Price"
                value={varExtraPrice}
                onChange={(e) => setVarExtraPrice(e.target.value)}
                className="rounded-xl bg-slate-900 border border-slate-700 p-2 text-xs text-white font-mono"
              />
              <button
                type="button"
                onClick={handleAddVariant}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-white font-semibold flex items-center justify-center gap-1"
              >
                <Plus size={14} />
                <span>Add</span>
              </button>
            </div>

            {variants.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {variants.map((v, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                  >
                    <span>
                      <strong className="text-white">{v.attribute}:</strong> {v.value} (+${v.extraPrice})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(i)}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-brand-500/25 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
