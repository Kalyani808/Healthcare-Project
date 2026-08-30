import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  FaHeartbeat, 
  FaUserCircle, 
  FaSignOutAlt, 
  FaBars, 
  FaTimes, 
  FaFileUpload,
  FaRobot,
  FaChartLine,
  FaChevronDown,
  FaBell,
  FaCheckCircle,
  FaCalendarAlt,
  FaSun,
  FaMoon,
  FaClock,
  FaAmbulance,
  FaHistory,
  FaFileMedical,
  FaBookMedical,
  FaLightbulb,
  FaUserMd,
  FaPills,
  FaMicroscope
} from 'react-icons/fa';

const Navbar = () => {
  const { isAuthenticated, user, role, logoutUser } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  // Navigation Dropdown States
  const [recordsMenuOpen, setRecordsMenuOpen] = useState(false);
  const [dailyCareMenuOpen, setDailyCareMenuOpen] = useState(false);
  const [consultMenuOpen, setConsultMenuOpen] = useState(false);

  const [visible, setVisible] = useState(true);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      if (currentScrollPos > 60 && currentScrollPos > prevScrollPos) {
        setVisible(false);
        setProfileDropdownOpen(false);
        setNotificationsOpen(false);
        setRecordsMenuOpen(false);
        setDailyCareMenuOpen(false);
        setConsultMenuOpen(false);
      } else {
        setVisible(true);
      }
      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollPos]);

  // Close dropdowns on route change
  useEffect(() => {
    setRecordsMenuOpen(false);
    setDailyCareMenuOpen(false);
    setConsultMenuOpen(false);
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const isDashboardPage = location.pathname.startsWith('/patient') || location.pathname.startsWith('/doctor');

  const mockNotifications = [
    { id: 1, title: 'Prescription Analyzed by AI', time: 'Just now', icon: FaCheckCircle, color: 'text-teal-500' },
    { id: 2, title: 'Morning Dose Reminder', time: '08:00 AM', icon: FaClock, color: 'text-amber-500' },
  ];

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      visible ? 'translate-y-0' : '-translate-y-full'
    } bg-white/95 dark:bg-[#0B1220]/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 shadow-xs py-1`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group select-none shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform duration-300">
              <FaHeartbeat className="text-xl animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Seva<span className="text-teal-600 dark:text-teal-400">Health</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="System Online"></span>
              </div>
              <span className="block text-[9px] font-extrabold tracking-widest uppercase text-teal-600 dark:text-teal-400 -mt-1">
                Clinical Healthcare Platform
              </span>
            </div>
          </Link>

          {/* Desktop Segregated Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            
            {/* Public Links */}
            {!isDashboardPage && (
              <>
                <Link
                  to="/"
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive('/') 
                      ? 'bg-teal-50 dark:bg-slate-800 text-teal-700 dark:text-teal-300' 
                      : 'text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-white'
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/about"
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive('/about') 
                      ? 'bg-teal-50 dark:bg-slate-800 text-teal-700 dark:text-teal-300' 
                      : 'text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-white'
                  }`}
                >
                  About
                </Link>
                <Link
                  to="/services"
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive('/services') 
                      ? 'bg-teal-50 dark:bg-slate-800 text-teal-700 dark:text-teal-300' 
                      : 'text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-white'
                  }`}
                >
                  Services
                </Link>
              </>
            )}

            {/* Authenticated Dashboard Link */}
            {isAuthenticated && (
              <Link
                to={role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  isActive('/patient/dashboard') || isActive('/doctor/dashboard') 
                    ? 'bg-teal-600 text-white shadow-sm' 
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FaChartLine className="text-sm" />
                <span>Overview</span>
              </Link>
            )}

            {/* 📑 SUITE 1: Medical Records Dropdown */}
            {isAuthenticated && role === 'patient' && (
              <div className="relative">
                <button
                  onClick={() => {
                    setRecordsMenuOpen(!recordsMenuOpen);
                    setDailyCareMenuOpen(false);
                    setConsultMenuOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    isActive('/patient/upload-document') || isActive('/patient/document-history') || isActive('/patient/health-reports')
                      ? 'bg-teal-50 dark:bg-slate-800 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-slate-700'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FaFileUpload className="text-teal-600" />
                  <span>Medical Records</span>
                  <FaChevronDown className="text-[9px] text-slate-400" />
                </button>

                {recordsMenuOpen && (
                  <div className="absolute left-0 mt-2 w-60 bg-white dark:bg-[#172033] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 space-y-1 animate-fadeIn z-50">
                    <div className="px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Diagnostics & Records
                    </div>
                    <Link
                      to="/patient/upload-document"
                      className="flex items-center space-x-2.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <FaFileUpload className="text-teal-600" />
                      <div>
                        <span className="block">Upload Rx & Lab Report</span>
                        <span className="block text-[10px] text-slate-400 font-normal">Fast 5s OCR Analyzer</span>
                      </div>
                    </Link>
                    <Link
                      to="/patient/skin-analyzer"
                      className="flex items-center space-x-2.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <FaHeartbeat className="text-rose-500" />
                      <div>
                        <span className="block">AI Skin & Face Scanner</span>
                        <span className="block text-[10px] text-slate-400 font-normal">Acne & pigmentation analysis</span>
                      </div>
                    </Link>
                    <Link
                      to="/patient/pill-identifier"
                      className="flex items-center space-x-2.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <FaPills className="text-emerald-500" />
                      <div>
                        <span className="block">Visual Pill Identifier</span>
                        <span className="block text-[10px] text-slate-400 font-normal">Tablet & blister strip scanner</span>
                      </div>
                    </Link>
                    <Link
                      to="/patient/document-history"
                      className="flex items-center space-x-2.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <FaHistory className="text-emerald-600" />
                      <div>
                        <span className="block">Medical Documents Vault</span>
                        <span className="block text-[10px] text-slate-400 font-normal">Encrypted records archive</span>
                      </div>
                    </Link>
                    <Link
                      to="/patient/health-reports"
                      className="flex items-center space-x-2.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <FaFileMedical className="text-blue-600" />
                      <div>
                        <span className="block">Health Diagnostic Summaries</span>
                        <span className="block text-[10px] text-slate-400 font-normal">Doctor remarks & vitals</span>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* ⏰ SUITE 2: Daily Care Dropdown */}
            {isAuthenticated && role === 'patient' && (
              <div className="relative">
                <button
                  onClick={() => {
                    setDailyCareMenuOpen(!dailyCareMenuOpen);
                    setRecordsMenuOpen(false);
                    setConsultMenuOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    isActive('/patient/reminders') || isActive('/patient/recommendations') || isActive('/patient/education')
                      ? 'bg-teal-50 dark:bg-slate-800 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-slate-700'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FaClock className="text-amber-500" />
                  <span>Daily Care</span>
                  <FaChevronDown className="text-[9px] text-slate-400" />
                </button>

                {dailyCareMenuOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-[#172033] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 space-y-1 animate-fadeIn z-50">
                    <div className="px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Adherence & Guidance
                    </div>
                    <Link
                      to="/patient/reminders"
                      className="flex items-center space-x-2.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <FaClock className="text-amber-500" />
                      <div>
                        <span className="block">Medication Reminders</span>
                        <span className="block text-[10px] text-slate-400 font-normal">3-Slot daily pill alarms</span>
                      </div>
                    </Link>
                    <Link
                      to="/patient/recommendations"
                      className="flex items-center space-x-2.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <FaLightbulb className="text-emerald-500" />
                      <div>
                        <span className="block">AI Health Recommendations</span>
                        <span className="block text-[10px] text-slate-400 font-normal">Drug-diet rules & follow-ups</span>
                      </div>
                    </Link>
                    <Link
                      to="/patient/education"
                      className="flex items-center space-x-2.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <FaBookMedical className="text-blue-500" />
                      <div>
                        <span className="block">Health Education Guides</span>
                        <span className="block text-[10px] text-slate-400 font-normal">Maternal, Child & Senior care</span>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* 🩺 SUITE 3: Consultations & AI Assistant Dropdown */}
            {isAuthenticated && role === 'patient' && (
              <div className="relative">
                <button
                  onClick={() => {
                    setConsultMenuOpen(!consultMenuOpen);
                    setRecordsMenuOpen(false);
                    setDailyCareMenuOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    isActive('/patient/appointments') || isActive('/patient/ai-assistant')
                      ? 'bg-teal-50 dark:bg-slate-800 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-slate-700'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FaUserMd className="text-blue-600" />
                  <span>Consultations</span>
                  <FaChevronDown className="text-[9px] text-slate-400" />
                </button>

                {consultMenuOpen && (
                  <div className="absolute left-0 mt-2 w-60 bg-white dark:bg-[#172033] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 space-y-1 animate-fadeIn z-50">
                    <div className="px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Medical Support
                    </div>
                    <Link
                      to="/patient/appointments"
                      className="flex items-center space-x-2.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <FaCalendarAlt className="text-blue-600" />
                      <div>
                        <span className="block">Doctor Appointments</span>
                        <span className="block text-[10px] text-slate-400 font-normal">Video & voice tele-consult</span>
                      </div>
                    </Link>
                    <Link
                      to="/patient/ai-assistant"
                      className="flex items-center space-x-2.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <FaRobot className="text-teal-600" />
                      <div>
                        <span className="block">Voice Health Sahayak</span>
                        <span className="block text-[10px] text-slate-400 font-normal">Regional AI symptom chat</span>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* 🚨 SUITE 4: 24/7 Emergency Speed Dial */}
            {isAuthenticated && role === 'patient' && (
              <Link
                to="/patient/emergency"
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all select-none ${
                  isActive('/patient/emergency')
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 hover:bg-rose-100'
                }`}
              >
                <FaAmbulance className="text-rose-600 dark:text-rose-400" />
                <span>Emergency 108</span>
              </Link>
            )}

          </div>

          {/* Right Action Icons & Auth Profile */}
          <div className="hidden md:flex items-center space-x-3">
            
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <FaSun className="text-base" /> : <FaMoon className="text-base" />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                
                {/* Notifications Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
                  >
                    <FaBell className="text-base" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500"></span>
                  </button>

                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#172033] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2 animate-fadeIn z-50">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">Alerts</span>
                        <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">2 New</span>
                      </div>
                      {mockNotifications.map(n => (
                        <div key={n.id} className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs space-y-0.5 transition-colors">
                          <p className="font-bold text-slate-800 dark:text-slate-100">{n.title}</p>
                          <p className="text-[10px] text-slate-400">{n.time}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Profile Pill Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all select-none"
                  >
                    <div className="w-7 h-7 rounded-full bg-teal-600 text-white font-black text-xs flex items-center justify-center">
                      {(user?.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                      {user?.username || 'My Account'}
                    </span>
                    <FaChevronDown className="text-[10px] text-slate-400" />
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#172033] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 space-y-1 animate-fadeIn z-50">
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                        <p className="text-xs font-black text-slate-900 dark:text-white">{user?.username}</p>
                        <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 capitalize">{role} Account</span>
                      </div>

                      <Link
                        to={role === 'doctor' ? '/doctor/profile?mode=view' : '/patient/profile?mode=view'}
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <FaUserCircle className="text-teal-500" />
                        <span>Medical Profile</span>
                      </Link>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <FaSignOutAlt />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-teal-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/20 transition-all"
                >
                  Get Started Free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {isDark ? <FaSun className="text-base" /> : <FaMoon className="text-base" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 dark:text-slate-300"
            >
              {mobileMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800 px-4 pt-2 pb-6 space-y-2 shadow-lg">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200">Home</Link>
          {isAuthenticated && (
            <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
              <Link to={role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'} onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-xs font-bold text-teal-600 dark:text-teal-400">Dashboard</Link>
              <div className="text-[10px] font-black uppercase text-slate-400 px-3 pt-2">Medical Records</div>
              <Link to="/patient/upload-document" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200">Upload Rx & Lab</Link>
              <Link to="/patient/document-history" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200">Documents Vault</Link>
              <Link to="/patient/health-reports" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200">Health Test Reports</Link>
              
              <div className="text-[10px] font-black uppercase text-slate-400 px-3 pt-2">Daily Care</div>
              <Link to="/patient/reminders" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-1.5 rounded-lg text-xs font-bold text-amber-600 dark:text-amber-400">Medication Reminders</Link>
              <Link to="/patient/recommendations" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-600 dark:text-emerald-400">AI Health Guidance</Link>
              <Link to="/patient/education" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400">Health Education Guides</Link>
              
              <div className="text-[10px] font-black uppercase text-slate-400 px-3 pt-2">Medical Support</div>
              <Link to="/patient/appointments" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200">Doctor Appointments</Link>
              <Link to="/patient/ai-assistant" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200">Voice Health Sahayak</Link>
              <Link to="/patient/emergency" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-xs font-bold text-rose-600">🚨 Emergency 108</Link>
              <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="block w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-rose-600">Sign Out</button>
            </div>
          )}
          {!isAuthenticated && (
            <div className="pt-2 flex flex-col space-y-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="py-2 text-center text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl">Sign In</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="py-2 text-center text-xs font-bold bg-teal-600 text-white rounded-xl">Register Free</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
