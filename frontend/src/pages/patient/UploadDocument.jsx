import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import api from '../../api/axios';
import {
  FaFileUpload, FaCloudUploadAlt, FaRobot, FaTimes, FaTable, FaEye,
  FaChevronDown, FaChevronUp, FaVolumeUp, FaPlay, FaPause, FaStop, FaInfoCircle, FaCheckCircle, FaExclamationTriangle
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

  // Audio Speech Synthesis State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);
  const [audioLang, setAudioLang] = useState('en-US');

  const [isExtendedProcessing, setIsExtendedProcessing] = useState(false);
  const [inlineError, setInlineError] = useState(null);
  const [activeDocId, setActiveDocId] = useState(null);
  const [verificationInputs, setVerificationInputs] = useState({});

  const handleConfirmVerificationMedicine = (vIdx, item) => {
    const enteredName = verificationInputs[vIdx] !== undefined ? verificationInputs[vIdx] : item.suggested_name;
    if (!enteredName || !enteredName.strip ? !enteredName : !enteredName.trim()) return;

    const newConfirmedMed = {
      name: enteredName.trim().capitalize ? enteredName.trim().capitalize() : enteredName.trim(),
      medicine: enteredName.trim(),
      strength: item.strength || '',
      frequency: item.frequency || '',
      duration: item.duration || '',
      confidence: 0.95,
      confidence_label: 'High',
      verification_warning: 'User verified medicine entry',
      info: `Prescribed medication (${enteredName.trim()}). Verified manually from handwritten prescription stroke.`
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
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
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
          extracted_text: statusData.raw_ocr_text || statusData.extracted_text || statusData.text || '',
          medicines: statusData.medicines || [],
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
      if (audioLang.startsWith('hi')) return analyzed.audio_scripts.hi || analyzed.audio_script;
      if (audioLang.startsWith('mr')) return analyzed.audio_scripts.mr || analyzed.audio_script;
      return analyzed.audio_scripts.en || analyzed.audio_script;
    }
    return analyzed.audio_script || '';
  };

  const speakAudioScript = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.');
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
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPausedAudio(true);
    }
  };

  const handleResumeAudio = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPausedAudio(false);
    } else {
      speakAudioScript();
    }
  };

  const handleStopAudio = () => {
    window.speechSynthesis.cancel();
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

      // Poll up to 90 seconds (45 attempts @ 2s interval) without annoying popups
      let pollCount = 0;
      const maxPollAttempts = 45;

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
              medicines_found: statusData.medicines_found || (statusData.medicines ? statusData.medicines.length : 0),
              audio_script: statusData.audio_script || '',
              audio_scripts: statusData.audio_scripts || null,
              confidence: statusData.confidence || 0.88,
              extraction_method: statusData.extraction_method || 'ollama_mistral_json',
              quality_metrics: statusData.quality_metrics || {},
              requires_review: statusData.requires_manual_review,
              db_doc: response.data,
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
            setProgress((prev) => Math.min(prev + 5, 95));
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
      <div className="flex items-center space-x-4 pb-4 border-b border-slate-100">
        <div className="w-14 h-14 rounded-2xl bg-mint-500 text-white flex items-center justify-center text-2xl shadow-md">
          <FaFileUpload />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Upload Medical Document</h1>
          <p className="text-slate-500 text-xs">Upload prescription images for 100% local offline AI medicine extraction (GLM-OCR + Mistral 7B)</p>
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

        {/* LEFT SIDE (50% Width Container) */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="h-[560px] flex flex-col justify-between space-y-4 overflow-hidden">
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
                  <label className="border-2 border-dashed border-health-200 hover:border-health-400 bg-health-50/30 hover:bg-health-50 rounded-2xl h-[290px] flex flex-col items-center justify-center cursor-pointer transition-all space-y-3 p-4">
                    <div className="w-16 h-16 rounded-2xl bg-health-100 text-health-600 flex items-center justify-center text-3xl">
                      <FaCloudUploadAlt />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-semibold text-slate-700">Click to select prescription image</p>
                      <p className="text-xs text-slate-400">Supports PNG, JPG, JPEG (100% Offline Local Processing)</p>
                    </div>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs text-slate-500 font-semibold px-1">
                      <span>Prescription Image View</span>
                      <button
                        type="button"
                        onClick={() => { setFile(null); setPreview(null); setAnalyzed(null); if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }}
                        className="text-rose-500 hover:underline flex items-center space-x-1"
                      >
                        <FaTimes /> <span>Remove File</span>
                      </button>
                    </div>
                    <div className="relative bg-slate-900/5 rounded-2xl border border-slate-200 h-[290px] flex items-center justify-center p-2 overflow-hidden group">
                      <img
                        src={preview}
                        alt="Prescription Preview"
                        className="max-h-[270px] max-w-full object-contain rounded-lg shadow-sm transition-transform duration-300 group-hover:scale-105"
                      />
                      <a
                        href={preview}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white text-slate-700 rounded-xl shadow-md backdrop-blur transition-all"
                        title="View Full Resolution"
                      >
                        <FaEye />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Inline Error Banner */}
              {inlineError && (
                <Alert type="error" message={inlineError} className="text-xs" />
              )}

              {/* Extended Processing Non-Blocking Banner */}
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

              {/* Simple Processing Indicator */}
              {uploading && (
                <div className="p-3 bg-mint-50/80 border border-mint-200 rounded-xl flex items-center justify-center space-x-2 text-xs font-bold text-mint-900">
                  <div className="w-4 h-4 border-2 border-mint-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing prescription & extracting medicines...</span>
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

        {/* RIGHT SIDE (50% Width Container) */}
        <div className="lg:col-span-1 space-y-4">
          <Card className={`h-[560px] flex flex-col justify-between ${analyzed ? 'border-mint-200 bg-mint-50/10' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-base">
                <FaRobot className="text-tealSoft-500 text-xl" />
                <span>AI Medicine Extraction</span>
              </div>
              {analyzed && (
                <span className="text-[11px] font-semibold text-mint-700 bg-mint-100 px-2.5 py-1 rounded-full flex items-center space-x-1">
                  <FaCheckCircle className="text-mint-600" />
                  <span>{analyzed.medicines_found || 0} Medicines Found</span>
                </span>
              )}
            </div>

            {!analyzed ? (
              <div className="my-auto py-16 text-center text-slate-400 space-y-3">
                <FaTable className="text-4xl mx-auto opacity-40 text-tealSoft-400" />
                <p className="text-sm font-medium text-slate-600">Upload prescription image on left panel</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">GLM-OCR & Mistral 7B will extract ALL medicine entries, strengths, dosages, and audio summaries locally via Ollama.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between pt-2 space-y-2.5 overflow-hidden">

                {/* Confidence & Model Badge */}
                {analyzed.confidence >= 0.75 ? (
                  <Alert type="success" message={`✓ Local AI High Confidence (${(analyzed.confidence * 100).toFixed(0)}%) — Extracted via ${analyzed.extraction_method || 'GLM-OCR + Mistral'}.`} />
                ) : (
                  <Alert type="warning" message={`⚠️ Local AI Extraction (${(analyzed.confidence * 100).toFixed(0)}%) — Please verify candidate items with doctor.`} />
                )}

                {/* DETECTED MEDICINES PANEL */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[250px]">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>ALL DETECTED MEDICINES ({analyzed.medicines?.length || 0})</span>
                    <span className="text-[10px] text-slate-400 font-normal">Parsed via Mistral 7B</span>
                  </h4>

                  {analyzed.medicines && analyzed.medicines.length > 0 ? (
                    analyzed.medicines.map((med, idx) => {
                      const confPct = med.confidence ? Math.round(med.confidence * 100) : 85;
                      const confLabel = med.confidence_label || (confPct >= 75 ? 'High' : confPct >= 50 ? 'Medium' : 'Needs verification');
                      const isHigh = confPct >= 75;
                      const isMedium = confPct >= 50 && confPct < 75;

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-r-xl border-l-4 shadow-sm space-y-1.5 transition-all hover:bg-white hover:shadow-md ${
                            isHigh
                              ? 'bg-[#f0f9f7] border-[#1abc9c]'
                              : isMedium
                              ? 'bg-amber-50/70 border-amber-400'
                              : 'bg-orange-50/80 border-orange-500'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold text-slate-800 text-sm">
                            <span className="text-slate-900 font-bold">{idx + 1}. {med.name || med.medicine} {med.strength}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isHigh
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isMedium
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-orange-100 text-orange-900'
                              }`}
                            >
                              {confPct}% {confLabel}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                            {med.frequency && (
                              <span className="bg-teal-50 text-teal-800 font-semibold px-2 py-0.5 rounded-md border border-teal-100">
                                Frequency: {med.frequency}
                              </span>
                            )}
                            {med.duration && (
                              <span className="bg-blue-50 text-blue-800 font-semibold px-2 py-0.5 rounded-md border border-blue-100">
                                Duration: {med.duration}
                              </span>
                            )}
                            {med.timing && (
                              <span className="bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-md border border-emerald-100">
                                Timing: {med.timing}
                              </span>
                            )}
                            {med.verification_warning && (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md flex items-center space-x-1">
                                <span>⚠️ {med.verification_warning}</span>
                              </span>
                            )}
                          </div>

                          {showMedInfo && med.info && (
                            <div className="pt-1 text-[11px] text-slate-600 flex items-start space-x-1.5 bg-white/80 p-1.5 rounded-lg border border-slate-100">
                              <FaInfoCircle className="text-teal-500 text-xs mt-0.5 flex-shrink-0" />
                              <span>{med.info}</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 bg-amber-50/90 rounded-2xl border border-amber-200 text-slate-700 space-y-2 text-xs">
                      <div className="flex items-center space-x-2 font-bold text-amber-900 text-sm">
                        <FaExclamationTriangle className="text-amber-600" />
                        <span>Could not identify medicines</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        Please verify that local Ollama is running (`http://localhost:11434`) and model `glm-ocr` or `mistral` is pulled.
                      </p>
                    </div>
                  )}
                </div>

                {/* UNCERTAIN MEDICINE ENTRIES (REQUIRES MANUAL VERIFICATION) */}
                {analyzed.needs_verification && analyzed.needs_verification.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900">
                      <FaExclamationTriangle className="text-amber-600" />
                      <span>Uncertain Prescription Lines (Requires Manual Verification)</span>
                    </div>
                    {analyzed.needs_verification.map((item, vIdx) => (
                      <div key={vIdx} className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5 text-xs">
                        <div className="flex justify-between items-center text-slate-700">
                          <span className="font-semibold text-slate-900">Handwriting Stroke:</span>
                          <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">Needs Verification</span>
                        </div>
                        <p className="font-mono text-slate-800 bg-white p-1.5 rounded border border-amber-200 text-[11px]">{item.raw_text}</p>
                        <div className="flex space-x-2 pt-1">
                          <input
                            type="text"
                            placeholder="Type correct medicine name (e.g. Nodosis 500mg)"
                            value={verificationInputs[vIdx] !== undefined ? verificationInputs[vIdx] : (item.suggested_name || '')}
                            onChange={(e) => setVerificationInputs({ ...verificationInputs, [vIdx]: e.target.value })}
                            className="flex-1 px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-amber-500 font-semibold"
                          />
                          <button
                            type="button"
                            onClick={() => handleConfirmVerificationMedicine(vIdx, item)}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-all flex items-center space-x-1"
                          >
                            <FaCheckCircle className="text-xs" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* AUDIO TTS PLAYER CONTROLS */}
                {analyzed.audio_script && (
                  <div className="p-2.5 bg-slate-900 text-white rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1.5 text-mint-400 font-bold">
                        <FaVolumeUp className="text-sm" />
                        <span>Prescription Audio Guidance</span>
                      </div>
                      <select
                        value={audioLang}
                        onChange={(e) => setAudioLang(e.target.value)}
                        className="bg-slate-800 text-slate-200 text-[11px] px-2 py-1 rounded-lg border border-slate-700 focus:outline-none"
                      >
                        <option value="en-US">English</option>
                        <option value="hi-IN">Hindi (हिंदी)</option>
                        <option value="mr-IN">Marathi (मराठी)</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-2">
                      {!isPlayingAudio ? (
                        <button
                          type="button"
                          onClick={() => speakAudioScript()}
                          className="flex-1 py-1.5 px-3 bg-mint-500 hover:bg-mint-600 text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 transition-colors"
                        >
                          <FaPlay className="text-[10px]" />
                          <span>Listen to Medicine Summary</span>
                        </button>
                      ) : isPausedAudio ? (
                        <button
                          type="button"
                          onClick={handleResumeAudio}
                          className="flex-1 py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 transition-colors"
                        >
                          <FaPlay className="text-[10px]" />
                          <span>Resume Audio</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handlePauseAudio}
                          className="flex-1 py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 transition-colors"
                        >
                          <FaPause className="text-[10px]" />
                          <span>Pause Audio</span>
                        </button>
                      )}

                      {isPlayingAudio && (
                        <button
                          type="button"
                          onClick={handleStopAudio}
                          className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-1 transition-colors"
                        >
                          <FaStop className="text-[10px]" />
                          <span>Stop</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Collapsible Drawers Footer: [ Show OCR Text ] & [ Medicine Information ] */}
                <div className="pt-1 border-t border-slate-100 flex flex-col space-y-1">
                  <div className="flex items-center justify-between space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowMedInfo(!showMedInfo)}
                      className="text-[11px] text-teal-600 hover:underline font-semibold flex items-center space-x-1 px-1 py-0.5"
                    >
                      <FaInfoCircle className="text-xs" />
                      <span>{showMedInfo ? 'Hide Medicine Info' : 'Medicine Information'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRawDetails(!showRawDetails)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold flex items-center space-x-1 px-1 py-0.5 rounded hover:bg-slate-100 transition-colors"
                    >
                      <span>{showRawDetails ? 'Hide OCR Text' : 'Show OCR Text'}</span>
                      {showRawDetails ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                  </div>

                  {showRawDetails && (
                    <div className="p-2 bg-slate-900 text-slate-200 font-mono text-[10px] rounded-xl max-h-24 overflow-y-auto whitespace-pre-wrap">
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
