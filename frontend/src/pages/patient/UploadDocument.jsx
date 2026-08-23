import React, { useState, useEffect, useRef } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import api from '../../api/axios';
import { parseDosagePattern } from '../../utils/dosageFormatter';
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
  FaHeadphones
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

  // Preferred Language Sync: Telugu, English, Hindi, Marathi
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
  const [showRawDetails, setShowRawDetails] = useState(false);
  const [syncingReminders, setSyncingReminders] = useState(false);
  const [syncedCount, setSyncedCount] = useState(null);
  const audioPlayerRef = useRef(null);

  const handleSyncToReminders = async () => {
    if (!analyzed?.medicines?.length) return;
    setSyncingReminders(true);
    try {
      const res = await api.post('/api/reminders/schedules/sync-from-prescription/', {
        document_id: activeDocId,
        medicines: analyzed.medicines
      });
      setSyncedCount(res.data.imported_count || analyzed.medicines.length);
    } catch (err) {
      console.error('Sync to reminders error:', err);
    } finally {
      setSyncingReminders(false);
    }
  };

  // Sync preferred language changes across components
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

  // Play audio instructions via native backend MP3 streaming or browser speech fallback
  const speakAudioScript = () => {
    const textToSpeak = getAudioScriptForSelectedLang();
    if (!textToSpeak) return;

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const langCode = audioLang.startsWith('te') ? 'te' :
                     audioLang.startsWith('hi') ? 'hi' :
                     audioLang.startsWith('mr') ? 'mr' : 'en';

    // Primary High-Quality Voice Path: Native backend gTTS streaming
    try {
      let audioUrl = '';
      if (activeDocId) {
        audioUrl = `/api/documents/${activeDocId}/audio/?lang=${langCode}&t=${Date.now()}`;
      } else {
        audioUrl = `/api/documents/speak/?lang=${langCode}&text=${encodeURIComponent(textToSpeak)}`;
      }

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
      audio.onerror = () => {
        console.warn('Backend audio streaming fallback to browser speech synthesis');
        fallbackBrowserSpeech(textToSpeak, audioLang);
      };

      audio.play().catch(() => {
        fallbackBrowserSpeech(textToSpeak, audioLang);
      });
      return;
    } catch (streamErr) {
      console.warn('Audio streaming initialization error:', streamErr);
      fallbackBrowserSpeech(textToSpeak, audioLang);
    }
  };

  // Fallback to browser Web Speech API if offline
  const fallbackBrowserSpeech = (textToSpeak, langCode) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = langCode;
    utterance.rate = 0.90;

    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => v.lang === langCode || v.lang.startsWith(langCode.split('-')[0]));
    if (matchedVoice) utterance.voice = matchedVoice;

    utterance.onstart = () => {
      setIsPlayingAudio(true);
      setIsPausedAudio(false);
    };
    utterance.onend = () => {
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    };
    utterance.onerror = () => {
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
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setProgress(25);
    setStageText('Stage 1: Uploading prescription image...');
    setInlineError(null);
    setIsExtendedProcessing(false);

    const formData = new FormData();
    formData.append('document_name', docName || 'Prescription Document');
    formData.append('file', file);

    try {
      const response = await api.post('/api/documents/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const docId = response.data.id;
      setActiveDocId(docId);
      setProgress(50);
      setStageText('Stage 2: Vision OCR reading prescription strokes...');

      await api.post(`/api/documents/${docId}/extract-text/`);
      setProgress(70);
      setStageText('Stage 3: Extracting medicines, dosages & usage...');

      // Fast polling (1s interval) for deep prescription OCR extraction
      let pollCount = 0;
      const maxPollAttempts = 60;

      const pollInterval = setInterval(async () => {
        pollCount += 1;
        try {
          const statusRes = await api.get(`/api/documents/${docId}/extraction-status/`);
          const statusData = statusRes.data;

          if (statusData.status === 'complete') {
            clearInterval(pollInterval);
            setProgress(100);
            setStageText('Stage 4: Extraction complete!');
            setUploading(false);
            setIsExtendedProcessing(false);

            setAnalyzed({
              extracted_text: statusData.raw_ocr_text || statusData.extracted_text || statusData.text || '',
              medicines: statusData.medicines || [],
              needs_verification: statusData.needs_verification || [],
              medicines_found: statusData.medicines_found || (statusData.medicines ? statusData.medicines.length : 0),
              audio_script: statusData.audio_script || '',
              audio_scripts: statusData.audio_scripts || null,
              confidence: statusData.confidence || 0.95,
              extraction_method: statusData.extraction_method || 'Vision OCR',
              quality_metrics: statusData.quality_metrics || {},
              requires_review: statusData.requires_manual_review,
              db_doc: response ? response.data : null,
            });
          } else if (statusData.status === 'failed') {
            clearInterval(pollInterval);
            setUploading(false);
            setIsExtendedProcessing(false);
            setInlineError(statusData.error_message || statusData.error || 'Prescription extraction encountered an issue.');
          } else if (pollCount >= maxPollAttempts) {
            clearInterval(pollInterval);
            setUploading(false);
            setIsExtendedProcessing(true);
          } else {
            setProgress((prev) => {
              const next = Math.min(prev + 5, 96);
              if (next >= 85) {
                setStageText('Stage 3: Verifying medicines against dictionary & generating audio...');
              } else if (next >= 65) {
                setStageText('Stage 2: Parsing dosage timings (1-0-1) & medical usage...');
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
      setInlineError(err.response?.data?.detail || 'Failed to upload and start prescription extraction.');
    }
  };

  const checkDocStatusManually = async () => {
    if (!activeDocId) return;
    try {
      const statusRes = await api.get(`/api/documents/${activeDocId}/extraction-status/`);
      const statusData = statusRes.data;
      if (statusData.status === 'complete') {
        setProgress(100);
        setUploading(false);
        setIsExtendedProcessing(false);
        setAnalyzed({
          extracted_text: statusData.raw_ocr_text || statusData.extracted_text || statusData.text || '',
          medicines: statusData.medicines || [],
          needs_verification: statusData.needs_verification || [],
          medicines_found: statusData.medicines_found || (statusData.medicines ? statusData.medicines.length : 0),
          audio_script: statusData.audio_script || '',
          audio_scripts: statusData.audio_scripts || null,
          confidence: statusData.confidence || 0.95,
          extraction_method: statusData.extraction_method || 'Vision OCR',
          quality_metrics: statusData.quality_metrics || {},
          requires_review: statusData.requires_manual_review,
        });
      }
    } catch (e) {
      console.error('Manual check failed:', e);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#00A896]/15 via-tealSoft-500/10 to-health-500/15 border border-mint-200 dark:border-slate-800 p-6 rounded-3xl shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center space-x-3">
              <span className="p-2.5 rounded-2xl bg-tealSoft-500 text-white shadow-md">
                <FaFileUpload />
              </span>
              <span>Upload Medical Prescription</span>
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Extract medicine names, 3-slot dosage schedules (<span className="font-bold text-mint-700 dark:text-mint-400">1 = Take, 0 = Skip</span>), medical purpose, and listen to spoken audio in your preferred language.
            </p>
          </div>

          {/* Quick Language Switcher */}
          <div className="flex items-center space-x-2 bg-white dark:bg-[#1E293B] p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 pl-2">Preferred Voice:</span>
            <select
              value={audioLang}
              onChange={(e) => {
                const newLang = e.target.value;
                setAudioLang(newLang);
                localStorage.setItem('preferred_language', newLang);
                window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang: newLang } }));
              }}
              className="text-xs font-bold bg-mint-50 dark:bg-slate-800 text-mint-800 dark:text-mint-300 rounded-xl px-3 py-1.5 border border-mint-200 dark:border-slate-600 outline-none cursor-pointer"
            >
              <option value="te-IN">తెలుగు (Telugu)</option>
              <option value="en-US">English (Voice)</option>
              <option value="hi-IN">हिंदी (Hindi)</option>
              <option value="mr-IN">मराठी (Marathi)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* LEFT COLUMN: 1. Prescription Upload Form + 2. Voice Guidance Player (Below Upload) */}
        <div className="space-y-6">

          {/* 1. Prescription Image Upload Card */}
          <Card className="shadow-md border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold text-base">
              <FaFileUpload className="text-tealSoft-500 text-lg" />
              <span>Select & Upload Prescription</span>
            </div>

            <form onSubmit={handleUpload} className="pt-4 space-y-4">
              <Input
                label="Document Name"
                placeholder="e.g. Dr_Sharma_Prescription_Aug"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                required
              />

              {!preview ? (
                <label className="border-2 border-dashed border-health-200 dark:border-slate-700 hover:border-health-400 dark:hover:border-health-500 bg-health-50/30 dark:bg-[#1E293B]/40 hover:bg-health-50 dark:hover:bg-[#1E293B]/80 rounded-2xl h-[280px] flex flex-col items-center justify-center cursor-pointer transition-all space-y-3 p-6">
                  <div className="w-16 h-16 rounded-2xl bg-health-100 dark:bg-slate-700 text-health-600 dark:text-health-400 flex items-center justify-center text-3xl shadow-sm">
                    <FaCloudUploadAlt />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-base font-semibold text-slate-700 dark:text-slate-200">Click to select prescription image</p>
                    <p className="text-xs text-slate-400">Supports JPG, PNG, WEBP prescription photos</p>
                  </div>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 font-semibold px-1">
                    <span>Prescription Image View</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setPreview(null);
                        setAnalyzed(null);
                        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                      }}
                      className="text-rose-500 hover:underline flex items-center space-x-1"
                    >
                      <FaTimes /> <span>Remove File</span>
                    </button>
                  </div>
                  <div className="relative bg-slate-900/5 dark:bg-[#0B1220] rounded-2xl border border-slate-200 dark:border-slate-700 h-[280px] flex items-center justify-center p-3 overflow-hidden group">
                    <img
                      src={preview}
                      alt="Prescription Preview"
                      className="max-h-[260px] max-w-full object-contain rounded-lg shadow-sm transition-transform duration-300 group-hover:scale-105"
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

              {isExtendedProcessing && !analyzed && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900">
                  <div className="flex items-center space-x-2 font-bold">
                    <FaInfoCircle className="text-amber-600 text-sm flex-shrink-0" />
                    <span>Still processing handwriting OCR...</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => checkDocStatusManually()}
                    className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-all text-xs"
                  >
                    Check Status Again
                  </button>
                </div>
              )}

              {uploading && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span>{stageText || 'Extracting medicines...'}</span>
                    <span className="font-bold text-mint-600">{progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-health-500 to-mint-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="mint"
                size="lg"
                fullWidth
                disabled={!file || uploading}
                icon={FaFileUpload}
              >
                {uploading ? 'Extracting Medicines...' : 'Upload & Extract Medicines'}
              </Button>
            </form>
          </Card>

          {/* 2. DEDICATED VOICE GUIDANCE & AUDIO PLAYER CARD (Placed CLEANLY below Image Upload) */}
          {analyzed && (analyzed.audio_script || analyzed.audio_scripts) && (
            <Card className="shadow-md border border-mint-200/80 dark:border-slate-700/80 bg-gradient-to-br from-mint-50/40 via-white to-tealSoft-50/20 dark:from-[#172033] dark:to-[#1E293B] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-mint-100 dark:border-slate-700">
                <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-100 font-bold text-base">
                  <div className="w-8 h-8 rounded-xl bg-mint-500 text-white flex items-center justify-center text-sm shadow-sm">
                    <FaHeadphones />
                  </div>
                  <span>Voice Guidance & Audio Player</span>
                </div>

                {/* Language Selector */}
                <select
                  value={audioLang}
                  onChange={(e) => {
                    const newLang = e.target.value;
                    setAudioLang(newLang);
                    localStorage.setItem('preferred_language', newLang);
                    window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang: newLang } }));
                  }}
                  className="text-xs bg-white dark:bg-[#0B1220] border border-mint-300 dark:border-slate-600 rounded-xl px-3 py-1.5 font-bold text-slate-700 dark:text-slate-200 cursor-pointer shadow-xs outline-none"
                >
                  <option value="te-IN">Telugu (తెలుగు)</option>
                  <option value="en-US">English (Voice)</option>
                  <option value="hi-IN">Hindi (हिंदी)</option>
                  <option value="mr-IN">Marathi (मराठी)</option>
                </select>
              </div>

              {/* Audio Playback Controls */}
              <div className="flex items-center justify-between bg-white dark:bg-[#0B1220] p-3 rounded-2xl border border-mint-100 dark:border-slate-700 shadow-xs">
                <div className="flex items-center space-x-2.5">
                  {!isPlayingAudio ? (
                    <button
                      type="button"
                      onClick={speakAudioScript}
                      className="px-4 py-2 bg-mint-600 hover:bg-mint-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm transition-all"
                    >
                      <FaPlay className="text-[10px]" />
                      <span>Listen Audio Instructions</span>
                    </button>
                  ) : isPausedAudio ? (
                    <button
                      type="button"
                      onClick={handleResumeAudio}
                      className="px-4 py-2 bg-mint-600 hover:bg-mint-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm transition-all"
                    >
                      <FaPlay className="text-[10px]" />
                      <span>Resume Audio</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePauseAudio}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm transition-all"
                    >
                      <FaPause className="text-[10px]" />
                      <span>Pause</span>
                    </button>
                  )}

                  {isPlayingAudio && (
                    <button
                      type="button"
                      onClick={handleStopAudio}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all"
                    >
                      <FaStop className="text-[10px]" />
                      <span>Stop</span>
                    </button>
                  )}
                </div>

                <span className="text-[11px] font-bold text-mint-700 dark:text-mint-400 bg-mint-100/80 dark:bg-slate-800 px-3 py-1 rounded-full flex items-center space-x-1.5">
                  <span className={`w-2 h-2 rounded-full ${isPlayingAudio ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                  <span>{isPlayingAudio ? 'Playing' : 'Ready to Play'}</span>
                </span>
              </div>

              {/* Multilingual Translation Text Preview with Clean Typography */}
              {getAudioScriptForSelectedLang() && (
                <div className="p-3.5 bg-white dark:bg-[#0B1220] rounded-2xl border border-mint-200/80 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 leading-relaxed shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-mint-800 dark:text-mint-400 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="flex items-center space-x-1.5">
                      <FaVolumeUp className="text-mint-600" />
                      <span>
                        {audioLang.startsWith('te') ? '🔊 తెలుగు అనువాదం (Telugu Transcript)' :
                         audioLang.startsWith('hi') ? '🔊 हिंदी अनुवाद (Hindi Transcript)' :
                         audioLang.startsWith('mr') ? '🔊 मराठी भाषांतर (Marathi Transcript)' :
                         '🔊 English Voice Guidance Transcript'}
                      </span>
                    </span>
                  </div>
                  <p className="font-medium text-xs text-slate-800 dark:text-slate-200 leading-relaxed max-h-36 overflow-y-auto pr-1 whitespace-pre-wrap">
                    {getAudioScriptForSelectedLang()}
                  </p>
                </div>
              )}

              {/* Quick Action: Ask AI Voice Assistant Button */}
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-voice-assistant', {
                    detail: { prescriptionContext: analyzed.medicines }
                  }));
                }}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-mint-500 to-tealSoft-500 hover:from-mint-600 hover:to-tealSoft-600 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-all"
              >
                <FaRobot className="text-sm" />
                <span>💬 Ask Voice Sahayak About These Dosages & Timings</span>
              </button>
            </Card>
          )}

        </div>

        {/* RIGHT COLUMN: PURE & SPACIOUS AI MEDICINE EXTRACTION RESULTS */}
        <div className="space-y-6">
          <Card className={`min-h-[580px] flex flex-col shadow-md ${analyzed ? 'border-mint-200 dark:border-slate-700/80 bg-white dark:bg-[#172033]' : 'bg-slate-50 dark:bg-[#172033] border-slate-100 dark:border-slate-700/80'}`}>
            <div className="flex justify-between items-center pb-3.5 border-b border-slate-100 dark:border-slate-700 shrink-0">
              <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-100 font-bold text-base">
                <FaRobot className="text-tealSoft-500 text-xl" />
                <span>AI Medicine Extraction Results</span>
              </div>
              {analyzed && (
                <span className="text-xs font-bold text-mint-700 dark:text-mint-300 bg-mint-100 dark:bg-slate-800 px-3.5 py-1 rounded-full flex items-center space-x-1.5 shadow-sm">
                  <FaPills />
                  <span>{(analyzed.medicines ? analyzed.medicines.length : 0) + (analyzed.medicines_only ? analyzed.medicines_only.length : 0)} Medicines Identified</span>
                </span>
              )}
            </div>

            {!analyzed ? (
              <div className="my-auto py-24 text-center text-slate-400 dark:text-slate-400 space-y-4">
                <FaTable className="text-5xl mx-auto opacity-40 text-tealSoft-400" />
                <p className="text-base font-semibold text-slate-600 dark:text-slate-300">Upload prescription image on left panel</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">Extracted medicine names, 3-slot daily schedules, tablet medical usage, and instructions will appear here clearly without clutter.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col pt-3.5 space-y-4">

                {/* Confidence & Model Alert */}
                <div className="shrink-0 space-y-2.5">
                  {analyzed.confidence >= 0.75 ? (
                    <Alert type="success" message={`✓ High Confidence Extraction (${(analyzed.confidence * 100).toFixed(0)}%) — Method: ${analyzed.extraction_method || 'Vision OCR'}.`} />
                  ) : (
                    <Alert type="warning" message={`⚠️ Candidate Items (${(analyzed.confidence * 100).toFixed(0)}%) — Please verify handwritten entries with doctor.`} />
                  )}

                  {/* 1-Click Sync to Medication Reminders Schedule */}
                  {analyzed.medicines && analyzed.medicines.length > 0 && (
                    <div className="p-3 bg-gradient-to-r from-tealSoft-50 to-mint-50 dark:from-[#1E293B] dark:to-[#172033] border border-tealSoft-200 dark:border-slate-700 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 rounded-xl bg-tealSoft-500 text-white text-sm shadow-xs">
                          <FaClock />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Add to Medication Schedule</h4>
                          <p className="text-[11px] text-slate-500">Auto-create Morning, Afternoon & Night reminder alarms</p>
                        </div>
                      </div>

                      {syncedCount === null ? (
                        <button
                          type="button"
                          onClick={handleSyncToReminders}
                          disabled={syncingReminders}
                          className="px-4 py-2 bg-tealSoft-600 hover:bg-tealSoft-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all whitespace-nowrap"
                        >
                          {syncingReminders ? 'Adding...' : '⏰ Set Daily Reminders'}
                        </button>
                      ) : (
                        <a
                          href="/patient/reminders"
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5 whitespace-nowrap"
                        >
                          <FaCheckCircle className="text-xs" />
                          <span>Added {syncedCount} Meds (View Reminders)</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* DETECTED MEDICINES CARDS PANEL */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
                    <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                      <FaPills className="text-tealSoft-500 text-sm" />
                      <span>DETECTED MEDICINES ({analyzed.medicines?.length || 0})</span>
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium">Clear Visual Dosage Schedule</span>
                  </div>

                  {analyzed.medicines && analyzed.medicines.length > 0 ? (
                    analyzed.medicines.map((med, idx) => {
                      const dosageInfo = parseDosagePattern(
                        med.dosage || med.strength,
                        med.frequency,
                        med.timing,
                        med.duration
                      );

                      return (
                        <div
                          key={idx}
                          className="p-5 bg-white dark:bg-[#1E293B] border-l-4 border-[#1abc9c] rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/60 space-y-3.5 transition-all hover:shadow-md hover:border-[#1abc9c]"
                        >
                          {/* Medicine Header: Name & Match Score */}
                          <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-100 text-base">
                            <span className="text-slate-900 dark:text-slate-100 font-extrabold tracking-tight text-lg">
                              {med.medicine || med.name || med.raw_text || med.raw_line}
                            </span>
                            <span className="text-xs font-mono px-3 py-1 rounded-full bg-mint-100 dark:bg-slate-700 text-mint-800 dark:text-mint-300 font-bold shadow-xs">
                              {(med.confidence ? (med.confidence * 100).toFixed(0) : 95)}% match
                            </span>
                          </div>

                          {/* Human-Friendly Dosage Schedule (Morning / Afternoon / Night) */}
                          {dosageInfo.hasSlotInfo && (
                            <div className="grid grid-cols-3 gap-2.5 pt-1">
                              {/* Morning Slot */}
                              <div className={`p-2.5 rounded-xl text-center border text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                                dosageInfo.morning.take
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 shadow-sm'
                                  : 'bg-slate-100/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400 opacity-60'
                              }`}>
                                <span className="text-[10px] font-bold flex items-center space-x-1">
                                  <FaSun className="text-amber-500" /> <span>Morning</span>
                                </span>
                                <span className="font-extrabold text-xs mt-0.5">
                                  {dosageInfo.morning.take ? `✓ Take (${dosageInfo.morning.count})` : '✕ 0 (Skip)'}
                                </span>
                              </div>

                              {/* Afternoon Slot */}
                              <div className={`p-2.5 rounded-xl text-center border text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                                dosageInfo.afternoon.take
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 shadow-sm'
                                  : 'bg-slate-100/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400 opacity-60'
                              }`}>
                                <span className="text-[10px] font-bold flex items-center space-x-1">
                                  <FaSun className="text-orange-500" /> <span>Afternoon</span>
                                </span>
                                <span className="font-extrabold text-xs mt-0.5">
                                  {dosageInfo.afternoon.take ? `✓ Take (${dosageInfo.afternoon.count})` : '✕ 0 (Skip)'}
                                </span>
                              </div>

                              {/* Night Slot */}
                              <div className={`p-2.5 rounded-xl text-center border text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                                dosageInfo.night.take
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 shadow-sm'
                                  : 'bg-slate-100/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400 opacity-60'
                              }`}>
                                <span className="text-[10px] font-bold flex items-center space-x-1">
                                  <FaMoon className="text-indigo-400" /> <span>Night</span>
                                </span>
                                <span className="font-extrabold text-xs mt-0.5">
                                  {dosageInfo.night.take ? `✓ Take (${dosageInfo.night.count})` : '✕ 0 (Skip)'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Dedicated Tablet Usage & Purpose Section */}
                          {(med.usage || med.usage_te || med.usage_hi || med.usage_mr || med.info) && (
                            <div className="p-3 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/80 dark:border-blue-800/60 rounded-xl text-xs space-y-1.5 shadow-sm">
                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <span className="font-bold text-blue-900 dark:text-blue-300 flex items-center space-x-1.5">
                                  <span className="text-sm">🎯</span>
                                  <span>
                                    {preferredLang === 'te' ? 'టాబ్లెట్ ఉపయోగం (Usage / Purpose):' :
                                     preferredLang === 'hi' ? 'दवा का उपयोग (Usage / Purpose):' :
                                     preferredLang === 'mr' ? 'औषधाचा वापर (Usage / Purpose):' :
                                     'Tablet Usage / Purpose:'}
                                  </span>
                                </span>
                                {med.category && (
                                  <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 bg-blue-100/80 dark:bg-blue-900/80 text-blue-800 dark:text-blue-200 rounded-full border border-blue-200 dark:border-blue-700">
                                    {preferredLang === 'te' ? (med.category_te || med.category) :
                                     preferredLang === 'hi' ? (med.category_hi || med.category) :
                                     preferredLang === 'mr' ? (med.category_mr || med.category) :
                                     med.category}
                                  </span>
                                )}
                              </div>
                              <p className="font-medium text-slate-800 dark:text-slate-200 leading-relaxed pl-5 text-xs">
                                {preferredLang === 'te' ? (med.usage_te || med.usage || med.info) :
                                 preferredLang === 'hi' ? (med.usage_hi || med.usage || med.info) :
                                 preferredLang === 'mr' ? (med.usage_mr || med.usage || med.info) :
                                 (med.usage || med.info || "Prescribed therapeutic medication as instructed by physician.")}
                              </p>
                            </div>
                          )}

                          {/* Plain-English Instructions Banner */}
                          <div className="text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-start space-x-2">
                            <span className="font-bold text-mint-700 dark:text-mint-400 shrink-0">📋 Instructions:</span>
                            <span className="font-medium leading-relaxed">{dosageInfo.humanSummary}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 bg-amber-50/80 dark:bg-[#1E293B] rounded-2xl border border-amber-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 space-y-3 text-xs">
                      <div className="flex items-center space-x-2 font-bold text-amber-900 dark:text-amber-300 text-sm">
                        <span>⚠️ No Valid Medicines Identified</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {analyzed.quality_reason || "Image quality or handwriting clarity is too low for accurate extraction."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Expandable Raw OCR Text Footer */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowRawDetails(!showRawDetails)}
                    className="w-full text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span>{showRawDetails ? 'Hide Full Raw OCR Text' : 'Show Full Raw OCR Text'}</span>
                    {showRawDetails ? <FaChevronUp /> : <FaChevronDown />}
                  </button>

                  {showRawDetails && (
                    <div className="mt-2 p-3 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-xl max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                      {analyzed.extracted_text}
                    </div>
                  )}
                </div>

              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
};

export default UploadDocument;
