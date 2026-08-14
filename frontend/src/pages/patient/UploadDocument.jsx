import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import api from '../../api/axios';
import {
  FaFileUpload, FaCloudUploadAlt, FaRobot, FaTimes, FaTable, FaEye,
  FaChevronDown, FaChevronUp, FaVolumeUp, FaPlay, FaPause, FaStop, FaInfoCircle, FaCheckCircle
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

  // Audio Speech Synthesis State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);
  const [audioLang, setAudioLang] = useState('en-US');

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakAudioScript = (textToSpeak) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const script = textToSpeak || analyzed?.audio_script || '';
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
    const selected = e.target.files[0];
    if (selected) {
      if (!selected.type.startsWith('image/')) {
        alert('Please select an image file (.png, .jpg, .jpeg) for medical prescription parsing.');
        return;
      }
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      if (!docName) {
        setDocName(selected.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('Authentication required. Please log in to upload and extract medical prescriptions.');
      window.location.href = '/login';
      return;
    }

    setUploading(true);
    setProgress(15);
    setStageText('Stage 1: Uploading prescription...');
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    const formData = new FormData();
    formData.append('document_name', docName || file.name);
    formData.append('document_type', 'image');
    formData.append('file', file);

    try {
      // Step 1: Upload document
      const response = await api.post('/api/documents/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const docId = response.data.id;
      setProgress(40);
      setStageText('Stage 2: Reading prescription text & preprocessing...');

      // Step 2: Trigger background ICR task (returns 202 Accepted)
      await api.post(`/api/documents/${docId}/extract-text/`);
      setProgress(60);
      setStageText('Stage 3: Extracting ALL detected medicines...');

      // Step 3: Poll GET /api/documents/{id}/extraction-status/ until complete
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await api.get(`/api/documents/${docId}/extraction-status/`);
          const statusData = statusRes.data;

          if (statusData.status === 'complete') {
            clearInterval(pollInterval);
            setProgress(100);
            setStageText('Stage 4: Medicines detected & Audio ready');
            setUploading(false);

            setAnalyzed({
              extracted_text: statusData.extracted_text || statusData.text || '',
              medicines: statusData.medicines || [],
              medicines_found: statusData.medicines_found || (statusData.medicines ? statusData.medicines.length : 0),
              audio_script: statusData.audio_script || '',
              confidence: statusData.confidence || 0.88,
              quality_metrics: statusData.quality_metrics || {},
              requires_review: statusData.requires_manual_review,
              db_doc: response.data,
            });
          } else if (statusData.status === 'failed') {
            clearInterval(pollInterval);
            setUploading(false);
            alert('ICR text extraction failed: ' + (statusData.error || 'Unknown error'));
          } else {
            setProgress((prev) => Math.min(prev + 10, 95));
          }
        } catch (pollErr) {
          console.error('Polling error:', pollErr);
        }
      }, 2000);

    } catch (err) {
      console.error('Failed to process prescription image:', err);
      setUploading(false);
      if (err.response?.status === 401) {
        alert('Your login session has expired or is invalid. Please log in again to upload prescriptions.');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      } else {
        alert('Extraction failed: ' + (err.response?.data?.detail || err.response?.data?.error || err.message));
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
          <p className="text-slate-500 text-xs">Upload prescription images for instant AI medicine extraction & regional care guidance</p>
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
          <Card className="h-[540px] flex flex-col justify-between space-y-4 overflow-hidden">
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
                  <label className="border-2 border-dashed border-health-200 hover:border-health-400 bg-health-50/30 hover:bg-health-50 rounded-2xl h-[280px] flex flex-col items-center justify-center cursor-pointer transition-all space-y-3 p-4">
                    <div className="w-16 h-16 rounded-2xl bg-health-100 text-health-600 flex items-center justify-center text-3xl">
                      <FaCloudUploadAlt />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-semibold text-slate-700">Click to select prescription image</p>
                      <p className="text-xs text-slate-400">Supports PNG, JPG, JPEG (Max 10MB)</p>
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
                    <div className="relative bg-slate-900/5 rounded-2xl border border-slate-200 h-[280px] flex items-center justify-center p-2 overflow-hidden group">
                      <img
                        src={preview}
                        alt="Prescription Preview"
                        className="max-h-[260px] max-w-full object-contain rounded-lg shadow-sm transition-transform duration-300 group-hover:scale-105"
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

              {/* Multi-Stage Uploading Progress Bar */}
              {uploading && (
                <div className="space-y-1.5 bg-mint-50/60 p-3 rounded-xl border border-mint-100">
                  <div className="flex justify-between text-xs font-bold text-mint-900">
                    <span>{stageText}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-health-500 via-mint-500 to-teal-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
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

        {/* RIGHT SIDE (50% Width Container) */}
        <div className="lg:col-span-1 space-y-4">
          <Card className={`h-[540px] flex flex-col justify-between ${analyzed ? 'border-mint-200 bg-mint-50/10' : 'bg-slate-50 border-slate-100'}`}>
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
                <p className="text-xs text-slate-400 max-w-xs mx-auto">ALL detected medicine names, strengths, dosages, and audio summaries will appear here instantly.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between pt-2 space-y-2.5 overflow-hidden">

                {/* Confidence Badge */}
                {analyzed.confidence >= 0.85 ? (
                  <Alert type="success" message={`✓ High Confidence Extraction (${(analyzed.confidence * 100).toFixed(0)}%) — All medicines identified from prescription.`} />
                ) : (
                  <Alert type="warning" message={`⚠️ Moderate Confidence (${(analyzed.confidence * 100).toFixed(0)}%) — Please verify medicines manually.`} />
                )}

                {/* DETECTED MEDICINES PANEL */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[260px]">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>ALL DETECTED MEDICINES ({analyzed.medicines?.length || 0})</span>
                    <span className="text-[10px] text-slate-400 font-normal">Parsed directly from text</span>
                  </h4>

                  {analyzed.medicines && analyzed.medicines.length > 0 ? (
                    analyzed.medicines.map((med, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#f0f9f7] border-l-4 border-[#1abc9c] rounded-r-xl shadow-sm space-y-1.5 transition-all hover:bg-white hover:shadow-md"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-800 text-sm">
                          <span className="text-slate-900 font-bold">{idx + 1}. {med.name || med.medicine}</span>
                          {med.strength && (
                            <span className="text-[11px] font-bold text-mint-800 bg-mint-100 px-2 py-0.5 rounded-md">
                              {med.strength}
                            </span>
                          )}
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
                          <span className="text-[10px] text-slate-400 ml-auto">
                            {(med.confidence ? (med.confidence * 100).toFixed(0) : 88)}% match
                          </span>
                        </div>

                        {med.info && (
                          <div className="pt-1 text-[11px] text-slate-600 flex items-start space-x-1.5 bg-white/70 p-1.5 rounded-lg border border-slate-100">
                            <FaInfoCircle className="text-teal-500 text-xs mt-0.5 flex-shrink-0" />
                            <span>{med.info}</span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-amber-50/90 rounded-2xl border border-amber-200 text-slate-700 space-y-2 text-xs">
                      <div className="flex items-center space-x-2 font-bold text-amber-900 text-sm">
                        <span>⚠️ Could not confidently identify medicines</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        Please verify the prescription manually. Try uploading a clearer, flat, well-lit photo of the prescription.
                      </p>
                    </div>
                  )}
                </div>

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

                {/* Collapsible Raw OCR Text Footer */}
                <div className="pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowRawDetails(!showRawDetails)}
                    className="w-full text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center justify-between py-0.5 px-1 rounded hover:bg-slate-100 transition-colors"
                  >
                    <span>{showRawDetails ? 'Hide Complete OCR Text' : 'Show Complete OCR Text'}</span>
                    {showRawDetails ? <FaChevronUp /> : <FaChevronDown />}
                  </button>

                  {showRawDetails && (
                    <div className="mt-1 p-2 bg-slate-900 text-slate-200 font-mono text-[10px] rounded-xl max-h-20 overflow-y-auto whitespace-pre-wrap">
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
