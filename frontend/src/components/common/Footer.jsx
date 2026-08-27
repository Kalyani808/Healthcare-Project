import React from 'react';
import { Link } from 'react-router-dom';
import { FaHeartbeat, FaPhoneAlt, FaShieldAlt, FaAmbulance, FaLanguage } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 pb-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800">
          
          {/* Col 1: Brand & Mission */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
                <FaHeartbeat className="text-xl" />
              </div>
              <div>
                <span className="text-xl font-black text-white tracking-tight">SevaHealth</span>
                <span className="block text-[10px] text-teal-400 font-extrabold uppercase tracking-wider -mt-1">
                  Rural Digital Health
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering rural and urban patients across India with AI-powered prescription & lab report comprehension, daily dosage reminders, and 24/7 multilingual healthcare assistance.
            </p>
          </div>

          {/* Col 2: Clinical Services */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase text-white tracking-wider">Clinical Services</h4>
            <ul className="space-y-2 text-xs text-slate-400 font-medium">
              <li><Link to="/patient/upload-document" className="hover:text-teal-400 transition-colors">Prescription & Lab OCR</Link></li>
              <li><Link to="/patient/reminders" className="hover:text-teal-400 transition-colors">Medication Reminder Schedules</Link></li>
              <li><Link to="/patient/emergency" className="hover:text-teal-400 transition-colors">24/7 Emergency & First Aid</Link></li>
              <li><Link to="/patient/ai-assistant" className="hover:text-teal-400 transition-colors">Voice Health Sahayak (AI)</Link></li>
              <li><Link to="/patient/appointments" className="hover:text-teal-400 transition-colors">Doctor Tele-Consultations</Link></li>
            </ul>
          </div>

          {/* Col 3: Multilingual Support */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center space-x-1.5">
              <FaLanguage className="text-teal-400 text-sm" />
              <span>Language Access</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="px-2.5 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700 text-slate-300 font-bold">తెలుగు (Telugu)</span>
              <span className="px-2.5 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700 text-slate-300 font-bold">हिंदी (Hindi)</span>
              <span className="px-2.5 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700 text-slate-300 font-bold">मराठी (Marathi)</span>
              <span className="px-2.5 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700 text-slate-300 font-bold">English (Voice)</span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              Spoken audio instruction playback for low-literacy patients.
            </p>
          </div>

          {/* Col 4: 24/7 National Emergency Hotlines */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase text-rose-400 tracking-wider flex items-center space-x-1.5">
              <FaAmbulance className="text-rose-400 text-sm" />
              <span>Emergency Hotlines</span>
            </h4>
            <div className="space-y-2">
              <a href="tel:108" className="flex items-center justify-between p-2.5 bg-rose-950/40 border border-rose-900 rounded-xl hover:bg-rose-900/60 transition-colors">
                <span className="text-xs font-bold text-rose-200">Ambulance (Free)</span>
                <span className="text-sm font-black text-white">108</span>
              </a>
              <a href="tel:112" className="flex items-center justify-between p-2.5 bg-rose-950/40 border border-rose-900 rounded-xl hover:bg-rose-900/60 transition-colors">
                <span className="text-xs font-bold text-rose-200">National SOS</span>
                <span className="text-sm font-black text-white">112</span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar & Disclaimer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 pt-2">
          <p className="text-[11px] text-slate-400 max-w-2xl text-center sm:text-left">
            <strong>Medical Disclaimer:</strong> SevaHealth is an assistive AI tool. In case of acute medical emergencies, immediately dial 108 or proceed to the nearest trauma care hospital.
          </p>
          <div className="text-slate-400 text-xs font-semibold shrink-0">
            © {new Date().getFullYear()} SevaHealth Platform • Digital India
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
