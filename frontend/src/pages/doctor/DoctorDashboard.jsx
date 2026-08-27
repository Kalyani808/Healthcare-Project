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
  FaClock,
  FaStethoscope,
  FaArrowRight,
  FaMicroscope,
  FaChartLine
} from 'react-icons/fa';

const DoctorDashboard = () => {
  const stats = [
    { label: "Today's Patient Queue", value: '6 Scheduled', color: 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300', icon: FaCalendarCheck },
    { label: 'Total Registered Patients', value: '148', color: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300', icon: FaUsers },
    { label: 'Prescriptions & Lab Tests', value: '94 Analyzed', color: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300', icon: FaMicroscope },
    { label: 'Clinical Satisfaction Rating', value: '4.9 ★', color: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300', icon: FaUserMd },
  ];

  const todayQueue = [
    { id: 1, name: 'Ramesh Kumar', age: 41, gender: 'Male', village: 'Sundarpur Village, Varanasi', time: '10:30 AM', status: 'In Waiting Room', priority: 'Moderate', reason: 'Fever (101°F) & prescription decoding review' },
    { id: 2, name: 'Sita Devi', age: 58, gender: 'Female', village: 'Solan Tehsil, HP', time: '11:15 AM', status: 'Confirmed', priority: 'Routine', reason: 'Hypertension regular BP review' },
    { id: 3, name: 'Mohammed Farooq', age: 34, gender: 'Male', village: 'Nalgonda District, Telangana', time: '12:00 PM', status: 'Confirmed', priority: 'Routine', reason: 'Lab report CBC platelet count check' },
  ];

  return (
    <div className="space-y-8 pb-12">
      
      {/* Doctor Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-teal-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-black bg-teal-500/20 border border-teal-400/30 text-teal-300 px-3 py-1 rounded-full uppercase tracking-wider">
              Clinical Medical Officer EMR Workspace
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome, Dr. Ananya Sharma
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              MBBS, MD (General Medicine) • Serving Tele-Medicine & Rural Primary Health Centers
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <Link to="/doctor/appointments">
              <Button variant="primary" size="md" icon={FaCalendarCheck} className="font-bold text-xs">
                Manage Consultation Queue
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <Card key={idx} className="p-5 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${s.color} shadow-xs`}>
                <Icon />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{s.label}</p>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{s.value}</h3>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Appointment Queue */}
      <Card className="p-6 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-md space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center text-sm shadow-xs">
              <FaClock />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
              Today's Consultation Schedule & Triage Queue
            </h3>
          </div>
          <Link to="/doctor/appointments" className="text-xs text-teal-600 font-bold hover:underline flex items-center space-x-1">
            <span>View Full Queue</span> <FaArrowRight className="text-[10px]" />
          </Link>
        </div>

        <div className="space-y-3">
          {todayQueue.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-teal-400"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center space-x-2.5">
                  <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                    {item.name}
                  </h4>
                  <span className="text-xs text-slate-400">({item.gender}, {item.age} yrs)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                    {item.priority}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{item.village} • Reason: <strong className="text-slate-700 dark:text-slate-300">{item.reason}</strong></p>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  🕒 {item.time}
                </span>
                <button
                  type="button"
                  onClick={() => alert(`Starting encrypted tele-consultation video session with ${item.name}`)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
                >
                  <FaVideo /> <span>Start Tele-Consult</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
};

export default DoctorDashboard;
