import React, { useState, useEffect, useRef } from 'react';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import api from '../../api/axios';
import { parseDosagePattern } from '../../utils/dosageFormatter';
import {
  FaFileUpload, FaCloudUploadAlt, FaRobot, FaTimes, FaTable, FaEye,
  FaChevronDown, FaChevronUp, FaVolumeUp, FaPlay, FaPause, FaStop, FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaPills, FaSun, FaMoon, FaClock
} from 'react-icons/fa';

const UploadDocument = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [docName, setDocName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState('Uploading prescription...');
  const [analyzed, setAnalyzed] = useState(null);
  const [showRawDetails, setShowRawDetails] = useState(false);
  const [showMedInfo, setShowMedInfo] = useState(true);

  // Audio Speech Synthesis & Streaming State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);
  const [audioLang, setAudioLang] = useState(() => {
    return localStorage.getItem('preferred_language') || 'te-IN';
  });
  const audioPlayerRef = useRef(null);

  const [isExtendedProcessing, setIsExtendedProcessing] = useState(false);
  const [inlineError, setInlineError] = useState(null);
  const [activeDocId, setActiveDocId] = useState(null);
  const [verificationInputs, setVerificationInputs] = useState({});

  const handleConfirmVerificationMedicine = (vIdx, item) => {
    const enteredName = verificationInputs[vIdx] !== undefined ? verificationInputs[vIdx] : item.suggested_name;
    if (!enteredName || !enteredName.trim()) return;

    const newConfirmedMed = {
      name: enteredName.trim().charAt(0).toUpperCase() + enteredName.trim().slice(1),
      medicine: enteredName.trim(),
      strength: item.strength || '',
      frequency: item.frequency || '',
      duration: item.duration || '',
      confidence: 0.95,
      confidence_label: 'High',
      timing: item.timing || '',
      dosage: item.strength || item.frequency || '',
      info: item.suggested_name ? `${item.suggested_name} confirmed by user.` : 'Prescribed medicine confirmed by user.'
    };

    setAnalyzed((prev) => {
      if (!prev) return prev;
      const updatedMeds = [...(prev.medicines || []), newConfirmedMed];
      const updatedNeedsVer = (prev.needs_verification || []).filter((_, idx) => idx !== vIdx);
      return {
        ...prev,
        medicines: updatedMeds,
        medicines_found: updatedMeds.length,
        needs_verification: updatedNeedsVer
      };
    });

    setVerificationInputs((prev) => {
      const copy = { ...prev };
      delete copy[vIdx];
      return copy;
    });
  };

  useEffect(() => {
    const handleLangChange = (e) => {
      if (e.detail?.lang) {
        setAudioLang(e.detail.lang);
      }
    };
    window.addEventListener('language-changed', handleLangChange);
    return () => {
      handleStopAudio();
      window.removeEventListener('language-changed', handleLangChange);
    };
  }, []);

  const checkDocStatusManually = async (docIdToPoll) => {
    const id = docIdToPoll || activeDocId;
    if (!id) return;
    try {
      const statusRes = await api.get(`/api/documents/${id}/extraction-status/`);
      const statusData = statusRes.data;
      if (statusData.status === 'complete') {
        setUploading(false);
        setIsExtendedProcessing(false);
        setInlineError(null);
        setAnalyzed({
          document_id: statusData.document_id || id,
          extracted_text: statusData.raw_ocr_text || statusData.extracted_text || statusData.text || '',
          medicines: statusData.medicines || [],
          needs_verification: statusData.needs_verification || [],
          medicines_found: statusData.medicines_found || (statusData.medicines ? statusData.medicines.length : 0),
          audio_script: statusData.audio_script || '',
          audio_scripts: statusData.audio_scripts || null,
          confidence: statusData.confidence || 0.88,
          extraction_method: statusData.extraction_method || 'ollama_mistral_json',
          quality_metrics: statusData.quality_metrics || {},
          requires_review: statusData.requires_manual_review,
        });
      } else if (statusData.status === 'failed') {
        setUploading(false);
        setIsExtendedProcessing(false);
        setInlineError(statusData.error_message || statusData.error || 'Extraction failed on local engine.');
      }
    } catch (e) {
      console.error('Manual status check error:', e);
    }
  };

  const getAudioScriptForSelectedLang = () => {
    if (!analyzed) return '';
    if (analyzed.audio_scripts) {
      if (audioLang.startsWith('te')) return analyzed.audio_scripts.te || analyzed.audio_script;
      if (audioLang.startsWith('hi')) return analyzed.audio_scripts.hi || analyzed.audio_script;
      if (audioLang.startsWith('mr')) return analyzed.audio_scripts.mr || analyzed.audio_script;
      return analyzed.audio_scripts.en || analyzed.audio_script;
    }
    return analyzed.audio_script || '';
  };

  const speakAudioScript = async () => {
    handleStopAudio();
    const docId = activeDocId || (analyzed && analyzed.document_id);

    // 1. Try High-Quality Native Backend Audio Streaming (Telugu, Hindi, Marathi, English)
    if (docId) {
      try {
        setIsPlayingAudio(true);
        setIsPausedAudio(false);
        const res = await api.get(`/api/documents/${docId}/audio/?lang=${audioLang}`, {
          responseType: 'blob'
        });
        const blobUrl = URL.createObjectURL(res.data);
        const audio = new Audio(blobUrl);
        audioPlayerRef.current = audio;

        audio.onended = () => {
          setIsPlayingAudio(false);
          setIsPausedAudio(false);
        };
        audio.onerror = () => {
          fallbackSpeechSynthesis();
        };

        await audio.play();
        return;
      } catch (err) {
        console.warn('Backend audio streaming failed, using fallback:', err);
      }
    }

    // 2. Fallback to Web Speech Synthesis
    fallbackSpeechSynthesis();
  };

  const fallbackSpeechSynthesis = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.');
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
      return;
    }
    window.speechSynthesis.cancel();
    const script = getAudioScriptForSelectedLang();
    if (!script) return;

    const utterance = new SpeechSynthesisUtterance(script);
    utterance.lang = audioLang;

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
    if (audioPlayerRef.current && !audioPlayerRef.current.paused) {
      audioPlayerRef.current.pause();
      setIsPausedAudio(true);
    } else if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPausedAudio(true);
    }
  };

  const handleResumeAudio = () => {
    if (audioPlayerRef.current && audioPlayerRef.current.paused) {
      audioPlayerRef.current.play();
      setIsPausedAudio(false);
    } else if (window.speechSynthesis && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPausedAudio(false);
    } else {
      speakAudioScript();
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
    setProgress(20);
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
      setProgress(40);
      setStageText('Stage 2: GLM-OCR Vision reading prescription image...');

      await api.post(`/api/documents/${docId}/extract-text/`);
      setProgress(60);
      setStageText('Stage 3: Mistral 7B extracting structured medicine records...');

      // Poll up to 240 seconds (120 attempts @ 2s interval) for deep handwritten prescription vision+LLM extraction
      let pollCount = 0;
      const maxPollAttempts = 120;

      const pollInterval = setInterval(async () => {
        pollCount += 1;
        try {
          const statusRes = await api.get(`/api/documents/${docId}/extraction-status/`);
          const statusData = statusRes.data;

          if (statusData.status === 'complete') {
            clearInterval(pollInterval);
            setProgress(100);
            setStageText('Stage 4: Extraction complete');
            setUploading(false);
            setIsExtendedProcessing(false);

            setAnalyzed({
              extracted_text: statusData.raw_ocr_text || statusData.extracted_text || statusData.text || '',
              medicines: statusData.medicines || [],
              needs_verification: statusData.needs_verification || [],
              medicines_found: statusData.medicines_found || (statusData.medicines ? statusData.medicines.length : 0),
              audio_script: statusData.audio_script || '',
              audio_scripts: statusData.audio_scripts || null,
              confidence: statusData.confidence || 0.88,
              extraction_method: statusData.extraction_method || 'ollama_mistral_json',
              quality_metrics: statusData.quality_metrics || {},
              requires_review: statusData.requires_manual_review,
              db_doc: response ? response.data : null,
            });
          } else if (statusData.status === 'failed') {
            clearInterval(pollInterval);
            setUploading(false);
            setIsExtendedProcessing(false);
            setInlineError(statusData.error_message || statusData.error || 'Local Ollama vision/LLM extraction failed.');
          } else if (pollCount >= maxPollAttempts) {
            clearInterval(pollInterval);
            setUploading(false);
            setIsExtendedProcessing(true);
          } else {
            setProgress((prev) => {
              const next = Math.min(prev + 4, 95);
              if (next >= 85) {
                setStageText('Stage 3: Verifying medicines against dictionary & generating audio...');
              } else if (next >= 65) {
                setStageText('Stage 2: Parsing dosage, timings & duration...');
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
      }, 2000);

    } catch (err) {
      console.error('Upload error:', err);
      setUploading(false);
      if (err.response?.status === 401) {
        setInlineError('Session expired. Please log in again.');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      } else {
        setInlineError('Upload error: ' + (err.response?.data?.detail || err.response?.data?.error || err.message));
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center space-x-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="w-14 h-14 rounded-2xl bg-mint-500 text-white flex items-center justify-center text-2xl shadow-md">
          <FaFileUpload />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Upload Medical Document</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs">Upload prescription images for 100% local offline AI medicine extraction (GLM-OCR + Mistral 7B)</p>
        </div>
      </div>

      {!localStorage.getItem('access_token') && (
        <Alert
          type="warning"
          message="⚠️ You are currently browsing as a guest. Please Log In or Register Free to run AI medicine extraction."
        />
      )}

      {/* Equal 50/50 Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* LEFT SIDE (50% Width Container - Upload & Preview) */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="h-[640px] flex flex-col justify-between space-y-4 overflow-hidden shadow-md">
            <form onSubmit={handleUpload} className="h-full flex flex-col justify-between space-y-3">

              <div className="space-y-3">
                <Input
                  label="Document Name"
                  placeholder="e.g. Dr_Sharma_Prescription_Aug"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  required
                />

                {!preview ? (
                  <label className="border-2 border-dashed border-health-200 dark:border-slate-700 hover:border-health-400 dark:hover:border-health-500 bg-health-50/30 dark:bg-[#1E293B]/40 hover:bg-health-50 dark:hover:bg-[#1E293B]/80 rounded-2xl h-[340px] flex flex-col items-center justify-center cursor-pointer transition-all space-y-3 p-6">
                    <div className="w-16 h-16 rounded-2xl bg-health-100 dark:bg-slate-700 text-health-600 dark:text-health-400 flex items-center justify-center text-3xl">
                      <FaCloudUploadAlt />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-base font-semibold text-slate-700 dark:text-slate-200">Click to select prescription image</p>
                      <p className="text-xs text-slate-400 dark:text-slate-400">Supports JPG, PNG, WEBP prescription photos</p>
                    </div>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 font-semibold px-1">
                      <span>Prescription Image View</span>
                      <button
                        type="button"
                        onClick={() => { setFile(null); setPreview(null); setAnalyzed(null); if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }}
                        className="text-rose-500 hover:underline flex items-center space-x-1"
                      >
                        <FaTimes /> <span>Remove File</span>
                      </button>
                    </div>
                    <div className="relative bg-slate-900/5 dark:bg-[#0B1220] rounded-2xl border border-slate-200 dark:border-slate-700 h-[340px] flex items-center justify-center p-3 overflow-hidden group">
                      <img
                        src={preview}
                        alt="Prescription Preview"
                        className="max-h-[320px] max-w-full object-contain rounded-lg shadow-sm transition-transform duration-300 group-hover:scale-105"
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
              </div>

              {inlineError && (
                <Alert type="error" message={inlineError} className="text-xs" />
              )}

              {isExtendedProcessing && !analyzed && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900">
                  <div className="flex items-center space-x-2 font-bold">
                    <FaInfoCircle className="text-amber-600 text-sm flex-shrink-0" />
                    <span>Still processing, this can take a bit longer for handwritten prescriptions.</span>
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
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span>{stageText || 'Extracting medicines with GLM-OCR + Mistral...'}</span>
                    <span>{progress}%</span>
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
                {uploading ? 'Processing...' : 'Upload & Extract Medicines'}
              </Button>

            </form>
          </Card>
        </div>

        {/* RIGHT SIDE (50% Width Container - AI Medicine Extraction Results) */}
        <div className="lg:col-span-1 space-y-4">
          <Card className={`h-[640px] flex flex-col justify-between shadow-md ${analyzed ? 'border-mint-200 dark:border-slate-700/80 bg-mint-50/10 dark:bg-[#172033]' : 'bg-slate-50 dark:bg-[#172033] border-slate-100 dark:border-slate-700/80'}`}>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-700/80 shrink-0">
              <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-100 font-bold text-base">
                <FaRobot className="text-tealSoft-500 text-xl" />
                <span>AI Medicine Extraction</span>
              </div>
              {analyzed && (
                <span className="text-xs font-bold text-mint-700 dark:text-mint-300 bg-mint-100 dark:bg-slate-800 px-3 py-1 rounded-full flex items-center space-x-1.5 shadow-sm">
                  <FaPills /> <span>{(analyzed.medicines ? analyzed.medicines.length : 0) + (analyzed.medicines_only ? analyzed.medicines_only.length : 0)} Medicines Found</span>
                </span>
              )}
            </div>

            {!analyzed ? (
              <div className="my-auto py-20 text-center text-slate-400 dark:text-slate-400 space-y-4">
                <FaTable className="text-5xl mx-auto opacity-40 text-tealSoft-400" />
                <p className="text-base font-semibold text-slate-600 dark:text-slate-300">Upload prescription image on left panel</p>
                <p className="text-xs text-slate-400 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">Extracted medicine names, dosages, and humanized daily schedules will appear here instantly with full audio instructions.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between pt-3 space-y-3.5 overflow-hidden">

                {/* 1. Confidence & Model Badge */}
                <div className="shrink-0">
                  {analyzed.confidence >= 0.75 ? (
                    <Alert type="success" message={`✓ High Confidence Extraction (${(analyzed.confidence * 100).toFixed(0)}%) — Method: ${analyzed.extraction_method || 'Vision LLM'}.`} />
                  ) : (
                    <Alert type="warning" message={`⚠️ Candidate Items (${(analyzed.confidence * 100).toFixed(0)}%) — Please verify handwritten entries with doctor.`} />
                  )}
                </div>

                {/* 2. TOP PRIORITY: DETECTED MEDICINES CARDS PANEL (Moved to TOP with 16-20px card spacing & generous padding) */}
                <div className="flex-1 overflow-y-auto pr-1.5 space-y-4 min-h-[220px]">
                  <div className="flex items-center justify-between sticky top-0 bg-[#f8fafc]/90 dark:bg-[#172033]/90 backdrop-blur py-1 z-10">
                    <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                      <FaPills className="text-tealSoft-500 text-sm" />
                      <span>DETECTED MEDICINES ({analyzed.medicines?.length || 0})</span>
                    </h4>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">Clear Visual Dosage Schedule</span>
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
                          className="p-4.5 sm:p-5 bg-white dark:bg-[#1E293B] border-l-4 border-[#1abc9c] rounded-r-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/60 space-y-3 transition-all hover:shadow-md hover:border-[#1abc9c]"
                        >
                          {/* Medicine Header: Name & Match Score */}
                          <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-100 text-base">
                            <span className="text-slate-900 dark:text-slate-100 font-extrabold tracking-tight">{med.medicine || med.name || med.raw_text || med.raw_line}</span>
                            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-mint-100 dark:bg-slate-700 text-mint-800 dark:text-mint-300 font-bold shadow-xs">
                              {(med.confidence ? (med.confidence * 100).toFixed(0) : 95)}% match
                            </span>
                          </div>

                          {/* Human-Friendly Dosage Schedule (Morning / Afternoon / Night) */}
                          {dosageInfo.hasSlotInfo && (
                            <div className="grid grid-cols-3 gap-2.5 pt-1">
                              {/* Morning Slot */}
                              <div className={`p-2 rounded-xl text-center border text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                                dosageInfo.morning.take
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 shadow-sm'
                                  : 'bg-slate-100/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 opacity-60'
                              }`}>
                                <span className="text-[10px] font-bold flex items-center space-x-1">
                                  <FaSun className="text-amber-500" /> <span>Morning</span>
                                </span>
                                <span className="font-extrabold text-xs mt-0.5">
                                  {dosageInfo.morning.take ? `✓ Take (${dosageInfo.morning.count})` : '✕ 0 (Skip)'}
                                </span>
                              </div>

                              {/* Afternoon Slot */}
                              <div className={`p-2 rounded-xl text-center border text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                                dosageInfo.afternoon.take
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 shadow-sm'
                                  : 'bg-slate-100/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 opacity-60'
                              }`}>
                                <span className="text-[10px] font-bold flex items-center space-x-1">
                                  <FaSun className="text-orange-500" /> <span>Afternoon</span>
                                </span>
                                <span className="font-extrabold text-xs mt-0.5">
                                  {dosageInfo.afternoon.take ? `✓ Take (${dosageInfo.afternoon.count})` : '✕ 0 (Skip)'}
                                </span>
                              </div>

                              {/* Night Slot */}
                              <div className={`p-2 rounded-xl text-center border text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                                dosageInfo.night.take
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 shadow-sm'
                                  : 'bg-slate-100/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 opacity-60'
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

                          {/* Plain-English Instructions Banner */}
                          <div className="text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-start space-x-2">
                            <span className="font-bold text-mint-700 dark:text-mint-400 shrink-0">📋 Instructions:</span>
                            <span className="font-medium leading-relaxed">{dosageInfo.humanSummary}</span>
                          </div>

                          {showMedInfo && med.info && (
                            <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start space-x-2 bg-mint-50/50 dark:bg-slate-900/40 p-2 rounded-lg border border-mint-100 dark:border-slate-800/60">
                              <FaInfoCircle className="text-teal-500 text-xs mt-0.5 flex-shrink-0" />
                              <span className="leading-relaxed">{med.info}</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : analyzed.medicines_only && analyzed.medicines_only.length > 0 ? (
                    analyzed.medicines_only.map((medStr, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-white dark:bg-[#1E293B] border-l-4 border-[#1abc9c] rounded-r-xl shadow-sm border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-sm flex items-center justify-between transition-all hover:shadow-md"
                      >
                        <span className="font-semibold text-slate-800 dark:text-slate-100 leading-snug">{medStr}</span>
                        <span className="text-xs uppercase font-bold text-mint-800 dark:text-mint-300 bg-mint-100 dark:bg-slate-700 px-2.5 py-1 rounded-full ml-2 flex-shrink-0">
                          Rx
                        </span>
                      </div>
                    ))
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

                {/* 3. VOICE GUIDANCE PLAYER & MULTILINGUAL TRANSLATION (Moved BELOW detected medicines) */}
                {(analyzed.audio_script || analyzed.audio_scripts) && (
                  <div className="p-3 bg-mint-50/90 dark:bg-[#1E293B] border border-mint-200 dark:border-slate-700/80 rounded-2xl space-y-2.5 shrink-0 shadow-xs">
                    <div className="flex items-center justify-between text-xs font-bold text-mint-900 dark:text-mint-200">
                      <span className="flex items-center space-x-1.5">
                        <FaVolumeUp className="text-mint-600 dark:text-mint-400 text-sm" />
                        <span>Voice Guidance Player</span>
                      </span>
                      <select
                        value={audioLang}
                        onChange={(e) => {
                          const newLang = e.target.value;
                          setAudioLang(newLang);
                          localStorage.setItem('preferred_language', newLang);
                          window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang: newLang } }));
                        }}
                        className="text-[11px] bg-white dark:bg-[#0B1220] border border-mint-300 dark:border-slate-600 rounded-lg px-2.5 py-1 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs"
                      >
                        <option value="te-IN">Telugu (తెలుగు)</option>
                        <option value="en-US">English (Voice)</option>
                        <option value="hi-IN">Hindi (हिंदी)</option>
                        <option value="mr-IN">Marathi (मराठी)</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-2">
                      {!isPlayingAudio ? (
                        <button
                          type="button"
                          onClick={speakAudioScript}
                          className="px-3.5 py-1.5 bg-mint-600 hover:bg-mint-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
                        >
                          <FaPlay className="text-[10px]" /> <span>Listen Audio Instructions</span>
                        </button>
                      ) : isPausedAudio ? (
                        <button
                          type="button"
                          onClick={handleResumeAudio}
                          className="px-3.5 py-1.5 bg-mint-600 hover:bg-mint-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
                        >
                          <FaPlay className="text-[10px]" /> <span>Resume Audio</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handlePauseAudio}
                          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
                        >
                          <FaPause className="text-[10px]" /> <span>Pause</span>
                        </button>
                      )}

                      {isPlayingAudio && (
                        <button
                          type="button"
                          onClick={handleStopAudio}
                          className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all"
                        >
                          <FaStop className="text-[10px]" /> <span>Stop</span>
                        </button>
                      )}
                    </div>

                    {/* Multilingual Translation Text Preview with Readable Line Height */}
                    {getAudioScriptForSelectedLang() && (
                      <div className="p-2.5 bg-white/95 dark:bg-[#0B1220] rounded-xl border border-mint-200/80 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 leading-relaxed max-h-24 overflow-y-auto shadow-inner">
                        <div className="flex items-center justify-between text-[10px] font-bold text-mint-800 dark:text-mint-400 mb-1 pb-1 border-b border-slate-100 dark:border-slate-800">
                          <span>
                            {audioLang.startsWith('te') ? '🔊 తెలుగు అనువాదం (Telugu Transcript)' :
                             audioLang.startsWith('hi') ? '🔊 हिंदी अनुवाद (Hindi Transcript)' :
                             audioLang.startsWith('mr') ? '🔊 मराठी भाषांतर (Marathi Transcript)' :
                             '🔊 English Voice Guidance Transcript'}
                          </span>
                          <span className="font-mono text-[9px] text-slate-400">
                            {isPlayingAudio ? '● Streaming Audio' : 'Ready'}
                          </span>
                        </div>
                        <p className="font-medium text-[11.5px] leading-relaxed tracking-normal">{getAudioScriptForSelectedLang()}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Quick Action: Open AI Voice Assistant Button */}
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('open-voice-assistant', {
                      detail: { prescriptionContext: analyzed.medicines }
                    }));
                  }}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-mint-500 to-tealSoft-500 hover:from-mint-600 hover:to-tealSoft-600 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-all shrink-0"
                >
                  <FaRobot className="text-sm" />
                  <span>💬 Ask Voice Assistant About These Dosages & Timings</span>
                </button>

                {/* 5. Expandable Raw OCR Text Footer */}
                <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700/80 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowRawDetails(!showRawDetails)}
                    className="w-full text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span>{showRawDetails ? 'Hide Full Raw Text Details' : 'Show Full Raw Text Details'}</span>
                    {showRawDetails ? <FaChevronUp /> : <FaChevronDown />}
                  </button>

                  {showRawDetails && (
                    <div className="mt-1.5 p-2.5 bg-slate-900 text-slate-200 font-mono text-[10px] rounded-xl max-h-24 overflow-y-auto whitespace-pre-wrap leading-relaxed">
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
