import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import CameraCaptureModal from '../../components/common/CameraCaptureModal';
import api from '../../api/axios';
import {
  FaPills,
  FaCamera,
  FaFileUpload,
  FaSpinner,
  FaVolumeUp,
  FaStop,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaCalendarPlus,
  FaLanguage,
  FaRedo,
  FaEye,
  FaShieldAlt,
  FaInfoCircle,
  FaWhatsapp
} from 'react-icons/fa';
import { sharePillOnWhatsApp } from '../../utils/whatsappHelper';

const PillIdentifier = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Syncing to Reminders state
  const [syncingReminder, setSyncingReminder] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(null);

  // Preferred language
  const [lang, setLang] = useState(() => localStorage.getItem('preferred_language') || 'te');

  // Audio Playback
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioObj, setAudioObj] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      processSelectedImage(selectedFile);
    }
  };

  const processSelectedImage = (selectedFile, previewUrl = null) => {
    setFile(selectedFile);
    setPreview(previewUrl || URL.createObjectURL(selectedFile));
    setResult(null);
    setError(null);
    setSyncSuccess(null);
    stopAudio();
  };

  const stopAudio = () => {
    if (audioObj) {
      audioObj.pause();
      setAudioObj(null);
    }
    window.speechSynthesis?.cancel();
    setIsPlayingAudio(false);
  };

  const handleIdentifyPill = async () => {
    if (!file) return;

    setAnalyzing(true);
    setError(null);
    setSyncSuccess(null);
    stopAudio();

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('lang', lang);

      const res = await api.post('/api/vision-ai/identify-pill/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data && res.data.status === 'success') {
        setResult(res.data);
      } else {
        setError('Unable to identify tablet from this image. Please ensure the tablet imprint or packaging text is clear.');
      }
    } catch (err) {
      console.error('Pill identification error:', err);
      setError(err.response?.data?.error || 'Pill identification service is currently unavailable.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSyncToReminders = async () => {
    if (!result) return;
    setSyncingReminder(true);
    setSyncSuccess(null);

    try {
      const sched = result.reminder_schedule || {};
      const res = await api.post('/api/vision-ai/sync-pill-reminder/', {
        medicine_name: result.name || sched.medicine_name,
        dosage: sched.dosage || '1 tablet',
        frequency: sched.frequency || '1-0-1',
        food_timing: sched.food_timing || 'after_food',
        instructions: result.dosage_timing || `Take ${sched.food_timing || 'after food'}`
      });

      if (res.status === 201 || res.data?.status === 'success') {
        setSyncSuccess(`Successfully added "${result.name}" to your Daily Medication Reminders!`);
      }
    } catch (err) {
      console.error('Sync reminder error:', err);
      setError('Failed to add medicine to your reminder schedule. Please ensure you are signed in.');
    } finally {
      setSyncingReminder(false);
    }
  };

  const handlePlayVoice = async () => {
    if (isPlayingAudio) {
      stopAudio();
      return;
    }

    if (!result) return;

    let scriptToSpeak = '';
    if (lang === 'te' && result.audio_te) scriptToSpeak = result.audio_te;
    else if (lang === 'hi' && result.audio_hi) scriptToSpeak = result.audio_hi;
    else if (lang === 'mr' && result.audio_mr) scriptToSpeak = result.audio_mr;
    else scriptToSpeak = result.audio_en || `${result.name}. ${result.dosage_timing}`;

    setIsPlayingAudio(true);

    try {
      const res = await api.post(
        '/api/documents/speak/',
        { text: scriptToSpeak.slice(0, 500), lang: lang },
        { responseType: 'blob' }
      );

      const blobUrl = URL.createObjectURL(res.data);
      const audio = new Audio(blobUrl);
      setAudioObj(audio);

      audio.onended = () => {
        setIsPlayingAudio(false);
        setAudioObj(null);
        URL.revokeObjectURL(blobUrl);
      };

      audio.onerror = () => {
        fallbackBrowserSpeech(scriptToSpeak);
      };

      await audio.play();
    } catch (err) {
      fallbackBrowserSpeech(scriptToSpeak);
    }
  };

  const fallbackBrowserSpeech = (text) => {
    if (!('speechSynthesis' in window)) {
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langMap = { 'te': 'te-IN', 'hi': 'hi-IN', 'mr': 'mr-IN', 'en': 'en-IN' };
    utterance.lang = langMap[lang] || 'en-IN';
    utterance.rate = 0.95;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      
      {/* 🌟 Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-teal-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-teal-500/20 border border-teal-400/30 px-3 py-1 rounded-full text-teal-300 text-xs font-bold uppercase tracking-wider">
              <FaPills className="text-teal-400" />
              <span>Vision AI Pharmacology Identifier</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Visual Tablet & Pill Scanner
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Snap a photo of any tablet, capsule, or medicine blister strip to identify its name, therapeutic uses, food timings, and add it directly to your daily medication schedule.
            </p>
          </div>

          {/* Regional Language Selector */}
          <div className="bg-slate-800/90 border border-slate-700 p-1.5 rounded-2xl flex items-center space-x-1 shrink-0">
            <FaLanguage className="text-teal-400 text-sm ml-1" />
            {[
              { code: 'te', label: 'తెలుగు' },
              { code: 'hi', label: 'हिंदी' },
              { code: 'mr', label: 'मराठी' },
              { code: 'en', label: 'English' }
            ].map(l => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code);
                  localStorage.setItem('preferred_language', l.code);
                  stopAudio();
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  lang === l.code
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2-Column Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left (5 Cols): Image Picker & Controls */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-5 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase">
                Capture Tablet / Blister Strip
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">Pill / Packaging</span>
            </div>

            {!preview ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-teal-500/20 flex items-center justify-center space-x-2 transition-all active:scale-95"
                >
                  <FaCamera className="text-sm" />
                  <span>Take Live Photo with Camera</span>
                </button>

                <label className="border-2 border-dashed border-teal-200 dark:border-slate-700 hover:border-teal-400 bg-teal-50/30 dark:bg-slate-800/40 rounded-2xl h-[180px] flex flex-col items-center justify-center cursor-pointer transition-all space-y-2 p-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-slate-700 text-teal-600 dark:text-teal-400 flex items-center justify-center text-lg shadow-xs">
                    <FaFileUpload />
                  </div>
                  <div className="text-center space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Browse Tablet Photo</p>
                    <p className="text-[10px] text-slate-400">Supports JPG, PNG, WEBP</p>
                  </div>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative bg-black rounded-2xl overflow-hidden aspect-[4/3] flex items-center justify-center border border-slate-700 shadow-md">
                  <img
                    src={preview}
                    alt="Pill Photo"
                    className="w-full h-full object-contain"
                  />
                  <a
                    href={preview}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-xl backdrop-blur transition-all"
                  >
                    <FaEye className="text-xs" />
                  </a>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={FaRedo}
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                      setResult(null);
                      setSyncSuccess(null);
                      stopAudio();
                    }}
                    className="w-1/2 text-xs"
                  >
                    Change Photo
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    icon={analyzing ? FaSpinner : FaPills}
                    disabled={analyzing}
                    onClick={handleIdentifyPill}
                    className="w-1/2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
                  >
                    {analyzing ? 'Scanning...' : 'Identify Pill AI'}
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <Alert type="error" message={error} className="text-xs" />
            )}
            {syncSuccess && (
              <Alert type="success" message={syncSuccess} className="text-xs" />
            )}

            <div className="p-3 bg-teal-50/60 dark:bg-slate-900/60 border border-teal-200/80 dark:border-slate-800 rounded-xl text-[11px] text-teal-900 dark:text-teal-300 space-y-1">
              <span className="font-extrabold flex items-center space-x-1">
                <FaShieldAlt /> <span>Medication Safety Note</span>
              </span>
              <p className="leading-tight">
                Always confirm tablet identities with your physician or pharmacist before taking unfamiliar medications.
              </p>
            </div>
          </Card>
        </div>

        {/* Right (7 Cols): Clinical Pharmacology Breakdown */}
        <div className="lg:col-span-7 space-y-4">
          {result ? (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Card 1: Medicine Identity & Audio Player */}
              <Card className="p-5 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-md space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-700">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                        {result.category || 'Therapeutic Medication'}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        Form: {result.form || 'Tablet'}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                      {result.name}
                    </h3>
                    <p className="text-xs font-bold text-teal-600 dark:text-teal-400">
                      Active Generic: {result.generic}
                    </p>
                  </div>

                  {/* Audio Read-Aloud */}
                  <button
                    type="button"
                    onClick={handlePlayVoice}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs ${
                      isPlayingAudio
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-teal-50 dark:bg-slate-800 text-teal-700 dark:text-teal-300 hover:bg-teal-100 border border-teal-200 dark:border-slate-700'
                    }`}
                  >
                    {isPlayingAudio ? <FaStop /> : <FaVolumeUp />}
                    <span>{isPlayingAudio ? 'Stop Audio' : `Listen (${lang.toUpperCase()})`}</span>
                  </button>
                </div>

                {/* 1-Click Add to Reminders Action Bar */}
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <FaClock className="text-emerald-600 text-sm" />
                    <div>
                      <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200 block">
                        Schedule in Daily Reminders
                      </span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                        Suggested: {result.reminder_schedule?.frequency || '1-0-1'} ({result.reminder_schedule?.food_timing?.replace('_', ' ') || 'after food'})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => sharePillOnWhatsApp(result)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      <FaWhatsapp className="text-sm" />
                      <span>WhatsApp</span>
                    </button>

                    <Button
                      variant="primary"
                      size="sm"
                      icon={syncingReminder ? FaSpinner : FaCalendarPlus}
                      disabled={syncingReminder || Boolean(syncSuccess)}
                      onClick={handleSyncToReminders}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0"
                    >
                      {syncSuccess ? '✓ Added' : syncingReminder ? 'Saving...' : 'Add to Reminders'}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Card 2: Uses & Dosage Timings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 🎯 Clinical Uses */}
                <Card className="p-4 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-2">
                  <div className="flex items-center space-x-1.5 text-xs font-extrabold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <FaCheckCircle className="text-teal-500" />
                    <span>Primary Clinical Uses</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {result.uses?.map((use, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-teal-500 font-bold">•</span>
                        <span className="leading-snug">{use}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* ⏰ Dosage & Food Timings */}
                <Card className="p-4 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-2">
                  <div className="flex items-center space-x-1.5 text-xs font-extrabold text-amber-700 dark:text-amber-400 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <FaClock className="text-amber-500" />
                    <span>Dosage & Food Timing Rules</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {result.dosage_timing}
                  </p>
                </Card>

              </div>

              {/* Card 3: Safety Precautions & Warnings */}
              <Card className="p-5 bg-amber-50/60 dark:bg-slate-900/60 border border-amber-200 dark:border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-extrabold text-amber-800 dark:text-amber-300">
                  <FaExclamationTriangle className="text-amber-600" />
                  <span>Important Warnings & Precautions</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {result.precautions?.map((pre, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <FaInfoCircle className="text-amber-500 text-[11px] shrink-0 mt-0.5" />
                      <span className="leading-snug font-medium">{pre}</span>
                    </li>
                  ))}
                </ul>
              </Card>

            </div>
          ) : (
            <Card className="p-10 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-sm text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-slate-800 text-teal-500 flex items-center justify-center text-2xl mx-auto shadow-xs">
                <FaPills />
              </div>
              <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                No Tablet Analyzed Yet
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Take a clear close-up photo of any loose tablet, capsule, or blister packaging strip to identify its clinical uses, food rules, and add it to your reminders.
              </p>
            </Card>
          )}
        </div>

      </div>

      {/* 📷 Live Camera Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(capturedFile, previewUrl) => processSelectedImage(capturedFile, previewUrl)}
        title="Snap Clear Photo of Tablet or Blister Strip"
      />

    </div>
  );
};

export default PillIdentifier;
