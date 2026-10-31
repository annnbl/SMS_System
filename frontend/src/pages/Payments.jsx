import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CreditCard, Search, Calendar, CheckCircle } from 'lucide-react';

export const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/payments?page=${page}&limit=10`);
      if (res.success) {
        setPayments(res.data);
        setTotal(res.pagination.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Payment Receipts</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Audited log of all processed subscription payments and customer transactions
        </p>
      </div>

      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 animate-pulse">
                    Loading payments...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {p.paymentNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{p.customer?.name}</div>
                      <div className="text-[11px] text-slate-400">{p.customer?.company}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {p.invoice?.invoiceNumber || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 capitalize text-slate-300">
                      {p.method?.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {p.referenceNumber || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400 text-sm">
                      +${p.amount?.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-900/30">
          <span>Total: {total} payments recorded</span>
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
    </div>
  );
};
