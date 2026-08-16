import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FaHeartbeat, 
  FaUserCircle, 
  FaSignOutAlt, 
  FaBars, 
  FaTimes, 
  FaFileUpload,
  FaRobot,
  FaChartLine,
  FaEdit,
  FaChevronDown,
  FaBell,
  FaCheckCircle,
  FaCalendarAlt
} from 'react-icons/fa';

const Navbar = () => {
  const { isAuthenticated, user, role, logoutUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  // Smart Auto-Hiding Scroll State
  const [visible, setVisible] = useState(true);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Smart Scroll Listener: Hides on Scroll Down, Shows on Scroll Up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      
      if (currentScrollPos > 60 && currentScrollPos > prevScrollPos) {
        setVisible(false);
        setProfileDropdownOpen(false);
        setNotificationsOpen(false);
      } else {
        setVisible(true);
      }

      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollPos]);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  
  // Check if current route is any internal patient or doctor dashboard workspace page
  const isDashboardPage = location.pathname.startsWith('/patient') || location.pathname.startsWith('/doctor');

  // Dynamic notifications list
  const mockNotifications = [
    { id: 1, title: 'Tele-Consultation Confirmed', time: 'Tomorrow 10:30 AM', icon: FaCalendarAlt, color: 'text-mint-500' },
    { id: 2, title: 'Prescription Parsed by AI', time: '2 hours ago', icon: FaCheckCircle, color: 'text-health-500' },
  ];

  return (
    <nav className={`sticky top-0 z-50 transition-transform duration-300 ${
      visible ? 'translate-y-0' : '-translate-y-full'
    } bg-white/95 backdrop-blur-lg border-b border-health-100 shadow-md py-1.5`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Dynamic Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-health-500 to-mint-400 flex items-center justify-center text-white shadow-md shadow-health-200 group-hover:scale-105 transition-transform duration-300">
              <FaHeartbeat className="text-xl animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-bold bg-gradient-to-r from-health-700 via-health-600 to-mint-600 bg-clip-text text-transparent tracking-tight">
                  SevaHealth
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" title="System Online"></span>
              </div>
              <span className="block text-[9px] font-semibold tracking-wider uppercase text-health-600 -mt-1">
                Rural Digital Health
              </span>
            </div>
          </Link>

          {/* Dynamic Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              to="/"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive('/') 
                  ? 'bg-health-50 text-health-700 font-bold border-b-2 border-health-500 shadow-xs' 
                  : 'text-slate-600 hover:text-health-600 hover:bg-slate-50'
              }`}
            >
              Home
            </Link>

            {/* Show About Us, Services, and Contact ONLY on public pages */}
            {!isDashboardPage && (
              <>
                <Link
                  to="/about"
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive('/about') 
                      ? 'bg-health-50 text-health-700 font-bold border-b-2 border-health-500 shadow-xs' 
                      : 'text-slate-600 hover:text-health-600 hover:bg-slate-50'
                  }`}
                >
                  About Us
                </Link>
                <Link
                  to="/services"
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive('/services') 
                      ? 'bg-health-50 text-health-700 font-bold border-b-2 border-health-500 shadow-xs' 
                      : 'text-slate-600 hover:text-health-600 hover:bg-slate-50'
                  }`}
                >
                  Services
                </Link>
                <Link
                  to="/contact"
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive('/contact') 
                      ? 'bg-health-50 text-health-700 font-bold border-b-2 border-health-500 shadow-xs' 
                      : 'text-slate-600 hover:text-health-600 hover:bg-slate-50'
                  }`}
                >
                  Contact
                </Link>
              </>
            )}

            {/* Overview link placed right after Contact */}
            {isAuthenticated && (
              <Link
                to={role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  isActive('/patient/dashboard') || isActive('/doctor/dashboard') 
                    ? 'bg-health-50 text-health-700 font-bold border-b-2 border-health-500 shadow-xs' 
                    : 'text-slate-600 hover:text-health-600 hover:bg-slate-50'
                }`}
              >
                <FaChartLine className="text-health-500" />
                <span>Overview</span>
              </Link>
            )}

            {/* Authenticated quick shortcuts with AI Assistant placed at the very end */}
            {isAuthenticated && role === 'patient' && (
              <>
                <Link
                  to="/patient/upload-document"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                    isActive('/patient/upload-document')
                      ? 'bg-mint-100 text-mint-800 font-bold border-b-2 border-mint-500'
                      : 'text-mint-600 hover:bg-mint-50'
                  }`}
                >
                  <FaFileUpload className="text-mint-500" />
                  <span>Upload Rx</span>
                </Link>
                <Link
                  to="/patient/ai-assistant"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                    isActive('/patient/ai-assistant')
                      ? 'bg-tealSoft-100 text-tealSoft-800 font-bold border-b-2 border-tealSoft-500'
                      : 'text-tealSoft-600 hover:bg-tealSoft-50'
                  }`}
                >
                  <FaRobot className="text-tealSoft-500" />
                  <span>AI Assistant</span>
                </Link>
              </>
            )}
          </div>

          {/* User Auth Buttons / Profile Menu & Notifications */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                
                {/* Dynamic Notifications Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setNotificationsOpen(!notificationsOpen);
                      setProfileDropdownOpen(false);
                    }}
                    className="p-2 text-slate-500 hover:text-health-600 hover:bg-health-50 rounded-xl transition-colors relative"
                    title="Notifications"
                  >
                    <FaBell className="text-base" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border border-white"></span>
                  </button>

                  {notificationsOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50 animate-fadeIn space-y-2"
                    >
                      <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Notifications</span>
                        <span className="text-[10px] bg-health-50 text-health-700 px-2 py-0.5 rounded-full font-semibold">2 New</span>
                      </div>

                      <div className="px-2 space-y-1">
                        {mockNotifications.map((notif) => {
                          const Icon = notif.icon;
                          return (
                            <div key={notif.id} className="p-2.5 hover:bg-slate-50 rounded-xl flex items-start space-x-2.5 transition-colors cursor-pointer">
                              <Icon className={`${notif.color} text-sm mt-0.5 shrink-0`} />
                              <div>
                                <p className="text-xs font-semibold text-slate-800">{notif.title}</p>
                                <p className="text-[10px] text-slate-400">{notif.time}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Interactive Dropdown Menu */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(!profileDropdownOpen);
                      setNotificationsOpen(false);
                    }}
                    className="flex items-center space-x-2 px-3.5 py-1.5 bg-health-50 hover:bg-health-100 border border-health-200 rounded-xl font-medium text-xs transition-all text-health-800 shadow-sm"
                  >
                    <FaUserCircle className="text-health-600 text-base" />
                    <span className="font-semibold">{user?.name || 'Dashboard'}</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-white text-health-700 rounded-full font-bold border border-health-200 uppercase">
                      {role}
                    </span>
                    <FaChevronDown className={`text-[10px] text-health-600 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileDropdownOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fadeIn"
                    >
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-800">{user?.name || 'User Profile'}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user?.email || 'user@sevahealth.org'}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          to={role === 'doctor' ? '/doctor/profile?mode=view' : '/patient/profile?mode=view'}
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-health-50 hover:text-health-700 transition-colors"
                        >
                          <FaUserCircle className="text-health-500 text-sm" />
                          <span>View Health Profile</span>
                        </Link>

                        <Link
                          to={role === 'doctor' ? '/doctor/profile?mode=edit' : '/patient/profile?mode=edit'}
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-health-50 hover:text-health-700 transition-colors"
                        >
                          <FaEdit className="text-mint-500 text-sm" />
                          <span>Edit Profile Details</span>
                        </Link>

                        <Link
                          to={role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'}
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-health-50 hover:text-health-700 transition-colors"
                        >
                          <FaChartLine className="text-tealSoft-500 text-sm" />
                          <span>Overview Dashboard</span>
                        </Link>
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <FaSignOutAlt className="text-sm" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-slate-700 hover:text-health-600 text-xs font-semibold transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-gradient-to-r from-health-500 to-mint-500 hover:from-health-600 hover:to-mint-600 text-white font-medium text-xs rounded-xl shadow-md shadow-health-100 hover:shadow-lg transition-all"
                >
                  Register Free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-health-600 focus:outline-none"
            >
              {mobileMenuOpen ? <FaTimes className="text-2xl" /> : <FaBars className="text-2xl" />}
            </button>
          </div>

        </div>
      </div>

      {/* Dynamic Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 px-4 pt-2 pb-6 space-y-3 shadow-lg animate-fadeIn">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
          >
            Home
          </Link>
          {!isDashboardPage && (
            <>
              <Link
                to="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
              >
                About Us
              </Link>
              <Link
                to="/services"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
              >
                Services
              </Link>
              <Link
                to="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
              >
                Contact
              </Link>
            </>
          )}

          {isAuthenticated && (
            <Link
              to={role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
            >
              <FaChartLine className="text-health-500" />
              <span>Overview</span>
            </Link>
          )}

          {isAuthenticated ? (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <Link
                to={role === 'doctor' ? '/doctor/profile?mode=view' : '/patient/profile?mode=view'}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-health-50 text-health-700 font-medium"
              >
                <FaUserCircle className="text-lg" />
                <span>View Profile</span>
              </Link>
              <Link
                to={role === 'doctor' ? '/doctor/profile?mode=edit' : '/patient/profile?mode=edit'}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
              >
                <FaEdit className="text-mint-500" />
                <span>Edit Profile Details</span>
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left flex items-center space-x-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg font-medium"
              >
                <FaSignOutAlt />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-slate-100 flex flex-col space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 border border-slate-200 rounded-xl font-medium text-slate-700"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 bg-health-600 text-white font-medium rounded-xl shadow-sm"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
