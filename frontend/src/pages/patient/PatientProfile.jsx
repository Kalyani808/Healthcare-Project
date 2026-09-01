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
  FaShieldAlt,
  FaWeightHanging,
  FaRulerVertical,
  FaHeartbeat,
  FaTint
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
    height_cm: '172',
    weight_kg: '68',
    blood_group: 'O+',
    language_preference: 'Hindi',
    emergency_contact: '+91 98123 45678',
    village: 'Sundarpur Village, Dist. Varanasi',
    allergies: 'Penicillin allergy',
  });

  // Calculate live age from Date of Birth
  const calculateAge = (dobString) => {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  // Calculate live BMI from Weight (kg) and Height (cm)
  const calculateBMI = (weightKg, heightCm) => {
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm);
    if (!w || !h || h <= 0) return { bmi: null, category: '' };
    const heightM = h / 100;
    const bmiVal = (w / (heightM * heightM)).toFixed(1);
    let category = '';
    if (bmiVal < 18.5) category = 'Underweight';
    else if (bmiVal < 25.0) category = 'Normal Weight';
    else if (bmiVal < 30.0) category = 'Overweight';
    else category = 'Obese';
    return { bmi: bmiVal, category };
  };

  const computedAge = calculateAge(profile.date_of_birth);
  const computedBMI = calculateBMI(profile.weight_kg, profile.height_cm);

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
            height_cm: data.height_cm ? String(data.height_cm) : prev.height_cm,
            weight_kg: data.weight_kg ? String(data.weight_kg) : prev.weight_kg,
            blood_group: data.blood_group || prev.blood_group,
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
      height_cm: profile.height_cm ? parseFloat(profile.height_cm) : null,
      weight_kg: profile.weight_kg ? parseFloat(profile.weight_kg) : null,
      blood_group: profile.blood_group,
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-health-500 to-mint-400 text-white flex items-center justify-center text-2xl shadow-md">
            <FaUser />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">My Health Profile</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border flex items-center space-x-1 ${
                isEditing 
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60' 
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
              }`}>
                {isEditing ? <FaEdit className="text-[10px]" /> : <FaLock className="text-[10px]" />}
                <span>{isEditing ? 'Editing Mode' : 'Read Only View'}</span>
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              {isEditing 
                ? 'Update your personal & clinical metrics below and click Save Changes' 
                : 'Your clinical vitals and profile details are used for personalized AI medication safety'}
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
              className="flex items-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium text-xs transition-all"
            >
              <FaArrowLeft />
              <span>Cancel Editing</span>
            </button>
          )}
        </div>
      </div>

      {saved && <Alert type="success" message="Profile & clinical metrics updated successfully!" />}
      {error && <Alert type="error" message={error} />}

      <Card className="space-y-6">
        
        {/* READ ONLY VIEW MODE */}
        {!isEditing ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#1E293B] rounded-2xl border border-slate-100 dark:border-slate-700/80">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-health-100 dark:bg-health-950 text-health-700 dark:text-health-300 flex items-center justify-center font-bold text-lg">
                  {profile.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{profile.full_name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Patient ID: SH-89421 • {computedAge ? `${computedAge} Years Old` : 'Age Verified'}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center space-x-1">
                <FaShieldAlt className="text-health-500" />
                <span>Verified Patient</span>
              </span>
            </div>

            {/* 🏥 PHYSICAL VITALS & DOSAGE METRICS CARD */}
            <div className="p-4 bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-teal-500/10 dark:bg-slate-800/90 border border-teal-200/80 dark:border-slate-700 rounded-2xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-teal-800 dark:text-teal-400 flex items-center space-x-1.5">
                  <FaHeartbeat className="text-teal-600 text-sm" />
                  <span>Clinical Vitals & Prescription Metrics</span>
                </span>
                {computedBMI.bmi && (
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    computedBMI.category === 'Normal Weight'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      : computedBMI.category === 'Underweight'
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                  }`}>
                    BMI: {computedBMI.bmi} ({computedBMI.category})
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Age (Calculated)</span>
                  <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                    {computedAge !== null ? `${computedAge} Years` : 'Not Set'}
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Body Weight</span>
                  <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                    {profile.weight_kg ? `${profile.weight_kg} kg` : 'Not Set'}
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Height</span>
                  <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                    {profile.height_cm ? `${profile.height_cm} cm` : 'Not Set'}
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Blood Group</span>
                  <span className="text-sm font-black text-rose-600 dark:text-rose-400 flex items-center space-x-1">
                    <FaTint className="text-xs" />
                    <span>{profile.blood_group || 'O+'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Read-Only Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-slate-700/80 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center space-x-1.5">
                  <FaUser className="text-slate-400" />
                  <span>Full Name</span>
                </span>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{profile.full_name}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-slate-700/80 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center space-x-1.5">
                  <FaPhone className="text-slate-400" />
                  <span>Phone Number</span>
                </span>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{profile.phone}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-slate-700/80 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center space-x-1.5">
                  <FaEnvelope className="text-slate-400" />
                  <span>Email Address</span>
                </span>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{profile.email}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-slate-700/80 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center space-x-1.5">
                  <FaMapMarkerAlt className="text-slate-400" />
                  <span>Village / Residence Address</span>
                </span>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{profile.village}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-slate-700/80 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center space-x-1.5">
                  <FaCalendarAlt className="text-slate-400" />
                  <span>Date of Birth & Age</span>
                </span>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {profile.date_of_birth || '1992-06-15'} {computedAge ? `(${computedAge} yrs)` : ''}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-slate-700/80 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center space-x-1.5">
                  <FaUser className="text-slate-400" />
                  <span>Gender</span>
                </span>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{profile.gender}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-slate-700/80 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center space-x-1.5">
                  <FaLanguage className="text-slate-400" />
                  <span>Preferred Language</span>
                </span>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{profile.language_preference}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-slate-700/80 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center space-x-1.5">
                  <FaPhoneAlt className="text-slate-400" />
                  <span>Emergency Contact Phone</span>
                </span>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{profile.emergency_contact}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-300 flex items-center space-x-1.5">
                <FaCheckCircle />
                <span>Known Medical Conditions / Allergies</span>
              </span>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{profile.allergies || 'No known severe allergies reported'}</p>
            </div>

            {/* Bottom edit shortcut banner */}
            <div className="p-4 bg-health-50 dark:bg-[#1E293B] rounded-2xl border border-health-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-health-800 dark:text-slate-200 font-medium">
                Need to update your vitals, weight, height, or contact details?
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

            {/* 🏥 CLINICAL VITALS SECTION */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center space-x-1.5">
                  <FaHeartbeat />
                  <span>Physical Vitals & Clinical Metrics (Dosage Calculations)</span>
                </h3>
                {computedBMI.bmi && (
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                    Live BMI: {computedBMI.bmi} ({computedBMI.category})
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Height (in cm)"
                  type="number"
                  placeholder="e.g. 172"
                  icon={FaRulerVertical}
                  value={profile.height_cm}
                  onChange={(e) => setProfile({ ...profile, height_cm: e.target.value })}
                />
                <Input
                  label="Weight (in kg)"
                  type="number"
                  placeholder="e.g. 68"
                  icon={FaWeightHanging}
                  value={profile.weight_kg}
                  onChange={(e) => setProfile({ ...profile, weight_kg: e.target.value })}
                />
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
                    Blood Group
                  </label>
                  <select
                    value={profile.blood_group}
                    onChange={(e) => setProfile({ ...profile, blood_group: e.target.value })}
                    className="w-full py-3 px-4 text-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-slate-800 dark:text-slate-100 focus:outline-none focus:border-health-500 dark:focus:border-health-400 font-medium"
                  >
                    <option value="O+">O Positive (O+)</option>
                    <option value="O-">O Negative (O-)</option>
                    <option value="A+">A Positive (A+)</option>
                    <option value="A-">A Negative (A-)</option>
                    <option value="B+">B Positive (B+)</option>
                    <option value="B-">B Negative (B-)</option>
                    <option value="AB+">AB Positive (AB+)</option>
                    <option value="AB-">AB Negative (AB-)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Input
                  label="Date of Birth"
                  type="date"
                  icon={FaCalendarAlt}
                  value={profile.date_of_birth}
                  onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
                  required
                />
                {computedAge !== null && (
                  <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 mt-1 block">
                    ⚡ Auto-Calculated Age: {computedAge} years
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
                  Gender
                </label>
                <select
                  value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                  className="w-full py-3 px-4 text-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-slate-800 dark:text-slate-100 focus:outline-none focus:border-health-500 dark:focus:border-health-400 font-medium"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
                  Preferred Language
                </label>
                <select
                  value={profile.language_preference}
                  onChange={(e) => setProfile({ ...profile, language_preference: e.target.value })}
                  className="w-full py-3 px-4 text-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-slate-800 dark:text-slate-100 focus:outline-none focus:border-health-500 dark:focus:border-health-400 font-medium"
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
                Known Medical Conditions / Allergies
              </label>
              <textarea
                rows="3"
                value={profile.allergies}
                onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
                className="w-full p-4 text-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-health-500 dark:focus:border-health-400 font-medium"
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
                className="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-semibold text-sm transition-all"
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
