import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { FaUserMd, FaStethoscope, FaPhone, FaMoneyBillWave, FaSave } from 'react-icons/fa';

const DoctorProfile = () => {
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    full_name: 'Dr. Ananya Sharma',
    specialization: 'General Medicine & Diabetology',
    experience: '12',
    qualification: 'MBBS, MD (General Medicine)',
    phone: '+91 98111 22334',
    consultation_fee: '250.00',
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
          <FaUserMd />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Doctor Officer Profile</h1>
          <p className="text-slate-500 text-xs">Update your professional credentials, consultation fees & contact details</p>
        </div>
      </div>

      <Card className="space-y-6">
        {saved && <Alert type="success" message="Doctor profile updated successfully!" />}

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

          <Button type="submit" variant="mint" size="lg" icon={FaSave}>
            Save Doctor Credentials
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default DoctorProfile;
