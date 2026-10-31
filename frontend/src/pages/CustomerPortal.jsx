import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import {
  Repeat,
  FileText,
  Download,
  CreditCard,
  Building,
  Mail,
  Phone,
  CheckCircle,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

export const CustomerPortal = ({ defaultTab = 'subscriptions' }) => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState(defaultTab);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Payment Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subRes, invRes] = await Promise.all([
        api.get('/subscriptions'),
        api.get('/invoices'),
      ]);
      if (subRes.success) setSubscriptions(subRes.data);
      if (invRes.success) setInvoices(invRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownloadPDF = async (inv) => {
    try {
      await api.downloadPdf(`/invoices/${inv._id}/pdf`, `Invoice-${inv.invoiceNumber}.pdf`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRenewSub = async (subId) => {
    try {
      await api.post(`/subscriptions/${subId}/renew`, {});
      setFeedback('Subscription renewal confirmed!');
      setTimeout(() => setFeedback(''), 4000);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const openPaymentModal = (inv) => {
    setSelectedInvoice(inv);
    setPaymentAmount(inv.amountDue.toFixed(2));
    setPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaymentSubmitting(true);
    try {
      await api.post('/payments', {
        invoiceId: selectedInvoice._id,
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
      });
      setPaymentModalOpen(false);
      setFeedback('Payment processed successfully. Thank you!');
      setTimeout(() => setFeedback(''), 4000);
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setPaymentSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl glass-panel border border-brand-500/20 bg-gradient-to-r from-brand-950/40 via-slate-900 to-indigo-950/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
              Customer Self-Service Portal
            </span>
            <h1 className="text-2xl font-black text-white mt-1">
              Welcome, {user?.name}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {user?.company || 'Organization Portal'} · Your active subscriptions and invoices
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('subscriptions')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeSubTab === 'subscriptions'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/25'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              My Subscriptions ({subscriptions.length})
            </button>
            <button
              onClick={() => setActiveSubTab('invoices')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeSubTab === 'invoices'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/25'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              My Invoices ({invoices.length})
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-medium">
          <CheckCircle size={16} />
          <span>{feedback}</span>
        </div>
      )}

      {/* Content depending on tab */}
      {activeSubTab === 'subscriptions' ? (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Active Software Subscriptions</h2>

          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading your subscriptions...</div>
          ) : subscriptions.length === 0 ? (
            <div className="p-10 text-center glass-card rounded-2xl text-slate-400 text-xs">
              You do not have any active software subscriptions yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subscriptions.map((sub) => (
                <div
                  key={sub._id}
                  className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs text-brand-400 font-bold">
                          {sub.subscriptionNumber}
                        </span>
                        <h3 className="text-base font-bold text-white mt-1">
                          {sub.plan?.name || 'Enterprise License'}
                        </h3>
                      </div>
                      <Badge status={sub.status} />
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Billing Cycle:</span>
                        <span className="text-white capitalize">{sub.plan?.billingPeriod || 'monthly'}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Total Recurring Amount:</span>
                        <span className="text-white font-bold">${sub.totalAmount?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Start Date:</span>
                        <span className="text-slate-300 font-mono">
                          {new Date(sub.startDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Renewal Date:</span>
                        <span className="text-emerald-400 font-mono">
                          {new Date(sub.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Included software features */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Licensed Features & Modules:
                      </span>
                      <div className="space-y-1">
                        {(sub.lines || []).map((l, i) => (
                          <div
                            key={i}
                            className="text-[11px] text-slate-300 bg-slate-900/60 p-1.5 rounded-lg flex items-center justify-between"
                          >
                            <span>{l.product?.name || 'Core System'} {l.variantName ? `(${l.variantName})` : ''}</span>
                            <span className="text-slate-500">Qty: {l.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {sub.plan?.allowRenew && (
                    <button
                      onClick={() => handleRenewSub(sub._id)}
                      className="mt-5 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Repeat size={14} />
                      <span>Renew Subscription</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Invoices & Statements</h2>

          <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-semibold text-slate-400 uppercase">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Billing Period</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Amount Due</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-900/40">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {inv.invoiceNumber}
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
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDownloadPDF(inv)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                            title="Download PDF"
                          >
                            <Download size={14} />
                          </button>

                          {inv.amountDue > 0 && inv.status !== 'Cancelled' && (
                            <button
                              onClick={() => openPaymentModal(inv)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20"
                            >
                              <CreditCard size={12} />
                              <span>Pay Now</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pay Invoice Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title={`Pay Invoice ${selectedInvoice?.invoiceNumber}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Amount Due:</span>
            <span className="font-bold text-rose-400 text-base">
              ${selectedInvoice?.amountDue?.toFixed(2)}
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
              max={selectedInvoice?.amountDue}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs font-bold text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white"
            >
              <option value="credit_card">Credit Card (Instant Settlement)</option>
              <option value="bank_transfer">ACH / Bank Transfer</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={paymentSubmitting}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-emerald-500/25 disabled:opacity-50"
          >
            {paymentSubmitting ? 'Authorizing Payment...' : `Confirm Payment of $${paymentAmount}`}
          </button>
        </form>
      </Modal>
    </div>
  );
};
