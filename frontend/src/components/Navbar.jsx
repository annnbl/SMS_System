import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Badge } from './Badge';
import { LogOut, User as UserIcon, ChevronDown, Sun, Moon } from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab }) => {
  const { user, logout, login } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
            B
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                Brightloop
              </span>
              <span className="text-[11px] font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                SMS
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Quick Demo Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="hidden sm:flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 font-medium transition-colors"
            >
              <span>Demo Roles</span>
              <ChevronDown size={13} />
            </button>
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white dark:bg-slate-900 shadow-lg border border-slate-200 dark:border-slate-800 p-1.5 z-50">
                <div className="text-[10px] font-semibold text-slate-400 px-2.5 py-1 uppercase tracking-wider">
                  Switch Active Role
                </div>
                <button
                  onClick={() => handleQuickSwitch('admin@brightloop.io', 'AdminPassword123!')}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-between"
                >
                  <span>Admin</span>
                  <Badge status="admin">Admin</Badge>
                </button>
                <button
                  onClick={() => handleQuickSwitch('staff@brightloop.io', 'StaffPassword123!')}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-between"
                >
                  <span>Staff</span>
                  <Badge status="staff">Staff</Badge>
                </button>
                <button
                  onClick={() => handleQuickSwitch('alice@acmecorp.com', 'CustomerPass123!')}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-between"
                >
                  <span>Customer (Acme)</span>
                  <Badge status="customer">Customer</Badge>
                </button>
              </div>
            )}
          </div>

          {/* User info */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                {user?.name}
              </div>
              <div className="text-[11px] text-slate-500 capitalize">{user?.role}</div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
