import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Badge } from './Badge';
import { Layers, LogOut, User as UserIcon, Bell, ChevronDown } from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab }) => {
  const { user, logout, login } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const handleQuickSwitch = async (email, password) => {
    setShowRoleMenu(false);
    try {
      await login(email, password);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-lg shadow-brand-500/20">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white">Brightloop</span>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                SMS
              </span>
            </div>
            <p className="text-[10px] text-slate-400 -mt-1 hidden sm:block">Subscription Management Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Quick Demo Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="hidden md:flex items-center gap-1.5 text-xs bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300 transition-colors"
            >
              <span>Demo Switcher</span>
              <ChevronDown size={14} />
            </button>
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl glass-panel shadow-xl border border-slate-700 p-2 z-50">
                <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                  Quick Switch Role
                </div>
                <button
                  onClick={() => handleQuickSwitch('admin@brightloop.io', 'AdminPassword123!')}
                  className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between"
                >
                  <span>Admin Account</span>
                  <Badge status="admin">Admin</Badge>
                </button>
                <button
                  onClick={() => handleQuickSwitch('staff@brightloop.io', 'StaffPassword123!')}
                  className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between"
                >
                  <span>Staff Account</span>
                  <Badge status="staff">Staff</Badge>
                </button>
                <button
                  onClick={() => handleQuickSwitch('alice@acmecorp.com', 'CustomerPass123!')}
                  className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between"
                >
                  <span>Customer (Acme)</span>
                  <Badge status="customer">Customer</Badge>
                </button>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
            <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-semibold text-sm">
              {user?.name?.charAt(0) || <UserIcon size={16} />}
            </div>
            <div className="hidden sm:block text-left">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white leading-tight">{user?.name}</p>
                <Badge status={user?.role}>{user?.role}</Badge>
              </div>
              <p className="text-xs text-slate-400 leading-tight truncate max-w-[140px]">{user?.email}</p>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors ml-1"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
