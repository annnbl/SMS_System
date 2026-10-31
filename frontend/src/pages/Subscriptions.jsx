import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import {
  Repeat,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  History,
  FileText,
  RotateCw,
  AlertCircle,
  Tag,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export const Subscriptions = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailSub, setDetailSub] = useState(null);
  const [transitionModalSub, setTransitionModalSub] = useState(null);
  const [targetStatus, setTargetStatus] = useState('');
  const [transitionReason, setTransitionReason] = useState('');
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState('');

  // Creation form state
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [products, setProducts] = useState([]);
  const [discounts, setDiscounts] = useState([]);

  const [formCustomer, setFormCustomer] = useState('');
  const [formPlan, setFormPlan] = useState('');
  const [formTemplate, setFormTemplate] = useState('');
  const [formDiscountCode, setFormDiscountCode] = useState('');
  const [formLines, setFormLines] = useState([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      let query = `?page=${page}&limit=10`;
      if (statusFilter) query += `&status=${statusFilter}`;
      if (search) query += `&search=${search}`;
      const res = await api.get(`/subscriptions${query}`);
      if (res.success) {
        setSubscriptions(res.data);
        setTotal(res.pagination.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [page, statusFilter, search]);

  const openCreateModal = async () => {
    setCreateError('');
    setCreateModalOpen(true);
    try {
      const [custRes, planRes, tmplRes, prodRes] = await Promise.all([
        api.get('/users?role=customer&limit=50'),
        api.get('/plans'),
        api.get('/quotation-templates'),
        api.get('/products?limit=50'),
      ]);
      setCustomers(custRes.data || []);
      setPlans(planRes.data || []);
      setTemplates(tmplRes.data || []);
      setProducts(prodRes.data || []);
      if (custRes.data?.[0]) setFormCustomer(custRes.data[0]._id);
      if (planRes.data?.[0]) setFormPlan(planRes.data[0]._id);
    } catch (err) {
      setCreateError(err.message);
    }
  };

  const handleTemplateSelect = (tmplId) => {
    setFormTemplate(tmplId);
    if (!tmplId) return;
    const tmpl = templates.find((t) => t._id === tmplId);
    if (tmpl && tmpl.plan) {
      setFormPlan(tmpl.plan._id || tmpl.plan);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    try {
      await api.post('/subscriptions', {
        customer: formCustomer,
        plan: formPlan,
        templateId: formTemplate || undefined,
        discountCode: formDiscountCode || undefined,
      });
      setCreateModalOpen(false);
      setActionFeedback('Subscription created in Draft status.');
      setTimeout(() => setActionFeedback(''), 4000);
      fetchSubscriptions();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleStatusTransition = async () => {
    if (!transitionModalSub || !targetStatus) return;
    setTransitionLoading(true);
    try {
      await api.post(`/subscriptions/${transitionModalSub._id}/transition`, {
        status: targetStatus,
        reason: transitionReason,
      });
      setTransitionModalSub(null);
      setTargetStatus('');
      setTransitionReason('');
      setActionFeedback(`Status updated to ${targetStatus}`);
      setTimeout(() => setActionFeedback(''), 4000);
      fetchSubscriptions();
      if (detailSub && detailSub._id === transitionModalSub._id) {
        const refreshed = await api.get(`/subscriptions/${detailSub._id}`);
        setDetailSub(refreshed.data);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setTransitionLoading(false);
    }
  };

  const handleRenew = async (subId) => {
    try {
      await api.post(`/subscriptions/${subId}/renew`, {});
      setActionFeedback('Subscription successfully renewed.');
      setTimeout(() => setActionFeedback(''), 4000);
      fetchSubscriptions();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleGenerateInvoiceNow = async (subId) => {
    try {
      const res = await api.post(`/invoices/generate/${subId}`, {});
      setActionFeedback(`Invoice ${res.data?.invoiceNumber || ''} generated successfully!`);
      setTimeout(() => setActionFeedback(''), 4000);
      fetchSubscriptions();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Subscriptions</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage contract life cycles from Draft to Quotation, Confirmation, and Active renewals
          </p>
        </div>

        {user?.role !== 'customer' && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all shadow-lg shadow-brand-500/25 flex items-center gap-2"
          >
            <Plus size={16} />
            <span>New Subscription</span>
          </button>
        )}
      </div>

      {actionFeedback && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-medium">
          <CheckCircle size={16} />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 text-slate-500 h-4 w-4" />
            <input
              type="text"
              placeholder="Search subscription number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700/80 pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Filter size={14} />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl bg-slate-900 border border-slate-700/80 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Quotation">Quotation</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Active">Active</option>
            <option value="Paused">Paused</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Table List */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Subscription #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Billing Period</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Next Invoice</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400 animate-pulse">
                    Loading subscriptions...
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No subscriptions found matching criteria.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {sub.subscriptionNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{sub.customer?.name}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                        {sub.customer?.company || sub.customer?.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      {sub.plan?.name || 'Custom Plan'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 capitalize">
                      {sub.plan?.billingPeriod || 'monthly'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={sub.status} />
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      ${sub.totalAmount?.toFixed(2)}
                      {sub.discountAmount > 0 && (
                        <span className="block text-[10px] text-emerald-400">
                          -${sub.discountAmount?.toFixed(2)} disc
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {sub.nextInvoiceDate
                        ? new Date(sub.nextInvoiceDate).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDetailSub(sub)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                        >
                          Details
                        </button>

                        {user?.role !== 'customer' && (
                          <>
                            {/* Status Flow transitions */}
                            <button
                              onClick={() => {
                                setTransitionModalSub(sub);
                                setTargetStatus('');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-brand-600/30 hover:bg-brand-600 text-brand-200 hover:text-white text-xs font-medium transition-colors"
                            >
                              Transition
                            </button>

                            {sub.status === 'Active' && (
                              <button
                                onClick={() => handleGenerateInvoiceNow(sub._id)}
                                title="Bill Now"
                                className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white text-xs font-medium transition-colors"
                              >
                                Bill Now
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-900/30">
          <span>Total: {total} subscriptions</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40"
            >
              Prev
            </button>
            <span>Page {page}</span>
            <button
              disabled={page * 10 >= total}
              onClick={() => setPage(page + 1)}
              className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal with Status History Log */}
      <Modal
        isOpen={!!detailSub}
        onClose={() => setDetailSub(null)}
        title={`Subscription Details: ${detailSub?.subscriptionNumber}`}
        maxWidth="max-w-3xl"
      >
        {detailSub && (
          <div className="space-y-5 text-xs text-slate-300">
            {/* Header info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900/70 border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Customer</span>
                <p className="font-semibold text-white mt-0.5">{detailSub.customer?.name}</p>
                <p className="text-[11px] text-slate-400">{detailSub.customer?.email}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Status</span>
                <div className="mt-1">
                  <Badge status={detailSub.status} />
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Start & Expiry</span>
                <p className="font-medium text-white mt-0.5">
                  {new Date(detailSub.startDate).toLocaleDateString()}
                </p>
                <p className="text-slate-400 text-[11px]">
                  Exp: {new Date(detailSub.expiryDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Payment Terms</span>
                <p className="font-semibold text-white mt-0.5 uppercase">
                  {detailSub.paymentTerms}
                </p>
              </div>
            </div>

            {/* Line items table */}
            <div>
              <h4 className="font-bold text-white mb-2">Contract Line Items</h4>
              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/40">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900 text-[10px] text-slate-400 uppercase">
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5">Qty</th>
                      <th className="p-2.5">Unit Price</th>
                      <th className="p-2.5">Taxes</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {(detailSub.lines || []).map((l, i) => (
                      <tr key={i}>
                        <td className="p-2.5">
                          <span className="font-semibold text-white">
                            {l.product?.name || detailSub.plan?.name || 'Software Subscription'}
                          </span>
                          {l.variantName && (
                            <span className="block text-[11px] text-brand-400">
                              Variant: {l.variantName} (+${l.variantExtraPrice})
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-mono">{l.quantity}</td>
                        <td className="p-2.5 font-mono">${l.unitPrice?.toFixed(2)}</td>
                        <td className="p-2.5 font-mono">${l.taxAmount?.toFixed(2)}</td>
                        <td className="p-2.5 font-mono font-bold text-right text-white">
                          ${l.amount?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial summary */}
              <div className="mt-3 flex justify-end">
                <div className="w-64 space-y-1 text-right">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span>${detailSub.subtotal?.toFixed(2)}</span>
                  </div>
                  {detailSub.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount:</span>
                      <span>-${detailSub.discountAmount?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400">
                    <span>Tax Total:</span>
                    <span>${detailSub.taxTotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-white pt-1 border-t border-slate-800">
                    <span>Total Amount:</span>
                    <span>${detailSub.totalAmount?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status History Audit Log */}
            <div>
              <h4 className="font-bold text-white mb-2 flex items-center gap-1.5">
                <History size={14} className="text-brand-400" />
                <span>Status Flow Audit Trail</span>
              </h4>
              <div className="space-y-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                {(detailSub.statusHistory || []).map((h, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-[11px]">
                    <div className="mt-1 h-2 w-2 rounded-full bg-brand-400" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">
                          {h.fromStatus} → {h.toStatus}
                        </span>
                        <span className="text-slate-500 font-mono">
                          {new Date(h.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-400">{h.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Status Transition Modal */}
      <Modal
        isOpen={!!transitionModalSub}
        onClose={() => setTransitionModalSub(null)}
        title={`Transition Status for ${transitionModalSub?.subscriptionNumber}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Current Status: <Badge status={transitionModalSub?.status} />
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Select Target Status
            </label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
            >
              <option value="">-- Choose Target Status --</option>
              {transitionModalSub?.status === 'Draft' && (
                <>
                  <option value="Quotation">Quotation</option>
                  <option value="Closed">Closed</option>
                </>
              )}
              {transitionModalSub?.status === 'Quotation' && (
                <>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Draft">Draft</option>
                  <option value="Closed">Closed</option>
                </>
              )}
              {transitionModalSub?.status === 'Confirmed' && (
                <>
                  <option value="Active">Active</option>
                  <option value="Closed">Closed</option>
                </>
              )}
              {transitionModalSub?.status === 'Active' && (
                <>
                  <option value="Paused">Paused</option>
                  <option value="Closed">Closed</option>
                </>
              )}
              {transitionModalSub?.status === 'Paused' && (
                <>
                  <option value="Active">Active</option>
                  <option value="Closed">Closed</option>
                </>
              )}
              {transitionModalSub?.status === 'Closed' && (
                <option value="Draft">Draft (Renew/Reopen)</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Reason / Audit Note
            </label>
            <textarea
              rows="3"
              value={transitionReason}
              onChange={(e) => setTransitionReason(e.target.value)}
              placeholder="e.g., Quotation signed by customer, activating service..."
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <button
            onClick={handleStatusTransition}
            disabled={!targetStatus || transitionLoading}
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors disabled:opacity-40"
          >
            {transitionLoading ? 'Processing Transition...' : 'Execute Status Transition'}
          </button>
        </div>
      </Modal>

      {/* Create Subscription Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Subscription"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {createError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {createError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Customer *</label>
            <select
              required
              value={formCustomer}
              onChange={(e) => setFormCustomer(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white"
            >
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.company || c.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Load from Quotation Template (Optional)
            </label>
            <select
              value={formTemplate}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white"
            >
              <option value="">-- None (Configure Plan Directly) --</option>
              {templates.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.validityDays} days validity)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Subscription Plan *
            </label>
            <select
              required
              value={formPlan}
              onChange={(e) => setFormPlan(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white"
            >
              {plans.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} - ${p.price}/{p.billingPeriod}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Discount Code (e.g. LAUNCH20)
            </label>
            <input
              type="text"
              value={formDiscountCode}
              onChange={(e) => setFormDiscountCode(e.target.value.toUpperCase())}
              placeholder="ENTERPRISE150"
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs font-mono text-white"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={createLoading}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-brand-500/25 disabled:opacity-50"
            >
              {createLoading ? 'Generating Contract...' : 'Create Subscription'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
