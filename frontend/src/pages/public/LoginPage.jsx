import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { FaUser, FaLock, FaHeartbeat, FaUserMd, FaCheckCircle, FaShieldAlt, FaAmbulance, FaMicroscope } from 'react-icons/fa';

const LoginPage = () => {
  const { loginUser, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: 'testpatient',
    password: 'TestPass@123',
    role: 'patient',
  });
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password) {
      setError('Please provide both username and password.');
      return;
    }

    const res = await loginUser(formData);
    if (res.success) {
      if (formData.role === 'doctor') {
        navigate('/doctor/dashboard');
      } else {
        navigate('/patient/dashboard');
      }
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Healthcare Trust Callout */}
        <div className="hidden lg:block lg:col-span-5 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-xl shadow-md">
              <FaHeartbeat className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">SevaHealth</h2>
              <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Clinical Health Portal</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
              Access Your Personal Healthcare Intelligence
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Securely view doctor prescriptions, analyze diagnostic lab reports, manage 3-slot daily medication reminders, and access 24/7 emergency dispatch.
            </p>
          </div>

          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400 font-bold">
            <div className="flex items-center space-x-2.5">
              <FaCheckCircle className="text-teal-500 text-sm shrink-0" />
              <span>AI Handwriting OCR with ~5.2s Extraction</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <FaCheckCircle className="text-teal-500 text-sm shrink-0" />
              <span>Voice Guidance in Telugu, Hindi & Marathi</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <FaCheckCircle className="text-teal-500 text-sm shrink-0" />
              <span>Free 108 Emergency Ambulance Dispatch</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="lg:col-span-7">
          <Card className="p-6 sm:p-8 bg-white dark:bg-[#172033] border border-slate-200/80 dark:border-slate-700 shadow-xl space-y-6">
            
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Sign In to Your Account</h2>
              <p className="text-xs text-slate-500">Enter your credentials to enter the clinical portal</p>
            </div>

            {error && <Alert type="error" message={error} />}

            {/* Role Toggle Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'patient' })}
                className={`py-2 rounded-xl flex items-center justify-center space-x-2 transition-all ${
                  formData.role === 'patient'
                    ? 'bg-white dark:bg-[#1E293B] text-teal-700 dark:text-teal-400 shadow-sm font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <FaUser />
                <span>Patient Account</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'doctor' })}
                className={`py-2 rounded-xl flex items-center justify-center space-x-2 transition-all ${
                  formData.role === 'doctor'
                    ? 'bg-white dark:bg-[#1E293B] text-teal-700 dark:text-teal-400 shadow-sm font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <FaUserMd />
                <span>Doctor / Officer</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Username / Phone Number"
                name="username"
                placeholder="e.g. testpatient"
                icon={FaUser}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />

              <Input
                label="Password"
                type="password"
                name="password"
                placeholder="••••••••"
                icon={FaLock}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-400"
                  />
                  <span>Remember my session</span>
                </label>
                <a href="#help" onClick={(e) => { e.preventDefault(); alert('Please call helpline 104 or 108 for account recovery assistance.'); }} className="text-teal-600 dark:text-teal-400 font-bold hover:underline">
                  Need Help?
                </a>
              </div>

              <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} className="py-3 font-bold text-sm">
                Sign In to Portal
              </Button>
            </form>

            {/* Quick Demo Access Bar */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 text-center space-y-2">
              <p className="text-[11px] text-slate-400 font-semibold">1-Click Test Credentials:</p>
              <div className="flex justify-center space-x-2 text-xs">
                <button
                  type="button"
                  onClick={() => setFormData({ username: 'testpatient', password: 'TestPass@123', role: 'patient' })}
                  className="px-3 py-1 bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 rounded-xl font-mono text-[11px] font-bold border border-teal-200 dark:border-teal-800"
                >
                  Patient (testpatient)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ username: 'dr_ananya', password: 'password123', role: 'doctor' })}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-mono text-[11px] font-bold border border-slate-200 dark:border-slate-700"
                >
                  Doctor (dr_ananya)
                </button>
              </div>
            </div>

            <p className="text-center text-xs text-slate-500 pt-2">
              Don't have an account yet?{' '}
              <Link to="/register" className="text-teal-600 dark:text-teal-400 font-black hover:underline">
                Create Free Account
              </Link>
            </p>

          </Card>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
