import React, { useState, useEffect, useRef } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import CameraCaptureModal from '../../components/common/CameraCaptureModal';
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
  FaCamera,
  FaWhatsapp,
  FaExternalLinkAlt
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
  const [isDuplicateNotice, setIsDuplicateNotice] = useState(false);

  // Active View Mode (Auto-detected from OCR or toggled by user)
  const [activeTab, setActiveTab] = useState('analysis'); // 'analysis', 'audio_transcript', 'raw_ocr'
  const [documentMode, setDocumentMode] = useState('auto'); // 'auto', 'prescription', 'lab_report'
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Preferred Language: English, Telugu, Hindi, Marathi
  const [preferredLang, setPreferredLang] = useState(() => {
    const saved = localStorage.getItem('preferred_language');
    if (saved) {
      if (saved.startsWith('te')) return 'te';
      if (saved.startsWith('hi')) return 'hi';
      if (saved.startsWith('mr')) return 'mr';
      return 'en';
    }
    return 'en';
  });

  const [audioLang, setAudioLang] = useState(() => {
    const saved = localStorage.getItem('preferred_language');
    return saved || 'en-US';
  });

  // Audio Playback State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);
  const audioPlayerRef = useRef(null);

  const openImageInNewTab = (imgUrl) => {
    if (!imgUrl) return;
    const imageWindow = window.open('', '_blank');
    if (imageWindow) {
      imageWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Prescription Image Viewer - SevaHealth</title>
            <style>
              body {
                margin: 0;
                background-color: #0f172a;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                font-family: system-ui, -apple-system, sans-serif;
                color: #e2e8f0;
              }
              .header {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                padding: 14px 24px;
                background: rgba(15, 23, 42, 0.9);
                backdrop-filter: blur(10px);
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                z-index: 10;
              }
              .title { font-weight: 800; font-size: 15px; color: #2dd4bf; }
              .sub { font-size: 12px; color: #94a3b8; font-weight: 600; }
              img {
                max-width: 92vw;
                max-height: 85vh;
                object-fit: contain;
                border-radius: 16px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
                margin-top: 50px;
                border: 1px solid rgba(255, 255, 255, 0.1);
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">🏥 SevaHealth Prescription Document Viewer</div>
              <div class="sub">Full High-Resolution View</div>
            </div>
            <img src="${imgUrl}" alt="Prescription Document Image" />
          </body>
        </html>
      `);
      imageWindow.document.close();
    }
  };

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

  // Auto-load saved document from PostgreSQL if docId is passed in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const docIdParam = params.get('docId') || params.get('id');
    if (docIdParam) {
      const loadSavedDoc = async () => {
        setUploading(true);
        setStageText('Loading saved medical document from vault...');
        try {
          const res = await api.get(`/api/documents/${docIdParam}/extraction-status/`);
          const statusData = res.data;
          setActiveDocId(docIdParam);
          setUploading(false);

          if (statusData && (statusData.status === 'complete' || statusData.medicines || statusData.extracted_text)) {
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
              extraction_method: statusData.extraction_method || 'Vault Saved Result',
              quality_metrics: statusData.quality_metrics || {},
              requires_review: statusData.requires_manual_review,
            });

            if (statusData.file_url || statusData.file) {
              setPreview(statusData.file_url || statusData.file);
            }
          }
        } catch (err) {
          console.error('Failed to load saved document:', err);
          setUploading(false);
        }
      };
      loadSavedDoc();
    }
  }, []);

  const handleSyncToReminders = async () => {
    if (!analyzed?.medicines?.length) return;
    setSyncingReminders(true);
    try {
      const res = await api.post('/api/reminders/schedules/sync-from-prescription/', {
        document_id: activeDocId,
        medicines: analyzed.medicines
      });
      setSyncedCount(res.data?.imported_count || analyzed.medicines.length);
    } catch (err) {
      console.error('Sync to reminders error:', err);
    } finally {
      setSyncingReminders(false);
    }
  };

  // WhatsApp Share Handler for Prescriptions & Lab Reports
  const handleShareWhatsApp = () => {
    if (!analyzed) return;

    let text = '';
    const isLab = isLabReportActive && analyzed.lab_report && analyzed.lab_report.parameters;

    if (isLab) {
      text = `🧪 *SevaHealth - Diagnostic Lab Report Summary*\n`;
      text += `📄 *Document:* ${docName || 'Lab Report'}\n\n`;
      text += `📊 *Summary:* Total Tests: ${analyzed.lab_report.param_count || 0} | 🟢 Normal: ${analyzed.lab_report.normal_count || 0} | ⚠️ Attention: ${analyzed.lab_report.abnormal_count || 0}\n\n`;
      text += `*Key Observations:*\n`;
      (analyzed.lab_report.parameters || []).forEach((param, idx) => {
        const statusEmoji = param.status === 'normal' ? '🟢' : '⚠️';
        text += `${idx + 1}. ${param.name}: ${param.value} ${param.unit || ''} (${statusEmoji} ${param.status_label || param.status})\n`;
      });
    } else {
      text = `🏥 *SevaHealth - Prescription Summary*\n`;
      text += `📄 *Document:* ${docName || 'Prescription'}\n\n`;

      if (analyzed.medicines && analyzed.medicines.length > 0) {
        text += `💊 *Prescribed Medicines (${analyzed.medicines.length}):*\n`;
        analyzed.medicines.forEach((med, idx) => {
          const name = med.medicine || med.name || 'Medicine';
          const dosage = med.dosage || med.strength || '';
          const freq = med.frequency || '';
          const dur = med.duration || '';
          text += `${idx + 1}. *${name}* ${dosage ? `- ${dosage}` : ''} ${freq ? `(${freq})` : ''} ${dur ? `for ${dur}` : ''}\n`;
        });
      } else {
        text += `No medicines extracted.\n`;
      }

      const spokenScript = getAudioScriptForSelectedLang();
      if (spokenScript) {
        text += `\n🗣️ *Patient Instructions:* ${spokenScript.slice(0, 250)}...\n`;
      }
    }

    text += `\n📱 _Shared via SevaHealth AI Assistant_`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
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
        console.warn('Falling back to browser speech synthesis');
        fallbackBrowserSpeech(textToSpeak, audioLang);
      };

      audio.play().catch(() => {
        fallbackBrowserSpeech(textToSpeak, audioLang);
      });
    } catch (streamErr) {
      console.warn('Audio stream error:', streamErr);
      fallbackBrowserSpeech(textToSpeak, audioLang);
    }
  };

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
      const docData = response.data;
      const docId = docData.id;
      setActiveDocId(docId);

      // Check if duplicate document was detected and reused from PostgreSQL
      if (docData.is_duplicate || docData.status === 'completed') {
        console.log('[DUPLICATE REUSE] Reusing saved extraction data from PostgreSQL for document #' + docId);
        setProgress(100);
        setStageText('Prescription already uploaded — using previously extracted results.');
        setUploading(false);
        setIsExtendedProcessing(false);
        setIsDuplicateNotice(true);

        const statusData = docData.extracted_data || {};
        const isLab = statusData.doc_classification === 'lab_report' ||
                      (statusData.lab_report && statusData.lab_report.is_lab_report);

        setAnalyzed({
          extracted_text: statusData.raw_ocr_text || statusData.extracted_text || docData.extracted_text || '',
          doc_classification: statusData.doc_classification || (isLab ? 'lab_report' : 'prescription'),
          medicines: Array.isArray(statusData.medicines) ? statusData.medicines : [],
          lab_report: statusData.lab_report || null,
          needs_verification: Array.isArray(statusData.needs_verification) ? statusData.needs_verification : [],
          medicines_found: statusData.medicines_found || (statusData.medicines ? statusData.medicines.length : 0),
          audio_script: statusData.audio_script || '',
          audio_scripts: statusData.audio_scripts || null,
          confidence: statusData.confidence || 0.98,
          extraction_method: statusData.extraction_method || 'PostgreSQL Saved Result (Duplicate Reused)',
          quality_metrics: statusData.quality_metrics || {},
          requires_review: statusData.requires_manual_review,
          db_doc: docData,
        });
        return;
      }

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
              <option value="mr-IN">మరాठी (Marathi)</option>
            </select>
          </div>
        </div>

      {/* 🚀 DUPLICATE REUSE NOTICE ALERT */}
      {isDuplicateNotice && (
        <Alert
          type="info"
          title="Prescription Already Uploaded"
          message="This exact prescription document was previously processed and stored in your PostgreSQL vault. Displaying saved clinical extraction results instantly without running OCR/LLM models again."
        />
      )}

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
                <FaVial /> <span>Lab Report ({analyzed.lab_report?.parameters?.length || 0})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {inlineError && (
        <Alert
          type="error"
          message={inlineError}
          onClose={() => setInlineError(null)}
        />
      )}

      {/* Extended Processing Alert */}
      {isExtendedProcessing && (
        <Alert
          type="warning"
          message="Medical extraction is running in the background. You can stay on this page or check your Health Records later for full results."
        />
      )}

      {/* 2-COLUMN MAIN WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN (5 COLS): Upload Box & Document Details */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-md space-y-5">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <FaCloudUploadAlt className="text-teal-600 dark:text-teal-400" />
              <span>Document Upload & Scanner</span>
            </h2>

            <form onSubmit={handleUpload} className="space-y-4">
              <Input
                label="Document Reference Name"
                placeholder="e.g. Apollo Prescription / Blood Test Jan 2026"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
              />

              {/* Upload Dropzone */}
              <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-teal-500 rounded-2xl p-6 text-center transition-all bg-slate-50/50 dark:bg-slate-900/40 group">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                {preview ? (
                  <div className="relative space-y-3">
                    {/* Top Right External Link Button (z-20 layer to bypass file input overlay) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const imgUrl = preview || analyzed?.file_url || analyzed?.file;
                        openImageInNewTab(imgUrl);
                      }}
                      className="absolute -top-2 -right-2 z-20 p-2 bg-slate-900/90 hover:bg-teal-600 text-white rounded-xl shadow-lg border border-slate-700 backdrop-blur-sm transition-all hover:scale-110"
                      title="Open document image in new tab"
                    >
                      <FaExternalLinkAlt className="text-xs" />
                    </button>

                    <img
                      src={preview}
                      alt="Prescription preview"
                      className="max-h-48 mx-auto rounded-xl shadow-md border border-slate-200 dark:border-slate-700 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setIsImageModalOpen(true)}
                    />
                    <p className="text-[11px] font-bold text-slate-400">Click image for preview modal or icon for new tab</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-slate-800 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto text-xl group-hover:scale-110 transition-transform">
                      <FaFileUpload />
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Drop prescription / lab report image here
                    </p>
                    <p className="text-[11px] text-slate-400">JPG, PNG, WEBP (Supports Handwritten Rx & Printed Labs)</p>
                  </div>
                )}
              </div>

              {/* Action Buttons: Camera Capture + Submit */}
              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs shrink-0"
                >
                  <FaCamera className="text-teal-500" />
                  <span>Snap Photo</span>
                </button>

                <Button
                  type="submit"
                  disabled={!file || uploading}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  {uploading ? (
                    <span>Analyzing Document...</span>
                  ) : (
                    <>
                      <FaRobot className="text-base" />
                      <span>Start AI Extraction</span>
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Progress Bar & Processing Steps */}
            {uploading && (
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>{stageText}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN (7 COLS): AI Extraction & Analysis Workspace */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-md min-h-[500px] flex flex-col justify-between">
            
            {/* Header Tabs: Clinical Summary / Voice Transcript / Raw OCR */}
            {analyzed && (
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveTab('analysis')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'analysis'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    Clinical Summary
                  </button>

                  <button
                    onClick={() => setActiveTab('audio_transcript')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'audio_transcript'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    Audio Script
                  </button>

                  <button
                    onClick={() => setActiveTab('raw_ocr')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'raw_ocr'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    Raw OCR Text
                  </button>
                </div>

                {/* Multilingual Audio Control Player */}
                <div className="flex items-center space-x-1.5">
                  {!isPlayingAudio ? (
                    <button
                      onClick={speakAudioScript}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs transition-all"
                    >
                      <FaPlay className="text-[10px]" /> <span>Listen Audio</span>
                    </button>
                  ) : isPausedAudio ? (
                    <button
                      onClick={handleResumeAudio}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs transition-all"
                    >
                      <FaPlay className="text-[10px]" /> <span>Resume</span>
                    </button>
                  ) : (
                    <button
                      onClick={handlePauseAudio}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs transition-all"
                    >
                      <FaPause className="text-[10px]" /> <span>Pause</span>
                    </button>
                  )}

                  {isPlayingAudio && (
                    <button
                      onClick={handleStopAudio}
                      className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-300"
                    >
                      <FaStop />
                    </button>
                  )}
                </div>
              </div>
            )}

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
                    Spoken Voice Guidance Transcript ({preferredLang.toUpperCase()})
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

                {/* WhatsApp Share & Reminder Actions */}
                <div className="p-3.5 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-[#1E293B] dark:to-[#172033] border border-teal-200 dark:border-slate-700 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-emerald-600 text-white text-sm shadow-xs">
                      <FaWhatsapp className="text-base" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Share Diagnostic Report</h4>
                      <p className="text-[11px] text-slate-500">Send test results directly via WhatsApp</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5 whitespace-nowrap"
                  >
                    <FaWhatsapp className="text-base" />
                    <span>Share on WhatsApp</span>
                  </button>
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
                
                {/* 1-Click Sync to Medication Reminders Schedule & WhatsApp Share */}
                {analyzed && (
                  <div className="p-3.5 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-[#1E293B] dark:to-[#172033] border border-teal-200 dark:border-slate-700 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-xl bg-teal-600 text-white text-sm shadow-xs">
                        <FaClock />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Prescription Actions</h4>
                        <p className="text-[11px] text-slate-500">Share output on WhatsApp or set daily reminder alarms</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleShareWhatsApp}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5 whitespace-nowrap"
                      >
                        <FaWhatsapp className="text-base" />
                        <span>Share on WhatsApp</span>
                      </button>

                      {analyzed.medicines && analyzed.medicines.length > 0 && (
                        syncedCount === null ? (
                          <button
                            type="button"
                            onClick={handleSyncToReminders}
                            disabled={syncingReminders}
                            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all whitespace-nowrap"
                          >
                            {syncingReminders ? 'Adding...' : '⏰ Set Reminders'}
                          </button>
                        ) : (
                          <a
                            href="/patient/reminders"
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5 whitespace-nowrap"
                          >
                            <FaCheckCircle className="text-xs" />
                            <span>Added {syncedCount} Meds</span>
                          </a>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Detected Medicines List */}
                <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                  {analyzed.medicines && analyzed.medicines.length > 0 ? (
                    analyzed.medicines.map((med, idx) => {
                      const dosageInfo = parseDosagePattern(
                        med?.dosage || med?.strength || '',
                        med?.frequency || '',
                        med?.timing || '',
                        med?.duration || ''
                      ) || {};

                      const hasSlots = Boolean(
                        dosageInfo?.hasSlotInfo &&
                        dosageInfo?.morning &&
                        dosageInfo?.afternoon &&
                        dosageInfo?.night
                      );

                      return (
                        <div
                          key={idx}
                          className="p-4 bg-white dark:bg-[#1E293B] border-l-4 border-teal-500 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/60 space-y-3"
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-slate-900 dark:text-slate-100 font-extrabold text-base">
                              {med?.medicine || med?.name || 'Prescribed Medicine'}
                            </span>
                            <span className="text-xs font-mono px-3 py-0.5 rounded-full bg-teal-100 dark:bg-slate-700 text-teal-800 dark:text-teal-300 font-bold shadow-xs">
                              {((med?.confidence || 0.95) * 100).toFixed(0)}% match
                            </span>
                          </div>

                          {/* 3-Slot Visual Schedule */}
                          {hasSlots && (
                            <div className="grid grid-cols-3 gap-2 pt-1">
                              <div className={`p-2 rounded-xl text-center border text-xs font-semibold ${
                                dosageInfo?.morning?.take
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-slate-100/80 dark:bg-slate-800/40 border-slate-200 text-slate-400 opacity-60'
                              }`}>
                                <span className="text-[10px] font-bold flex items-center justify-center space-x-1">
                                  <FaSun className="text-amber-500" /> <span>Morning</span>
                                </span>
                                <span className="font-black text-xs mt-0.5 block">
                                  {dosageInfo?.morning?.take ? `✓ Take (${dosageInfo?.morning?.count || 1})` : '✕ 0 (Skip)'}
                                </span>
                              </div>

                              <div className={`p-2 rounded-xl text-center border text-xs font-semibold ${
                                dosageInfo?.afternoon?.take
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-slate-100/80 dark:bg-slate-800/40 border-slate-200 text-slate-400 opacity-60'
                              }`}>
                                <span className="text-[10px] font-bold flex items-center justify-center space-x-1">
                                  <FaSun className="text-orange-500" /> <span>Afternoon</span>
                                </span>
                                <span className="font-black text-xs mt-0.5 block">
                                  {dosageInfo?.afternoon?.take ? `✓ Take (${dosageInfo?.afternoon?.count || 1})` : '✕ 0 (Skip)'}
                                </span>
                              </div>

                              <div className={`p-2 rounded-xl text-center border text-xs font-semibold ${
                                dosageInfo?.night?.take
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-slate-100/80 dark:bg-slate-800/40 border-slate-200 text-slate-400 opacity-60'
                              }`}>
                                <span className="text-[10px] font-bold flex items-center justify-center space-x-1">
                                  <FaMoon className="text-indigo-400" /> <span>Night</span>
                                </span>
                                <span className="font-black text-xs mt-0.5 block">
                                  {dosageInfo?.night?.take ? `✓ Take (${dosageInfo?.night?.count || 1})` : '✕ 0 (Skip)'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Tablet Usage in Preferred Language */}
                          {(med?.usage || med?.usage_te || med?.usage_hi || med?.usage_mr || med?.info) && (
                            <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900 rounded-xl text-xs space-y-1">
                              <span className="font-bold text-blue-900 dark:text-blue-300 flex items-center space-x-1">
                                <span>🎯</span>
                                <span>
                                  {preferredLang === 'te' ? 'టాబ్లెట్ ఉపయోగం (Usage / Purpose):' :
                                   preferredLang === 'hi' ? 'दवा का उपयोग (Usage / Purpose):' :
                                   preferredLang === 'mr' ? 'औषधाचा वापर (Usage / Purpose):' :
                                   'Tablet Purpose:'}
                                </span>
                              </span>
                              <p className="font-medium text-slate-800 dark:text-slate-200 leading-relaxed pl-5 text-xs">
                                {preferredLang === 'te' ? (med?.usage_te || med?.usage || med?.info) :
                                 preferredLang === 'hi' ? (med?.usage_hi || med?.usage || med?.info) :
                                 preferredLang === 'mr' ? (med?.usage_mr || med?.usage || med?.info) :
                                 (med?.usage || med?.info)}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900">
                      No prescription medicines detected. If this is a Lab Report, switch to <strong>Lab Report Mode</strong> above.
                    </div>
                  )}
                </div>
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

      {/* 🖼️ ORIGINAL PRESCRIPTION IMAGE FULL-SCREEN MODAL */}
      {isImageModalOpen && (preview || analyzed?.file_url || analyzed?.file) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white dark:bg-[#1E293B] max-w-4xl w-full rounded-3xl p-6 shadow-2xl relative border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FaEye className="text-teal-500 text-lg" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Uploaded Prescription / Document Image
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const imgUrl = preview || analyzed?.file_url || analyzed?.file;
                    openImageInNewTab(imgUrl);
                  }}
                  className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-teal-100 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-300 rounded-xl transition-colors"
                  title="Open image in new tab"
                >
                  <FaExternalLinkAlt className="text-xs" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-colors"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-slate-950 rounded-2xl p-3 border border-slate-800">
              <img
                src={preview || (analyzed?.file_url || analyzed?.file)}
                alt="Uploaded Prescription"
                className="max-h-[70vh] w-auto object-contain rounded-xl shadow-2xl"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="primary"
                onClick={() => setIsImageModalOpen(false)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadDocument;
