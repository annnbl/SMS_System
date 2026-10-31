import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Download, Repeat, CreditCard } from 'lucide-react';

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
      setFeedback('Subscription renewed.');
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
      setFeedback('Payment processed successfully.');
      setTimeout(() => setFeedback(''), 4000);
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setPaymentSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Customer Portal
          </span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
            {user?.name}
          </h1>
          <p className="text-xs text-slate-500">
            {user?.company || 'Organization Portal'} · Your active subscriptions and invoices
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('subscriptions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeSubTab === 'subscriptions'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            Subscriptions ({subscriptions.length})
          </button>
          <button
            onClick={() => setActiveSubTab('invoices')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeSubTab === 'invoices'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            Invoices ({invoices.length})
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs">
          {feedback}
        </div>
      )}

      {/* Content */}
      {activeSubTab === 'subscriptions' ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Active Subscriptions
          </h2>

          {loading ? (
            <div className="text-center py-8 text-xs text-slate-400">Loading subscriptions...</div>
          ) : subscriptions.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
              You do not have any active subscriptions.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {subscriptions.map((sub) => (
                <div
                  key={sub._id}
                  className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs text-slate-500">
                          {sub.subscriptionNumber}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                          {sub.plan?.name || 'Software Subscription'}
                        </h3>
                      </div>
                      <Badge status={sub.status} />
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>Period:</span>
                        <span className="text-slate-800 dark:text-slate-200 capitalize">
                          {sub.plan?.billingPeriod || 'monthly'}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Recurring Total:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          ${sub.totalAmount?.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Renewal Date:</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">
                          {new Date(sub.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Lines */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-medium text-slate-500 block mb-1">
                        Licensed Modules:
                      </span>
                      <div className="space-y-1">
                        {(sub.lines || []).map((l, i) => (
                          <div
                            key={i}
                            className="text-xs text-slate-700 dark:text-slate-300 p-1.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-between"
                          >
                            <span>
                              {l.product?.name || 'Core Software'}{' '}
                              {l.variantName ? `(${l.variantName})` : ''}
                            </span>
                            <span className="text-slate-400">Qty: {l.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {sub.plan?.allowRenew && (
                    <button
                      onClick={() => handleRenewSub(sub._id)}
                      className="mt-4 w-full py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Repeat size={13} />
                      <span>Renew Subscription</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Invoices & Statements
          </h2>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase tracking-wider text-[11px] font-medium">
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Total</th>
                  <th className="py-2.5 px-3">Amount Due</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-mono font-medium text-slate-900 dark:text-white">
                        {inv.invoiceNumber}
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
                            onClick={() => handleDownloadPDF(inv)}
                            className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                            title="Download PDF"
                          >
                            <Download size={13} />
                          </button>

                          {inv.amountDue > 0 && inv.status !== 'Cancelled' && (
                            <button
                              onClick={() => openPaymentModal(inv)}
                              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center gap-1"
                            >
                              <CreditCard size={12} />
                              <span>Pay</span>
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

      {/* Pay Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title={`Pay Invoice: ${selectedInvoice?.invoiceNumber}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-3.5">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-between text-xs">
            <span className="text-slate-500">Amount Due:</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">
              ${selectedInvoice?.amountDue?.toFixed(2)}
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
              max={selectedInvoice?.amountDue}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs font-semibold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 text-xs text-slate-900 dark:text-white"
            >
              <option value="credit_card">Credit Card</option>
              <option value="bank_transfer">Bank Transfer / Wire</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={paymentSubmitting}
            className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors disabled:opacity-50"
          >
            {paymentSubmitting ? 'Processing...' : `Pay $${paymentAmount}`}
          </button>
        </form>
      </Modal>
    </div>
  );
};
