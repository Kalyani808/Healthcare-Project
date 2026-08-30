import React, { useState, useRef, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import CameraCaptureModal from '../../components/common/CameraCaptureModal';
import MarkdownMessage from '../../components/common/MarkdownMessage';
import api from '../../api/axios';
import {
  FaRobot, 
  FaPaperPlane, 
  FaMicrophone, 
  FaUser, 
  FaStop, 
  FaSpinner, 
  FaCheckCircle, 
  FaVolumeUp, 
  FaPills, 
  FaFileUpload, 
  FaLanguage, 
  FaLightbulb, 
  FaClock, 
  FaShieldAlt, 
  FaCamera,
  FaImage
} from 'react-icons/fa';
import { useOffline } from '../../context/OfflineContext';

const AIChatAssistant = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Namaste! Main aapka SevaHealth AI Sahayak hoon. Aap mujhse kisi bhi tablet, prescription ya swasthya samasya ke baare mein pooch sakte hain. (Telugu / Hindi / Marathi / English)',
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeMedicines, setActiveMedicines] = useState([]);
  const [prescriptionContext, setPrescriptionContext] = useState(null);
  const [uploadingRx, setUploadingRx] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const { isOffline } = useOffline();

  // Preferred Language: 'te', 'hi', 'mr', 'en'
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('preferred_language') || 'te';
  });

  // Audio Playback states
  const [playingMsgId, setPlayingMsgId] = useState(null);
  const [audioObj, setAudioObj] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Fetch active prescription medicines on load
  useEffect(() => {
    const fetchActivePrescriptions = async () => {
      try {
        const res = await api.get('/api/reminders/schedules/');
        const list = res.data.results || res.data;
        if (Array.isArray(list) && list.length > 0) {
          const meds = list.filter(m => m.is_active).map(m => ({
            name: m.medicine_name,
            dosage: m.dosage,
            timing: m.food_timing,
            frequency: m.frequency,
            instructions: m.instructions || m.usage_summary
          }));
          setActiveMedicines(meds);
          setPrescriptionContext({ active_medicines: meds });
        }
      } catch (err) {
        console.error('Failed to load active prescription context:', err);
      }
    };

    fetchActivePrescriptions();
  }, []);

  // Web Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        
        const langMap = { 'te': 'te-IN', 'hi': 'hi-IN', 'mr': 'mr-IN', 'en': 'en-IN' };
        recognition.lang = langMap[lang] || 'en-IN';

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInputQuery(transcript);
          setIsRecording(false);
        };

        recognition.onerror = (event) => {
          console.warn('Speech recognition error:', event.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('SpeechRecognition initialization error:', e);
      }
    }
  }, [lang]);

  const toggleRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your query or use Google Chrome / Microsoft Edge.');
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        const langMap = { 'te': 'te-IN', 'hi': 'hi-IN', 'mr': 'mr-IN', 'en': 'en-IN' };
        if (recognitionRef.current) {
          recognitionRef.current.lang = langMap[lang] || 'en-IN';
          recognitionRef.current.start();
          setIsRecording(true);
        }
      } catch (err) {
        console.error('Failed to start voice recognition:', err);
        setIsRecording(false);
      }
    }
  };

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputQuery;
    if (!textToSend.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: textToSend.trim(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    if (!customText) setInputQuery('');
    setLoading(true);

    try {
      const res = await api.post('/api/documents/chat/', {
        messages: newHistory.map(m => ({ sender: m.sender, text: m.text })),
        prescription_context: prescriptionContext,
        lang: lang,
      });

      if (res.data && res.data.response) {
        const aiMessage = {
          id: Date.now() + 1,
          sender: 'ai',
          text: res.data.response,
          isPharmacology: res.data.is_pharmacology_match
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (err) {
      console.error('Error during AI chat:', err);
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: 'Kripya thoda aaram karein aur boiled paani piyein. Yadi lakshan gambhir hain to turant doctor se sampark karein.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Process uploaded or camera-captured prescription file
  const processPrescriptionFile = async (file) => {
    if (!file) return;

    setUploadingRx(true);
    const tempUserMsg = {
      id: Date.now(),
      sender: 'user',
      text: `📎 Uploaded Prescription: ${file.name}`,
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_name', file.name);

      const uploadRes = await api.post('/api/documents/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const docId = uploadRes.data.id;
      // Trigger OCR
      await api.post(`/api/documents/${docId}/extract-text/`);

      // Poll extraction
      let pollAttempts = 0;
      const pollInterval = setInterval(async () => {
        pollAttempts++;
        try {
          const statusRes = await api.get(`/api/documents/${docId}/extraction-status/`);
          if (statusRes.data.status === 'translated' || statusRes.data.status === 'text_extracted' || pollAttempts > 6) {
            clearInterval(pollInterval);
            setUploadingRx(false);

            const extractedMeds = statusRes.data.medicines || [];
            if (extractedMeds.length > 0) {
              setActiveMedicines(extractedMeds);
              setPrescriptionContext({ active_medicines: extractedMeds });
            }

            const medSummaryText = extractedMeds.length > 0
              ? `📑 **Prescription Analyzed Successfully!**\n\nDetected Tablets:\n` +
                extractedMeds.map(m => `• **${m.name || m.medicine_name}** (${m.dosage || '1 tab'}) - ${m.timing || 'After food'}`).join('\n') +
                `\n\n💬 *You can now ask me any question about these tablets (food timings, purposes, side effects, or missed doses).*`
              : `📑 **Prescription Stored in Vault!**\nOCR text extracted. How can I assist you with your medications?`;

            setMessages(prev => [...prev, {
              id: Date.now() + 2,
              sender: 'ai',
              text: medSummaryText,
              isPharmacology: true
            }]);
          }
        } catch (pollErr) {
          clearInterval(pollInterval);
          setUploadingRx(false);
        }
      }, 1500);

    } catch (err) {
      console.error('Prescription upload failed:', err);
      setUploadingRx(false);
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        sender: 'ai',
        text: 'Prescription upload error. Please try uploading via the Upload Rx page or ask me your question directly.',
      }]);
    }
  };

  // Robust Spoken Voice Playback (POST Blob with Web Speech Fallback)
  const handlePlayVoice = async (msg) => {
    // If already playing this message, stop it
    if (audioObj) {
      audioObj.pause();
      setAudioObj(null);
      if (playingMsgId === msg.id) {
        setPlayingMsgId(null);
        window.speechSynthesis?.cancel();
        return;
      }
    }
    window.speechSynthesis?.cancel();

    const cleanText = msg.text.replace(/[*#•_`]/g, '').trim();
    if (!cleanText) return;

    setPlayingMsgId(msg.id);

    try {
      // 1. Try Backend gTTS Speech Engine via POST Blob
      const res = await api.post(
        '/api/documents/speak/',
        { text: cleanText.slice(0, 500), lang: lang },
        { responseType: 'blob' }
      );

      const blobUrl = URL.createObjectURL(res.data);
      const audio = new Audio(blobUrl);
      setAudioObj(audio);

      audio.onended = () => {
        setPlayingMsgId(null);
        setAudioObj(null);
        URL.revokeObjectURL(blobUrl);
      };

      audio.onerror = () => {
        fallbackBrowserSpeech(cleanText, msg.id);
      };

      await audio.play();
    } catch (err) {
      console.warn('Backend TTS failed, using browser speech synthesis fallback:', err);
      fallbackBrowserSpeech(cleanText, msg.id);
    }
  };

  const fallbackBrowserSpeech = (text, msgId) => {
    if (!('speechSynthesis' in window)) {
      setPlayingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langMap = { 'te': 'te-IN', 'hi': 'hi-IN', 'mr': 'mr-IN', 'en': 'en-IN' };
    utterance.lang = langMap[lang] || 'en-IN';
    utterance.rate = 0.95;

    utterance.onend = () => {
      setPlayingMsgId(null);
      setAudioObj(null);
    };

    utterance.onerror = () => {
      setPlayingMsgId(null);
      setAudioObj(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* 🌟 Header & Language Switcher */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-teal-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-2xl shadow-md">
              <FaRobot className="animate-bounce" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black text-white">Voice Health Sahayak</h1>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <p className="text-xs text-teal-300 font-semibold">
                AI Companion for Tablet Guidance & Prescription Understanding
              </p>
            </div>
          </div>

          {/* Regional Language Switcher */}
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

      {/* 📡 OFFLINE WARNING BANNER */}
      {isOffline && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900 rounded-2xl flex items-center space-x-3 text-xs text-amber-900 dark:text-amber-300 shadow-xs">
          <span className="text-base">📡</span>
          <p className="font-semibold">
            AI Health Sahayak requires an active internet connection to generate clinical guidance. You can still view your saved prescriptions and medication schedules in offline mode.
          </p>
        </div>
      )}

      {/* 💊 PRESCRIPTION CONTEXT BAR WITH CAMERA & FILE UPLOAD */}
      <div className="p-4 bg-teal-50 dark:bg-slate-800/90 border border-teal-200/80 dark:border-slate-700 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center text-sm shrink-0 shadow-xs">
            <FaPills />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-teal-700 dark:text-teal-400 block">
              Active Prescriptions in Context:
            </span>
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
              {activeMedicines.length > 0 
                ? activeMedicines.map(m => m.name || m.medicine_name).join(', ')
                : 'Augmentin 625mg, Pan-D, Dolo 650 (Default Clinical Protocol)'}
            </span>
          </div>
        </div>

        {/* 📷 Live Camera & 📁 Upload File Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => processPrescriptionFile(e.target.files[0])}
            accept="image/*"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs"
          >
            <FaCamera className="text-xs" />
            <span>Open Camera</span>
          </button>

          <button
            type="button"
            disabled={uploadingRx}
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-white dark:bg-[#1E293B] hover:bg-teal-50 dark:hover:bg-slate-700 border border-teal-200 dark:border-slate-700 text-teal-700 dark:text-teal-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs"
          >
            {uploadingRx ? <FaSpinner className="animate-spin text-xs" /> : <FaFileUpload className="text-xs" />}
            <span>{uploadingRx ? 'Scanning...' : 'Upload File'}</span>
          </button>
        </div>
      </div>

      {/* 💬 Suggested Quick Inquiry Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center space-x-1">
          <FaLightbulb className="text-amber-500" /> <span>Ask AI:</span>
        </span>
        {[
          'Explain my prescribed tablets',
          'When should I take Pan-D and Augmentin?',
          'What are the side effects of Dolo 650?',
          'Any food precautions for my medicines?',
          'What if I miss a morning dose?'
        ].map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(chip)}
            className="px-3 py-1.5 bg-white dark:bg-[#1E293B] hover:bg-teal-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 rounded-xl font-bold whitespace-nowrap shadow-xs transition-all hover:border-teal-400"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* 🗨️ CHAT MESSAGES WINDOW */}
      <Card className="p-4 sm:p-6 bg-white dark:bg-[#172033] border border-slate-200/80 dark:border-slate-700 shadow-md min-h-[420px] max-h-[500px] flex flex-col justify-between">
        
        {/* Messages Stream */}
        <div className="space-y-4 overflow-y-auto pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center text-sm shrink-0 shadow-xs mt-0.5">
                  <FaRobot />
                </div>
              )}

              <div className="space-y-1.5 max-w-[85%] sm:max-w-[75%]">
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-teal-600 text-white font-medium rounded-tr-none shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/60 dark:border-slate-700 shadow-xs'
                  }`}
                >
                  <MarkdownMessage content={msg.text} />
                </div>

                {/* Audio Read Aloud Button on AI Messages */}
                {msg.sender === 'ai' && (
                  <button
                    type="button"
                    onClick={() => handlePlayVoice(msg)}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shadow-xs ${
                      playingMsgId === msg.id
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700'
                    }`}
                  >
                    {playingMsgId === msg.id ? <FaStop /> : <FaVolumeUp />}
                    <span>{playingMsgId === msg.id ? 'Stop Voice' : `Listen Audio (${lang.toUpperCase()})`}</span>
                  </button>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center text-sm shrink-0 shadow-xs mt-0.5">
                  <FaUser />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center text-sm shrink-0">
                <FaRobot />
              </div>
              <div className="p-3.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs text-slate-500 flex items-center space-x-2">
                <FaSpinner className="animate-spin text-teal-600" />
                <span>Analyzing prescription pharmacology & tablets...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ⌨️ INPUT CONTROL BAR WITH MIC & CAMERA */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-700/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            {/* Live Camera Button */}
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 text-teal-600 dark:text-teal-400 rounded-2xl transition-all shadow-xs"
              title="Take Photo with Camera"
            >
              <FaCamera className="text-base" />
            </button>

            {/* Voice Microphone Button */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-3 rounded-2xl transition-all shadow-xs ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
              title="Speak query (Telugu, Hindi, Marathi, English)"
            >
              <FaMicrophone className="text-base" />
            </button>

            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={isOffline ? "AI Sahayak is offline. Connect to internet to ask questions..." : "Ask about your tablets, food timings, or symptoms..."}
              disabled={loading || isOffline}
              className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium disabled:opacity-60"
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!inputQuery.trim() || loading || isOffline}
              icon={FaPaperPlane}
              className="px-5 py-3 rounded-2xl font-bold text-xs disabled:opacity-50"
            >
              Send
            </Button>
          </form>
        </div>

      </Card>

      {/* 📷 Live Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(file) => processPrescriptionFile(file)}
        title="Snap Doctor Prescription / Lab Report Photo"
      />

    </div>
  );
};

export default AIChatAssistant;
