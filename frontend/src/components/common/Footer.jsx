import React from 'react';
import { Link } from 'react-router-dom';
import { FaHeartbeat, FaPhoneAlt } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-health-500 to-mint-400 flex items-center justify-center text-white shadow-sm">
              <FaHeartbeat className="text-lg" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-800 tracking-tight">SevaHealth</span>
              <span className="block text-[10px] text-slate-400 font-medium -mt-1">Rural Digital Health</span>
            </div>
          </div>

          {/* Essential Quick Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-600">
            <Link to="/" className="hover:text-health-600 transition-colors">Home</Link>
            <Link to="/about" className="hover:text-health-600 transition-colors">About Us</Link>
            <Link to="/services" className="hover:text-health-600 transition-colors">Services</Link>
            <Link to="/contact" className="hover:text-health-600 transition-colors">Contact</Link>
          </div>

          {/* Compact Helpline & Copyright */}
          <div className="flex items-center space-x-4 text-xs text-slate-500">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl font-bold">
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
