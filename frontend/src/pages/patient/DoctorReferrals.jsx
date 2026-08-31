import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import api from '../../api/axios';
import {
  FaUserMd,
  FaSearch,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaDirections,
  FaCheckCircle,
  FaShieldAlt,
  FaBuilding,
  FaGraduationCap,
  FaClock,
  FaStethoscope,
  FaFilter,
  FaLocationArrow,
  FaWhatsapp,
  FaFileMedical,
  FaExclamationTriangle,
  FaSpinner,
  FaPlus,
  FaTimes,
  FaBalanceScale,
  FaAward
} from 'react-icons/fa';

const DoctorReferrals = () => {
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'my_referrals'
  const [providers, setProviders] = useState([]);
  const [referrals, setReferrals] = useState([]);
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  
  // Geolocation & Loading state
  const [userCoords, setUserCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle'); // 'idle' | 'requesting' | 'granted' | 'denied'
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modal State for Patient Paper Referral Entry
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [referralForm, setReferralForm] = useState({
    referring_doctor_name: '',
    referring_facility: '',
    specialty: 'Cardiology',
    suggested_doctor_name: '',
    reason: '',
    notes: ''
  });

  const specialties = [
    { id: 'all', label: 'All Specialties' },
    { id: 'Cardiology', label: 'Cardiology' },
    { id: 'Neurology', label: 'Neurology' },
    { id: 'Nephrology', label: 'Nephrology' },
    { id: 'Oncology', label: 'Oncology' },
    { id: 'Orthopedics', label: 'Orthopedics' },
    { id: 'Gastroenterology', label: 'Gastroenterology' },
    { id: 'Pulmonology', label: 'Pulmonology' },
    { id: 'General Medicine', label: 'General Medicine' },
  ];

  // Acquire Geolocation
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }
    setLocationStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
        setLocationStatus('granted');
      },
      (err) => {
        console.warn('Geolocation denied or timed out:', err);
        setLocationStatus('denied');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Fetch Providers from API
  const fetchProviders = useCallback(async () => {
    setLoadingProviders(true);
    setErrorMsg(null);
    try {
      const params = {};
      if (searchQuery.trim()) params.q = searchQuery;
      if (selectedSpecialty !== 'all') params.specialization = selectedSpecialty;
      if (selectedCity !== 'all') params.city = selectedCity;
      if (availabilityFilter !== 'all') params.availability = availabilityFilter;
      if (userCoords?.latitude && userCoords?.longitude) {
        params.latitude = userCoords.latitude;
        params.longitude = userCoords.longitude;
      }

      const res = await api.get('/api/referrals/providers/', { params });
      const list = res.data.results || (Array.isArray(res.data) ? res.data : []);
      setProviders(list);
    } catch (err) {
      console.error('Error fetching healthcare providers:', err);
      setErrorMsg('Failed to load healthcare provider directory.');
    } finally {
      setLoadingProviders(false);
    }
  }, [searchQuery, selectedSpecialty, selectedCity, availabilityFilter, userCoords]);

  // Fetch Patient Referrals
  const fetchReferrals = useCallback(async () => {
    setLoadingReferrals(true);
    try {
      const res = await api.get('/api/referrals/referrals/');
      const list = res.data.results || (Array.isArray(res.data) ? res.data : []);
      setReferrals(list);
    } catch (err) {
      console.error('Error fetching patient referrals:', err);
    } finally {
      setLoadingReferrals(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  useEffect(() => {
    if (activeTab === 'my_referrals') {
      fetchReferrals();
    }
  }, [activeTab, fetchReferrals]);

  // Handle Add Paper Referral Submit
  const handleCreateReferral = async (e) => {
    e.preventDefault();
    if (!referralForm.referring_doctor_name || !referralForm.reason) {
      setErrorMsg('Please enter the rural doctor name and clinical reason.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await api.post('/api/referrals/referrals/', referralForm);
      setSuccessMsg('Paper referral logged successfully! Independent verified second opinions loaded.');
      setShowAddModal(false);
      setReferralForm({
        referring_doctor_name: '',
        referring_facility: '',
        specialty: 'Cardiology',
        suggested_doctor_name: '',
        reason: '',
        notes: ''
      });
      setActiveTab('my_referrals');
      fetchReferrals();
    } catch (err) {
      console.error('Error creating referral:', err);
      setErrorMsg('Failed to log paper referral. Please verify login status.');
    } finally {
      setSubmitting(false);
    }
  };

  // Google Maps Directions Link Generator
  const getDirectionsUrl = (provider) => {
    if (!provider) return '#';
    const dest = (provider.latitude && provider.longitude)
      ? `${provider.latitude},${provider.longitude}`
      : encodeURIComponent(`${provider.hospital_name} ${provider.address} ${provider.city}`);

    if (userCoords?.latitude && userCoords?.longitude) {
      return `https://www.google.com/maps/dir/?api=1&origin=${userCoords.latitude},${userCoords.longitude}&destination=${dest}&travelmode=driving`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
  };

  // Share Doctor via WhatsApp
  const handleShareWhatsAppDoctor = (doc) => {
    let text = `🩺 *SEVAHEALTH VERIFIED DOCTOR PROFILE*\n\n`;
    text += `*Dr. ${doc.name}*\n`;
    text += `🔬 Specialty: ${doc.specialization}\n`;
    text += `🎓 Qualification: ${doc.qualification} (${doc.experience_years} Yrs Exp)\n`;
    text += `🏥 Hospital: ${doc.hospital_name}, ${doc.city}\n`;
    text += `📍 Address: ${doc.address}\n`;
    text += `📞 Contact Helpline: ${doc.phone_number}\n`;
    text += `✓ Status: Verified in SevaHealth Provider Directory\n`;
    text += `🗺️ Google Maps Directions: ${getDirectionsUrl(doc)}\n\n`;
    text += `📱 _Shared via SevaHealth Healthcare Assistant_`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 🩺 TOP WORKSPACE HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-teal-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold tracking-wider uppercase backdrop-blur-sm">
              <FaShieldAlt className="text-teal-400" />
              <span>Verified Rural-to-Urban Specialist Network</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center space-x-3">
              <FaUserMd className="text-teal-400" />
              <span>Trusted Doctor Referrals & Discovery</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Find verified urban specialists and log paper referrals from local clinics to get independent, verified second opinions.
            </p>
          </div>

          {/* Action Buttons: GPS + Add Referral */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-2xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg flex items-center space-x-2 border border-emerald-400/40 transition-all"
            >
              <FaPlus />
              <span>+ Log Paper Referral & Get Second Opinion</span>
            </button>

            <button
              onClick={requestLocation}
              disabled={locationStatus === 'requesting'}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center space-x-2 transition-all shadow-md ${
                locationStatus === 'granted'
                  ? 'bg-emerald-500 text-white border border-emerald-400'
                  : 'bg-teal-600 hover:bg-teal-500 text-white border border-teal-400'
              }`}
            >
              <FaLocationArrow className={locationStatus === 'requesting' ? 'animate-spin' : ''} />
              <span>{locationStatus === 'granted' ? '📍 GPS Active' : locationStatus === 'requesting' ? 'Locating...' : 'Sort by Distance'}</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-3 pt-6 mt-4 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'directory'
                ? 'bg-teal-500 text-slate-900 shadow-lg font-black'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FaStethoscope />
            <span>Verified Doctor Directory ({providers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('my_referrals')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'my_referrals'
                ? 'bg-teal-500 text-slate-900 shadow-lg font-black'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FaFileMedical />
            <span>My Doctor Referrals & Second Opinions ({referrals.length})</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <Alert type="error" message={errorMsg} onClose={() => setErrorMsg(null)} />
      )}
      {successMsg && (
        <Alert type="success" message={successMsg} onClose={() => setSuccessMsg(null)} />
      )}

      {/* ======================================================== */}
      {/* TAB 1: VERIFIED DOCTOR DIRECTORY                        */}
      {/* ======================================================== */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          {/* SEARCH & FILTERS BAR */}
          <Card className="p-5 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-md space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* Query Search Input */}
              <div className="sm:col-span-6 relative">
                <FaSearch className="absolute left-3.5 top-3 text-slate-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search Doctor name, Specialty, Hospital (e.g. Apollo, Cardiology)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-teal-500"
                />
              </div>

              {/* City Filter */}
              <div className="sm:col-span-3">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer outline-none"
                >
                  <option value="all">All Cities</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Warangal">Warangal</option>
                  <option value="Karimnagar">Karimnagar</option>
                  <option value="Nalgonda">Nalgonda</option>
                </select>
              </div>

              {/* Availability Filter */}
              <div className="sm:col-span-3">
                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer outline-none"
                >
                  <option value="all">All Availability</option>
                  <option value="available">Available Today</option>
                  <option value="limited">Limited Slots</option>
                </select>
              </div>
            </div>

            {/* Specialty Pills Filter */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin">
              <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center space-x-1">
                <FaFilter className="text-[10px]" /> <span>Specialties:</span>
              </span>
              {specialties.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSpecialty(s.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedSpecialty === s.id
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Card>

          {/* DOCTOR CARDS GRID */}
          {loadingProviders ? (
            <div className="p-12 text-center space-y-3 bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-700">
              <FaSpinner className="animate-spin text-teal-600 text-3xl mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Loading verified doctors...</p>
            </div>
          ) : providers.length === 0 ? (
            <div className="p-12 text-center space-y-3 bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-700">
              <FaUserMd className="text-slate-300 text-4xl mx-auto" />
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">No verified providers found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No doctors matched your criteria. Try resetting your search filters or selecting "All Specialties".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {providers.map((doc) => (
                <Card
                  key={doc.id}
                  className="p-6 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-md space-y-4 hover:border-teal-400 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header: Name + Verification Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                            {doc.name.startsWith('Dr.') ? doc.name : `Dr. ${doc.name}`}
                          </h3>
                        </div>
                        <p className="text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center space-x-1.5 mt-0.5">
                          <FaStethoscope className="text-[11px]" />
                          <span>{doc.specialization}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500 font-semibold">{doc.experience_years} Years Exp.</span>
                        </p>
                      </div>

                      {/* Verification Badge */}
                      <span className="inline-flex items-center space-x-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shrink-0 shadow-xs">
                        <FaCheckCircle className="text-teal-500 text-[10px]" />
                        <span>Verified Directory</span>
                      </span>
                    </div>

                    {/* Qualifications & Hospital */}
                    <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                      <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                        <FaGraduationCap className="text-teal-500 shrink-0" />
                        <span className="font-semibold">{doc.qualification}</span>
                      </div>
                      <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-slate-100">
                        <FaBuilding className="text-teal-500 shrink-0" />
                        <span className="line-clamp-1">{doc.hospital_name}</span>
                      </div>
                      <div className="flex items-start space-x-2 text-slate-500">
                        <FaMapMarkerAlt className="text-rose-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{doc.address}, {doc.city}</span>
                      </div>
                    </div>

                    {doc.profile_description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                        {doc.profile_description}
                      </p>
                    )}

                    {/* Badges: Availability & Distance */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="inline-flex items-center space-x-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900 text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>{doc.availability_status === 'available' ? 'Available Today' : 'Limited Slots'}</span>
                      </span>

                      {doc.distance_formatted && (
                        <span className="font-extrabold text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-950 px-2.5 py-1 rounded-lg text-[11px]">
                          📍 {doc.distance_formatted}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions: Directions + WhatsApp + Call */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <a
                      href={getDirectionsUrl(doc)}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 px-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-[11px] rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1"
                    >
                      <FaDirections />
                      <span>Directions</span>
                    </a>

                    <button
                      onClick={() => handleShareWhatsAppDoctor(doc)}
                      className="py-2 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1"
                    >
                      <FaWhatsapp className="text-xs" />
                      <span>WhatsApp</span>
                    </button>

                    <a
                      href={`tel:${doc.phone_number}`}
                      className="py-2 px-2 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-[11px] rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1"
                    >
                      <FaPhoneAlt className="text-[10px]" />
                      <span>Call</span>
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MY DOCTOR REFERRALS & SECOND OPINIONS            */}
      {/* ======================================================== */}
      {activeTab === 'my_referrals' && (
        <div className="space-y-6">
          {loadingReferrals ? (
            <div className="p-12 text-center space-y-3 bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-700">
              <FaSpinner className="animate-spin text-teal-600 text-3xl mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Loading doctor referrals & second opinions...</p>
            </div>
          ) : referrals.length === 0 ? (
            <div className="p-12 text-center space-y-4 bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-700">
              <FaFileMedical className="text-slate-300 text-5xl mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">No active referrals logged yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Log a paper referral given by your local clinic to verify the suggested urban doctor and view independent top-ranked specialists.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-2xl shadow-md transition-all inline-flex items-center space-x-2"
              >
                <FaPlus />
                <span>Log My Paper Referral</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {referrals.map((ref) => (
                <Card
                  key={ref.id}
                  className="p-6 bg-white dark:bg-[#1E293B] border-l-4 border-teal-500 rounded-3xl shadow-md border border-slate-200/80 dark:border-slate-700 space-y-5"
                >
                  {/* Referral Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 rounded-md">
                          {ref.specialty} Referral
                        </span>
                        {ref.suggested_doctor_name && (
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-md flex items-center space-x-1">
                            <FaExclamationTriangle className="text-[9px]" />
                            <span>Suggested: {ref.suggested_doctor_name}</span>
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-1">
                        Referred by {ref.referring_doctor_name.startsWith('Dr.') ? ref.referring_doctor_name : `Dr. ${ref.referring_doctor_name}`}
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold">{ref.referring_facility || 'Local Clinic / PHC'}</p>
                    </div>

                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 self-start sm:self-auto">
                      ✓ {ref.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Reason & Clinical Notes */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      <strong className="text-teal-600">Clinical Reason:</strong> {ref.reason}
                    </p>
                    {ref.notes && (
                      <p className="text-slate-600 dark:text-slate-400">
                        <strong className="text-slate-500">Doctor Notes:</strong> {ref.notes}
                      </p>
                    )}
                  </div>

                  {/* 🛡️ INDEPENDENT SECOND OPINIONS / VERIFIED SPECIALISTS MATCH */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-slate-900 dark:text-slate-100">
                        <FaBalanceScale className="text-teal-500 text-sm" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                          Independent Verified Second Opinions ({ref.verified_alternatives?.length || 0})
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">
                        Verified Credentials • No Hidden Commissions
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {ref.verified_alternatives?.map((doc, idx) => (
                        <div
                          key={doc.id}
                          className="p-4 bg-gradient-to-b from-slate-50 to-teal-50/30 dark:from-[#172033] dark:to-[#1E293B] border border-teal-200/70 dark:border-slate-700 rounded-2xl space-y-2.5 flex flex-col justify-between"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-teal-600 text-white">
                                #{idx + 1} Best Match
                              </span>
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                ✓ Verified
                              </span>
                            </div>
                            <h5 className="text-xs font-black text-slate-900 dark:text-slate-100">
                              {doc.name.startsWith('Dr.') ? doc.name : `Dr. ${doc.name}`}
                            </h5>
                            <p className="text-[11px] font-bold text-teal-600 dark:text-teal-400">
                              {doc.qualification}
                            </p>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold line-clamp-1">
                              🏥 {doc.hospital_name}, {doc.city}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              ⭐ {doc.experience_years} Years Experience
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700">
                            <a
                              href={getDirectionsUrl(doc)}
                              target="_blank"
                              rel="noreferrer"
                              className="py-1.5 px-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-[10px] rounded-lg text-center transition-all flex items-center justify-center space-x-1"
                            >
                              <FaDirections />
                              <span>Map</span>
                            </a>
                            <button
                              onClick={() => handleShareWhatsAppDoctor(doc)}
                              className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg text-center transition-all flex items-center justify-center space-x-1"
                            >
                              <FaWhatsapp />
                              <span>Share</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: LOG PAPER REFERRAL & GET SECOND OPINION           */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                  <FaFileMedical />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Log Paper Referral</h3>
                  <p className="text-[11px] text-slate-500">Get independent, verified second opinion recommendations</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleCreateReferral} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Rural / Local Doctor Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Ramesh Kumar (Local Clinic / PHC)"
                  value={referralForm.referring_doctor_name}
                  onChange={(e) => setReferralForm({ ...referralForm, referring_doctor_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Local Clinic / Health Center Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nalgonda Primary Health Center"
                  value={referralForm.referring_facility}
                  onChange={(e) => setReferralForm({ ...referralForm, referring_facility: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Specialty Required <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={referralForm.specialty}
                    onChange={(e) => setReferralForm({ ...referralForm, specialty: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500 font-semibold"
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Nephrology">Nephrology</option>
                    <option value="Oncology">Oncology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Gastroenterology">Gastroenterology</option>
                    <option value="Pulmonology">Pulmonology</option>
                    <option value="General Medicine">General Medicine</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Suggested Urban Doctor (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Doctor suggested by rural clinic"
                    value={referralForm.suggested_doctor_name}
                    onChange={(e) => setReferralForm({ ...referralForm, suggested_doctor_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Reason for Referral / Symptoms <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Severe chest pain, abnormal ECG, suspected arrhythmia"
                  value={referralForm.reason}
                  onChange={(e) => setReferralForm({ ...referralForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500 font-semibold"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl shadow-md flex items-center space-x-2"
                >
                  {submitting && <FaSpinner className="animate-spin text-xs" />}
                  <span>Save & Get Second Opinions</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorReferrals;
