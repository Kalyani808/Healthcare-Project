import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import api from '../../api/axios';
import {
  FaAmbulance,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaHeartbeat,
  FaFirstAid,
  FaHospital,
  FaPrescriptionBottleAlt,
  FaTint,
  FaVolumeUp,
  FaPlay,
  FaStop,
  FaExclamationTriangle,
  FaDirections,
  FaShieldAlt,
  FaUserNurse,
  FaWhatsapp
} from 'react-icons/fa';
import { sendEmergencySOSWhatsApp } from '../../utils/whatsappHelper';

const EmergencyAssistance = () => {
  const [facilities, setFacilities] = useState([]);
  const [firstAidGuides, setFirstAidGuides] = useState([]);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [selectedFacilityType, setSelectedFacilityType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [sosStatus, setSosStatus] = useState(null);

  // Preferred Language for First Aid Speech
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('preferred_language') || 'te-IN';
  });

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    const fetchEmergencyData = async () => {
      setLoading(true);
      try {
        const [facRes, guidesRes] = await Promise.all([
          api.get('/api/emergency/facilities/'),
          api.get('/api/emergency/facilities/first-aid/'),
        ]);

        const facList = facRes.data.results || facRes.data.facilities || facRes.data;
        setFacilities(Array.isArray(facList) ? facList : []);

        const guidesList = guidesRes.data.guides || guidesRes.data;
        setFirstAidGuides(Array.isArray(guidesList) ? guidesList : []);
        if (Array.isArray(guidesList) && guidesList.length > 0) {
          setSelectedGuide(guidesList[0]);
        }
      } catch (err) {
        console.error('Error fetching emergency data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmergencyData();
  }, []);

  const handleTriggerSOS = async () => {
    if (!navigator.geolocation) {
      triggerSOSTelemetry(null, null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => triggerSOSTelemetry(pos.coords.latitude, pos.coords.longitude),
      () => triggerSOSTelemetry(null, null)
    );
  };

  const triggerSOSTelemetry = async (lat, lng) => {
    try {
      const res = await api.post('/api/emergency/facilities/sos-trigger/', {
        latitude: lat,
        longitude: lng
      });
      setSosStatus(res.data);
    } catch (e) {
      console.error('SOS dispatch error:', e);
    }
  };

  const speakFirstAidGuide = (guide) => {
    if (!guide) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const textToSpeak = lang.startsWith('te')
      ? (guide.audio_script_te || guide.steps_te?.join('. '))
      : lang.startsWith('hi')
      ? (guide.steps_hi?.join('. '))
      : (guide.audio_script_en || guide.steps?.join('. '));

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = lang;
    utterance.rate = 0.90;

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  const filteredFacilities = selectedFacilityType === 'all'
    ? facilities
    : facilities.filter(f => f.facility_type === selectedFacilityType);

  return (
    <div className="space-y-6 pb-12">
      {/* 🔴 RED EMERGENCY SOS SPEED DIAL BANNER */}
      <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/20 text-white font-extrabold text-xs tracking-wider uppercase backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-yellow-300 animate-ping"></span>
              <span>24/7 Emergency Medical Response</span>
            </span>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight flex items-center space-x-3">
              <FaAmbulance className="text-3xl" />
              <span>Emergency Information Assistance</span>
            </h1>
            <p className="text-sm text-rose-100 max-w-2xl leading-relaxed">
              Instant speed-dial emergency dispatch, interactive step-by-step first aid guidance, and verified nearby 24/7 hospitals and trauma care centers.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
            <button
              onClick={handleTriggerSOS}
              className="w-full sm:w-auto px-5 py-3.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black text-xs sm:text-sm rounded-2xl shadow-lg transform active:scale-95 transition-all flex items-center justify-center space-x-2 border-2 border-yellow-200"
            >
              <FaExclamationTriangle className="text-rose-600 text-base" />
              <span>DISPATCH SOS 108</span>
            </button>

            <button
              onClick={() => sendEmergencySOSWhatsApp('Patient', 'O+')}
              className="w-full sm:w-auto px-5 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg transform active:scale-95 transition-all flex items-center justify-center space-x-2 border border-emerald-300"
            >
              <FaWhatsapp className="text-lg" />
              <span>WhatsApp Family SOS</span>
            </button>
          </div>
        </div>

        {/* Speed Dial Numbers Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-rose-500/50">
          <a
            href="tel:108"
            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur border border-white/20 transition-all flex items-center justify-between group"
          >
            <div>
              <p className="text-[11px] font-bold text-rose-200">Ambulance (Free)</p>
              <h3 className="text-2xl font-black tracking-wider">108</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 group-hover:bg-white text-white group-hover:text-rose-600 flex items-center justify-center text-sm transition-colors">
              <FaPhoneAlt />
            </div>
          </a>

          <a
            href="tel:112"
            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur border border-white/20 transition-all flex items-center justify-between group"
          >
            <div>
              <p className="text-[11px] font-bold text-rose-200">National SOS</p>
              <h3 className="text-2xl font-black tracking-wider">112</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 group-hover:bg-white text-white group-hover:text-rose-600 flex items-center justify-center text-sm transition-colors">
              <FaPhoneAlt />
            </div>
          </a>

          <a
            href="tel:102"
            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur border border-white/20 transition-all flex items-center justify-between group"
          >
            <div>
              <p className="text-[11px] font-bold text-rose-200">Mother & Child</p>
              <h3 className="text-2xl font-black tracking-wider">102</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 group-hover:bg-white text-white group-hover:text-rose-600 flex items-center justify-center text-sm transition-colors">
              <FaPhoneAlt />
            </div>
          </a>

          <a
            href="tel:100"
            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur border border-white/20 transition-all flex items-center justify-between group"
          >
            <div>
              <p className="text-[11px] font-bold text-rose-200">Police Assistance</p>
              <h3 className="text-2xl font-black tracking-wider">100</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 group-hover:bg-white text-white group-hover:text-rose-600 flex items-center justify-center text-sm transition-colors">
              <FaPhoneAlt />
            </div>
          </a>
        </div>
      </div>

      {sosStatus && (
        <Alert
          type="success"
          message={`🚨 ${sosStatus.message} — Emergency hotline: ${sosStatus.ambulance_number}`}
          onClose={() => setSosStatus(null)}
        />
      )}

      {/* 2-COLUMN MAIN CONTENT: 1. First Aid Guides + 2. Nearby Facilities Locator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* LEFT COLUMN (7 Cols): Interactive Step-by-Step First Aid Guides */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-6 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-md space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center text-base shadow-sm">
                  <FaFirstAid />
                </div>
                <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                  Interactive First Aid Action Guides
                </h2>
              </div>

              {/* Language Selector for Audio Guidance */}
              <select
                value={lang}
                onChange={(e) => {
                  setLang(e.target.value);
                  localStorage.setItem('preferred_language', e.target.value);
                }}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 font-bold text-slate-700 dark:text-slate-200 cursor-pointer shadow-xs"
              >
                <option value="te-IN">తెలుగు (Telugu)</option>
                <option value="en-US">English (Voice)</option>
                <option value="hi-IN">हिंदी (Hindi)</option>
                <option value="mr-IN">मराठी (Marathi)</option>
              </select>
            </div>

            {/* Quick Category Buttons for Emergencies */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin">
              {firstAidGuides.map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    setSelectedGuide(g);
                    stopAudio();
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-1.5 transition-all ${
                    selectedGuide?.id === g.id
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <span>{g.icon}</span>
                  <span>{g.title.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* Detailed First Aid Steps Card */}
            {selectedGuide && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between bg-rose-50 dark:bg-rose-950/40 p-4 rounded-2xl border border-rose-200 dark:border-rose-900">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200 rounded-md">
                      {selectedGuide.category} • {selectedGuide.severity}
                    </span>
                    <h3 className="text-lg font-black text-rose-950 dark:text-rose-100 mt-1">
                      {lang.startsWith('te') ? selectedGuide.title_te : lang.startsWith('hi') ? selectedGuide.title_hi : selectedGuide.title}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {!isPlayingAudio ? (
                      <button
                        onClick={() => speakFirstAidGuide(selectedGuide)}
                        className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
                      >
                        <FaVolumeUp /> <span>Listen Steps</span>
                      </button>
                    ) : (
                      <button
                        onClick={stopAudio}
                        className="px-3.5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
                      >
                        <FaStop /> <span>Stop Audio</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Step List */}
                <div className="space-y-2.5">
                  {(lang.startsWith('te') && selectedGuide.steps_te ? selectedGuide.steps_te : lang.startsWith('hi') && selectedGuide.steps_hi ? selectedGuide.steps_hi : selectedGuide.steps).map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-start space-x-3.5"
                    >
                      <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {idx + 1}
                      </span>
                      <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-center space-x-2">
                  <FaExclamationTriangle className="text-amber-600 shrink-0" />
                  <span>Always call <strong>108 Ambulance</strong> first while performing these steps.</span>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN (5 Cols): Nearby 24/7 Healthcare Facilities & Trauma Centers */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-tealSoft-500 text-white flex items-center justify-center text-base shadow-sm">
                  <FaHospital />
                </div>
                <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                  Nearby 24/7 Facilities
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-semibold">Hyderabad Area</span>
            </div>

            {/* Facility Type Filter Tabs */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'hospital', label: 'Hospitals' },
                { id: 'pharmacy', label: 'Pharmacies' },
                { id: 'blood_bank', label: 'Blood Banks' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedFacilityType(t.id)}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
                    selectedFacilityType === t.id
                      ? 'bg-tealSoft-500 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Facility Cards List */}
            <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredFacilities.map((fac) => (
                <div
                  key={fac.id}
                  className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5 hover:border-tealSoft-400 transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm leading-tight">
                        {fac.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-1">
                        <FaMapMarkerAlt className="text-rose-500 shrink-0" />
                        <span className="line-clamp-1">{fac.address}</span>
                      </p>
                    </div>
                    {fac.is_24_hours && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-md shrink-0">
                        24/7 OPEN
                      </span>
                    )}
                  </div>

                  {fac.available_services && (
                    <p className="text-[11px] text-tealSoft-700 dark:text-tealSoft-400 font-medium">
                      ✓ {fac.available_services}
                    </p>
                  )}

                  {/* Actions: Call & Directions */}
                  <div className="flex items-center space-x-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                    <a
                      href={`tel:${fac.emergency_hotline || fac.phone_number}`}
                      className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm transition-all"
                    >
                      <FaPhoneAlt className="text-[10px]" />
                      <span>Call {fac.emergency_hotline || fac.phone_number}</span>
                    </a>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fac.name + ' ' + fac.address)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-1.5 px-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all"
                      title="Open Google Maps Directions"
                    >
                      <FaDirections /> <span>Directions</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default EmergencyAssistance;
