import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { FaUser, FaLock, FaHeartbeat, FaUserMd, FaCheckCircle } from 'react-icons/fa';

const LoginPage = () => {
  const { loginUser, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
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
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-health-500 to-mint-400 text-white flex items-center justify-center text-2xl mx-auto shadow-md shadow-health-200">
            <FaHeartbeat className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Welcome Back to SevaHealth</h2>
          <p className="text-slate-500 text-xs">Sign in to access your digital health dashboard</p>
        </div>

        <Card className="space-y-6">
          {error && <Alert type="error" message={error} />}

          {/* Role Toggle Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100/70 rounded-2xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'patient' })}
              className={`py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all ${
                formData.role === 'patient'
                  ? 'bg-white text-health-700 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FaCheckCircle />
              <span>Patient Account</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'doctor' })}
              className={`py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all ${
                formData.role === 'doctor'
                  ? 'bg-white text-health-700 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FaUserMd />
              <span>Doctor Officer</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username or Phone"
              name="username"
              placeholder="e.g. ramesh_kumar"
              icon={FaUser}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="Enter your password"
              icon={FaLock}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center space-x-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-health-600 focus:ring-health-400"
                />
                <span>Remember me</span>
              </label>
              <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please call rural helpline 104 for password reset assistance.'); }} className="text-health-600 font-semibold hover:underline">
                Forgot password?
              </a>
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              Sign In
            </Button>
          </form>

          {/* Quick Demo Credentials helper */}
          <div className="pt-4 border-t border-slate-100 text-center space-y-2">
            <p className="text-xs text-slate-400">Quick Demo Credentials:</p>
            <div className="flex justify-center space-x-2 text-[11px]">
              <button
                type="button"
                onClick={() => setFormData({ username: 'ramesh_kumar', password: 'password123', role: 'patient' })}
                className="px-2.5 py-1 bg-health-50 text-health-700 rounded-lg font-mono hover:bg-health-100"
              >
                Patient Demo
              </button>
              <button
                type="button"
                onClick={() => setFormData({ username: 'dr_ananya', password: 'password123', role: 'doctor' })}
                className="px-2.5 py-1 bg-mint-50 text-mint-700 rounded-lg font-mono hover:bg-mint-100"
              >
                Doctor Demo
              </button>
            </div>
          </div>
        </Card>

        <p className="text-center text-xs text-slate-500">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-health-600 font-bold hover:underline">
            Register for Free
          </Link>
        </p>

      </div>
    </div>
  );
};

export default LoginPage;
