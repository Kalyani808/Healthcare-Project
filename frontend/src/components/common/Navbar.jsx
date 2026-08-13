import React, { useState } from 'react';
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
  FaCalendarCheck,
  FaStethoscope,
  FaPhoneAlt
} from 'react-icons/fa';

const Navbar = () => {
  const { isAuthenticated, user, role, logoutUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-health-100 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-health-500 to-mint-400 flex items-center justify-center text-white shadow-md shadow-health-200 group-hover:scale-105 transition-transform duration-300">
              <FaHeartbeat className="text-2xl animate-pulse" />
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-health-700 via-health-600 to-mint-600 bg-clip-text text-transparent tracking-tight">
                SevaHealth
              </span>
              <span className="block text-[10px] font-medium tracking-wider uppercase text-health-600 -mt-1">
                Rural Digital Health
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              to="/"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'bg-health-50 text-health-700 font-semibold' 
                  : 'text-slate-600 hover:text-health-600 hover:bg-slate-50'
              }`}
            >
              Home
            </Link>
            <Link
              to="/about"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive('/about') 
                  ? 'bg-health-50 text-health-700 font-semibold' 
                  : 'text-slate-600 hover:text-health-600 hover:bg-slate-50'
              }`}
            >
              About Us
            </Link>
            <Link
              to="/services"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive('/services') 
                  ? 'bg-health-50 text-health-700 font-semibold' 
                  : 'text-slate-600 hover:text-health-600 hover:bg-slate-50'
              }`}
            >
              Services
            </Link>
            <Link
              to="/contact"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive('/contact') 
                  ? 'bg-health-50 text-health-700 font-semibold' 
                  : 'text-slate-600 hover:text-health-600 hover:bg-slate-50'
              }`}
            >
              Contact
            </Link>

            {/* Authenticated quick shortcuts */}
            {isAuthenticated && role === 'patient' && (
              <>
                <Link
                  to="/patient/ai-assistant"
                  className="flex items-center space-x-1.5 px-3 py-2 text-sm font-medium text-tealSoft-600 hover:bg-tealSoft-50 rounded-xl transition-colors"
                >
                  <FaRobot className="text-tealSoft-500" />
                  <span>AI Assistant</span>
                </Link>
                <Link
                  to="/patient/upload-document"
                  className="flex items-center space-x-1.5 px-3 py-2 text-sm font-medium text-mint-600 hover:bg-mint-50 rounded-xl transition-colors"
                >
                  <FaFileUpload className="text-mint-500" />
                  <span>Upload Rx</span>
                </Link>
              </>
            )}
          </div>

          {/* User Auth Buttons / Profile Menu */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link
                  to={role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'}
                  className="flex items-center space-x-2 px-4 py-2 bg-health-50 text-health-700 hover:bg-health-100 border border-health-200 rounded-xl font-medium text-sm transition-all"
                >
                  <FaUserCircle className="text-health-600 text-lg" />
                  <span>{user?.name || 'Dashboard'}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-white text-health-700 rounded-full font-semibold border border-health-200 uppercase">
                    {role}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <FaSignOutAlt className="text-lg" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-5 py-2.5 text-slate-700 hover:text-health-600 text-sm font-semibold transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 bg-gradient-to-r from-health-500 to-mint-500 hover:from-health-600 hover:to-mint-600 text-white font-medium text-sm rounded-xl shadow-md shadow-health-100 hover:shadow-lg transition-all"
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

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
          >
            Home
          </Link>
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

          {isAuthenticated ? (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <Link
                to={role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-health-50 text-health-700 font-medium"
              >
                <FaUserCircle className="text-lg" />
                <span>My Dashboard</span>
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
