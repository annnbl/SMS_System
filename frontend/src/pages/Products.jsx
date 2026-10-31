import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Edit2 } from 'lucide-react';

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
    if (!window.confirm('Deactivate this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Products & Variants
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Software licenses, services, and attribute variants (e.g. Brand: Odoo +$560)
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openNewModal}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={15} />
            <span>Add Product</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading ? (
          <div className="col-span-3 text-center py-8 text-xs text-slate-400">Loading catalog...</div>
        ) : products.length === 0 ? (
          <div className="col-span-3 text-center py-8 text-xs text-slate-400">No products configured.</div>
        ) : (
          products.map((p) => (
            <div
              key={p._id}
              className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {p.type}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">{p.name}</h3>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">
                    ${p.salesPrice?.toFixed(2)}
                  </span>
                  {p.costPrice > 0 && (
                    <span className="text-xs text-slate-400">
                      (Cost: ${p.costPrice?.toFixed(2)})
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {p.notes || 'No notes.'}
                </p>

                {/* Variants */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-medium text-slate-500 block mb-1">
                    Variants ({p.variants?.length || 0}):
                  </span>
                  {p.variants?.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">Base item only</span>
                  ) : (
                    <div className="space-y-1">
                      {p.variants.map((v, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs p-1.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                        >
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {v.attribute}: {v.value}
                          </span>
                          <span className="text-blue-600 dark:text-blue-400 font-mono font-semibold">
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

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
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
              Product Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. BrightCloud ERP Suite"
              className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs text-slate-900 dark:text-white"
              >
                <option value="software">Software</option>
                <option value="service">Service</option>
                <option value="addon">Add-on</option>
                <option value="license">License</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Sales Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={salesPrice}
                onChange={(e) => setSalesPrice(e.target.value)}
                placeholder="1200"
                className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Cost Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="300"
                className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Features and technical specifications..."
              className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs text-slate-900 dark:text-white"
            />
          </div>

          {/* Variants */}
          <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
              Attribute Variants (e.g. Brand: Odoo +$560)
            </span>

            <div className="grid grid-cols-4 gap-2 mb-2">
              <input
                type="text"
                placeholder="Attribute"
                value={varAttribute}
                onChange={(e) => setVarAttribute(e.target.value)}
                className="rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-1.5 text-xs text-slate-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Value"
                value={varValue}
                onChange={(e) => setVarValue(e.target.value)}
                className="rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-1.5 text-xs text-slate-900 dark:text-white"
              />
              <input
                type="number"
                placeholder="+Extra $"
                value={varExtraPrice}
                onChange={(e) => setVarExtraPrice(e.target.value)}
                className="rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-1.5 text-xs text-slate-900 dark:text-white font-mono"
              />
              <button
                type="button"
                onClick={handleAddVariant}
                className="rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Add
              </button>
            </div>

            {variants.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {variants.map((v, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                  >
                    <span>
                      {v.attribute}: {v.value} (+${v.extraPrice})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(i)}
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
            {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
