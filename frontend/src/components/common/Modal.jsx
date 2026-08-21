import React from 'react';
import { FaTimes } from 'react-icons/fa';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#172033] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700/80 relative">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700/80">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <FaTimes />
          </button>
        </div>
        <div className="py-4">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
