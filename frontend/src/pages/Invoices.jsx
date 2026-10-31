import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Download, Mail, Search } from 'lucide-react';

export const Invoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const [detailInvoice, setDetailInvoice] = useState(null);
  const [actionFeedback, setActionFeedback] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Payment Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      let query = `?page=${page}&limit=10`;
      if (statusFilter) query += `&status=${statusFilter}`;
      if (search) query += `&search=${search}`;
      const res = await api.get(`/invoices${query}`);
      if (res.success) {
        setInvoices(res.data);
        setTotal(res.pagination.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, statusFilter, search]);

  const handlePrintPDF = async (inv) => {
    try {
      await api.downloadPdf(`/invoices/${inv._id}/pdf`, `Invoice-${inv.invoiceNumber}.pdf`);
    } catch (err) {
      alert(`Could not download PDF: ${err.message}`);
    }
  };

  const handleConfirm = async (invId) => {
    try {
      await api.post(`/invoices/${invId}/confirm`, {});
      setActionFeedback('Invoice confirmed.');
      setTimeout(() => setActionFeedback(''), 3000);
      fetchInvoices();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendEmail = async (invId) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/invoices/${invId}/send`, {});
      setActionFeedback(res.message);
      setTimeout(() => setActionFeedback(''), 4000);
      fetchInvoices();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openPaymentModal = (inv) => {
    setSelectedInvoiceForPayment(inv);
    setPaymentAmount(inv.amountDue.toFixed(2));
    setPaymentMethod('credit_card');
    setPaymentRef('');
    setPaymentError('');
    setPaymentModalOpen(true);
  };

  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    setPaymentSubmitting(true);
    setPaymentError('');
    try {
      await api.post('/payments', {
        invoiceId: selectedInvoiceForPayment._id,
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
        referenceNumber: paymentRef,
      });
      setPaymentModalOpen(false);
      setActionFeedback('Payment recorded successfully.');
      setTimeout(() => setActionFeedback(''), 3000);
      fetchInvoices();
    } catch (err) {
      setPaymentError(err.message);
    } finally {
      setPaymentSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Invoices
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Billing records, automated taxes, payments, and PDF downloads
        </p>
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
            placeholder="Search invoice number..."
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
            <option value="Confirmed">Confirmed</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase tracking-wider text-[11px] font-medium">
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Period</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Total</th>
                <th className="py-2.5 px-3">Amount Due</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-medium text-slate-900 dark:text-white">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {inv.customer?.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                        {inv.customer?.company || inv.customer?.email}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {new Date(inv.billingPeriodStart).toLocaleDateString()} –{' '}
                      {new Date(inv.billingPeriodEnd).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3">
                      <Badge status={inv.status} />
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      ${inv.totalAmount?.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 font-semibold">
                      {inv.amountDue > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400">
                          ${inv.amountDue?.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">$0.00</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDetailInvoice(inv)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium"
                        >
                          View
                        </button>

                        <button
                          onClick={() => handlePrintPDF(inv)}
                          title="Download PDF"
                          className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                        >
                          <Download size={13} />
                        </button>

                        {user?.role !== 'customer' && (
                          <>
                            {inv.status === 'Draft' && (
                              <button
                                onClick={() => handleConfirm(inv._id)}
                                className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-medium"
                              >
                                Confirm
                              </button>
                            )}

                            <button
                              onClick={() => handleSendEmail(inv._id)}
                              disabled={actionLoading}
                              title="Email PDF"
                              className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                            >
                              <Mail size={13} />
                            </button>

                            {inv.amountDue > 0 && inv.status !== 'Cancelled' && (
                              <button
                                onClick={() => openPaymentModal(inv)}
                                className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-medium"
                              >
                                Record Pay
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
          <span>Total: {total} invoices</span>
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

      {/* Detail Modal */}
      <Modal
        isOpen={!!detailInvoice}
        onClose={() => setDetailInvoice(null)}
        title={`Invoice: ${detailInvoice?.invoiceNumber}`}
        maxWidth="max-w-2xl"
      >
        {detailInvoice && (
          <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-500 uppercase">Customer</span>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {detailInvoice.customer?.name}
                </p>
                <p className="text-[11px] text-slate-400">{detailInvoice.customer?.email}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase">Status</span>
                <div className="mt-1">
                  <Badge status={detailInvoice.status} />
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase">Due Date</span>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {new Date(detailInvoice.dueDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase">Amount Due</span>
                <p className="font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  ${detailInvoice.amountDue?.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Line items */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[10px] text-slate-500 uppercase">
                    <th className="p-2">Description</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2">Unit Price</th>
                    <th className="p-2">Tax</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(detailInvoice.lines || []).map((l, i) => (
                    <tr key={i}>
                      <td className="p-2 font-medium text-slate-900 dark:text-white">
                        {l.description}
                      </td>
                      <td className="p-2 font-mono">{l.quantity}</td>
                      <td className="p-2 font-mono">${l.unitPrice?.toFixed(2)}</td>
                      <td className="p-2 font-mono">${(l.taxAmount || 0).toFixed(2)}</td>
                      <td className="p-2 font-mono font-semibold text-right text-slate-900 dark:text-white">
                        ${l.total?.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1 text-right text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span>${detailInvoice.subtotal?.toFixed(2)}</span>
              </div>
              {detailInvoice.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount:</span>
                  <span>-${detailInvoice.discountAmount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Taxes:</span>
                <span>${detailInvoice.taxTotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-800">
                <span>Total:</span>
                <span>${detailInvoice.totalAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Paid:</span>
                <span>${detailInvoice.amountPaid?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-rose-600 dark:text-rose-400">
                <span>Due:</span>
                <span>${detailInvoice.amountDue?.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => handlePrintPDF(detailInvoice)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs flex items-center gap-1.5"
              >
                <Download size={13} />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title={`Record Payment: ${selectedInvoiceForPayment?.invoiceNumber}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRecordPaymentSubmit} className="space-y-3.5">
          {paymentError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              {paymentError}
            </div>
          )}

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs flex justify-between">
            <span className="text-slate-500">Amount Due:</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">
              ${selectedInvoiceForPayment?.amountDue?.toFixed(2)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Payment Amount ($) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              min="0.01"
              max={selectedInvoiceForPayment?.amountDue}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs font-semibold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs text-slate-900 dark:text-white"
            >
              <option value="credit_card">Credit Card</option>
              <option value="bank_transfer">Bank Transfer / Wire</option>
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Reference ID
            </label>
            <input
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="e.g. WIRE-89210"
              className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={paymentSubmitting}
            className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors disabled:opacity-50"
          >
            {paymentSubmitting ? 'Recording...' : 'Settle Payment'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
