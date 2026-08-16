import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { 
  FaUserMd, 
  FaUsers, 
  FaCalendarCheck, 
  FaNotesMedical, 
  FaVideo, 
  FaCheckCircle, 
  FaPhoneAlt, 
  FaClock 
} from 'react-icons/fa';

const DoctorDashboard = () => {
  const stats = [
    { label: "Today's Consultations", value: '6 Patients', color: 'bg-health-50 dark:bg-health-950/60 text-health-600 dark:text-health-400', icon: FaCalendarCheck },
    { label: 'Active Rural Patients', value: '142', color: 'bg-mint-50 dark:bg-mint-950/60 text-mint-600 dark:text-mint-400', icon: FaUsers },
    { label: 'Prescriptions Parsed', value: '89', color: 'bg-tealSoft-50 dark:bg-tealSoft-950/60 text-tealSoft-600 dark:text-tealSoft-400', icon: FaNotesMedical },
    { label: 'Doctor Rating', value: '4.9 ⭐', color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400', icon: FaUserMd },
  ];

  const todayQueue = [
    { id: 1, name: 'Ramesh Kumar', age: 41, gender: 'Male', village: 'Sundarpur Village', time: '10:30 AM', status: 'In Queue', reason: 'Fever & prescription decoding' },
    { id: 2, name: 'Sita Devi', age: 58, gender: 'Female', village: 'Solan Tehsil', time: '11:15 AM', status: 'Confirmed', reason: 'Hypertension checkup' },
  ];

  return (
    <div className="space-y-8 pb-12">
      
      {/* Doctor Header Banner */}
      <div className="bg-gradient-to-r from-health-600 via-tealSoft-600 to-mint-600 rounded-3xl p-8 text-white shadow-soft">
        <div className="space-y-2">
          <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full uppercase">
            Medical Officer Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Welcome, Dr. Ananya Sharma</h1>
          <p className="text-health-50 text-xs">Serving primary healthcare centers and rural tele-consultations</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <Card key={idx} className="flex items-center space-x-4 p-5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${s.color}`}>
                <Icon />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">{s.label}</p>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{s.value}</h3>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Appointment Queue */}
      <Card className="space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-700/80">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center space-x-2">
            <FaClock className="text-health-500" />
            <span>Today's Consultation Schedule</span>
          </h3>
          <Link to="/doctor/appointments" className="text-xs text-health-600 dark:text-health-400 font-semibold hover:underline">
            Manage Full Queue
          </Link>
        </div>

        <div className="space-y-3">
          {todayQueue.map((patient) => (
            <div key={patient.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 dark:bg-[#1E293B] border border-slate-100 dark:border-slate-700/80 rounded-2xl gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{patient.name}</h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">({patient.gender}, {patient.age} yrs)</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{patient.village} • Time: <strong className="text-slate-700 dark:text-slate-200">{patient.time}</strong></p>
                <p className="text-xs text-health-700 dark:text-health-300 font-medium">Reason: {patient.reason}</p>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="mint" size="sm" icon={FaVideo} onClick={() => alert(`Starting video consultation call with ${patient.name}...`)}>
                  Join Call
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
};

export default DoctorDashboard;
