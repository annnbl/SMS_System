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
  UserCheck,
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const role = user?.role || 'customer';

  const adminNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'plans', label: 'Plans', icon: Calendar },
    { id: 'templates', label: 'Templates', icon: FileSpreadsheet },
    { id: 'discounts', label: 'Discounts', icon: Tag },
    { id: 'taxes', label: 'Taxes', icon: Percent },
    { id: 'users', label: 'Users & Staff', icon: Users },
  ];

  const staffNav = [
    { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'plans', label: 'Plans', icon: Calendar },
    { id: 'templates', label: 'Templates', icon: FileSpreadsheet },
  ];

  const customerNav = [
    { id: 'customer-portal', label: 'My Subscriptions', icon: Repeat },
    { id: 'customer-invoices', label: 'My Invoices', icon: FileText },
    { id: 'customer-profile', label: 'Account Profile', icon: UserCheck },
  ];

  let navItems = customerNav;
  if (role === 'admin') navItems = adminNav;
  if (role === 'staff') navItems = staffNav;

  return (
    <aside className="w-56 flex-shrink-0 hidden md:block border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3">
      <div className="mb-3 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          {role} Workspace
        </span>
      </div>

      <nav className="space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
