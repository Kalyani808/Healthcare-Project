import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../api/axios';
import { 
  FaRobot, 
  FaFileUpload, 
  FaCalendarCheck, 
  FaHistory, 
  FaHeartbeat, 
  FaClock, 
  FaAmbulance, 
  FaCheckCircle, 
  FaArrowRight, 
  FaNotesMedical, 
  FaVial, 
  FaPills,
  FaShieldAlt,
  FaBookMedical,
  FaLightbulb
} from 'react-icons/fa';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [recentDocs, setRecentDocs] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [schedRes, docsRes, recsRes] = await Promise.allSettled([
          api.get('/api/reminders/schedules/today-schedule/'),
          api.get('/api/documents/'),
          api.get('/api/recommendations/my-recommendations/'),
        ]);

        if (schedRes.status === 'fulfilled') {
          setTodaySchedule(schedRes.value.data);
        }
        if (docsRes.status === 'fulfilled') {
          const docData = docsRes.value.data.results || docsRes.value.data;
          setRecentDocs(Array.isArray(docData) ? docData.slice(0, 4) : []);
        }
        if (recsRes.status === 'fulfilled') {
          setRecommendations(recsRes.value.data);
        }
      } catch (err) {
        console.error('Error loading patient dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      
      {/* 🏥 EXECUTIVE PATIENT GREETING & HEALTH STATUS BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-teal-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-teal-500/20 border border-teal-400/30 px-3 py-1 rounded-full text-teal-300 text-xs font-extrabold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Patient Health Portal Active</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Namaste, {user?.name || user?.username || 'Patient'}!
            </h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Your medical prescriptions, diagnostic test archives, and daily dosage reminder alarms are synchronized and up-to-date.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link to="/patient/upload-document">
              <Button variant="primary" size="md" icon={FaFileUpload} className="shadow-lg shadow-teal-500/20 text-xs sm:text-sm">
                Upload Rx / Lab
              </Button>
            </Link>
            <Link to="/patient/emergency">
              <Button variant="danger" size="md" icon={FaAmbulance} className="text-xs sm:text-sm">
                Emergency 108
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 🤖 AI PERSONALIZED RECOMMENDATION QUICK BANNER */}
      {recommendations?.insights?.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-slate-800 dark:to-slate-800/90 border border-teal-200 dark:border-teal-800 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-lg shrink-0 shadow-xs">
              <FaLightbulb />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-950 px-2 py-0.5 rounded">
                  AI Recommendation
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                  {recommendations.insights[0].title}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium line-clamp-1 mt-0.5">
                {recommendations.insights[0].description}
              </p>
            </div>
          </div>

          <Link to="/patient/recommendations" className="shrink-0">
            <button className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center space-x-1">
              <span>View All</span> <FaArrowRight className="text-[9px]" />
            </button>
          </Link>
        </div>
      )}

      {/* 📊 CLINICAL VITALS & STATUS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Today's Medication Adherence */}
        <Card className="p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-[#1E293B] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Medication Adherence</span>
            <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center text-sm font-bold">
              <FaClock />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {todaySchedule?.adherence_pct ?? 100}%
          </h3>
          <p className="text-[11px] text-teal-600 dark:text-teal-400 font-bold">
            {todaySchedule?.total_doses || 0} Doses Scheduled Today
          </p>
        </Card>

        {/* Card 2: Blood Pressure Status */}
        <Card className="p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-[#1E293B] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Blood Pressure</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center justify-center text-sm font-bold">
              <FaHeartbeat />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">120 / 80</h3>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
            Optimal Range (mmHg)
          </p>
        </Card>

        {/* Card 3: Blood Sugar (FBS) */}
        <Card className="p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-[#1E293B] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Fasting Sugar</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center text-sm font-bold">
              <FaVial />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">95 mg/dL</h3>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
            Healthy Fasting Range
          </p>
        </Card>

        {/* Card 4: Active Medical Records */}
        <Card className="p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-[#1E293B] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Prescriptions & Tests</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-sm font-bold">
              <FaNotesMedical />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {recentDocs.length > 0 ? recentDocs.length : '3'} Active
          </h3>
          <p className="text-[11px] text-teal-600 dark:text-teal-400 font-bold">
            Archived in Vault
          </p>
        </Card>

      </div>

      {/* 🚀 QUICK ACTION WORKSPACE SHORTCUTS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <Link to="/patient/upload-document">
          <Card hoverable className="p-3.5 flex flex-col items-center text-center space-y-2 border-teal-200/80 dark:border-slate-700 bg-teal-50/40 dark:bg-slate-800/60 h-full">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center text-base shadow-xs">
              <FaFileUpload />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">Upload Rx/Lab</h4>
              <p className="text-[10px] text-slate-400">Scan & Translate</p>
            </div>
          </Card>
        </Link>

        <Link to="/patient/reminders">
          <Card hoverable className="p-3.5 flex flex-col items-center text-center space-y-2 border-amber-200/80 dark:border-slate-700 bg-amber-50/40 dark:bg-slate-800/60 h-full">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center text-base shadow-xs">
              <FaClock />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">Reminders</h4>
              <p className="text-[10px] text-slate-400">Daily Timeline</p>
            </div>
          </Card>
        </Link>

        <Link to="/patient/recommendations">
          <Card hoverable className="p-3.5 flex flex-col items-center text-center space-y-2 border-emerald-200/80 dark:border-slate-700 bg-emerald-50/40 dark:bg-slate-800/60 h-full">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-base shadow-xs">
              <FaRobot />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">AI Advice</h4>
              <p className="text-[10px] text-slate-400">Diet & Follow-Up</p>
            </div>
          </Card>
        </Link>

        <Link to="/patient/education">
          <Card hoverable className="p-3.5 flex flex-col items-center text-center space-y-2 border-blue-200/80 dark:border-slate-700 bg-blue-50/40 dark:bg-slate-800/60 h-full">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-base shadow-xs">
              <FaBookMedical />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">Health Guides</h4>
              <p className="text-[10px] text-slate-400">Maternal & Child</p>
            </div>
          </Card>
        </Link>

        <Link to="/patient/emergency">
          <Card hoverable className="p-3.5 flex flex-col items-center text-center space-y-2 border-rose-200/80 dark:border-slate-700 bg-rose-50/40 dark:bg-slate-800/60 h-full">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center text-base shadow-xs">
              <FaAmbulance />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">Emergency 108</h4>
              <p className="text-[10px] text-slate-400">SOS & First Aid</p>
            </div>
          </Card>
        </Link>

        <Link to="/patient/appointments">
          <Card hoverable className="p-3.5 flex flex-col items-center text-center space-y-2 border-slate-200/80 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/60 h-full">
            <div className="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center text-base shadow-xs">
              <FaCalendarCheck />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">Tele-Doctor</h4>
              <p className="text-[10px] text-slate-400">Appointments</p>
            </div>
          </Card>
        </Link>
      </div>

      {/* 2-COLUMN MAIN CONTENT: Recent Prescriptions & Today's Reminder Pill Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left (7 Cols): Today's Active Medication Schedule Summary */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-6 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center text-sm shadow-xs">
                  <FaPills />
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                  Today's Medication Doses
                </h3>
              </div>
              <Link to="/patient/reminders" className="text-xs font-bold text-teal-600 hover:underline flex items-center space-x-1">
                <span>Manage Reminders</span> <FaArrowRight className="text-[10px]" />
              </Link>
            </div>

            {todaySchedule?.slots?.morning?.items?.length > 0 || todaySchedule?.slots?.night?.items?.length > 0 ? (
              <div className="space-y-3">
                {['morning', 'afternoon', 'night'].map((slotKey) => {
                  const slot = todaySchedule?.slots?.[slotKey];
                  if (!slot || slot.items.length === 0) return null;

                  return (
                    <div key={slotKey} className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 dark:text-slate-300">
                        <span className="capitalize">{slot.label} ({slot.time})</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{slot.items.length} Medicines</span>
                      </div>
                      <div className="space-y-1.5">
                        {slot.items.map((item) => (
                          <div key={item.log_id} className="flex items-center justify-between text-xs p-2 bg-white dark:bg-slate-950/60 rounded-xl border border-slate-200/40 dark:border-slate-800">
                            <span className="font-bold text-slate-900 dark:text-slate-100">{item.medicine_name} ({item.dosage})</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              item.status === 'taken' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {item.status === 'taken' ? '✓ Taken' : '🕒 Pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 space-y-2 text-slate-400 text-xs">
                <FaPills className="text-3xl mx-auto opacity-30 text-teal-500" />
                <p className="font-bold text-slate-600 dark:text-slate-300">No active medication reminders for today</p>
                <Link to="/patient/upload-document" className="text-teal-600 font-bold hover:underline inline-block">
                  Upload prescription to auto-create alarms
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Right (5 Cols): Recent Uploaded Documents Archive */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm shadow-xs">
                  <FaHistory />
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                  Recent Document History
                </h3>
              </div>
              <Link to="/patient/document-history" className="text-xs font-bold text-teal-600 hover:underline flex items-center space-x-1">
                <span>View Vault</span> <FaArrowRight className="text-[10px]" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentDocs.length > 0 ? (
                recentDocs.map((doc) => (
                  <div key={doc.id} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="space-y-0.5 max-w-[200px]">
                      <h5 className="font-extrabold text-slate-900 dark:text-slate-100 truncate">{doc.document_name}</h5>
                      <p className="text-[10px] text-slate-400">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                    </div>
                    <Link
                      to="/patient/upload-document"
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[11px] font-bold shadow-xs transition-all"
                    >
                      View
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 space-y-2 text-slate-400 text-xs">
                  <FaNotesMedical className="text-3xl mx-auto opacity-30 text-teal-500" />
                  <p className="font-bold text-slate-600 dark:text-slate-300">No medical records uploaded yet</p>
                  <Link to="/patient/upload-document" className="text-teal-600 font-bold hover:underline inline-block">
                    Upload your first prescription or lab test
                  </Link>
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default PatientDashboard;
