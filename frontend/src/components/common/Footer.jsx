import React from 'react';
import { Link } from 'react-router-dom';
import { FaHeartbeat, FaPhoneAlt } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-[#0B1220] border-t border-slate-100 dark:border-slate-800 py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-health-500 to-mint-400 flex items-center justify-center text-white shadow-sm">
              <FaHeartbeat className="text-lg" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">SevaHealth</span>
              <span className="block text-[10px] text-slate-400 dark:text-slate-400 font-medium -mt-1">Rural Digital Health</span>
            </div>
          </div>

          {/* Essential Quick Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Link to="/" className="hover:text-health-600 dark:hover:text-health-400 transition-colors">Home</Link>
            <Link to="/about" className="hover:text-health-600 dark:hover:text-health-400 transition-colors">About Us</Link>
            <Link to="/services" className="hover:text-health-600 dark:hover:text-health-400 transition-colors">Services</Link>
            <Link to="/contact" className="hover:text-health-600 dark:hover:text-health-400 transition-colors">Contact</Link>
          </div>

          {/* Compact Helpline & Copyright */}
          <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl font-bold">
              <FaPhoneAlt className="text-xs" />
              <span>Helpline: 104 / 108</span>
            </div>
            <span>© {new Date().getFullYear()} SevaHealth</span>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
