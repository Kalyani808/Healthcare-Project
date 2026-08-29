import React, { useState, useEffect, useRef } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import CameraCaptureModal from '../../components/common/CameraCaptureModal';
import api from '../../api/axios';
import { parseDosagePattern } from '../../utils/dosageFormatter';
import {
  getLocalizedUiString,
  getLocalizedMedicinePurpose,
  getLocalizedSideEffects,
  getLocalizedScheduleSummary,
  getLocalizedRuralGuidance,
  getLocalizedSlotPillLabels,
  normalizeLangKey
} from '../../utils/prescriptionLocalization';
import {
  FaFileUpload,
  FaCloudUploadAlt,
  FaRobot,
  FaTimes,
  FaInfoCircle,
  FaVolumeUp,
  FaPlay,
  FaPause,
  FaStop,
  FaChevronDown,
  FaChevronUp,
  FaEye,
  FaSun,
  FaMoon,
  FaPills,
  FaTable,
  FaHeadphones,
  FaClock,
  FaCheckCircle,
  FaFileMedical,
  FaVial,
  FaHeartbeat,
  FaExclamationTriangle,
  FaNotesMedical,
  FaMicroscope,
  FaChartBar,
  FaCamera
} from 'react-icons/fa';

const UploadDocument = () => {
  const [file, setFile] = useState(null);
  const [docName, setDocName] = useState('');
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState('');
  const [analyzed, setAnalyzed] = useState(null);
  const [activeDocId, setActiveDocId] = useState(null);
  const [inlineError, setInlineError] = useState(null);
  const [isExtendedProcessing, setIsExtendedProcessing] = useState(false);
  const [syncingReminders, setSyncingReminders] = useState(false);
  const [syncedCount, setSyncedCount] = useState(null);
  const [savedRemindersMap, setSavedRemindersMap] = useState({});

  // Active View Mode (Auto-detected from OCR or toggled by user)
  const [activeTab, setActiveTab] = useState('analysis'); // 'analysis', 'audio_transcript', 'raw_ocr'
  const [documentMode, setDocumentMode] = useState('auto'); // 'auto', 'prescription', 'lab_report'
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Preferred Language: Telugu, Hindi, Marathi, English
  const [preferredLang, setPreferredLang] = useState(() => {
    const saved = localStorage.getItem('preferred_language');
    if (saved) {
      if (saved.startsWith('te')) return 'te';
      if (saved.startsWith('hi')) return 'hi';
      if (saved.startsWith('mr')) return 'mr';
      return 'en';
    }
    return 'te';
  });

  const [audioLang, setAudioLang] = useState(() => {
    const saved = localStorage.getItem('preferred_language');
    return saved || 'te-IN';
  });

  // Audio Playback State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);
  const audioPlayerRef = useRef(null);

  // Sync preferred language changes
  useEffect(() => {
    const handleLanguageChange = (e) => {
      const newLang = e.detail?.lang || 'te-IN';
      setAudioLang(newLang);
      if (newLang.startsWith('te')) setPreferredLang('te');
      else if (newLang.startsWith('hi')) setPreferredLang('hi');
      else if (newLang.startsWith('mr')) setPreferredLang('mr');
      else setPreferredLang('en');
    };

    window.addEventListener('language-changed', handleLanguageChange);
    return () => window.removeEventListener('language-changed', handleLanguageChange);
  }, []);

  // Cleanup audio player on unmount
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSyncToReminders = async () => {
    if (!analyzed?.medicines?.length) return;
    setSyncingReminders(true);
    try {
      const res = await api.post('/api/reminders/schedules/sync-from-prescription/', {
        document_id: activeDocId,
        medicines: analyzed.medicines
      });
      const count = res.data?.imported_count || analyzed.medicines.length;
      setSyncedCount(count);
      const allSaved = {};
      analyzed.medicines.forEach((m, i) => {
        const k = m.name || m.medicine || `med_${i}`;
        allSaved[k] = true;
      });
      setSavedRemindersMap(allSaved);
    } catch (err) {
      console.error('Sync to reminders error:', err);
    } finally {
      setSyncingReminders(false);
    }
  };

  // Determine current audio script for the selected language
  const getAudioScriptForSelectedLang = () => {
    if (!analyzed) return '';
    const langKey = audioLang.startsWith('te') ? 'te' :
                    audioLang.startsWith('hi') ? 'hi' :
                    audioLang.startsWith('mr') ? 'mr' : 'en';

    if (analyzed.audio_scripts && analyzed.audio_scripts[langKey]) {
      return analyzed.audio_scripts[langKey];
    }
    return analyzed.audio_script || '';
  };

  // Helper: Asynchronously load browser voices waiting for voiceschanged event
  const getBrowserVoicesAsync = () => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) return resolve([]);
      const current = window.speechSynthesis.getVoices();
      if (current && current.length > 0) return resolve(current);

      const handler = () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
        resolve(window.speechSynthesis.getVoices() || []);
      };
      window.speechSynthesis.addEventListener('voiceschanged', handler);
      setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
        resolve(window.speechSynthesis.getVoices() || []);
      }, 1000);
    });
  };

  // Play audio instructions via high-quality native backend MP3 streaming or browser speech fallback
  const speakAudioScript = async () => {
    const textToSpeak = getAudioScriptForSelectedLang();
    if (!textToSpeak) return;

    handleStopAudio();
    setIsPlayingAudio(true);
    setIsPausedAudio(false);

    const langCode = audioLang.startsWith('te') ? 'te' :
                     audioLang.startsWith('hi') ? 'hi' :
                     audioLang.startsWith('mr') ? 'mr' : 'en';

    try {
      // 1. Primary: Stream Google female voice MP3 from backend
      const audioUrl = `/api/documents/speak/?lang=${langCode}&text=${encodeURIComponent(textToSpeak)}&t=${Date.now()}`;
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;

      audio.onplay = () => {
        setIsPlayingAudio(true);
        setIsPausedAudio(false);
      };
      audio.onended = () => {
        setIsPlayingAudio(false);
        setIsPausedAudio(false);
        audioPlayerRef.current = null;
      };
      audio.onerror = async (err) => {
        console.warn('Backend audio streaming error, falling back to Web Speech API:', err);
        await fallbackBrowserSpeech(textToSpeak, audioLang);
      };

      await audio.play();
    } catch (streamErr) {
      console.warn('Audio play exception, switching to browser speech:', streamErr);
      await fallbackBrowserSpeech(textToSpeak, audioLang);
    }
  };

  const fallbackBrowserSpeech = async (textToSpeak, langCode) => {
    if (!('speechSynthesis' in window)) {
      setInlineError('Speech playback is not supported on this device.');
      setIsPlayingAudio(false);
      return;
    }
    window.speechSynthesis.cancel();

    // Await full voice population to eliminate the race condition
    const voices = await getBrowserVoicesAsync();
    const baseCode = (langCode || '').split('-')[0].toLowerCase();
    const matchedVoices = voices.filter(v => 
      v.lang.toLowerCase() === (langCode || '').toLowerCase() || 
      v.lang.toLowerCase().startsWith(baseCode)
    );

    // If client browser lacks regional voice, inform user cleanly
    if (matchedVoices.length === 0 && (baseCode === 'te' || baseCode === 'mr')) {
      const langName = baseCode === 'te' ? 'Telugu' : 'Marathi';
      setInlineError(`Voice playback for ${langName} requires an active internet connection. Please verify connection and retry.`);
      setIsPlayingAudio(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = langCode;
    utterance.rate = 0.88;
    utterance.pitch = 1.05; // Natural female pitch

    // Prioritize female voice profiles
    const femaleVoice = matchedVoices.find(v => 
      /female|heera|swara|kalpana|zira|sangeeta|veena|priya|google/i.test(v.name)
    ) || matchedVoices[0];

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    utterance.onstart = () => {
      setIsPlayingAudio(true);
      setIsPausedAudio(false);
    };
    utterance.onend = () => {
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    };
    utterance.onerror = (e) => {
      console.error('SpeechSynthesis error:', e);
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePauseAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPausedAudio(true);
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPausedAudio(true);
    }
  };

  const handleResumeAudio = () => {
    if (audioPlayerRef.current && isPausedAudio) {
      audioPlayerRef.current.play();
      setIsPausedAudio(false);
    } else if ('speechSynthesis' in window && isPausedAudio) {
      window.speechSynthesis.resume();
      setIsPausedAudio(false);
    }
  };

  const handleStopAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      audioPlayerRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setIsPausedAudio(false);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setDocName(selectedFile.name.replace(/\.[^/.]+$/, ''));
      setAnalyzed(null);
      setInlineError(null);
      setIsExtendedProcessing(false);
      setSyncedCount(null);
      handleStopAudio();
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setProgress(25);
    setStageText('Stage 1: Uploading medical document...');
    setInlineError(null);
    setIsExtendedProcessing(false);
    setSyncedCount(null);

    const formData = new FormData();
    formData.append('document_name', docName || 'Medical Document');
    formData.append('file', file);

    try {
      const response = await api.post('/api/documents/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const docId = response.data.id;
      setActiveDocId(docId);
      setProgress(50);
      setStageText('Stage 2: Vision OCR scanning text & lab parameters...');

      await api.post(`/api/documents/${docId}/extract-text/`);
      setProgress(70);
      setStageText('Stage 3: Analyzing prescription & diagnostic test values...');

      let pollCount = 0;
      const maxPollAttempts = 40;

      const pollInterval = setInterval(async () => {
        pollCount += 1;
        try {
          const statusRes = await api.get(`/api/documents/${docId}/extraction-status/`);
          const statusData = statusRes.data;

          if (statusData && statusData.status === 'complete') {
            clearInterval(pollInterval);
            setProgress(100);
            setStageText('Stage 4: Clinical analysis complete!');
            setUploading(false);
            setIsExtendedProcessing(false);

            const isLab = statusData.doc_classification === 'lab_report' ||
                          (statusData.lab_report && statusData.lab_report.is_lab_report);

            setAnalyzed({
              extracted_text: statusData.raw_ocr_text || statusData.extracted_text || statusData.text || '',
              doc_classification: statusData.doc_classification || (isLab ? 'lab_report' : 'prescription'),
              medicines: Array.isArray(statusData.medicines) ? statusData.medicines : [],
              lab_report: statusData.lab_report || null,
              needs_verification: Array.isArray(statusData.needs_verification) ? statusData.needs_verification : [],
              medicines_found: statusData.medicines_found || (statusData.medicines ? statusData.medicines.length : 0),
              audio_script: statusData.audio_script || '',
              audio_scripts: statusData.audio_scripts || null,
              confidence: statusData.confidence || 0.95,
              extraction_method: statusData.extraction_method || 'Vision OCR',
              quality_metrics: statusData.quality_metrics || {},
              requires_review: statusData.requires_manual_review,
              db_doc: response ? response.data : null,
            });
          } else if (statusData && statusData.status === 'failed') {
            clearInterval(pollInterval);
            setUploading(false);
            setIsExtendedProcessing(false);
            setInlineError(statusData.error_message || statusData.error || 'Medical document analysis failed.');
          } else if (pollCount >= maxPollAttempts) {
            clearInterval(pollInterval);
            setUploading(false);
            setIsExtendedProcessing(true);
          } else {
            setProgress((prev) => {
              const next = Math.min(prev + 8, 96);
              if (next >= 85) {
                setStageText('Stage 3: Matching clinical knowledge base & generating speech...');
              } else if (next >= 65) {
                setStageText('Stage 2: Evaluating test ranges & dosage timings...');
              }
              return next;
            });
          }
        } catch (pollErr) {
          console.error('Polling status error:', pollErr);
          if (pollCount >= maxPollAttempts) {
            clearInterval(pollInterval);
            setUploading(false);
            setIsExtendedProcessing(true);
          }
        }
      }, 1000);

    } catch (err) {
      console.error('Upload error:', err);
      setUploading(false);
      setInlineError(err.response?.data?.detail || 'Failed to upload and analyze document.');
    }
  };

  // Determine which mode to render (Prescription vs Lab Report)
  const isLabReportActive = analyzed && (
    documentMode === 'lab_report' ||
    (documentMode === 'auto' && analyzed.doc_classification === 'lab_report') ||
    (analyzed.lab_report && analyzed.lab_report.is_lab_report && (!analyzed.medicines || analyzed.medicines.length === 0))
  );

  const hasLabData = analyzed?.lab_report?.parameters?.length > 0;
  const hasPrescriptionData = analyzed?.medicines?.length > 0;

  return (
    <div className="space-y-6 pb-12">
      {/* 🏥 PROFESSIONAL TOP MEDICAL WORKSPACE BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-teal-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold tracking-wider uppercase backdrop-blur-sm">
              <FaMicroscope className="text-teal-400" />
              <span>Universal Clinical Document & Diagnostic Analyzer</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center space-x-3">
              <span>Medical Document Intelligence</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Universal AI extraction for <strong>Doctor Prescriptions</strong> and <strong>Diagnostic Lab Reports</strong> (Blood, Diabetes, Kidney, Liver, Lipid) with instant multilingual audio assistance.
            </p>
          </div>

          {/* Voice Language Selector */}
          <div className="flex items-center space-x-2 bg-slate-800/80 backdrop-blur border border-slate-700 p-2.5 rounded-2xl shrink-0 shadow-md">
            <span className="text-xs font-bold text-slate-300 pl-1 flex items-center space-x-1.5">
              <FaHeadphones className="text-teal-400" />
              <span>Voice Language:</span>
            </span>
            <select
              value={audioLang}
              onChange={(e) => {
                const newLang = e.target.value;
                setAudioLang(newLang);
                localStorage.setItem('preferred_language', newLang);
                window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang: newLang } }));
              }}
              className="text-xs font-bold bg-teal-900/60 text-teal-200 border border-teal-600/50 rounded-xl px-3 py-1.5 cursor-pointer outline-none shadow-xs"
            >
              <option value="te-IN">తెలుగు (Telugu)</option>
              <option value="en-US">English (Voice)</option>
              <option value="hi-IN">हिंदी (Hindi)</option>
              <option value="mr-IN">मराठी (Marathi)</option>
            </select>
          </div>
        </div>

        {/* Dual Mode Switcher Tabs */}
        {analyzed && (hasLabData || hasPrescriptionData) && (
          <div className="flex items-center space-x-2 pt-4 mt-4 border-t border-slate-800/80">
            <button
              onClick={() => setDocumentMode('auto')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                documentMode === 'auto'
                  ? 'bg-teal-500 text-slate-900 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>Auto-Detected Mode</span>
            </button>

            {hasPrescriptionData && (
              <button
                onClick={() => setDocumentMode('prescription')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  documentMode === 'prescription'
                    ? 'bg-teal-500 text-slate-900 shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <FaPills /> <span>Prescription ({analyzed.medicines?.length || 0})</span>
              </button>
            )}

            {hasLabData && (
              <button
                onClick={() => setDocumentMode('lab_report')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  documentMode === 'lab_report'
                    ? 'bg-teal-500 text-slate-900 shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <FaVial /> <span>Lab Report ({analyzed.lab_report?.param_count || 0} Tests)</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2-COLUMN BALANCED WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* LEFT COLUMN (5 Cols): Upload Form + Compact Image Preview + Built-in Audio Bar */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-5 sm:p-6 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700/80 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-100 font-bold text-base">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center text-sm shadow-sm">
                  <FaFileUpload />
                </div>
                <span>Select & Upload Document</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">Prescriptions & Lab Tests</span>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <Input
                label="Document Reference Name"
                placeholder="e.g. Blood_Test_Report_CBC or Dr_Prescription"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                required
              />

              {!preview ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Choose Image Source:</span>
                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5 active:scale-95"
                    >
                      <FaCamera className="text-xs" />
                      <span>Take Photo with Camera</span>
                    </button>
                  </div>

                  <label className="border-2 border-dashed border-teal-300 dark:border-slate-600 hover:border-teal-500 dark:hover:border-teal-400 bg-teal-50/20 dark:bg-slate-800/40 hover:bg-teal-50/40 dark:hover:bg-slate-800/70 rounded-2xl h-[200px] flex flex-col items-center justify-center cursor-pointer transition-all space-y-2.5 p-5">
                    <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-slate-700 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xl shadow-sm">
                      <FaCloudUploadAlt />
                    </div>
                    <div className="text-center space-y-0.5">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Click to browse or drag file here</p>
                      <p className="text-[10px] text-slate-400">Supports JPG, PNG, WEBP medical reports & prescriptions</p>
                    </div>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 font-semibold px-1">
                    <span>Document Image Preview</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setPreview(null);
                        setAnalyzed(null);
                        handleStopAudio();
                      }}
                      className="text-rose-500 hover:underline flex items-center space-x-1 font-bold"
                    >
                      <FaTimes /> <span>Remove</span>
                    </button>
                  </div>
                  <div className="relative bg-slate-900/5 dark:bg-[#0B1220] rounded-2xl border border-slate-200 dark:border-slate-700 h-[240px] flex items-center justify-center p-2.5 overflow-hidden group">
                    <img
                      src={preview}
                      alt="Document Preview"
                      className="max-h-[220px] max-w-full object-contain rounded-lg shadow-sm transition-transform duration-300 group-hover:scale-105"
                    />
                    <a
                      href={preview}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-[#1E293B] hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl shadow-md backdrop-blur transition-all"
                      title="View Full Resolution"
                    >
                      <FaEye />
                    </a>
                  </div>
                </div>
              )}

              {inlineError && (
                <Alert type="error" message={inlineError} className="text-xs" />
              )}

              {uploading && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span>{stageText || 'Analyzing document...'}</span>
                    <span className="font-bold text-teal-600 dark:text-teal-400">{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="teal"
                size="lg"
                fullWidth
                disabled={!file || uploading}
                icon={FaMicroscope}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl py-3 shadow-md"
              >
                {uploading ? 'Analyzing Medical Document...' : 'Analyze Document Now'}
              </Button>
            </form>

            {/* INTEGRATED DOCKED AUDIO PLAYER CONTROL BAR */}
            {analyzed && (analyzed.audio_script || analyzed.audio_scripts) && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                    <FaHeadphones className="text-teal-600" />
                    <span>{getLocalizedUiString('voiceGuidance', audioLang)}</span>
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 rounded-md">
                    {normalizeLangKey(audioLang).toUpperCase()} Female Voice
                  </span>
                </div>

                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                  <div className="flex items-center space-x-2">
                    {!isPlayingAudio ? (
                      <button
                        type="button"
                        onClick={speakAudioScript}
                        className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
                      >
                        <FaPlay className="text-[10px]" /> <span>{getLocalizedUiString('listenAudio', audioLang)}</span>
                      </button>
                    ) : isPausedAudio ? (
                      <button
                        type="button"
                        onClick={handleResumeAudio}
                        className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
                      >
                        <FaPlay className="text-[10px]" /> <span>{getLocalizedUiString('resume', audioLang)}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handlePauseAudio}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
                      >
                        <FaPause className="text-[10px]" /> <span>{getLocalizedUiString('pause', audioLang)}</span>
                      </button>
                    )}

                    {isPlayingAudio && (
                      <button
                        type="button"
                        onClick={handleStopAudio}
                        className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
                      >
                        <FaStop className="text-[10px]" />
                      </button>
                    )}
                  </div>

                  <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 flex items-center space-x-1">
                    <span className={`w-2 h-2 rounded-full ${isPlayingAudio ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
                    <span>{isPlayingAudio ? getLocalizedUiString('speaking', audioLang) : getLocalizedUiString('ready', audioLang)}</span>
                  </span>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN (7 Cols): Dynamic Clinical Results Workspace */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="min-h-[560px] p-6 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700/80 shadow-md flex flex-col">
            
            {/* Header Tabs: Analysis | Audio Transcript | Raw OCR */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-700 shrink-0">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    activeTab === 'analysis'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <FaNotesMedical />
                  <span>{getLocalizedUiString('clinicalFindings', audioLang)}</span>
                </button>

                <button
                  onClick={() => setActiveTab('audio_transcript')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    activeTab === 'audio_transcript'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <FaVolumeUp />
                  <span>{getLocalizedUiString('audioTranscript', audioLang)}</span>
                </button>

                <button
                  onClick={() => setActiveTab('raw_ocr')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    activeTab === 'raw_ocr'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <FaTable />
                  <span>{getLocalizedUiString('rawOcr', audioLang)}</span>
                </button>
              </div>

              {analyzed && (
                <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {isLabReportActive ? '📑 Lab Report' : '💊 Prescription'}
                </span>
              )}
            </div>

            {!analyzed ? (
              <div className="my-auto py-24 text-center text-slate-400 space-y-4">
                <FaFileMedical className="text-5xl mx-auto opacity-30 text-teal-500" />
                <p className="text-base font-bold text-slate-700 dark:text-slate-300">Upload any Prescription or Lab Report</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  The AI automatically extracts doctor handwriting, medicine dosages, and diagnostic lab parameters with normal ranges, providing clinical explanations in Telugu, Hindi, Marathi, and English.
                </p>
              </div>
            ) : activeTab === 'audio_transcript' ? (
              /* TAB 2: Multilingual Audio Transcript */
              <div className="pt-4 space-y-3 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    Spoken Voice Guidance Transcript ({normalizeLangKey(audioLang).toUpperCase()})
                  </h4>
                  <button
                    type="button"
                    onClick={speakAudioScript}
                    className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline flex items-center space-x-1"
                  >
                    <FaPlay className="text-[10px]" /> <span>Play this Audio</span>
                  </button>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {getAudioScriptForSelectedLang()}
                </div>
              </div>
            ) : activeTab === 'raw_ocr' ? (
              /* TAB 3: Raw OCR Text */
              <div className="pt-4 space-y-3 flex-1">
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Full Optical Character Recognition (OCR) Lines
                </h4>
                <div className="p-4 bg-slate-900 text-slate-200 font-mono text-xs rounded-2xl max-h-[440px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {analyzed.extracted_text}
                </div>
              </div>
            ) : isLabReportActive && analyzed.lab_report && analyzed.lab_report.parameters ? (
              /* ======================================================== */
              /* LAB & DIAGNOSTIC REPORT WORKSPACE VIEW                   */
              /* ======================================================== */
              <div className="pt-4 space-y-4 flex-1">
                
                {/* Diagnostic Scorecard KPIs */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-teal-50 dark:bg-slate-800 rounded-2xl border border-teal-200 dark:border-slate-700 text-center">
                    <p className="text-[11px] font-bold text-slate-500">Total Tests</p>
                    <h3 className="text-2xl font-black text-teal-700 dark:text-teal-300">
                      {analyzed.lab_report.param_count}
                    </h3>
                  </div>

                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center">
                    <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">🟢 Normal</p>
                    <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                      {analyzed.lab_report.normal_count}
                    </h3>
                  </div>

                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-800 text-center">
                    <p className="text-[11px] font-bold text-rose-800 dark:text-rose-300">⚠️ Attention Required</p>
                    <h3 className="text-2xl font-black text-rose-700 dark:text-rose-300">
                      {analyzed.lab_report.abnormal_count}
                    </h3>
                  </div>
                </div>

                {/* Lab Test Parameter Cards List */}
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {analyzed.lab_report.parameters.map((param, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                        param.status === 'normal'
                          ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-teal-400'
                          : param.status === 'high'
                          ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900 shadow-xs'
                          : 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md">
                            {param.category}
                          </span>
                          <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base mt-1">
                            {param.name}
                          </h4>
                        </div>

                        {/* Status Badge */}
                        <span className={`text-[11px] font-black uppercase px-3 py-1 rounded-full shrink-0 shadow-xs ${
                          param.status === 'normal'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : param.status === 'high'
                            ? 'bg-rose-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}>
                          {param.status_label}
                        </span>
                      </div>

                      {/* Observed Value vs Normal Reference Range */}
                      <div className="grid grid-cols-2 gap-2 bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">Observed Value:</span>
                          <span className="font-black text-slate-900 dark:text-slate-100 text-sm">
                            {param.value} <span className="text-xs font-semibold text-slate-500">{param.unit}</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">Healthy Reference Range:</span>
                          <span className="font-bold text-slate-600 dark:text-slate-400 text-xs">
                            {param.reference_range}
                          </span>
                        </div>
                      </div>

                      {/* Clinical Meaning & Lifestyle Advice in Preferred Language */}
                      <div className="text-xs space-y-1 pt-1">
                        <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                          <span className="text-teal-600 font-bold">💡 Meaning:</span>
                          <span>{preferredLang === 'te' ? param.meaning_te : preferredLang === 'hi' ? param.meaning_hi : preferredLang === 'mr' ? param.meaning_mr : param.meaning_en}</span>
                        </p>
                        <p className={`font-semibold ${param.status === 'normal' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-300'} flex items-start space-x-1`}>
                          <span className="font-bold shrink-0">🎯 Advice:</span>
                          <span>{preferredLang === 'te' ? param.advice_te : preferredLang === 'hi' ? param.advice_hi : preferredLang === 'mr' ? param.advice_mr : param.advice_en}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* ======================================================== */
              /* PRESCRIPTION WORKSPACE VIEW                              */
              /* ======================================================== */
              <div className="pt-4 space-y-4 flex-1">
                
                {/* Detected Medicines List */}
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {analyzed.medicines && analyzed.medicines.length > 0 ? (
                    analyzed.medicines.map((med, idx) => {
                      const currentLang = normalizeLangKey(audioLang || preferredLang);
                      const dosageInfo = parseDosagePattern(
                        med?.dosage || med?.strength || '',
                        med?.frequency || '',
                        med?.timing || '',
                        med?.duration || ''
                      ) || {};

                      const localizedPurpose = getLocalizedMedicinePurpose(med, currentLang);
                      const localizedSideEffects = getLocalizedSideEffects(med, currentLang);
                      const localizedScheduleSummary = getLocalizedScheduleSummary(dosageInfo, currentLang);
                      const localizedRuralGuidance = getLocalizedRuralGuidance(dosageInfo, med, currentLang);
                      const slotPillLabels = getLocalizedSlotPillLabels(dosageInfo, med, currentLang);

                      // Single medicine reminder action handler
                      const medKey = med?.name || med?.medicine || `med_${idx}`;
                      const isReminderSaved = !!savedRemindersMap[medKey];

                      const handleSingleReminder = async (selectedMed) => {
                        setSyncingReminders(true);
                        try {
                          const res = await api.post('/api/reminders/schedules/sync-from-prescription/', {
                            document_id: activeDocId,
                            medicines: [selectedMed]
                          });
                          setSavedRemindersMap(prev => ({ ...prev, [medKey]: true }));
                          setSyncedCount((prev) => (prev || 0) + 1);
                        } catch (err) {
                          console.error('Single reminder sync error:', err);
                        } finally {
                          setSyncingReminders(false);
                        }
                      };

                      return (
                        <div
                          key={idx}
                          className="p-5 bg-[#f8f9fb] dark:bg-[#1E293B]/60 rounded-3xl border border-slate-200/80 dark:border-slate-700/60 space-y-4 text-left animate-fadeIn"
                        >
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center space-x-2.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                              <span className="text-slate-900 dark:text-slate-100 font-extrabold text-base flex items-baseline gap-1">
                                <span>{med?.medicine || med?.name || getLocalizedUiString('prescribedMedicine', currentLang)}</span>
                                <span className="text-xs text-slate-400 font-normal">
                                  ({med?.dosage || med?.strength || getLocalizedUiString('notSpecified', currentLang)})
                                </span>
                              </span>
                            </div>
                            
                            {isReminderSaved ? (
                              <span className="px-3 py-1 border border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-extrabold rounded-full flex items-center space-x-1.5 shadow-xs">
                                <span>✓</span>
                                <span>Reminder Active</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSingleReminder(med)}
                                className="px-3.5 py-1.5 border border-teal-500/20 bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-bold rounded-full flex items-center space-x-1.5 transition-all shadow-xs"
                              >
                                <span className="text-[10px]">🔔</span>
                                <span>{getLocalizedUiString('setReminder', currentLang)}</span>
                              </button>
                            )}
                          </div>

                          {/* One-line schedule summary */}
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-5 mt-[-8px]">
                            {localizedScheduleSummary}
                          </p>

                          {/* Inner White Sub-card */}
                          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl space-y-3 shadow-xs">
                            <div className="space-y-0.5">
                              <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                                {getLocalizedUiString('whyToTake', currentLang)}
                              </span>
                              <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                                {localizedPurpose}
                              </p>
                            </div>
                            
                            <div className="space-y-0.5">
                              <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                                {getLocalizedUiString('commonSideEffects', currentLang)}
                              </span>
                              <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                                {localizedSideEffects}
                              </p>
                            </div>
                          </div>

                          {/* Yellow/Amber Rural Guidance Callout Box */}
                          <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/60 rounded-2xl space-y-1">
                            <div className="flex items-center space-x-1.5 text-amber-700 dark:text-amber-400 font-extrabold text-xs">
                              <span>☀️</span>
                              <span>{getLocalizedUiString('whenToTake', currentLang)}</span>
                            </div>
                            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                              {localizedRuralGuidance}
                            </p>
                          </div>

                          {/* Time Slot Pill Buttons */}
                          <div className="flex items-center gap-2 pt-1.5 overflow-x-auto">
                            {/* Morning Slot */}
                            {dosageInfo?.morning?.take ? (
                              <div className="px-3.5 py-1.5 rounded-full border border-amber-300 bg-amber-50 text-amber-700 font-extrabold text-[11px] flex items-center space-x-1.5 shrink-0">
                                <span>☀️</span>
                                <span>{slotPillLabels.morningActive}</span>
                              </div>
                            ) : (
                              <div className="px-3.5 py-1.5 rounded-full border border-slate-200/80 bg-slate-100 text-slate-400 font-semibold text-[11px] opacity-60 shrink-0">
                                <span>☀️</span>
                                <span>{slotPillLabels.morningInactive}</span>
                              </div>
                            )}

                            {/* Afternoon Slot */}
                            {dosageInfo?.afternoon?.take ? (
                              <div className="px-3.5 py-1.5 rounded-full border border-orange-300 bg-orange-50 text-orange-700 font-extrabold text-[11px] flex items-center space-x-1.5 shrink-0">
                                <span>☀️</span>
                                <span>{slotPillLabels.afternoonActive}</span>
                              </div>
                            ) : (
                              <div className="px-3.5 py-1.5 rounded-full border border-slate-200/80 bg-slate-100 text-slate-400 font-semibold text-[11px] opacity-60 shrink-0">
                                <span>☀️</span>
                                <span>{slotPillLabels.afternoonInactive}</span>
                              </div>
                            )}

                            {/* Night Slot */}
                            {dosageInfo?.night?.take ? (
                              <div className="px-3.5 py-1.5 rounded-full border border-indigo-300 bg-indigo-50/60 text-indigo-700 font-extrabold text-[11px] flex items-center space-x-1.5 shrink-0">
                                <span>🌙</span>
                                <span>{slotPillLabels.nightActive}</span>
                              </div>
                            ) : (
                              <div className="px-3.5 py-1.5 rounded-full border border-slate-200/80 bg-slate-100 text-slate-400 font-semibold text-[11px] opacity-60 shrink-0">
                                <span>🌙</span>
                                <span>{slotPillLabels.nightInactive}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900">
                      No prescription medicines detected. If this is a Lab Report, switch to <strong>Lab Report Mode</strong> above.
                    </div>
                  )}
                </div>

                {/* Action Buttons at the bottom of the whole list */}
                {analyzed.medicines && analyzed.medicines.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setPreview(null);
                        setAnalyzed(null);
                        setSyncedCount(null);
                        handleStopAudio();
                      }}
                      className="py-2.5 border border-teal-600 text-teal-600 bg-white hover:bg-teal-50 text-xs font-bold rounded-full transition-all text-center shadow-xs flex items-center justify-center space-x-1"
                    >
                      <span>{getLocalizedUiString('retakePhoto', audioLang)}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSyncToReminders}
                      disabled={syncingReminders}
                      className="py-2.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-full transition-all text-center shadow-xs flex items-center justify-center space-x-1 disabled:opacity-50"
                    >
                      <span>{syncingReminders ? getLocalizedUiString('saving', audioLang) : getLocalizedUiString('confirmSave', audioLang)}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

      </div>

      {/* 📷 Live Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(capturedFile, previewUrl) => {
          setFile(capturedFile);
          setPreview(previewUrl);
          setDocName(capturedFile.name.replace(/\.[^/.]+$/, ''));
          setAnalyzed(null);
          setInlineError(null);
          setIsExtendedProcessing(false);
          setSyncedCount(null);
          handleStopAudio();
        }}
        title="Snap Doctor Prescription / Lab Report Photo"
      />
    </div>
  );
};

export default UploadDocument;
