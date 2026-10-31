import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Users as UsersIcon, UserPlus, Search, ShieldCheck } from 'lucide-react';

export const Users = () => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Creation modals
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let q = `?page=${page}&limit=10`;
      if (roleFilter) q += `&role=${roleFilter}`;
      if (search) q += `&search=${search}`;
      const res = await api.get(`/users${q}`);
      if (res.success) {
        setUsers(res.data);
        setTotal(res.pagination.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, search]);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setCompany('');
    setPhone('');
    setError('');
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/users/staff', { name, email, password, company, phone });
      setStaffModalOpen(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/users/customer', { name, email, password, company, phone });
      setCustomerModalOpen(false);
      resetForm();
      fetchUsers();
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
          <h1 className="text-2xl font-extrabold text-white tracking-tight">User Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Internal operators, staff members, and client subscriber accounts
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => {
                resetForm();
                setStaffModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-cyan-600/30 hover:bg-cyan-600 text-cyan-200 hover:text-white font-semibold text-xs transition-colors flex items-center gap-1.5 border border-cyan-500/30"
            >
              <ShieldCheck size={16} />
              <span>Create Staff</span>
            </button>
          )}

          <button
            onClick={() => {
              resetForm();
              setCustomerModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-lg shadow-brand-500/25"
          >
            <UserPlus size={16} />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 text-slate-500 h-4 w-4" />
          <input
            type="text"
            placeholder="Search by name, email, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-slate-900 border border-slate-700/80 pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl bg-slate-900 border border-slate-700/80 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
        >
          <option value="">All Roles</option>
          <option value="admin">Admins</option>
          <option value="staff">Internal Staff</option>
          <option value="customer">Customers</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 animate-pulse">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No users found matching query.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">{u.name}</td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <Badge status={u.role}>{u.role}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{u.company || '—'}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {u.phone || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-emerald-400 font-medium">Active</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-900/30">
          <span>Total: {total} accounts</span>
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

      {/* Create Staff Modal (Admin Only) */}
      <Modal
        isOpen={staffModalOpen}
        onClose={() => setStaffModalOpen(false)}
        title="Create Internal Staff Account"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Staff Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sarah Connor"
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Staff Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@brightloop.io"
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Temporary Password *</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="StaffPassword123!"
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Must be &gt;8 chars with uppercase, lowercase, and special character.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-cyan-500/25 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Staff Member'}
          </button>
        </form>
      </Modal>

      {/* Create Customer Modal */}
      <Modal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        title="Add New Customer Account"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alice Johnson"
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alice@acmecorp.com"
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Company Name</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Corporation"
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Password *</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="CustomerPass123!"
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-brand-500/25 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Customer Account'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
