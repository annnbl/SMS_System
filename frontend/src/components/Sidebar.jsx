import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Repeat,
  FileText,
  CreditCard,
  Package,
  Calendar,
  FileSpreadsheet,
  Tag,
  Percent,
  Users,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const role = user?.role || 'customer';

  const adminNav = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'products', label: 'Products & Variants', icon: Package },
    { id: 'plans', label: 'Subscription Plans', icon: Calendar },
    { id: 'templates', label: 'Quotation Templates', icon: FileSpreadsheet },
    { id: 'discounts', label: 'Discounts', icon: Tag },
    { id: 'taxes', label: 'Tax Rules', icon: Percent },
    { id: 'users', label: 'Users & Staff', icon: Users },
  ];

  const staffNav = [
    { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'products', label: 'Products Catalog', icon: Package },
    { id: 'plans', label: 'Plans & Pricing', icon: Calendar },
    { id: 'templates', label: 'Quotation Templates', icon: FileSpreadsheet },
  ];

  const customerNav = [
    { id: 'customer-portal', label: 'My Subscriptions', icon: Repeat },
    { id: 'customer-invoices', label: 'My Invoices & Receipts', icon: FileText },
    { id: 'customer-profile', label: 'Company Profile', icon: UserCheck },
  ];

  let navItems = customerNav;
  if (role === 'admin') navItems = adminNav;
  if (role === 'staff') navItems = staffNav;

  return (
    <aside className="w-64 flex-shrink-0 hidden md:block border-r border-slate-800/80 bg-slate-950/50 p-4">
      <div className="mb-4 px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-brand-400" />
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          {role} Workspace
        </span>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/25'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Helper documentation box */}
      <div className="mt-8 p-3 rounded-xl border border-brand-500/20 bg-brand-500/5 text-xs text-slate-400">
        <p className="font-semibold text-brand-400 mb-1">Brightloop System</p>
        <p className="text-[11px] leading-relaxed">
          {role === 'admin' && 'Full system control: staff creation, taxes, products, and MRR metrics.'}
          {role === 'staff' && 'Operations: customer quotes, subscriptions, billing, and payment processing.'}
          {role === 'customer' && 'Self-service portal: view subscriptions, invoices, and download receipts.'}
        </p>
      </div>
    </aside>
  );
};
