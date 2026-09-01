import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FaChartLine, 
  FaUser, 
  FaFileUpload, 
  FaHistory, 
  FaRobot, 
  FaCalendarAlt, 
  FaFileMedical, 
  FaUserMd, 
  FaUsers,
  FaClock,
  FaAmbulance,
  FaShieldAlt,
  FaHeartbeat,
  FaBookMedical,
  FaLightbulb,
  FaMicroscope
} from 'react-icons/fa';

const Sidebar = () => {
  const { role } = useAuth();

  const patientSections = [
    {
      title: 'Clinical Diagnostics',
      links: [
        { to: '/patient/dashboard', label: 'Overview Dashboard', icon: FaChartLine },
        { to: '/patient/upload-document', label: 'Upload Rx & Lab', icon: FaFileUpload, badge: '5s AI' },
        { to: '/patient/document-history', label: 'Documents Vault', icon: FaHistory },
        { to: '/patient/health-reports', label: 'Diagnostic Reports', icon: FaFileMedical },
      ]
    },
    {
      title: 'Daily Care & Adherence',
      links: [
        { to: '/patient/ai-assistant', label: 'Voice Health Sahayak', icon: FaRobot, badge: 'Voice AI' },
        { to: '/patient/reminders', label: 'Medication Reminders', icon: FaClock, badge: 'Daily' },
        { to: '/patient/recommendations', label: 'AI Health Guidance', icon: FaLightbulb, badge: 'Smart' },
        { to: '/patient/education', label: 'Health Education', icon: FaBookMedical, badge: 'Guides' },
      ]
    },
    {
      title: 'Consultations & Emergency',
      links: [
        { to: '/patient/appointments', label: 'Doctor Tele-Consult', icon: FaCalendarAlt },
        { to: '/patient/referrals', label: 'Doctor Referrals & Finder', icon: FaUserMd, badge: 'Verified' },
        { to: '/patient/emergency', label: '24/7 Emergency 108', icon: FaAmbulance, emergency: true },
      ]
    },
    {
      title: 'Account Settings',
      links: [
        { to: '/patient/profile?mode=view', label: 'Medical Profile & ID', icon: FaUser },
      ]
    }
  ];

  const doctorSections = [
    {
      title: 'Clinical Operations',
      links: [
        { to: '/doctor/dashboard', label: 'Doctor Overview', icon: FaChartLine },
        { to: '/doctor/patients', label: 'Patient Registry', icon: FaUsers },
        { to: '/doctor/appointments', label: 'Appointments Queue', icon: FaCalendarAlt },
        { to: '/doctor/profile?mode=view', label: 'Doctor Profile', icon: FaUserMd },
      ]
    }
  ];

  const sections = role === 'doctor' ? doctorSections : patientSections;

  return (
    <aside className="w-64 bg-white dark:bg-[#111827] border-r border-slate-200/80 dark:border-slate-800 min-h-[calc(100vh-4rem)] p-4 space-y-6 hidden lg:flex flex-col justify-between shrink-0 shadow-xs">
      <div className="space-y-5">
        
        {/* Portal Workspace Header Badge */}
        <div className="p-3 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-slate-800 dark:to-slate-800/80 border border-teal-200/80 dark:border-slate-700 rounded-2xl flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center text-sm shadow-xs">
            <FaHeartbeat />
          </div>
          <div>
            <span className="block text-[10px] font-extrabold tracking-wider text-teal-700 dark:text-teal-400 uppercase">
              {role === 'doctor' ? 'Clinical Portal' : 'Patient Workspace'}
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {role === 'doctor' ? 'Medical Officer' : 'Healthcare Assistant'}
            </span>
          </div>
        </div>

        {/* Categorized Navigation Sections */}
        <div className="space-y-4">
          {sections.map((sec, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <div className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center justify-between">
                <span>{sec.title}</span>
              </div>

              <div className="space-y-0.5">
                {sec.links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all select-none ${
                          isActive
                            ? link.emergency
                              ? 'bg-rose-600 text-white shadow-md font-extrabold'
                              : 'bg-teal-600 text-white shadow-md font-extrabold'
                            : link.emergency
                            ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                        }`
                      }
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className="text-sm shrink-0" />
                        <span className="line-clamp-1">{link.label}</span>
                      </div>
                      {link.badge && (
                        <span className="px-1.5 py-0.2 text-[9px] bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 rounded-full font-black uppercase tracking-wider shrink-0">
                          {link.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Emergency Quick Dispatch Footer */}
      <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl space-y-1.5 mt-4">
        <div className="flex items-center justify-between text-rose-800 dark:text-rose-300 font-extrabold text-[11px]">
          <span className="flex items-center space-x-1">
            <FaShieldAlt /> <span>24/7 Emergency</span>
          </span>
          <span className="text-[10px] bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200 px-1.5 py-0.2 rounded font-black">108</span>
        </div>
        <a
          href="tel:108"
          className="block w-full py-1.5 text-center bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all"
        >
          Call Ambulance
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
