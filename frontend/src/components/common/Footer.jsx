import React from 'react';
import { Link } from 'react-router-dom';
import { FaHeartbeat, FaPhoneAlt, FaShieldAlt, FaMapMarkerAlt, FaEnvelope } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-white to-health-50/50 border-t border-health-100 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-health-500 flex items-center justify-center text-white shadow-md">
                <FaHeartbeat className="text-xl" />
              </div>
              <span className="text-2xl font-bold text-slate-800 tracking-tight">
                SevaHealth
              </span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Empowering rural communities with compassionate, AI-driven digital healthcare and direct access to qualified medical practitioners.
            </p>
            <div className="flex items-center space-x-2 text-xs text-mint-700 bg-mint-50 border border-mint-100 px-3 py-1.5 rounded-lg w-fit">
              <FaShieldAlt className="text-mint-500" />
              <span>Government Approved Tele-Health Standards</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-slate-800 font-semibold text-sm uppercase tracking-wider mb-4">
              Patient Care
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <Link to="/patient/ai-assistant" className="hover:text-health-600 transition-colors">
                  AI Symptom Companion
                </Link>
              </li>
              <li>
                <Link to="/patient/upload-document" className="hover:text-health-600 transition-colors">
                  Upload Prescription
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-health-600 transition-colors">
                  Tele-Consultations
                </Link>
              </li>
              <li>
                <Link to="/patient/document-history" className="hover:text-health-600 transition-colors">
                  Medical Record Vault
                </Link>
              </li>
            </ul>
          </div>

          {/* Rural Outlets */}
          <div>
            <h4 className="text-slate-800 font-semibold text-sm uppercase tracking-wider mb-4">
              Community Outreach
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <Link to="/about" className="hover:text-health-600 transition-colors">
                  Village Wellness Kiosks
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-health-600 transition-colors">
                  Find Nearest Health Center
                </Link>
              </li>
              <li>
                <Link to="/doctor/profile" className="hover:text-health-600 transition-colors">
                  Join as Doctor Volunteer
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-health-600 transition-colors">
                  Multilingual Voice Assistant
                </Link>
              </li>
            </ul>
          </div>

          {/* Emergency Helplines */}
          <div>
            <h4 className="text-slate-800 font-semibold text-sm uppercase tracking-wider mb-4">
              24/7 Rural Helpline
            </h4>
            <div className="space-y-3">
              <a
                href="tel:104"
                className="flex items-center space-x-3 p-3 bg-white border border-health-200 rounded-2xl shadow-sm hover:border-health-400 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-colors">
                  <FaPhoneAlt />
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-500">Free Health Helpline</span>
                  <span className="text-lg font-bold text-slate-800">104 / 108</span>
                </div>
              </a>
              <div className="flex items-center space-x-2 text-xs text-slate-500 pt-1">
                <FaMapMarkerAlt className="text-health-500" />
                <span>Serving 500+ Rural Districts</span>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-200/60 text-center text-xs text-slate-500 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p>© {new Date().getFullYear()} SevaHealth Rural Care Initiative. All rights reserved.</p>
          <div className="flex space-x-6">
            <span className="hover:text-health-600 cursor-pointer">Privacy Guarantee</span>
            <span className="hover:text-health-600 cursor-pointer">Patient Rights</span>
            <span className="hover:text-health-600 cursor-pointer">Accessibility First</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
