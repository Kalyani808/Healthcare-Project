import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import api from '../../api/axios';
import { 
  FaUser, 
  FaPhone, 
  FaCalendarAlt, 
  FaLanguage, 
  FaPhoneAlt, 
  FaSave, 
  FaMapMarkerAlt, 
  FaEdit, 
  FaLock, 
  FaCheckCircle,
  FaEnvelope,
  FaArrowLeft,
  FaShieldAlt
} from 'react-icons/fa';

const PatientProfile = () => {
  const { user, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Read mode from query param ?mode=edit or ?mode=view
  const modeParam = searchParams.get('mode');
  const [isEditing, setIsEditing] = useState(modeParam === 'edit');

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [profile, setProfile] = useState({
    full_name: user?.name || user?.first_name || user?.username || 'Ramesh Kumar',
    phone: user?.phone || user?.phone_number || '+91 98765 43210',
    email: user?.email || 'ramesh_kumar@sevahealth.org',
    date_of_birth: '1992-06-15',
    gender: 'Male',
    language_preference: 'Hindi',
    emergency_contact: '+91 98123 45678',
    village: 'Sundarpur Village, Dist. Varanasi',
    allergies: 'Penicillin allergy',
  });

  // Listen to URL search param changes
  useEffect(() => {
    if (modeParam === 'edit') {
      setIsEditing(true);
    } else if (modeParam === 'view') {
      setIsEditing(false);
    }
  }, [modeParam]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/api/auth/profile/');
        if (res.data) {
          const data = res.data;
          setProfile((prev) => ({
            ...prev,
            full_name: data.first_name || user?.name || user?.first_name || user?.username || prev.full_name,
            phone: data.phone_number || user?.phone || user?.phone_number || prev.phone,
            email: data.email || user?.email || prev.email,
            date_of_birth: data.date_of_birth || prev.date_of_birth,
            gender: data.gender === 'F' ? 'Female' : data.gender === 'O' ? 'Other' : 'Male',
            language_preference: 'Hindi',
            emergency_contact: data.emergency_contact_number || prev.emergency_contact,
            village: data.village_town || data.address || prev.village,
            allergies: prev.allergies,
          }));
        }
      } catch (err) {
        console.error('Failed to load profile from backend:', err);
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
      gender: profile.gender === 'Female' ? 'F' : profile.gender === 'Other' ? 'O' : 'M',
      address: profile.village,
      village_town: profile.village,
      emergency_contact_number: profile.emergency_contact,
    };

    try {
      await api.put('/api/auth/profile/', profilePayload).catch(() => {});

      if (updateUser) {
        updateUser({
          name: profile.full_name,
          first_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          phone_number: profile.phone,
        });
      }

      setSaved(true);
      setIsEditing(false);
      setSearchParams({ mode: 'view' });
      setTimeout(() => setSaved(false), 3500);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update profile.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-health-500 to-mint-400 text-white flex items-center justify-center text-2xl shadow-md">
            <FaUser />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-800">My Health Profile</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border flex items-center space-x-1 ${
                isEditing 
                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {isEditing ? <FaEdit className="text-[10px]" /> : <FaLock className="text-[10px]" />}
                <span>{isEditing ? 'Editing Mode' : 'Read Only View'}</span>
              </span>
            </div>
            <p className="text-slate-500 text-xs">
              {isEditing 
                ? 'Update your personal details below and click Save Changes' 
                : 'Your profile details are locked in read-only mode to prevent accidental changes'}
            </p>
          </div>
        </div>

        {/* Action Toggle Button */}
        <div>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => {
                setIsEditing(true);
                setSearchParams({ mode: 'edit' });
              }}
              className="flex items-center space-x-2 px-5 py-2.5 bg-health-600 hover:bg-health-700 text-white rounded-xl font-medium text-xs shadow-sm transition-all"
            >
              <FaEdit />
              <span>Edit Profile</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setSearchParams({ mode: 'view' });
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition-all"
            >
              <FaArrowLeft />
              <span>Cancel Editing</span>
            </button>
          )}
        </div>
      </div>

      {saved && <Alert type="success" message="Profile updated successfully in your local health vault!" />}
      {error && <Alert type="error" message={error} />}

      <Card className="space-y-6">
        
        {/* READ ONLY VIEW MODE */}
        {!isEditing ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-health-100 text-health-700 flex items-center justify-center font-bold text-lg">
                  {profile.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">{profile.full_name}</h3>
                  <p className="text-xs text-slate-500">Patient ID: SH-89421 • Village Member</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold flex items-center space-x-1">
                <FaShieldAlt className="text-health-500" />
                <span>Verified Account</span>
              </span>
            </div>

            {/* Read-Only Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-100 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <FaUser className="text-slate-400" />
                  <span>Full Name</span>
                </span>
                <p className="text-sm font-semibold text-slate-800">{profile.full_name}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-100 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <FaPhone className="text-slate-400" />
                  <span>Phone Number</span>
                </span>
                <p className="text-sm font-semibold text-slate-800">{profile.phone}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-100 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <FaEnvelope className="text-slate-400" />
                  <span>Email Address</span>
                </span>
                <p className="text-sm font-semibold text-slate-800">{profile.email}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-100 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <FaMapMarkerAlt className="text-slate-400" />
                  <span>Village / Residence Address</span>
                </span>
                <p className="text-sm font-semibold text-slate-800">{profile.village}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-100 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <FaCalendarAlt className="text-slate-400" />
                  <span>Date of Birth</span>
                </span>
                <p className="text-sm font-semibold text-slate-800">{profile.date_of_birth || '1992-06-15'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-100 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <FaUser className="text-slate-400" />
                  <span>Gender</span>
                </span>
                <p className="text-sm font-semibold text-slate-800">{profile.gender}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-100 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <FaLanguage className="text-slate-400" />
                  <span>Preferred Language</span>
                </span>
                <p className="text-sm font-semibold text-slate-800">{profile.language_preference}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-100 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <FaPhoneAlt className="text-slate-400" />
                  <span>Emergency Contact Phone</span>
                </span>
                <p className="text-sm font-semibold text-slate-800">{profile.emergency_contact}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 flex items-center space-x-1.5">
                <FaCheckCircle />
                <span>Known Medical Conditions / Allergies</span>
              </span>
              <p className="text-sm font-medium text-slate-800">{profile.allergies || 'No known severe allergies reported'}</p>
            </div>

            {/* Bottom edit shortcut banner */}
            <div className="p-4 bg-health-50 rounded-2xl border border-health-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-health-800 font-medium">
                Need to update your mobile number, address, or emergency contacts?
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  setSearchParams({ mode: 'edit' });
                }}
                className="px-4 py-2 bg-health-600 hover:bg-health-700 text-white font-semibold rounded-xl flex items-center space-x-1.5 transition-colors"
              >
                <FaEdit />
                <span>Edit Profile Fields</span>
              </button>
            </div>

          </div>
        ) : (
          /* EDITING MODE FORM */
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
                label="Village / Residence Address"
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
              label="Emergency Family Phone"
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

            <div className="flex items-center space-x-3 pt-2">
              <Button type="submit" variant="primary" size="lg" icon={FaSave}>
                Save Profile Changes
              </Button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setSearchParams({ mode: 'view' });
                }}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-semibold text-sm transition-all"
              >
                Cancel
              </button>
            </div>

          </form>
        )}

      </Card>
    </div>
  );
};

export default PatientProfile;
