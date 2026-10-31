import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Filter, History } from 'lucide-react';

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
  const [formCustomer, setFormCustomer] = useState('');
  const [formPlan, setFormPlan] = useState('');
  const [formTemplate, setFormTemplate] = useState('');
  const [formDiscountCode, setFormDiscountCode] = useState('');
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
      const [custRes, planRes, tmplRes] = await Promise.all([
        api.get('/users?role=customer&limit=50'),
        api.get('/plans'),
        api.get('/quotation-templates'),
      ]);
      setCustomers(custRes.data || []);
      setPlans(planRes.data || []);
      setTemplates(tmplRes.data || []);
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

  const handleGenerateInvoiceNow = async (subId) => {
    try {
      const res = await api.post(`/invoices/generate/${subId}`, {});
      setActionFeedback(`Invoice ${res.data?.invoiceNumber || ''} generated.`);
      setTimeout(() => setActionFeedback(''), 4000);
      fetchSubscriptions();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Subscriptions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Contracts, lifecycle transitions, and renewal policies
          </p>
        </div>

        {user?.role !== 'customer' && (
          <button
            onClick={openCreateModal}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={15} />
            <span>New Subscription</span>
          </button>
        )}
      </div>

      {actionFeedback && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs">
          {actionFeedback}
        </div>
      )}

      {/* Filter toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shadow-sm">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 text-slate-400 h-3.5 w-3.5" />
          <input
            type="text"
            placeholder="Search subscription number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-600"
          >
            <option value="">All</option>
            <option value="Draft">Draft</option>
            <option value="Quotation">Quotation</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Active">Active</option>
            <option value="Paused">Paused</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase tracking-wider text-[11px] font-medium">
                <th className="py-2.5 px-3">Subscription #</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Plan</th>
                <th className="py-2.5 px-3">Period</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Total Amount</th>
                <th className="py-2.5 px-3">Next Invoice</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    Loading subscriptions...
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No subscriptions found.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-medium text-slate-900 dark:text-white">
                      {sub.subscriptionNumber}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {sub.customer?.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                        {sub.customer?.company || sub.customer?.email}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      {sub.plan?.name || 'Custom Plan'}
                    </td>
                    <td className="py-3 px-3 text-slate-500 capitalize">
                      {sub.plan?.billingPeriod || 'monthly'}
                    </td>
                    <td className="py-3 px-3">
                      <Badge status={sub.status} />
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      ${sub.totalAmount?.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {sub.nextInvoiceDate
                        ? new Date(sub.nextInvoiceDate).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDetailSub(sub)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium"
                        >
                          Details
                        </button>

                        {user?.role !== 'customer' && (
                          <>
                            <button
                              onClick={() => {
                                setTransitionModalSub(sub);
                                setTargetStatus('');
                              }}
                              className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-medium"
                            >
                              Transition
                            </button>

                            {sub.status === 'Active' && (
                              <button
                                onClick={() => handleGenerateInvoiceNow(sub._id)}
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium"
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

        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 bg-slate-50 dark:bg-slate-950">
          <span>Total: {total} contracts</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40"
            >
              Prev
            </button>
            <span>Page {page}</span>
            <button
              disabled={page * 10 >= total}
              onClick={() => setPage(page + 1)}
              className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={!!detailSub}
        onClose={() => setDetailSub(null)}
        title={`Subscription: ${detailSub?.subscriptionNumber}`}
        maxWidth="max-w-2xl"
      >
        {detailSub && (
          <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-500 uppercase">Customer</span>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {detailSub.customer?.name}
                </p>
                <p className="text-[11px] text-slate-400">{detailSub.customer?.email}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase">Status</span>
                <div className="mt-1">
                  <Badge status={detailSub.status} />
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase">Term Dates</span>
                <p className="font-medium text-slate-900 dark:text-white mt-0.5">
                  {new Date(detailSub.startDate).toLocaleDateString()}
                </p>
                <p className="text-slate-400 text-[11px]">
                  Exp: {new Date(detailSub.expiryDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase">Payment Terms</span>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5 uppercase">
                  {detailSub.paymentTerms}
                </p>
              </div>
            </div>

            {/* Line items */}
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Contract Items</h4>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[10px] text-slate-500 uppercase">
                      <th className="p-2">Item</th>
                      <th className="p-2">Qty</th>
                      <th className="p-2">Unit Price</th>
                      <th className="p-2">Tax</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {(detailSub.lines || []).map((l, i) => (
                      <tr key={i}>
                        <td className="p-2 font-medium text-slate-900 dark:text-white">
                          {l.product?.name || detailSub.plan?.name || 'Software Subscription'}
                          {l.variantName && (
                            <span className="block text-[11px] text-blue-600 dark:text-blue-400">
                              {l.variantName} (+${l.variantExtraPrice})
                            </span>
                          )}
                        </td>
                        <td className="p-2 font-mono">{l.quantity}</td>
                        <td className="p-2 font-mono">${l.unitPrice?.toFixed(2)}</td>
                        <td className="p-2 font-mono">${l.taxAmount?.toFixed(2)}</td>
                        <td className="p-2 font-mono font-semibold text-right text-slate-900 dark:text-white">
                          ${l.amount?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex justify-end">
                <div className="w-56 space-y-1 text-right text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span>${detailSub.subtotal?.toFixed(2)}</span>
                  </div>
                  {detailSub.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Discount:</span>
                      <span>-${detailSub.discountAmount?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500">
                    <span>Taxes:</span>
                    <span>${detailSub.taxTotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span>Total Amount:</span>
                    <span>${detailSub.totalAmount?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Audit Log */}
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                <History size={13} className="text-slate-500" />
                <span>Status History Audit Trail</span>
              </h4>
              <div className="space-y-1.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px]">
                {(detailSub.statusHistory || []).map((h, i) => (
                  <div key={i} className="flex items-start justify-between">
                    <div>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {h.fromStatus} → {h.toStatus}
                      </span>
                      <p className="text-slate-500">{h.reason}</p>
                    </div>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {new Date(h.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Transition Modal */}
      <Modal
        isOpen={!!transitionModalSub}
        onClose={() => setTransitionModalSub(null)}
        title={`Transition ${transitionModalSub?.subscriptionNumber}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-3.5">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Current: <Badge status={transitionModalSub?.status} />
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Target Status
            </label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value)}
              className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            >
              <option value="">-- Choose Status --</option>
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
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Audit Note
            </label>
            <textarea
              rows="2"
              value={transitionReason}
              onChange={(e) => setTransitionReason(e.target.value)}
              placeholder="Reason for status change..."
              className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <button
            onClick={handleStatusTransition}
            disabled={!targetStatus || transitionLoading}
            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors disabled:opacity-40"
          >
            {transitionLoading ? 'Updating...' : 'Execute Transition'}
          </button>
        </div>
      </Modal>

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Subscription"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-3.5">
          {createError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              {createError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Customer *
            </label>
            <select
              required
              value={formCustomer}
              onChange={(e) => setFormCustomer(e.target.value)}
              className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs text-slate-900 dark:text-white"
            >
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.company || c.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              From Quotation Template (Optional)
            </label>
            <select
              value={formTemplate}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs text-slate-900 dark:text-white"
            >
              <option value="">-- Direct Plan Selection --</option>
              {templates.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Plan *
            </label>
            <select
              required
              value={formPlan}
              onChange={(e) => setFormPlan(e.target.value)}
              className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs text-slate-900 dark:text-white"
            >
              {plans.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} - ${p.price}/{p.billingPeriod}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Discount Code (Optional)
            </label>
            <input
              type="text"
              value={formDiscountCode}
              onChange={(e) => setFormDiscountCode(e.target.value.toUpperCase())}
              placeholder="e.g. LAUNCH20"
              className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs font-mono text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={createLoading}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors disabled:opacity-50"
          >
            {createLoading ? 'Creating...' : 'Create Subscription'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
