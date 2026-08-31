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

    const res = await loginUser({ ...formData, role: 'patient' });
    if (res.success) {
      navigate('/patient/dashboard');
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <Card className="p-6 bg-white dark:bg-[#172033] border border-slate-200/80 dark:border-slate-700 shadow-xl space-y-5 rounded-3xl">
          
          <div className="text-center space-y-1">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-xl shadow-md mx-auto mb-2">
              <FaHeartbeat className="animate-pulse" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Sign In to SevaHealth</h2>
            <p className="text-xs text-slate-500">Access your personal healthcare intelligence</p>
          </div>

          {error && <Alert type="error" message={error} />}

          <form onSubmit={handleSubmit} className="space-y-3.5">
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

            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-400"
                />
                <span>Remember session</span>
              </label>
              <a href="#help" onClick={(e) => { e.preventDefault(); alert('Please call helpline 104 or 108 for account recovery assistance.'); }} className="text-teal-600 dark:text-teal-400 font-bold hover:underline">
                Need Help?
              </a>
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} className="py-2.5 font-bold text-xs rounded-xl">
              Sign In to Portal
            </Button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-center space-y-1.5">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">1-Click Test Credentials:</p>
            <div className="flex justify-center space-x-2 text-xs">
              <button
                type="button"
                onClick={() => setFormData({ username: 'testpatient', password: 'TestPass@123', role: 'patient' })}
                className="px-3 py-1 bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 rounded-xl font-mono text-[11px] font-bold border border-teal-200 dark:border-teal-800"
              >
                Patient (testpatient)
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 pt-1">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-teal-600 dark:text-teal-400 font-black hover:underline">
              Create Free Account
            </Link>
          </p>

        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
