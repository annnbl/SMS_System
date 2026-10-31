import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Subscriptions } from './pages/Subscriptions';
import { Invoices } from './pages/Invoices';
import { Payments } from './pages/Payments';
import { Products } from './pages/Products';
import { Plans } from './pages/Plans';
import { Templates } from './pages/Templates';
import { Discounts } from './pages/Discounts';
import { Taxes } from './pages/Taxes';
import { Users } from './pages/Users';
import { CustomerPortal } from './pages/CustomerPortal';

export const App = () => {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset'
  const [resetToken, setResetToken] = useState('');
  const [activeTab, setActiveTab] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-sm font-semibold text-brand-400 animate-pulse tracking-wide">
          Initializing Brightloop Software...
        </div>
      </div>
    );
  }

  // Not logged in: Show Auth screens
  if (!user) {
    if (authView === 'register') {
      return <Register onSwitchToLogin={() => setAuthView('login')} />;
    }
    if (authView === 'forgot') {
      return (
        <ForgotPassword
          onSwitchToLogin={() => setAuthView('login')}
          onOpenResetWithToken={(t) => {
            setResetToken(t);
            setAuthView('reset');
          }}
        />
      );
    }
    if (authView === 'reset') {
      return (
        <ResetPassword
          token={resetToken}
          onComplete={() => setAuthView('login')}
        />
      );
    }
    return (
      <Login
        onSwitchToRegister={() => setAuthView('register')}
        onSwitchToForgot={() => setAuthView('forgot')}
      />
    );
  }

  // Set default tab based on user role
  const role = user.role || 'customer';
  const effectiveTab =
    activeTab || (role === 'admin' ? 'dashboard' : role === 'staff' ? 'subscriptions' : 'customer-portal');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar activeTab={effectiveTab} setActiveTab={setActiveTab} />

      <div className="flex flex-1">
        <Sidebar activeTab={effectiveTab} setActiveTab={setActiveTab} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {effectiveTab === 'dashboard' && <Dashboard onNavigate={(tab) => setActiveTab(tab)} />}
          {effectiveTab === 'subscriptions' && <Subscriptions />}
          {effectiveTab === 'invoices' && <Invoices />}
          {effectiveTab === 'payments' && <Payments />}
          {effectiveTab === 'products' && <Products />}
          {effectiveTab === 'plans' && <Plans />}
          {effectiveTab === 'templates' && <Templates />}
          {effectiveTab === 'discounts' && <Discounts />}
          {effectiveTab === 'taxes' && <Taxes />}
          {(effectiveTab === 'users' || effectiveTab === 'customers') && <Users />}
          {effectiveTab === 'customer-portal' && <CustomerPortal defaultTab="subscriptions" />}
          {effectiveTab === 'customer-invoices' && <CustomerPortal defaultTab="invoices" />}
          {effectiveTab === 'customer-profile' && <CustomerPortal defaultTab="subscriptions" />}
        </main>
      </div>
    </div>
  );
};
