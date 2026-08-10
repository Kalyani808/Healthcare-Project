import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaHeartbeat, FaCalendarAlt, FaLanguage, FaPhoneAlt } from 'react-icons/fa';

const RegisterPage = () => {
  const { registerUser, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '1990-01-01',
    gender: 'Male',
    language_preference: 'Hindi',
    emergency_contact: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password || !formData.phone) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    const res = await registerUser(formData);
    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } else {
      setError('Registration failed. Username or email may already be taken.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-health-500 to-mint-400 text-white flex items-center justify-center text-2xl mx-auto shadow-md shadow-health-200">
            <FaHeartbeat className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Create Patient Account</h2>
          <p className="text-slate-500 text-xs">Join SevaHealth for free digital prescription parsing & doctor access</p>
        </div>

        <Card className="space-y-6">
          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message="Registration Successful! Redirecting to login..." />}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Account Credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Username"
                placeholder="e.g. ramesh_kumar"
                icon={FaUser}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="Create password"
                icon={FaLock}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            {/* Personal Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="e.g. Ramesh"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
              <Input
                label="Last Name"
                placeholder="e.g. Kumar"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="ramesh@gmail.com"
                icon={FaEnvelope}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Input
                label="Mobile Phone Number"
                placeholder="e.g. 9876543210"
                icon={FaPhone}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            {/* DOB & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Date of Birth"
                type="date"
                icon={FaCalendarAlt}
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                required
              />
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                  Gender *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full py-3 px-4 text-sm rounded-2xl border border-slate-200 bg-white focus:outline-none focus:border-health-500 focus:ring-2 focus:ring-health-100"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                  Language *
                </label>
                <select
                  value={formData.language_preference}
                  onChange={(e) => setFormData({ ...formData, language_preference: e.target.value })}
                  className="w-full py-3 px-4 text-sm rounded-2xl border border-slate-200 bg-white focus:outline-none focus:border-health-500 focus:ring-2 focus:ring-health-100"
                >
                  <option value="Hindi">Hindi</option>
                  <option value="Punjabi">Punjabi</option>
                  <option value="Bengali">Bengali</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Marathi">Marathi</option>
                  <option value="English">English</option>
                </select>
              </div>
            </div>

            {/* Emergency Contact */}
            <Input
              label="Emergency Family Phone"
              placeholder="e.g. 9812345678 (Son / Brother / Neighbor)"
              icon={FaPhoneAlt}
              value={formData.emergency_contact}
              onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
              required
            />

            <Button type="submit" variant="mint" size="lg" fullWidth loading={loading}>
              Create Patient Account
            </Button>
          </form>

        </Card>

        <p className="text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="text-health-600 font-bold hover:underline">
            Sign In Here
          </Link>
        </p>

      </div>
    </div>
  );
};

export default RegisterPage;
