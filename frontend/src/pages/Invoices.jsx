import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Download,
  Mail,
  CheckCircle,
  XCircle,
  CreditCard,
  Search,
  Filter,
  Printer,
  RotateCw,
  AlertCircle,
} from 'lucide-react';

export const Invoices = ({ onRecordPayment }) => {
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

  // Payment Recording Modal State
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

  const handleCancel = async (invId) => {
    if (!window.confirm('Are you sure you want to cancel this invoice?')) return;
    try {
      await api.post(`/invoices/${invId}/cancel`, {});
      setActionFeedback('Invoice cancelled.');
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Billing & Invoices</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated subscription billing, tax calculation, PDF exports, and payment settlement
          </p>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-medium">
          <CheckCircle size={16} />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 text-slate-500 h-4 w-4" />
          <input
            type="text"
            placeholder="Search invoice number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-slate-900 border border-slate-700/80 pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
          />
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
            <option value="">All Invoices</option>
            <option value="Draft">Draft</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Billing Period</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Amount Due</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400 animate-pulse">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No invoices found matching criteria.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{inv.customer?.name}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                        {inv.customer?.company || inv.customer?.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(inv.billingPeriodStart).toLocaleDateString()} –{' '}
                      {new Date(inv.billingPeriodEnd).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={inv.status} />
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      ${inv.totalAmount?.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      {inv.amountDue > 0 ? (
                        <span className="text-rose-400">${inv.amountDue?.toFixed(2)}</span>
                      ) : (
                        <span className="text-emerald-400">$0.00</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDetailInvoice(inv)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                        >
                          View
                        </button>

                        <button
                          onClick={() => handlePrintPDF(inv)}
                          title="Download PDF"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        >
                          <Download size={14} />
                        </button>

                        {user?.role !== 'customer' && (
                          <>
                            {inv.status === 'Draft' && (
                              <button
                                onClick={() => handleConfirm(inv._id)}
                                className="px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white text-xs font-medium transition-colors"
                              >
                                Confirm
                              </button>
                            )}

                            <button
                              onClick={() => handleSendEmail(inv._id)}
                              disabled={actionLoading}
                              title="Email PDF Invoice to Customer"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            >
                              <Mail size={14} />
                            </button>

                            {inv.amountDue > 0 && inv.status !== 'Cancelled' && (
                              <button
                                onClick={() => openPaymentModal(inv)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white text-xs font-medium transition-colors flex items-center gap-1"
                              >
                                <CreditCard size={12} />
                                <span>Pay</span>
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
          <span>Total: {total} invoices</span>
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

      {/* Invoice Detail Modal */}
      <Modal
        isOpen={!!detailInvoice}
        onClose={() => setDetailInvoice(null)}
        title={`Invoice Breakdown: ${detailInvoice?.invoiceNumber}`}
        maxWidth="max-w-2xl"
      >
        {detailInvoice && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Customer</span>
                <p className="font-semibold text-white mt-0.5">{detailInvoice.customer?.name}</p>
                <p className="text-[11px] text-slate-400">{detailInvoice.customer?.email}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Status</span>
                <div className="mt-1">
                  <Badge status={detailInvoice.status} />
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Due Date</span>
                <p className="font-semibold text-white mt-0.5">
                  {new Date(detailInvoice.dueDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Amount Due</span>
                <p className="font-bold text-sm text-rose-400 mt-0.5">
                  ${detailInvoice.amountDue?.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Line items */}
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/40">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900 text-[10px] text-slate-400 uppercase">
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5">Qty</th>
                    <th className="p-2.5">Unit Price</th>
                    <th className="p-2.5">Tax</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(detailInvoice.lines || []).map((l, i) => (
                    <tr key={i}>
                      <td className="p-2.5 font-medium text-white">{l.description}</td>
                      <td className="p-2.5 font-mono">{l.quantity}</td>
                      <td className="p-2.5 font-mono">${l.unitPrice?.toFixed(2)}</td>
                      <td className="p-2.5 font-mono">${(l.taxAmount || 0).toFixed(2)}</td>
                      <td className="p-2.5 font-mono font-bold text-right text-white">
                        ${l.total?.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial summary */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 text-right text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span>${detailInvoice.subtotal?.toFixed(2)}</span>
              </div>
              {detailInvoice.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount:</span>
                  <span>-${detailInvoice.discountAmount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Taxes:</span>
                <span>${detailInvoice.taxTotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-white text-sm pt-1 border-t border-slate-800">
                <span>Total Amount:</span>
                <span>${detailInvoice.totalAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Amount Paid:</span>
                <span>${detailInvoice.amountPaid?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-rose-400 font-bold text-sm">
                <span>Amount Due:</span>
                <span>${detailInvoice.amountDue?.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => handlePrintPDF(detailInvoice)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center gap-1.5"
              >
                <Download size={14} />
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
        title={`Record Payment for ${selectedInvoiceForPayment?.invoiceNumber}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
          {paymentError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {paymentError}
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex justify-between items-center">
            <span className="text-slate-400">Total Invoice Amount:</span>
            <span className="font-bold text-white">
              ${selectedInvoiceForPayment?.totalAmount?.toFixed(2)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex justify-between items-center">
            <span className="text-slate-400">Outstanding Amount Due:</span>
            <span className="font-bold text-rose-400 text-sm">
              ${selectedInvoiceForPayment?.amountDue?.toFixed(2)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
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
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs font-bold text-white"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Supports partial payments. Invoice status will switch to Paid once remaining balance hits $0.00.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white"
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
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Reference / Transaction ID
            </label>
            <input
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="e.g. TXN-8930129"
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white"
            />
          </div>

          <button
            type="submit"
            disabled={paymentSubmitting}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-emerald-500/25 disabled:opacity-50"
          >
            {paymentSubmitting ? 'Recording Payment...' : 'Confirm & Settle Payment'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
