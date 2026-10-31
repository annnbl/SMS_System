import React from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        <div
          className={`relative transform overflow-hidden rounded-2xl glass-panel text-left shadow-2xl transition-all sm:my-8 w-full ${maxWidth} border border-slate-700/80`}
        >
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/60">
            <h3 className="text-lg font-semibold text-white tracking-wide">{title}</h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white rounded-lg p-1 hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
};
