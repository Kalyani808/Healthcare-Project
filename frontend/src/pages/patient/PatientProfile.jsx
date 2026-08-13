import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import api from '../../api/axios';
import { FaUser, FaPhone, FaCalendarAlt, FaPhoneAlt, FaSave, FaMapMarkerAlt } from 'react-icons/fa';

const PatientProfile = () => {
  const { user, updateUser } = useAuth();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [profile, setProfile] = useState({
    full_name: user?.name || user?.first_name || user?.username || '',
    phone: user?.phone || user?.phone_number || '',
    email: user?.email || '',
    date_of_birth: '',
    gender: 'M',
    language_preference: 'hi',
    emergency_contact: '',
    village: '',
    allergies: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/api/auth/profile/');
        if (res.data) {
          const data = res.data;
          setProfile({
            full_name: data.first_name || user?.name || user?.first_name || user?.username || '',
            phone: data.phone_number || user?.phone || user?.phone_number || '',
            email: data.email || user?.email || '',
            date_of_birth: data.date_of_birth || '',
            gender: data.gender || 'M',
            language_preference: 'hi',
            emergency_contact: data.emergency_contact_number || '',
            village: data.village_town || data.address || '',
            allergies: '',
          });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const profilePayload = {
      first_name: profile.full_name,
      phone_number: profile.phone,
      email: profile.email,
      date_of_birth: profile.date_of_birth ? profile.date_of_birth : null,
      gender: profile.gender || 'M',
      address: profile.village,
      village_town: profile.village,
      emergency_contact_number: profile.emergency_contact,
    };

    const userPayload = {
      first_name: profile.full_name,
      email: profile.email,
      phone_number: profile.phone,
    };

    console.log("Sending data (profilePayload):", profilePayload);
    console.log("Sending data (userPayload):", userPayload);
    console.log("Token:", localStorage.getItem('access_token'));

    try {
      // 1. Update Profile endpoint
      const res = await api.put('/api/auth/profile/', profilePayload);
      console.log("Response status (profile):", res.status);
      console.log("Response data (profile):", res.data);

      // 2. Update User endpoint for user fields
      try {
        const userRes = await api.put('/api/auth/user/', userPayload);
        console.log("Response status (user):", userRes.status);
        console.log("Response data (user):", userRes.data);
      } catch (uErr) {
        console.warn("User endpoint update warning:", uErr);
      }

      if (res.data) {
        const data = res.data;
        const newFullName = data.first_name || profile.full_name;
        const newPhone = data.phone_number || profile.phone;
        const newEmail = data.email || profile.email;

        setProfile((prev) => ({
          ...prev,
          full_name: newFullName,
          phone: newPhone,
          email: newEmail,
          date_of_birth: data.date_of_birth || '',
          gender: data.gender || 'M',
          village: data.village_town || data.address || prev.village,
          emergency_contact: data.emergency_contact_number || prev.emergency_contact,
        }));

        // 3. Update AuthContext & localStorage user_info so name ('Shreyam') immediately updates UI and persists across F5!
        if (updateUser) {
          updateUser({
            name: newFullName,
            first_name: newFullName,
            email: newEmail,
            phone: newPhone,
            phone_number: newPhone,
          });
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch (err) {
      console.error('Failed to update profile:', err);
      const errMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      setError('Failed to update profile: ' + errMsg);
    }
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
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
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
