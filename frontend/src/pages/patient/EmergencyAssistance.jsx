import React, { useState, useEffect, useRef } from 'react';
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
  FaSyncAlt,
  FaLocationArrow,
  FaSpinner
} from 'react-icons/fa';

const EmergencyAssistance = () => {
  // First Aid Guides State
  const [firstAidGuides, setFirstAidGuides] = useState([]);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [sosStatus, setSosStatus] = useState(null);

  // Live Location & Facilities State (Strictly real data, no mocks)
  const [userCoords, setUserCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState('requesting'); // 'requesting', 'granted', 'denied', 'unsupported', 'error'
  const [locationError, setLocationError] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);
  const [facilitiesError, setFacilitiesError] = useState(null);
  const [selectedFacilityType, setSelectedFacilityType] = useState('all');
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Preferred Language for First Aid Speech
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('preferred_language') || 'te-IN';
  });

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // 1. Fetch First-Aid Guides
  useEffect(() => {
    const fetchFirstAidGuides = async () => {
      try {
        const res = await api.get('/api/emergency/facilities/first-aid/');
        const list = res.data.guides || res.data;
        if (Array.isArray(list) && list.length > 0) {
          setFirstAidGuides(list);
          setSelectedGuide(list[0]);
        }
      } catch (err) {
        console.error('Error loading first-aid guides:', err);
      }
    };
    fetchFirstAidGuides();
  }, []);

  // 2. Real-Time Geolocation Tracking (watchPosition)
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('unsupported');
      setLocationError('Geolocation is not supported by your browser.');
      setFacilitiesLoading(false);
      return;
    }

    setLocationStatus('requesting');

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
        setUserCoords(coords);
        setLocationStatus('granted');
        setLocationError(null);
      },
      (err) => {
        console.warn('Geolocation access error:', err);
        if (err.code === 1) {
          setLocationStatus('denied');
          setLocationError('Location permission denied. Please allow location access in your browser to discover real-time nearby hospitals and pharmacies.');
        } else {
          setLocationStatus('error');
          setLocationError(err.message || 'Unable to detect your device coordinates.');
        }
        setFacilitiesLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // 3. Fetch Real Live Facilities & Auto-Refresh every 10 Seconds
  useEffect(() => {
    if (!userCoords?.lat || !userCoords?.lng) return;

    let isMounted = true;

    const fetchLiveNearby = async (isBackground = false) => {
      if (!isBackground) setFacilitiesLoading(true);
      try {
        const res = await api.get('/api/emergency/facilities/live-nearby/', {
          params: {
            lat: userCoords.lat,
            lng: userCoords.lng,
            type: selectedFacilityType,
          }
        });
        if (isMounted) {
          setFacilities(res.data.facilities || []);
          setFacilitiesError(null);
          setLastRefreshedAt(new Date());
          setRefreshCounter((c) => c + 1);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to fetch live nearby facilities:', err);
          setFacilitiesError('Unable to connect to live facilities service. Please check your internet connection.');
        }
      } finally {
        if (isMounted && !isBackground) {
          setFacilitiesLoading(false);
        }
      }
    };

    // Immediate fetch
    fetchLiveNearby(false);

    // 10-second auto-refresh polling interval
    const intervalId = setInterval(() => {
      fetchLiveNearby(true);
    }, 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [userCoords?.lat, userCoords?.lng, selectedFacilityType]);

  const handleManualRefresh = async () => {
    if (!userCoords?.lat || !userCoords?.lng) return;
    setFacilitiesLoading(true);
    try {
      const res = await api.get('/api/emergency/facilities/live-nearby/', {
        params: {
          lat: userCoords.lat,
          lng: userCoords.lng,
          type: selectedFacilityType,
        }
      });
      setFacilities(res.data.facilities || []);
      setFacilitiesError(null);
      setLastRefreshedAt(new Date());
      setRefreshCounter((c) => c + 1);
    } catch (err) {
      setFacilitiesError('Refresh failed. Please check network connection.');
    } finally {
      setFacilitiesLoading(false);
    }
  };

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

  return (
    <div className="space-y-6 pb-12">
      {/* 🔴 RED EMERGENCY SOS SPEED DIAL BANNER */}
      <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider">
              <FaAmbulance className="text-sm animate-pulse" />
              <span>24/7 Emergency Medical Response</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Emergency Information Assistance
            </h1>
            <p className="text-xs sm:text-sm text-rose-100 font-medium leading-relaxed">
              Instant 1-tap emergency dispatch, interactive step-by-step first aid guidance, and live 24/7 hospitals and pharmacies verified from your device location.
            </p>
          </div>

          {/* Speed Dial Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full md:w-auto shrink-0">
            {/* 108 Ambulance */}
            <a
              href="tel:108"
              onClick={handleTriggerSOS}
              className="p-3.5 bg-white text-rose-700 hover:bg-rose-50 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg transition-all transform hover:scale-105 active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-1.5 shadow-inner">
                <FaAmbulance className="text-lg" />
              </div>
              <span className="text-xs font-black uppercase">108 Ambulance</span>
              <span className="text-[10px] text-rose-500 font-bold">Free Emergency</span>
            </a>

            {/* 112 National SOS */}
            <a
              href="tel:112"
              onClick={handleTriggerSOS}
              className="p-3.5 bg-white text-rose-700 hover:bg-rose-50 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg transition-all transform hover:scale-105 active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-1.5 shadow-inner">
                <FaPhoneAlt className="text-base" />
              </div>
              <span className="text-xs font-black uppercase">112 SOS All-in-1</span>
              <span className="text-[10px] text-rose-500 font-bold">National Helpline</span>
            </a>

            {/* 104 Health Helpline */}
            <a
              href="tel:104"
              className="p-3.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-2xl flex flex-col items-center justify-center text-center backdrop-blur-sm transition-all col-span-2 sm:col-span-1"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-1.5">
                <FaUserNurse className="text-base" />
              </div>
              <span className="text-xs font-black uppercase">104 Medical</span>
              <span className="text-[10px] text-rose-200 font-medium">Doctor on Call</span>
            </a>
          </div>
        </div>
      </div>

      {/* SOS Telemetry Confirmation Banner */}
      {sosStatus && (
        <Alert
          type="success"
          message={`🚨 ${sosStatus.message} — Emergency hotline: ${sosStatus.ambulance_number}`}
        />
      )}

      {/* TWO COLUMN GRID: Left = First Aid, Right = Live 24/7 Facilities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (7 Cols): Clinical Step-by-Step First Aid Procedures */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-6 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center text-base shadow-sm">
                  <FaFirstAid />
                </div>
                <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                  Interactive First Aid Guides
                </h2>
              </div>

              {/* Language Selector */}
              <div className="flex items-center space-x-1 text-xs">
                {['te-IN', 'hi-IN', 'en-IN'].map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      lang === l
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {l === 'te-IN' ? 'తెలుగు' : l === 'hi-IN' ? 'हिंदी' : 'English'}
                  </button>
                ))}
              </div>
            </div>

            {/* Emergency Scenario Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {firstAidGuides.map((guide) => (
                <button
                  key={guide.id}
                  onClick={() => setSelectedGuide(guide)}
                  className={`py-2 px-3.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center space-x-1.5 shadow-xs ${
                    selectedGuide?.id === guide.id
                      ? 'bg-rose-600 text-white shadow-rose-600/30'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{guide.icon || '🩺'}</span>
                  <span>{lang.startsWith('te') ? (guide.title_te || guide.title) : lang.startsWith('hi') ? (guide.title_hi || guide.title) : guide.title}</span>
                </button>
              ))}
            </div>

            {/* Selected Guide Detail View */}
            {selectedGuide && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                      <span>{selectedGuide.icon || '🩺'}</span>
                      <span>{lang.startsWith('te') ? (selectedGuide.title_te || selectedGuide.title) : lang.startsWith('hi') ? (selectedGuide.title_hi || selectedGuide.title) : selectedGuide.title}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {lang.startsWith('te') ? (selectedGuide.subtitle_te || selectedGuide.subtitle) : lang.startsWith('hi') ? (selectedGuide.subtitle_hi || selectedGuide.subtitle) : selectedGuide.subtitle}
                    </p>
                  </div>

                  {/* Audio Read-Aloud Action */}
                  <button
                    type="button"
                    onClick={() => isPlayingAudio ? stopAudio() : speakFirstAidGuide(selectedGuide)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm ${
                      isPlayingAudio
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200'
                    }`}
                  >
                    {isPlayingAudio ? <FaStop /> : <FaVolumeUp />}
                    <span>{isPlayingAudio ? 'Stop Audio' : 'Voice Steps'}</span>
                  </button>
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
                  <span>Always call <strong>108 Ambulance</strong> first while performing these emergency steps.</span>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN (5 Cols): Live Real-Time Nearby Facilities based on Device Location */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-md space-y-4">
            {/* Header with Live Telemetry Status */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-700 gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-tealSoft-500 text-white flex items-center justify-center text-base shadow-sm">
                  <FaHospital />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span>Nearby 24/7 Facilities</span>
                    {locationStatus === 'granted' && (
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    )}
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {locationStatus === 'granted' && userCoords
                      ? `GPS: ${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}`
                      : 'Live Device Location'}
                  </p>
                </div>
              </div>

              {/* Refresh Status & Manual Action */}
              <div className="flex items-center space-x-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={facilitiesLoading || locationStatus !== 'granted'}
                  className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold transition-all"
                  title="Manual Refresh"
                >
                  <FaSyncAlt className={facilitiesLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Live Auto-Refresh Telemetry Tag */}
            {locationStatus === 'granted' && (
              <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
                <span className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Live GPS Tracking Active</span>
                </span>
                <span className="text-[10px] opacity-80">
                  {lastRefreshedAt ? `Refreshed ${lastRefreshedAt.toLocaleTimeString()}` : 'Polling every 10s'}
                </span>
              </div>
            )}

            {/* Facility Type Filter Tabs */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'hospital', label: 'Hospitals' },
                { id: 'pharmacy', label: 'Pharmacies' },
                { id: 'blood_bank', label: 'Blood Banks' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedFacilityType(t.id)}
                  className={`py-1.5 px-1.5 rounded-xl text-[11px] font-bold transition-all text-center ${
                    selectedFacilityType === t.id
                      ? 'bg-tealSoft-500 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* LOCATION PERMISSION DENIED OR UNSUPPORTED STATE */}
            {locationStatus === 'denied' && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-2 text-center">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center mx-auto text-base">
                  <FaLocationArrow />
                </div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Location Permission Required
                </h4>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  Please enable location permissions in your browser to discover real-time hospitals, pharmacies, and blood banks near your actual coordinates.
                </p>
              </div>
            )}

            {locationStatus === 'unsupported' && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-center space-y-1.5">
                <p className="text-xs font-bold text-rose-800 dark:text-rose-300">
                  Geolocation Not Supported
                </p>
                <p className="text-[11px] text-rose-700 dark:text-rose-400">
                  Your device or browser does not provide geolocation support.
                </p>
              </div>
            )}

            {/* LOADING STATE ON INITIAL FETCH */}
            {facilitiesLoading && facilities.length === 0 && locationStatus === 'granted' && (
              <div className="py-12 flex flex-col items-center justify-center space-y-2.5 text-slate-400">
                <FaSpinner className="animate-spin text-2xl text-tealSoft-500" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Querying live healthcare places from GPS...
                </p>
                <p className="text-[10px] text-slate-400">
                  Locating verified hospitals, pharmacies & blood banks
                </p>
              </div>
            )}

            {/* ERROR STATE */}
            {facilitiesError && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between">
                <span>{facilitiesError}</span>
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  className="font-bold underline text-[11px] ml-2"
                >
                  Retry
                </button>
              </div>
            )}

            {/* EMPTY STATE */}
            {!facilitiesLoading && facilities.length === 0 && locationStatus === 'granted' && (
              <div className="py-10 text-center space-y-2 text-slate-400">
                <FaHospital className="text-3xl mx-auto opacity-40" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  No {selectedFacilityType === 'all' ? 'facilities' : selectedFacilityType} found within 10 km
                </p>
                <p className="text-[11px]">
                  Call <strong>108 Ambulance</strong> for emergency dispatch anywhere in India.
                </p>
              </div>
            )}

            {/* LIVE FACILITY CARDS LIST */}
            {facilities.length > 0 && (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {facilities.map((fac) => (
                  <div
                    key={fac.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2 hover:border-tealSoft-400 transition-all shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            fac.facility_type === 'hospital'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                              : fac.facility_type === 'pharmacy'
                              ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300'
                          }`}>
                            {fac.facility_type === 'hospital' ? 'Hospital' : fac.facility_type === 'pharmacy' ? 'Pharmacy' : 'Blood Bank'}
                          </span>
                          <span className="text-[11px] font-extrabold text-tealSoft-600 dark:text-tealSoft-400">
                            {fac.distance_km} km away
                          </span>
                        </div>

                        <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-snug pt-0.5">
                          {fac.name}
                        </h4>
                        
                        <p className="text-[11px] text-slate-500 flex items-center space-x-1">
                          <FaMapMarkerAlt className="text-rose-500 shrink-0 text-[10px]" />
                          <span className="line-clamp-1">{fac.address}</span>
                        </p>
                      </div>

                      {fac.is_24_hours ? (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-md shrink-0 whitespace-nowrap">
                          24/7 OPEN
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md shrink-0 whitespace-nowrap">
                          Standard
                        </span>
                      )}
                    </div>

                    {fac.available_services && (
                      <p className="text-[10px] text-tealSoft-700 dark:text-tealSoft-400 font-medium">
                        ✓ {fac.available_services}
                      </p>
                    )}

                    {/* Action Buttons: Phone & Live Maps Directions */}
                    <div className="flex items-center space-x-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                      <a
                        href={`tel:${fac.emergency_hotline || fac.phone_number}`}
                        className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-xs transition-all"
                      >
                        <FaPhoneAlt className="text-[10px]" />
                        <span>Call {fac.emergency_hotline || fac.phone_number}</span>
                      </a>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${fac.latitude},${fac.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1.5 px-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all"
                        title="Get Live Directions"
                      >
                        <FaDirections /> <span>Directions</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
};

export default EmergencyAssistance;
