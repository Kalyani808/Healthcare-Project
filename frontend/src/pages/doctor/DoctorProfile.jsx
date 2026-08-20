import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { 
  FaUserMd, 
  FaStethoscope, 
  FaPhone, 
  FaMoneyBillWave, 
  FaSave, 
  FaEdit, 
  FaLock, 
  FaArrowLeft, 
  FaBriefcase, 
  FaGraduationCap 
} from 'react-icons/fa';

const DoctorProfile = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const modeParam = searchParams.get('mode');
  const [isEditing, setIsEditing] = useState(modeParam === 'edit');

  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    full_name: 'Dr. Ananya Sharma',
    specialization: 'General Medicine & Diabetology',
    experience: '12',
    qualification: 'MBBS, MD (General Medicine)',
    phone: '+91 98111 22334',
    consultation_fee: '250.00',
  });

  useEffect(() => {
    if (modeParam === 'edit') {
      setIsEditing(true);
    } else if (modeParam === 'view') {
      setIsEditing(false);
    }
  }, [modeParam]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaved(true);
    setIsEditing(false);
    setSearchParams({ mode: 'view' });
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-health-500 to-mint-400 text-white flex items-center justify-center text-2xl shadow-md">
            <FaUserMd />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-800">Doctor Officer Profile</h1>
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
                ? 'Update your credentials and consultation fee' 
                : 'Your doctor credentials are shown in read-only mode to prevent accidental changes'}
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
              <span>Edit Doctor Profile</span>
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

      <Card className="space-y-6">
        {saved && <Alert type="success" message="Doctor profile updated successfully!" />}

        {!isEditing ? (
          /* READ ONLY VIEW */
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-health-100 text-health-700 flex items-center justify-center font-bold text-lg">
                  DR
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">{profile.full_name}</h3>
                  <p className="text-xs text-slate-500">{profile.specialization} • Reg #MED-74892</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-mint-50 border border-mint-200 text-mint-700 rounded-xl text-xs font-semibold">
                Medical Officer
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-100 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <FaUserMd className="text-slate-400" />
                  <span>Full Name</span>
                </span>
                <p className="text-sm font-semibold text-slate-800">{profile.full_name}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-100 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <FaStethoscope className="text-slate-400" />
                  <span>Specialization</span>
                </span>
                <p className="text-sm font-semibold text-slate-800">{profile.specialization}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-100 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <FaGraduationCap className="text-slate-400" />
                  <span>Qualification</span>
                </span>
                <p className="text-sm font-semibold text-slate-800">{profile.qualification}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-100 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <FaBriefcase className="text-slate-400" />
                  <span>Years of Experience</span>
                </span>
                <p className="text-sm font-semibold text-slate-800">{profile.experience} Years</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-100 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <FaPhone className="text-slate-400" />
                  <span>Contact Phone</span>
                </span>
                <p className="text-sm font-semibold text-slate-800">{profile.phone}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-100 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <FaMoneyBillWave className="text-slate-400" />
                  <span>Tele-consultation Fee</span>
                </span>
                <p className="text-sm font-bold text-health-600">₹{profile.consultation_fee}</p>
              </div>
            </div>
          </div>
        ) : (
          /* EDITING MODE FORM */
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name (with Title)"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Specialization"
                icon={FaStethoscope}
                value={profile.specialization}
                onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
                required
              />
              <Input
                label="Experience (Years)"
                type="number"
                value={profile.experience}
                onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Qualification / Degree"
                value={profile.qualification}
                onChange={(e) => setProfile({ ...profile, qualification: e.target.value })}
                required
              />
              <Input
                label="Contact Phone"
                icon={FaPhone}
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                required
              />
            </div>

            <Input
              label="Consultation Fee (₹)"
              type="number"
              icon={FaMoneyBillWave}
              value={profile.consultation_fee}
              onChange={(e) => setProfile({ ...profile, consultation_fee: e.target.value })}
              required
            />

            <div className="flex items-center space-x-3 pt-2">
              <Button type="submit" variant="mint" size="lg" icon={FaSave}>
                Save Doctor Credentials
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

export default DoctorProfile;
