import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { FaUser, FaPhone, FaCalendarAlt, FaLanguage, FaPhoneAlt, FaSave, FaMapMarkerAlt } from 'react-icons/fa';

const PatientProfile = () => {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    full_name: user?.name || 'Ramesh Kumar',
    phone: user?.phone || '+91 98765 43210',
    email: user?.email || 'ramesh@sevahealth.org',
    date_of_birth: '1985-04-12',
    gender: 'Male',
    language_preference: 'Hindi',
    emergency_contact: '+91 98123 45678',
    village: 'Sundarpur Village, Dist. Solan, HP',
    allergies: 'None reported',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center space-x-4 pb-4 border-b border-slate-100">
        <div className="w-14 h-14 rounded-2xl bg-health-500 text-white flex items-center justify-center text-2xl shadow-md">
          <FaUser />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Health Profile</h1>
          <p className="text-slate-500 text-xs">Manage your personal information and emergency contact details</p>
        </div>
      </div>

      <Card className="space-y-6">
        {saved && <Alert type="success" message="Profile updated successfully in local health vault!" />}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              required
            />
            <Input
              label="Phone Number"
              icon={FaPhone}
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              required
            />
            <Input
              label="Village / Address"
              icon={FaMapMarkerAlt}
              value={profile.village}
              onChange={(e) => setProfile({ ...profile, village: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Date of Birth"
              type="date"
              icon={FaCalendarAlt}
              value={profile.date_of_birth}
              onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
              required
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                Gender
              </label>
              <select
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                className="w-full py-3 px-4 text-sm rounded-2xl border border-slate-200 bg-white focus:outline-none focus:border-health-500 focus:ring-2 focus:ring-health-100"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                Preferred Language
              </label>
              <select
                value={profile.language_preference}
                onChange={(e) => setProfile({ ...profile, language_preference: e.target.value })}
                className="w-full py-3 px-4 text-sm rounded-2xl border border-slate-200 bg-white focus:outline-none focus:border-health-500 focus:ring-2 focus:ring-health-100"
              >
                <option value="Hindi">Hindi</option>
                <option value="Punjabi">Punjabi</option>
                <option value="Bengali">Bengali</option>
                <option value="Telugu">Telugu</option>
                <option value="English">English</option>
              </select>
            </div>
          </div>

          <Input
            label="Emergency Contact Phone"
            icon={FaPhoneAlt}
            value={profile.emergency_contact}
            onChange={(e) => setProfile({ ...profile, emergency_contact: e.target.value })}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
              Known Medical Conditions / Allergies
            </label>
            <textarea
              rows="3"
              value={profile.allergies}
              onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
              className="w-full p-4 text-sm rounded-2xl border border-slate-200 focus:outline-none focus:border-health-500 focus:ring-2 focus:ring-health-100"
            ></textarea>
          </div>

          <Button type="submit" variant="primary" size="lg" icon={FaSave}>
            Save Changes
          </Button>

        </form>
      </Card>
    </div>
  );
};

export default PatientProfile;
