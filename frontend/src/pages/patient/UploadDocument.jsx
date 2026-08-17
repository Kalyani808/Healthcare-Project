import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import api from '../../api/axios';
import {
  FaFileUpload, FaCloudUploadAlt, FaRobot, FaTimes, FaTable, FaEye,
  FaChevronDown, FaChevronUp, FaVolumeUp, FaPlay, FaPause, FaStop, FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaPills
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
            setProgress((prev) => Math.min(prev + 2, 95));
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

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
                  <label className="border-2 border-dashed border-health-200 dark:border-slate-700 hover:border-health-400 dark:hover:border-health-500 bg-health-50/30 dark:bg-[#1E293B]/40 hover:bg-health-50 dark:hover:bg-[#1E293B]/80 rounded-2xl h-[290px] flex flex-col items-center justify-center cursor-pointer transition-all space-y-3 p-4">
                    <div className="w-16 h-16 rounded-2xl bg-health-100 dark:bg-slate-700 text-health-600 dark:text-health-400 flex items-center justify-center text-3xl">
                      <FaCloudUploadAlt />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Click to select prescription image</p>
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
                    <div className="relative bg-slate-900/5 dark:bg-[#0B1220] rounded-2xl border border-slate-200 dark:border-slate-700 h-[290px] flex items-center justify-center p-2 overflow-hidden group">
                      <img
                        src={preview}
                        alt="Prescription Preview"
                        className="max-h-[270px] max-w-full object-contain rounded-lg shadow-sm transition-transform duration-300 group-hover:scale-105"
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

        <div className="lg:col-span-1 space-y-4">
          <Card className={`h-[560px] flex flex-col justify-between ${analyzed ? 'border-mint-200 dark:border-slate-700/80 bg-mint-50/10 dark:bg-[#172033]' : 'bg-slate-50 dark:bg-[#172033] border-slate-100 dark:border-slate-700/80'}`}>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-700/80">
              <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-100 font-bold text-base">
                <FaRobot className="text-tealSoft-500 text-xl" />
                <span>AI Medicine Extraction</span>
              </div>
              {analyzed && (
                <span className="text-[11px] font-semibold text-mint-700 dark:text-mint-300 bg-mint-100 dark:bg-slate-800 px-2.5 py-1 rounded-full flex items-center space-x-1">
                  <FaPills /> <span>{(analyzed.medicines ? analyzed.medicines.length : 0) + (analyzed.medicines_only ? analyzed.medicines_only.length : 0)} Medicines Found</span>
                </span>
              )}
            </div>

            {!analyzed ? (
              <div className="my-auto py-16 text-center text-slate-400 dark:text-slate-400 space-y-3">
                <FaTable className="text-4xl mx-auto opacity-40 text-tealSoft-400" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Upload prescription image on left panel</p>
                <p className="text-xs text-slate-400 dark:text-slate-400 max-w-xs mx-auto">Extracted medicine names, dosages, and instructions will appear here instantly.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between pt-2 space-y-2.5 overflow-hidden">

                {analyzed.confidence >= 0.75 ? (
                  <Alert type="success" message={`✓ High Confidence Extraction (${(analyzed.confidence * 100).toFixed(0)}%) — Method: ${analyzed.extraction_method || 'Vision LLM'}.`} />
                ) : (
                  <Alert type="warning" message={`⚠️ Candidate Items (${(analyzed.confidence * 100).toFixed(0)}%) — Please verify handwritten entries with doctor.`} />
                )}

                {(analyzed.audio_script || analyzed.audio_scripts) && (
                  <div className="p-2.5 bg-mint-50/80 dark:bg-[#1E293B] border border-mint-200 dark:border-slate-700 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-mint-900 dark:text-mint-200">
                      <span className="flex items-center space-x-1.5">
                        <FaVolumeUp className="text-mint-600 dark:text-mint-400" />
                        <span>Voice Guidance Player</span>
                      </span>
                      <select
                        value={audioLang}
                        onChange={(e) => setAudioLang(e.target.value)}
                        className="text-[11px] bg-white dark:bg-[#0B1220] border border-mint-300 dark:border-slate-600 rounded-lg px-2 py-0.5 font-semibold text-slate-700 dark:text-slate-200"
                      >
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
                          className="px-3 py-1 bg-mint-600 hover:bg-mint-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-sm transition-colors"
                        >
                          <FaPlay className="text-[10px]" /> <span>Listen Instructions</span>
                        </button>
                      ) : isPausedAudio ? (
                        <button
                          type="button"
                          onClick={handleResumeAudio}
                          className="px-3 py-1 bg-mint-600 hover:bg-mint-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-sm transition-colors"
                        >
                          <FaPlay className="text-[10px]" /> <span>Resume</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handlePauseAudio}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-sm transition-colors"
                        >
                          <FaPause className="text-[10px]" /> <span>Pause</span>
                        </button>
                      )}

                      {isPlayingAudio && (
                        <button
                          type="button"
                          onClick={handleStopAudio}
                          className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors"
                        >
                          <FaStop className="text-[10px]" /> <span>Stop</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 max-h-[300px]">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>DETECTED MEDICINES</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 font-normal">Filtered Medicine Names Only</span>
                  </h4>

                  {analyzed.medicines && analyzed.medicines.length > 0 ? (
                    analyzed.medicines.map((med, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#f0f9f7] dark:bg-[#1E293B] border-l-4 border-[#1abc9c] rounded-r-xl shadow-sm space-y-1 transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-md"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-100 text-sm">
                          <span className="text-slate-900 dark:text-slate-100">{med.medicine || med.name || med.raw_text || med.raw_line}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-mint-100 dark:bg-slate-700 text-mint-800 dark:text-mint-300 font-bold">
                            {(med.confidence ? (med.confidence * 100).toFixed(0) : 95)}% match
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                          <span className="truncate pr-2">{med.raw_text || med.raw_line || med.found_as || med.timing}</span>
                          {(med.dosage || med.strength) && (
                            <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-slate-700 px-2 py-0.5 rounded-md flex-shrink-0">
                              {med.dosage || med.strength} {med.frequency ? `• ${med.frequency}` : ''}
                            </span>
                          )}
                        </div>

                        {showMedInfo && med.info && (
                          <div className="pt-1 text-[11px] text-slate-600 dark:text-slate-300 flex items-start space-x-1.5 bg-white/80 dark:bg-slate-900/60 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                            <FaInfoCircle className="text-teal-500 text-xs mt-0.5 flex-shrink-0" />
                            <span>{med.info}</span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : analyzed.medicines_only && analyzed.medicines_only.length > 0 ? (
                    analyzed.medicines_only.map((medStr, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#f0f9f7] dark:bg-[#1E293B] border-l-4 border-[#1abc9c] rounded-r-xl shadow-sm text-slate-800 dark:text-slate-100 font-medium text-sm flex items-center justify-between transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-md"
                      >
                        <span className="font-semibold text-slate-800 dark:text-slate-100 leading-snug">{medStr}</span>
                        <span className="text-[10px] uppercase font-bold text-mint-800 dark:text-mint-300 bg-mint-100 dark:bg-slate-700 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
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

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80">
                  <button
                    type="button"
                    onClick={() => setShowRawDetails(!showRawDetails)}
                    className="w-full text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span>{showRawDetails ? 'Hide Full Raw Text Details' : 'Show Full Raw Text Details'}</span>
                    {showRawDetails ? <FaChevronUp /> : <FaChevronDown />}
                  </button>

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
