import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import api from '../../api/axios';
import {
  FaPills,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaSun,
  FaMoon,
  FaPlus,
  FaUserFriends,
  FaBell,
  FaChartLine,
  FaVolumeUp,
  FaExclamationTriangle,
  FaTrashAlt,
  FaCheck
} from 'react-icons/fa';

const MedicationReminders = () => {
  const [todayData, setTodayData] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [caregivers, setCaregivers] = useState([]);
  const [adherence, setAdherence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCaregiverModal, setShowCaregiverModal] = useState(false);

  // Form states for new medicine schedule
  const [newMedName, setNewMedName] = useState('');
  const [newDosage, setNewDosage] = useState('1 tablet');
  const [newFrequency, setNewFrequency] = useState('1-0-1');
  const [isMorning, setIsMorning] = useState(true);
  const [isAfternoon, setIsAfternoon] = useState(false);
  const [isNight, setIsNight] = useState(true);
  const [foodTiming, setFoodTiming] = useState('after_meal');
  const [durationDays, setDurationDays] = useState(5);
  const [category, setCategory] = useState('Prescribed Medication');
  const [usageSummary, setUsageSummary] = useState('');

  // Form states for caregiver
  const [caregiverName, setCaregiverName] = useState('');
  const [caregiverRel, setCaregiverRel] = useState('family');
  const [caregiverPhone, setCaregiverPhone] = useState('');
  const [caregiverEmail, setCaregiverEmail] = useState('');

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [todayRes, schedulesRes, caregiversRes, adherenceRes] = await Promise.all([
        api.get('/api/reminders/schedules/today-schedule/'),
        api.get('/api/reminders/schedules/'),
        api.get('/api/reminders/caregivers/'),
        api.get('/api/reminders/schedules/adherence-stats/'),
      ]);

      setTodayData(todayRes.data);
      setSchedules(schedulesRes.data.results || schedulesRes.data);
      setCaregivers(caregiversRes.data.results || caregiversRes.data);
      setAdherence(adherenceRes.data);
    } catch (err) {
      console.error('Error loading reminders data:', err);
      setAlertMsg({ type: 'error', text: 'Failed to load medication schedules.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleMarkDose = async (logId, status) => {
    try {
      await api.post('/api/reminders/schedules/mark-dose/', {
        log_id: logId,
        status: status
      });

      // Play subtle chime on taken
      if (status === 'taken') {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => {});
      }

      setAlertMsg({ type: 'success', text: `Dose marked as ${status.toUpperCase()}!` });
      fetchAllData();
    } catch (err) {
      console.error('Error marking dose:', err);
      setAlertMsg({ type: 'error', text: 'Failed to update dose status.' });
    }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (!newMedName) return;

    try {
      await api.post('/api/reminders/schedules/', {
        medicine_name: newMedName,
        dosage: newDosage,
        frequency: newFrequency,
        is_morning: isMorning,
        is_afternoon: isAfternoon,
        is_night: isNight,
        food_timing: foodTiming,
        duration_days: durationDays,
        category: category,
        usage_summary: usageSummary,
        instructions: `Take ${newDosage} ${foodTiming.replace('_', ' ')}`
      });

      setShowAddModal(false);
      setNewMedName('');
      setUsageSummary('');
      setAlertMsg({ type: 'success', text: 'New medication schedule added successfully!' });
      fetchAllData();
    } catch (err) {
      console.error('Error creating schedule:', err);
      setAlertMsg({ type: 'error', text: 'Failed to create schedule.' });
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Are you sure you want to delete this medication schedule?')) return;
    try {
      await api.delete(`/api/reminders/schedules/${id}/`);
      setAlertMsg({ type: 'success', text: 'Medication schedule removed.' });
      fetchAllData();
    } catch (err) {
      console.error('Error deleting schedule:', err);
      setAlertMsg({ type: 'error', text: 'Failed to delete schedule.' });
    }
  };

  const handleCreateCaregiver = async (e) => {
    e.preventDefault();
    if (!caregiverName || !caregiverPhone) return;

    try {
      await api.post('/api/reminders/caregivers/', {
        name: caregiverName,
        relationship: caregiverRel,
        phone_number: caregiverPhone,
        email: caregiverEmail,
        notify_on_missed: true,
        notify_on_emergency: true
      });

      setShowCaregiverModal(false);
      setCaregiverName('');
      setCaregiverPhone('');
      setCaregiverEmail('');
      setAlertMsg({ type: 'success', text: 'Caregiver registered for missed dose alerts!' });
      fetchAllData();
    } catch (err) {
      console.error('Error creating caregiver:', err);
      setAlertMsg({ type: 'error', text: 'Failed to register caregiver.' });
    }
  };

  const handleSendTestAlert = async (caregiverId) => {
    try {
      const res = await api.post(`/api/reminders/caregivers/${caregiverId}/send-test-alert/`);
      setAlertMsg({ type: 'success', text: res.data.message });
    } catch (err) {
      console.error('Error sending alert:', err);
      setAlertMsg({ type: 'error', text: 'Failed to send alert.' });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-tealSoft-500/20 via-mint-500/15 to-blue-500/15 border border-mint-200 dark:border-slate-800 p-6 rounded-3xl shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center space-x-3">
              <span className="p-2.5 rounded-2xl bg-tealSoft-500 text-white shadow-md">
                <FaClock />
              </span>
              <span>Medication Reminder System</span>
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Track daily dosages, log taken medicines, monitor compliance adherence, and configure automatic caregiver alerts.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="mint"
              size="md"
              icon={FaPlus}
              onClick={() => setShowAddModal(true)}
            >
              Add Medicine
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={FaUserFriends}
              onClick={() => setShowCaregiverModal(true)}
            >
              Add Caregiver
            </Button>
          </div>
        </div>
      </div>

      {alertMsg && (
        <Alert
          type={alertMsg.type}
          message={alertMsg.text}
          onClose={() => setAlertMsg(null)}
        />
      )}

      {/* Top Metrics Row: Adherence, Taken Doses, Caregiver Alert Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Adherence Score */}
        <Card className="p-5 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl font-black shadow-inner">
            {todayData ? `${todayData.adherence_pct}%` : '100%'}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Adherence</p>
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
              {todayData ? `${todayData.taken_doses} of ${todayData.total_doses} Doses` : '0 / 0'}
            </h3>
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {adherence?.streak_days ? `✓ ${adherence.streak_days} Day Streak Active` : 'Log doses to start your streak'}
            </p>
          </div>
        </Card>

        {/* Metric 2: Active Prescriptions */}
        <Card className="p-5 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-tealSoft-100 dark:bg-slate-800 text-tealSoft-600 dark:text-tealSoft-400 flex items-center justify-center text-2xl shadow-inner">
            <FaPills />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Medications</p>
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
              {schedules.length} Prescribed
            </h3>
            <p className="text-[11px] text-slate-500">Auto-synced with ICR extraction</p>
          </div>
        </Card>

        {/* Metric 3: Caregiver Guard */}
        <Card className="p-5 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl shadow-inner">
            <FaBell />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Caregiver Alerts</p>
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
              {caregivers.length} Registered
            </h3>
            <p className="text-[11px] text-blue-600 dark:text-blue-400">Missed dose alerts active</p>
          </div>
        </Card>
      </div>

      {/* TODAY'S MEDICINE TIMELINE (Morning / Afternoon / Night Buckets) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
            <FaClock className="text-tealSoft-500" />
            <span>Today's Dosage Schedule ({new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })})</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">Click button to log intake</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading daily schedules...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. MORNING BUCKET */}
            <Card className="p-5 border-t-4 border-amber-500 bg-white dark:bg-[#1E293B] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 text-base">
                    <FaSun />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Morning Dose</h3>
                    <p className="text-[11px] text-slate-400 font-mono">08:00 AM</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-slate-800 text-amber-700 dark:text-amber-300">
                  {todayData?.slots?.morning?.items?.length || 0} Meds
                </span>
              </div>

              <div className="space-y-3">
                {todayData?.slots?.morning?.items?.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No morning medicines scheduled.</p>
                ) : (
                  todayData?.slots?.morning?.items?.map((item) => (
                    <div
                      key={item.log_id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        item.status === 'taken'
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{item.medicine_name}</h4>
                          <p className="text-xs font-semibold text-slate-500">{item.dosage} • <span className="text-tealSoft-600 dark:text-tealSoft-400">{item.food_timing}</span></p>
                          {item.usage_summary && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">{item.usage_summary}</p>
                          )}
                        </div>
                        {item.status === 'taken' ? (
                          <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                            <FaCheckCircle /> <span>Taken</span>
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-amber-600 flex items-center space-x-1">
                            <FaClock /> <span>Pending</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                        {item.status !== 'taken' ? (
                          <button
                            onClick={() => handleMarkDose(item.log_id, 'taken')}
                            className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all"
                          >
                            <FaCheck className="text-[10px]" /> <span>Take Now</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMarkDose(item.log_id, 'pending')}
                            className="text-[11px] text-slate-400 hover:underline"
                          >
                            Undo
                          </button>
                        )}
                        {item.status !== 'missed' && item.status !== 'taken' && (
                          <button
                            onClick={() => handleMarkDose(item.log_id, 'missed')}
                            className="py-1.5 px-2.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-100 hover:text-rose-700 rounded-xl text-xs font-semibold transition-all"
                            title="Mark as missed"
                          >
                            Missed
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* 2. AFTERNOON BUCKET */}
            <Card className="p-5 border-t-4 border-orange-500 bg-white dark:bg-[#1E293B] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 text-base">
                    <FaSun />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Afternoon Dose</h3>
                    <p className="text-[11px] text-slate-400 font-mono">01:00 PM</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 dark:bg-slate-800 text-orange-700 dark:text-orange-300">
                  {todayData?.slots?.afternoon?.items?.length || 0} Meds
                </span>
              </div>

              <div className="space-y-3">
                {todayData?.slots?.afternoon?.items?.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No afternoon medicines scheduled.</p>
                ) : (
                  todayData?.slots?.afternoon?.items?.map((item) => (
                    <div
                      key={item.log_id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        item.status === 'taken'
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{item.medicine_name}</h4>
                          <p className="text-xs font-semibold text-slate-500">{item.dosage} • <span className="text-tealSoft-600 dark:text-tealSoft-400">{item.food_timing}</span></p>
                          {item.usage_summary && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">{item.usage_summary}</p>
                          )}
                        </div>
                        {item.status === 'taken' ? (
                          <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                            <FaCheckCircle /> <span>Taken</span>
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-amber-600 flex items-center space-x-1">
                            <FaClock /> <span>Pending</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                        {item.status !== 'taken' ? (
                          <button
                            onClick={() => handleMarkDose(item.log_id, 'taken')}
                            className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all"
                          >
                            <FaCheck className="text-[10px]" /> <span>Take Now</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMarkDose(item.log_id, 'pending')}
                            className="text-[11px] text-slate-400 hover:underline"
                          >
                            Undo
                          </button>
                        )}
                        {item.status !== 'missed' && item.status !== 'taken' && (
                          <button
                            onClick={() => handleMarkDose(item.log_id, 'missed')}
                            className="py-1.5 px-2.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-100 hover:text-rose-700 rounded-xl text-xs font-semibold transition-all"
                          >
                            Missed
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* 3. NIGHT BUCKET */}
            <Card className="p-5 border-t-4 border-indigo-600 bg-white dark:bg-[#1E293B] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 text-base">
                    <FaMoon />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Night Dose</h3>
                    <p className="text-[11px] text-slate-400 font-mono">08:00 PM</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300">
                  {todayData?.slots?.night?.items?.length || 0} Meds
                </span>
              </div>

              <div className="space-y-3">
                {todayData?.slots?.night?.items?.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No night medicines scheduled.</p>
                ) : (
                  todayData?.slots?.night?.items?.map((item) => (
                    <div
                      key={item.log_id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        item.status === 'taken'
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{item.medicine_name}</h4>
                          <p className="text-xs font-semibold text-slate-500">{item.dosage} • <span className="text-tealSoft-600 dark:text-tealSoft-400">{item.food_timing}</span></p>
                          {item.usage_summary && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">{item.usage_summary}</p>
                          )}
                        </div>
                        {item.status === 'taken' ? (
                          <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                            <FaCheckCircle /> <span>Taken</span>
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-amber-600 flex items-center space-x-1">
                            <FaClock /> <span>Pending</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                        {item.status !== 'taken' ? (
                          <button
                            onClick={() => handleMarkDose(item.log_id, 'taken')}
                            className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all"
                          >
                            <FaCheck className="text-[10px]" /> <span>Take Now</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMarkDose(item.log_id, 'pending')}
                            className="text-[11px] text-slate-400 hover:underline"
                          >
                            Undo
                          </button>
                        )}
                        {item.status !== 'missed' && item.status !== 'taken' && (
                          <button
                            onClick={() => handleMarkDose(item.log_id, 'missed')}
                            className="py-1.5 px-2.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-100 hover:text-rose-700 rounded-xl text-xs font-semibold transition-all"
                          >
                            Missed
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* ALL MEDICATIONS TABLE & CAREGIVERS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        {/* Left 2 Cols: Active Medication Schedules */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base flex items-center space-x-2">
                <FaPills className="text-tealSoft-500" />
                <span>All Active Medication Schedules ({schedules.length})</span>
              </h3>
              <span className="text-xs text-slate-400">Duration & Times</span>
            </div>

            {schedules.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-tealSoft-50 dark:bg-slate-800 text-tealSoft-600 dark:text-tealSoft-400 flex items-center justify-center text-2xl mx-auto shadow-inner">
                  <FaPills />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No medicines added yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Extract a prescription and tap <strong className="text-tealSoft-600">Set Reminder</strong> to add one, or click Add Medicine.
                  </p>
                </div>
                <div className="pt-1">
                  <a
                    href="/patient/upload-document"
                    className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-tealSoft-600 hover:bg-tealSoft-700 text-white text-xs font-bold shadow-xs transition-all"
                  >
                    Upload Prescription →
                  </a>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {schedules.map((s) => (
                  <div key={s.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{s.medicine_name}</span>
                        <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 bg-mint-100 dark:bg-slate-800 text-mint-800 dark:text-mint-300 rounded-md">
                          {s.category || 'Medication'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {s.dosage} • {s.frequency} • {s.food_timing?.replace('_', ' ')} • Active for {s.duration_days} days
                      </p>
                      {s.usage_summary && (
                        <p className="text-[11px] text-tealSoft-600 dark:text-tealSoft-400 mt-1">{s.usage_summary}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDeleteSchedule(s.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Delete schedule"
                      >
                        <FaTrashAlt className="text-sm" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Col: Caregivers Notification Settings */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-5 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center space-x-2">
                <FaUserFriends className="text-blue-500" />
                <span>Caregiver Guard ({caregivers.length})</span>
              </h3>
              <button
                onClick={() => setShowCaregiverModal(true)}
                className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
              >
                + Add
              </button>
            </div>

            {caregivers.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No caregivers added yet. Add a family member or nurse to receive missed dose alerts.</p>
            ) : (
              <div className="space-y-3">
                {caregivers.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs">{c.name}</h4>
                      <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-md font-semibold capitalize">{c.relationship}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">{c.phone_number}</p>
                    <button
                      onClick={() => handleSendTestAlert(c.id)}
                      className="w-full py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold hover:bg-slate-50 transition-all"
                    >
                      Send Test Alert
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* MODAL: ADD MEDICINE SCHEDULE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base flex items-center space-x-2">
                <FaPills className="text-tealSoft-500" />
                <span>Add Medication Schedule</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-3">
              <Input
                label="Medicine Name *"
                placeholder="e.g. Augmentin 625mg, Pan-DSR"
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Dosage"
                  placeholder="e.g. 1 tablet, 500mg"
                  value={newDosage}
                  onChange={(e) => setNewDosage(e.target.value)}
                />
                <Input
                  label="Duration (Days)"
                  type="number"
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value) || 5)}
                />
              </div>

              {/* 3-Slot Daily Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Daily Timing Slots *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMorning(!isMorning)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border flex items-center justify-center space-x-1 ${
                      isMorning ? 'bg-amber-100 border-amber-400 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <FaSun /> <span>Morning</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAfternoon(!isAfternoon)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border flex items-center justify-center space-x-1 ${
                      isAfternoon ? 'bg-orange-100 border-orange-400 text-orange-900' : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <FaSun /> <span>Afternoon</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNight(!isNight)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border flex items-center justify-center space-x-1 ${
                      isNight ? 'bg-indigo-100 border-indigo-400 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <FaMoon /> <span>Night</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Food Instructions</label>
                <select
                  value={foodTiming}
                  onChange={(e) => setFoodTiming(e.target.value)}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  <option value="after_meal">After Food (భోజనం తర్వాత / खाने के बाद)</option>
                  <option value="before_meal">Before Food / Empty Stomach (భోజనానికి ముందు / खाली पेट)</option>
                  <option value="with_meal">With Food (భోజనంతో పాటు)</option>
                  <option value="anytime">As Directed</option>
                </select>
              </div>

              <Input
                label="Clinical Usage / Purpose (Optional)"
                placeholder="e.g. Antibiotic for throat infection"
                value={usageSummary}
                onChange={(e) => setUsageSummary(e.target.value)}
              />

              <div className="flex space-x-3 pt-2">
                <Button type="button" variant="outline" fullWidth onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="mint" fullWidth>
                  Save Schedule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CAREGIVER */}
      {showCaregiverModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base flex items-center space-x-2">
                <FaUserFriends className="text-blue-500" />
                <span>Register Caregiver Contact</span>
              </h3>
              <button onClick={() => setShowCaregiverModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateCaregiver} className="space-y-3">
              <Input
                label="Caregiver Name *"
                placeholder="e.g. Rahul Sharma"
                value={caregiverName}
                onChange={(e) => setCaregiverName(e.target.value)}
                required
              />

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Relationship *</label>
                <select
                  value={caregiverRel}
                  onChange={(e) => setCaregiverRel(e.target.value)}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  <option value="family">Family Member / Spouse</option>
                  <option value="child">Son / Daughter</option>
                  <option value="parent">Parent</option>
                  <option value="nurse">Nurse / Attendant</option>
                  <option value="friend">Friend / Neighbor</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <Input
                label="Phone Number (WhatsApp/SMS) *"
                placeholder="e.g. +91 9876543210"
                value={caregiverPhone}
                onChange={(e) => setCaregiverPhone(e.target.value)}
                required
              />

              <Input
                label="Email Address (Optional)"
                placeholder="e.g. caregiver@gmail.com"
                value={caregiverEmail}
                onChange={(e) => setCaregiverEmail(e.target.value)}
              />

              <div className="flex space-x-3 pt-2">
                <Button type="button" variant="outline" fullWidth onClick={() => setShowCaregiverModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="mint" fullWidth>
                  Register Caregiver
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationReminders;
