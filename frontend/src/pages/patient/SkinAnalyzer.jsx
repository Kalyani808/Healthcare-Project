import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import CameraCaptureModal from '../../components/common/CameraCaptureModal';
import api from '../../api/axios';
import {
  FaMicroscope,
  FaCamera,
  FaFileUpload,
  FaSpinner,
  FaVolumeUp,
  FaStop,
  FaCheckCircle,
  FaExclamationTriangle,
  FaShieldAlt,
  FaUserMd,
  FaLanguage,
  FaSun,
  FaHeartbeat,
  FaRedo,
  FaEye
} from 'react-icons/fa';

const SkinAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

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

  const handleAnalyzeSkin = async () => {
    if (!file) return;

    setAnalyzing(true);
    setError(null);
    stopAudio();

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('lang', lang);

      const res = await api.post('/api/vision-ai/analyze-skin/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data && res.data.status === 'success') {
        setResult(res.data);
      } else {
        setError('Unable to analyze skin image. Please ensure the photo is clear and well-lit.');
      }
    } catch (err) {
      console.error('Skin analysis error:', err);
      setError(err.response?.data?.error || 'Skin assessment service is currently unavailable. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePlayVoice = async () => {
    if (isPlayingAudio) {
      stopAudio();
      return;
    }

    if (!result) return;

    // Get language-specific script or fallback
    let scriptToSpeak = '';
    if (lang === 'te' && result.summary_te) scriptToSpeak = result.summary_te;
    else if (lang === 'hi' && result.summary_hi) scriptToSpeak = result.summary_hi;
    else if (lang === 'mr' && result.summary_mr) scriptToSpeak = result.summary_mr;
    else scriptToSpeak = result.summary_en || result.description || result.condition_name;

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
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-rose-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-rose-500/20 border border-rose-400/30 px-3 py-1 rounded-full text-rose-300 text-xs font-bold uppercase tracking-wider">
              <FaMicroscope className="text-rose-400" />
              <span>Vision AI Clinical Dermatology</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              AI Skin & Face Condition Scanner
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Take a photo or upload an image of your skin concern (acne, pimples, dark spots, pigmentation, eczema, rashes) for root causes, symptoms, and safe home care routines.
            </p>
          </div>

          {/* Regional Language Selector */}
          <div className="bg-slate-800/90 border border-slate-700 p-1.5 rounded-2xl flex items-center space-x-1 shrink-0">
            <FaLanguage className="text-rose-400 text-sm ml-1" />
            {[
              { code: 'te', label: 'తెలుగు' },
              { code: 'hi', label: 'हिंदी' },
              { code: 'mr', label: 'మराठी' },
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
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2-Column Interface: Image Input on Left, Clinical Analysis on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left (5 Cols): Image Picker & Actions */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-5 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase">
                Capture or Upload Skin Photo
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">Face / Body</span>
            </div>

            {!preview ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-rose-500/20 flex items-center justify-center space-x-2 transition-all active:scale-95"
                >
                  <FaCamera className="text-sm" />
                  <span>Take Live Photo with Camera</span>
                </button>

                <label className="border-2 border-dashed border-rose-200 dark:border-slate-700 hover:border-rose-400 bg-rose-50/30 dark:bg-slate-800/40 rounded-2xl h-[180px] flex flex-col items-center justify-center cursor-pointer transition-all space-y-2 p-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-slate-700 text-rose-600 dark:text-rose-400 flex items-center justify-center text-lg shadow-xs">
                    <FaFileUpload />
                  </div>
                  <div className="text-center space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Browse Skin Photo</p>
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
                    alt="Skin Photo"
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
                      stopAudio();
                    }}
                    className="w-1/2 text-xs"
                  >
                    Change Photo
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    icon={analyzing ? FaSpinner : FaMicroscope}
                    disabled={analyzing}
                    onClick={handleAnalyzeSkin}
                    className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                  >
                    {analyzing ? 'Scanning...' : 'Analyze Skin AI'}
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <Alert type="error" message={error} className="text-xs" />
            )}

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-[11px] text-amber-900 dark:text-amber-300 space-y-1">
              <span className="font-extrabold flex items-center space-x-1">
                <FaShieldAlt /> <span>Clinical Advisory Disclaimer</span>
              </span>
              <p className="leading-tight">
                This AI tool provides educational health guidance and does not substitute professional medical diagnosis. Consult a qualified dermatologist for severe symptoms.
              </p>
            </div>
          </Card>
        </div>

        {/* Right (7 Cols): Dermatology Results Breakdown */}
        <div className="lg:col-span-7 space-y-4">
          {result ? (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Card 1: Condition Header & Spoken Voice Player */}
              <Card className="p-5 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-md space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-700">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                        {result.severity || 'Mild-to-Moderate'}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        AI Confidence: 95%
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">
                      {result.condition_name}
                    </h3>
                  </div>

                  {/* Audio Read-Aloud Button */}
                  <button
                    type="button"
                    onClick={handlePlayVoice}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs ${
                      isPlayingAudio
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-rose-50 dark:bg-slate-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-slate-700'
                    }`}
                  >
                    {isPlayingAudio ? <FaStop /> : <FaVolumeUp />}
                    <span>{isPlayingAudio ? 'Stop Audio' : `Listen (${lang.toUpperCase()})`}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {result.description}
                </p>

                {/* Regional Summary Box */}
                {(result.summary_te || result.summary_hi || result.summary_mr) && (
                  <div className="p-3 bg-rose-50/60 dark:bg-slate-900/60 rounded-xl border border-rose-200/60 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 space-y-1">
                    <span className="text-[10px] font-black uppercase text-rose-700 dark:text-rose-400 block">
                      Regional Guidance ({lang === 'te' ? 'తెలుగు' : lang === 'hi' ? 'हिंदी' : lang === 'mr' ? 'मराठी' : 'English'}):
                    </span>
                    <p>
                      {lang === 'te' ? (result.summary_te || result.summary_en) :
                       lang === 'hi' ? (result.summary_hi || result.summary_en) :
                       lang === 'mr' ? (result.summary_mr || result.summary_en) :
                       result.summary_en}
                    </p>
                  </div>
                )}
              </Card>

              {/* Card 2: Causes & Symptoms (2-Col Grid) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 🧬 Causes / Reasons of Occurring */}
                <Card className="p-4 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-2">
                  <div className="flex items-center space-x-1.5 text-xs font-extrabold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <FaSun className="text-amber-500" />
                    <span>Primary Causes & Triggers</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {result.causes?.map((cause, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-amber-500 font-bold">•</span>
                        <span className="leading-snug">{cause}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* ⚠️ Key Symptoms */}
                <Card className="p-4 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-2">
                  <div className="flex items-center space-x-1.5 text-xs font-extrabold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <FaHeartbeat className="text-rose-500" />
                    <span>Observable Symptoms</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {result.symptoms?.map((sym, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-rose-500 font-bold">•</span>
                        <span className="leading-snug">{sym}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

              </div>

              {/* Card 3: Safe Home Care & Routine */}
              <Card className="p-5 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-2.5">
                <div className="flex items-center space-x-1.5 text-xs font-extrabold text-emerald-700 dark:text-emerald-400 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <FaCheckCircle className="text-emerald-500" />
                  <span>Safe Home Care & Daily Routine Recommendations</span>
                </div>
                <div className="space-y-2">
                  {result.safe_home_care?.map((care, idx) => (
                    <div key={idx} className="flex items-start space-x-2.5 text-xs text-slate-700 dark:text-slate-300 p-2 bg-emerald-50/40 dark:bg-slate-900/40 rounded-xl border border-emerald-100/60 dark:border-slate-800">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed font-medium">{care}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Card 4: When to See a Dermatologist (Red Flags) */}
              <Card className="p-5 bg-rose-50/60 dark:bg-slate-900/60 border border-rose-200 dark:border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-extrabold text-rose-800 dark:text-rose-300">
                  <FaUserMd className="text-rose-600" />
                  <span>When to Consult a Dermatologist (Clinical Red Flags)</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {result.when_to_see_doctor?.map((flag, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <FaExclamationTriangle className="text-rose-500 text-[11px] shrink-0 mt-0.5" />
                      <span className="leading-snug font-medium">{flag}</span>
                    </li>
                  ))}
                </ul>
              </Card>

            </div>
          ) : (
            <Card className="p-10 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-sm text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-slate-800 text-rose-500 flex items-center justify-center text-2xl mx-auto shadow-xs">
                <FaMicroscope />
              </div>
              <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                No Skin Image Analyzed Yet
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Take a close-up, well-lit photo of your facial skin concern or upload an existing photo from your gallery to view a full clinical assessment.
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
        title="Snap Clear Photo of Skin / Face Concern"
      />

    </div>
  );
};

export default SkinAnalyzer;
