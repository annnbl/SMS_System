import React from 'react';

const statusColors = {
  // Subscription statuses
  Draft: 'bg-slate-700/60 text-slate-300 border-slate-600',
  Quotation: 'bg-amber-950/60 text-amber-300 border-amber-600/50',
  Confirmed: 'bg-blue-950/60 text-blue-300 border-blue-600/50',
  Active: 'bg-emerald-950/60 text-emerald-300 border-emerald-600/50',
  Paused: 'bg-purple-950/60 text-purple-300 border-purple-600/50',
  Closed: 'bg-red-950/60 text-red-300 border-red-600/50',

  // Invoice statuses
  Paid: 'bg-emerald-950/60 text-emerald-300 border-emerald-600/50',
  Overdue: 'bg-rose-950/60 text-rose-300 border-rose-600/60 animate-pulse',
  Cancelled: 'bg-slate-800/60 text-slate-400 border-slate-700',

  // Roles
  admin: 'bg-violet-950/60 text-violet-300 border-violet-600/50',
  staff: 'bg-cyan-950/60 text-cyan-300 border-cyan-600/50',
  customer: 'bg-indigo-950/60 text-indigo-300 border-indigo-600/50',
};

export const Badge = ({ children, status, className = '' }) => {
  const colorClass = statusColors[status] || 'bg-slate-800 text-slate-300 border-slate-700';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75"></span>
      {children || status}
    </span>
  );
};
