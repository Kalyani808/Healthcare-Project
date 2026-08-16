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
} from 'react-icons/fa';

const Sidebar = () => {
  const { role } = useAuth();

  const patientLinks = [
    { to: '/patient/dashboard', label: 'Overview', icon: FaChartLine },
    { to: '/patient/profile?mode=view', label: 'My Health Profile', icon: FaUser },
    { to: '/patient/ai-assistant', label: 'AI Health Companion', icon: FaRobot, badge: 'Smart' },
    { to: '/patient/upload-document', label: 'Upload Medical Doc', icon: FaFileUpload },
    { to: '/patient/document-history', label: 'Medical Document Vault', icon: FaHistory },
    { to: '/patient/appointments', label: 'Appointments', icon: FaCalendarAlt },
    { to: '/patient/health-reports', label: 'Health Reports', icon: FaFileMedical },
  ];

  const doctorLinks = [
    { to: '/doctor/dashboard', label: 'Doctor Overview', icon: FaChartLine },
    { to: '/doctor/profile?mode=view', label: 'Doctor Profile', icon: FaUserMd },
    { to: '/doctor/patients', label: 'Patient Registry', icon: FaUsers },
    { to: '/doctor/appointments', label: 'Appointments Queue', icon: FaCalendarAlt },
  ];

  const links = role === 'doctor' ? doctorLinks : patientLinks;

  return (
    <aside className="w-64 bg-white border-r border-slate-100 min-h-[calc(100vh-5rem)] p-4 space-y-6 hidden lg:block">
      <div className="px-3 py-2 bg-health-50/70 border border-health-100 rounded-2xl">
        <span className="block text-[11px] font-semibold tracking-wider text-health-600 uppercase">
          Portal Workspace
        </span>
        <span className="text-sm font-bold text-slate-800 capitalize">
          {role === 'doctor' ? 'Medical Officer' : 'Patient Companion'}
        </span>
      </div>

      <nav className="space-y-1.5">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-health-500 to-health-600 text-white shadow-md shadow-health-100 font-semibold'
                    : 'text-slate-600 hover:bg-health-50/80 hover:text-health-700'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon className="text-lg" />
                <span>{link.label}</span>
              </div>
              {link.badge && (
                <span className="px-2 py-0.5 text-[10px] bg-tealSoft-100 text-tealSoft-700 rounded-full font-bold">
                  {link.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
