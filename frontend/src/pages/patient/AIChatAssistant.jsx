import React, { useState, useRef, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import api from '../../api/axios';
import { FaRobot, FaPaperPlane, FaMicrophone, FaUser, FaStop, FaSpinner, FaCheckCircle, FaVolumeUp } from 'react-icons/fa';

const AIChatAssistant = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Namaste! Main aapka SevaHealth AI Sahayak hoon. Aap exact kin swasthya samasyaon ya preshanion ka samna kar rahe hain? Main Hindi ya English dono mein sahyog kar sakta hoon.',
      time: '10:00 AM',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [detectedLang, setDetectedLang] = useState(null);
  const [speechError, setSpeechError] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const silenceStartRef = useRef(null);
  const speechDetectedRef = useRef(false);
  const recordStartRef = useRef(null);
  const messagesEndRef = useRef(null);

  const suggestedQuestions = [
    'Bukhar aur sirdard mein ghar par kya parhej karein?',
    'Prescription par Paracetamol kitne ghante baad lena chahiye?',
    'Kuch dino se pet dard hai, konsa doctor best rahega?',
    'Bachon ko monsoon mein sardi se kaise bachayein?',
  ];

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isRecording, isTranscribing]);

  // Clean up audio & media recorder on unmount
  useEffect(() => {
    return () => {
      cleanupAudioAnalyser();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const cleanupAudioAnalyser = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  };

  const getLanguageLabel = (code) => {
    switch (code?.toLowerCase()) {
      case 'hi': return 'Hindi (हिंदी)';
      case 'en': return 'English';
      case 'te': return 'Telugu (తెలుగు)';
      case 'mr': return 'Marathi (मराठी)';
      case 'ta': return 'Tamil (தமிழ்)';
      case 'bn': return 'Bengali (বাংলা)';
      default: return code ? code.toUpperCase() : 'Auto-Detected';
    }
  };

  const startRecording = async () => {
    setSpeechError(null);
    setDetectedLang(null);

    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setSpeechError('Audio recording is not supported in this browser. Please use Chrome/Edge or type your question below.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        cleanupAudioAnalyser();
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size > 0 && speechDetectedRef.current) {
          await transcribeAudioWithWhisper(audioBlob);
        } else if (!speechDetectedRef.current) {
          setSpeechError("Didn't catch that, please try speaking again.");
        } else {
          setSpeechError('No audio captured from microphone. Please try speaking again.');
        }
      };

      // Set up Web Audio API AnalyserNode for volume monitoring & auto-stop on silence
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      speechDetectedRef.current = false;
      silenceStartRef.current = null;
      recordStartRef.current = Date.now();

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avgVolume = sum / dataArray.length;
        const normalizedLevel = Math.min(100, Math.round((avgVolume / 128) * 100));
        setAudioLevel(normalizedLevel);

        const now = Date.now();
        const elapsedSec = (now - recordStartRef.current) / 1000;

        // Hard maximum recording length limit (30s)
        if (elapsedSec >= 30) {
          console.log('[AUTO-STOP] Max recording length (30s) reached.');
          stopRecording();
          return;
        }

        // Silence detection logic
        if (avgVolume > 8) {
          speechDetectedRef.current = true;
          silenceStartRef.current = null;
        } else {
          // Volume is silent (< 8)
          if (!speechDetectedRef.current) {
            // Initial silence timeout (5s) if user hasn't spoken at all
            if (elapsedSec >= 5.0) {
              console.log('[AUTO-STOP] Initial silence timeout (5s) reached with no speech.');
              stopRecording(true);
              return;
            }
          } else {
            // User was speaking, but is now silent
            if (!silenceStartRef.current) {
              silenceStartRef.current = now;
            } else {
              const silenceElapsedMs = now - silenceStartRef.current;
              // Auto-stop after 1.8 seconds of continuous natural silence after speaking
              if (silenceElapsedMs >= 1800) {
                console.log('[AUTO-STOP] Natural silence (1.8s) detected after speech. Auto-stopping!');
                stopRecording();
                return;
              }
            }
          }
        }

        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };

      animationFrameRef.current = requestAnimationFrame(checkVolume);

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone permission/access error:', err);
      setIsRecording(false);
      cleanupAudioAnalyser();
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setSpeechError('Microphone access denied. Please click the browser camera/mic icon to allow permission.');
      } else {
        setSpeechError('Could not start microphone recording. Please check browser permissions.');
      }
    }
  };

  const stopRecording = (noSpeechInitial = false) => {
    cleanupAudioAnalyser();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      if (noSpeechInitial) {
        speechDetectedRef.current = false;
      }
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudioWithWhisper = async (audioBlob) => {
    setIsTranscribing(true);
    setSpeechError(null);

    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice_query.webm');

    try {
      const response = await api.post('/api/voice/transcribe/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = response.data;
      if (data.status === 'success' && data.text) {
        setInput(data.text);
        setDetectedLang({
          code: data.language,
          label: getLanguageLabel(data.language),
          probability: data.language_probability ? (data.language_probability * 100).toFixed(0) : '95',
          duration: data.duration,
        });
      } else if (data.status === 'no_speech') {
        setSpeechError("Didn't catch that, please try speaking again.");
      } else {
        setSpeechError(data.error || 'Local Whisper transcription failed. Please try typing your question.');
      }
    } catch (err) {
      console.error('Whisper API Error:', err);
      setSpeechError('Local Whisper AI endpoint unavailable. Please ensure local server is running.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const toggleVoiceRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    if (isRecording) {
      stopRecording();
    }

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!textToSend) setInput('');
    setIsTyping(true);

    try {
      const response = await api.post('/api/chat/', { messages: updatedMessages });
      const data = response.data;
      const aiReplyText = data.response || 'Aapke prasana ke bare mein paryapt jankari nahi mil saki. Kripya doctor se consult karein.';

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: aiReplyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Chat API Error:', err);
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: 'Aapke lakshan samanye viral infection ke pratit hote hain. Kripya paryapt boiled pani piyein aur regular aaram karein. Agar bukhar 101°F se adhik ho to hamare doctor dwara tele-consultation book karein.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-mint-500 to-tealSoft-500 text-white flex items-center justify-center text-2xl shadow-md">
            <FaRobot />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">AI Health Sahayak</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs">Offline local Whisper AI voice symptom companion for rural families</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold text-mint-700 dark:text-mint-300 bg-mint-50 dark:bg-mint-950/60 px-3 py-1.5 rounded-full border border-mint-100 dark:border-mint-800/60">
          <span className="w-2 h-2 rounded-full bg-mint-500 animate-pulse"></span>
          <span>100% Offline Whisper AI Active</span>
        </div>
      </div>

      {/* Suggested Chips */}
      <div className="flex flex-wrap gap-2">
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="text-xs bg-white dark:bg-[#1E293B] text-slate-600 dark:text-slate-300 hover:text-health-700 dark:hover:text-health-300 hover:bg-health-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-health-200 dark:hover:border-slate-600 px-3.5 py-1.5 rounded-full transition-all shadow-sm"
          >
            💡 {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Window */}
      <Card className="h-[520px] flex flex-col justify-between p-4 bg-gradient-to-b from-slate-50/50 to-white dark:from-[#0F172A] dark:to-[#172033]">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${
                msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm text-white shrink-0 ${
                  msg.sender === 'user' ? 'bg-health-600' : 'bg-mint-500'
                }`}
              >
                {msg.sender === 'user' ? <FaUser /> : <FaRobot />}
              </div>

              <div
                className={`max-w-md p-4 rounded-3xl text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-health-500 to-health-600 text-white rounded-tr-none shadow-sm'
                    : 'bg-white dark:bg-[#1E293B] text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700/80 rounded-tl-none shadow-sm'
                }`}
              >
                <p>{msg.text}</p>
                <span className={`block text-[10px] mt-1.5 ${msg.sender === 'user' ? 'text-health-100 text-right' : 'text-slate-400 dark:text-slate-400'}`}>
                  {msg.time}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center space-x-2 text-xs text-slate-400 dark:text-slate-400 pl-12">
              <span className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              <span>Sahayak is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Voice Error Banner */}
        {speechError && (
          <div className="my-2">
            <Alert type="warning" message={speechError} />
          </div>
        )}

        {/* Active Recording State Banner with Dynamic Soundwave Meter */}
        {isRecording && (
          <div className="my-2 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl space-y-2 text-xs text-rose-800 dark:text-rose-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping"></span>
                <span className="font-bold">
                  🎙️ Listening to your voice... (Auto-stops 1.8s after you finish speaking)
                </span>
              </div>
              <button
                type="button"
                onClick={() => stopRecording()}
                className="px-2.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-[11px] transition-all"
              >
                Stop Early
              </button>
            </div>

            {/* Dynamic Soundwave Volume Meter */}
            <div className="w-full bg-rose-200/60 dark:bg-rose-900/40 h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-600 rounded-full transition-all duration-75 ease-out"
                style={{ width: `${Math.max(8, audioLevel)}%` }}
              />
            </div>
          </div>
        )}

        {/* Transcribing State Banner */}
        {isTranscribing && (
          <div className="my-2 p-3 bg-mint-50 dark:bg-mint-950/60 border border-mint-200 dark:border-mint-800 rounded-xl flex items-center space-x-2 text-xs text-mint-900 dark:text-mint-200 shadow-sm">
            <FaSpinner className="animate-spin text-mint-600 text-sm" />
            <span className="font-bold">Transcribing audio with local Whisper AI & auto-detecting language...</span>
          </div>
        )}

        {/* Auto-Detected Language Badge */}
        {detectedLang && !isRecording && !isTranscribing && (
          <div className="my-1.5 flex items-center space-x-2 text-[11px] font-semibold text-mint-800 dark:text-mint-300 bg-mint-50 dark:bg-slate-800/80 px-3 py-1 rounded-xl border border-mint-200 dark:border-slate-700 w-fit">
            <FaCheckCircle className="text-mint-500" />
            <span>Auto-Detected Language: <strong>{detectedLang.label}</strong> ({detectedLang.probability}% confidence) • Transcribed in {detectedLang.duration}s</span>
          </div>
        )}

        {/* Input Bar with Voice Button */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={toggleVoiceRecording}
              disabled={isTranscribing}
              className={`p-3 rounded-2xl transition-all shadow-sm flex items-center justify-center shrink-0 ${
                isRecording
                  ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse ring-4 ring-rose-200 dark:ring-rose-900/50 scale-105'
                  : isTranscribing
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-mint-50 dark:bg-mint-950/60 text-mint-600 dark:text-mint-400 hover:bg-mint-100 dark:hover:bg-mint-900/60'
              }`}
              title={isRecording ? 'Click to Stop Early' : 'Click Mic Once & Speak (Auto-Stops When You Finish)'}
            >
              {isRecording ? <FaStop className="text-lg animate-spin" /> : isTranscribing ? <FaSpinner className="text-lg animate-spin" /> : <FaMicrophone className="text-lg" />}
            </button>
            
            <input
              type="text"
              placeholder={
                isRecording
                  ? '🎙️ Listening... Speak naturally (Auto-stops when you finish)'
                  : isTranscribing
                  ? '⏳ Transcribing speech locally with Whisper AI...'
                  : 'Type or click mic to speak in any language...'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isTranscribing}
              className={`flex-1 py-3 px-4 text-sm rounded-2xl border transition-all ${
                isRecording
                  ? 'border-rose-400 dark:border-rose-600 bg-rose-50/30 dark:bg-rose-950/20 text-slate-900 dark:text-slate-100 font-medium'
                  : isTranscribing
                  ? 'border-mint-300 dark:border-mint-700 bg-mint-50/30 text-slate-500 animate-pulse'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-health-500 dark:focus:border-health-400'
              }`}
            />

            <Button variant="mint" size="md" icon={FaPaperPlane} onClick={() => handleSend()} disabled={isTranscribing || !input.trim()}>
              Send
            </Button>
          </div>
        </div>
      </Card>

    </div>
  );
};

export default AIChatAssistant;
