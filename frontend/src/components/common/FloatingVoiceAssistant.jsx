import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { 
  FaRobot, 
  FaPaperPlane, 
  FaMicrophone, 
  FaUser, 
  FaTimes, 
  FaVolumeUp, 
  FaMinus, 
  FaExpandAlt,
  FaLanguage
} from 'react-icons/fa';

const FloatingVoiceAssistant = ({ prescriptionContext = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [input, setInput] = useState('');
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('preferred_language') || 'te-IN';
  });
  const messagesEndRef = useRef(null);
  const audioPlayerRef = useRef(null);

  const getGreetingForLang = (currentLang) => {
    switch (currentLang) {
      case 'te-IN':
        return 'నమస్కారం! నేను మీ SevaHealth AI వాయిస్ సహాయకుడిని. మీ మందుల మోతాదు (Dosage), సమయాలు మరియు ఆరోగ్య సమస్యల గురించి తెలుగులో అడగండి.';
      case 'mr-IN':
        return 'नमस्कार! मी तुमचा SevaHealth AI व्हॉइस सहाय्यक आहे. औषधांची वेळ, प्रमाण आणि आरोग्य समस्यांबद्दल मला मराठीत विचारा.';
      case 'hi-IN':
        return 'नमस्ते! मैं आपका SevaHealth AI वॉयस सहायक हूँ। आप अपनी दवाइयों, खुराक और समय के बारे में मुझसे हिंदी में पूछ सकते हैं।';
      default:
        return 'Hello! I am your SevaHealth AI Voice Assistant. Ask me about your prescribed medicine timings, dosages, and health queries in English, Telugu, Hindi, or Marathi.';
    }
  };

  const [messages, setMessages] = useState(() => [
    {
      id: 1,
      sender: 'ai',
      text: getGreetingForLang(localStorage.getItem('preferred_language') || 'te-IN'),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Sync with global language changes
  useEffect(() => {
    const handleLangChange = (e) => {
      if (e.detail?.lang && e.detail.lang !== lang) {
        setLang(e.detail.lang);
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            sender: 'ai',
            text: getGreetingForLang(e.detail.lang),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
      }
    };
    window.addEventListener('language-changed', handleLangChange);
    return () => window.removeEventListener('language-changed', handleLangChange);
  }, [lang]);

  const getSuggestedQuestions = () => {
    switch (lang) {
      case 'te-IN':
        return [
          '1-0-1 అంటే ఏమిటి? ఎప్పుడు వేసుకోవాలి?',
          'భోజనానికి ముందు ఏ మందులు వేసుకోవాలి?',
          'డోస్ మర్చిపోతే ఏమి చేయాలి?',
          'పారాసిటమాల్ రోజుకు ఎన్నిసార్లు వేసుకోవచ్చు?',
        ];
      case 'mr-IN':
        return [
          '1-0-1 चा अर्थ काय आहे?',
          'जेवणापूर्वी कोणती औषधे घ्यावीत?',
          'डोस विसरल्यास काय करावे?',
          'दिवसातून किती वेळा पॅरासिटामॉल घ्यावी?',
        ];
      case 'hi-IN':
        return [
          '1-0-1 का exact मतलब क्या होता है?',
          'खाने से पहले कौन सी दवाई लेनी चाहिए?',
          'अगर मैं डोज़ भूल जाऊं तो क्या करें?',
          'एंटीबायोटिक कितने दिन तक लेनी चाहिए?',
        ];
      default:
        return [
          'What does 1-0-1 dosage mean?',
          'Which medicines should I take before food?',
          'What if I forget a medicine dose?',
          'How many times can I take Paracetamol?',
        ];
    }
  };

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isTyping]);

  // Context injection if prescription analysis is provided
  useEffect(() => {
    if (prescriptionContext && prescriptionContext.length > 0) {
      const medNames = prescriptionContext.map(m => m.name || m.medicine).filter(Boolean).join(', ');
      let ctxText = '';
      if (lang === 'te-IN') {
        ctxText = `మీ ప్రిస్క్రిప్షన్‌లోని మందులను నేను చూశాను: ${medNames}. వీటి సమయాలు లేదా మోతాదు గురించి అడగండి!`;
      } else if (lang === 'mr-IN') {
        ctxText = `मी तुमच्या प्रिस्क्रिप्शनमधील ही औषधे पाहिली आहेत: ${medNames}. यांच्या वेळेबद्दल विचारा!`;
      } else if (lang === 'hi-IN') {
        ctxText = `मैंने आपके पर्चे की दवाइयां देख ली हैं: ${medNames}. इनकी खुराक और समय के बारे में पूछिए!`;
      } else {
        ctxText = `I have reviewed the medicines in your prescription: ${medNames}. Feel free to ask about their timings, dosage, or instructions!`;
      }

      const contextMsg = {
        id: Date.now(),
        sender: 'ai',
        text: ctxText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, contextMsg]);
      setIsOpen(true);
    }
  }, [prescriptionContext]);

  // Listen for custom global events to open assistant from anywhere
  useEffect(() => {
    const handleOpenAssistant = (event) => {
      setIsOpen(true);
      setIsMinimized(false);
      if (event.detail?.initialQuery) {
        handleSend(event.detail.initialQuery);
      }
    };
    window.addEventListener('open-voice-assistant', handleOpenAssistant);
    return () => window.removeEventListener('open-voice-assistant', handleOpenAssistant);
  }, []);

  // Web Speech API Voice Recognition (Multilingual)
  const toggleVoiceListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please use Chrome/Edge or type your question below.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        handleSend(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech error:', err);
      setIsListening(false);
    }
  };

  // High-Quality Native Audio Playback via Backend gTTS Stream (Telugu, Hindi, Marathi, English)
  const speakMessage = async (text) => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }

    try {
      const res = await api.post('/api/documents/speak/', { text, lang }, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(res.data);
      const audio = new Audio(blobUrl);
      audioPlayerRef.current = audio;
      await audio.play();
      return;
    } catch (err) {
      console.warn('Backend audio speak endpoint failed, falling back to Web Speech API:', err);
    }

    // Fallback to Web Speech API
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSend = (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const q = query.toLowerCase();
      let reply = '';

      // Multilingual smart responses
      if (lang === 'te-IN') {
        if (q.includes('1-0-1') || q.includes('1 0 1')) {
          reply = '1-0-1 అంటే: 1 డోస్ ఉదయం (Morning), 1 డోస్ రాత్రి (Night) వేసుకోవాలి. "0" అంటే మధ్యాహ్నం (Afternoon) వేసుకోకూడదు. ఇది రోజుకు 2 సార్లు వేసుకునే పద్ధతి.';
        } else if (q.includes('1-1-1') || q.includes('1 1 1')) {
          reply = '1-1-1 అంటే రోజుకు 3 సార్లు: ఉదయం, మధ్యాహ్నం మరియు రాత్రి భోజనం తర్వాత వేసుకోవాలి.';
        } else if (q.includes('1-0-0')) {
          reply = '1-0-0 అంటే రోజుకు ఒక్కసారి మాత్రమే ఉదయం పూట వేసుకోవాలి.';
        } else if (q.includes('0-0-1')) {
          reply = '0-0-1 అంటే రోజుకు ఒక్కసారి మాత్రమే రాత్రి పడుకునే ముందు వేసుకోవాలి.';
        } else if (q.includes('paracetamol') || q.includes('calpol')) {
          reply = 'పారాసిటమాల్ జ్వరం మరియు ఒంటి నొప్పుల కోసం ఉపయోగిస్తారు. దీనిని భోజనం తర్వాత మాత్రమే తీసుకోవాలి. రోజుకు 3-4 సార్లకు మించి వేసుకోకూడదు.';
        } else if (q.includes('mundu') || q.includes('before food') || q.includes('khali')) {
          reply = 'గ్యాస్ లేదా ఎసిడిటీ మందులు (పాంటోప్రాజోల్, ఒమెప్రాజోల్) ఉదయం అల్పాహారానికి 30 నిమిషాల ముందు ఖాళీ కడుపుతో తీసుకోవాలి.';
        } else {
          reply = 'మీ ఆరోగ్యం మరియు మందుల కోసం డాక్టర్ సూచించిన సమయాలను కచ్చితంగా పాటించండి. ఏవైనా సందేహాలుంటే మా వైద్యుడిని సంప్రదించండి.';
        }
      } else if (lang === 'mr-IN') {
        if (q.includes('1-0-1') || q.includes('1 0 1')) {
          reply = '1-0-1 चा अर्थ असा आहे: 1 डोस सकाळी (Morning) आणि 1 डोस रात्री (Night) घ्यावा. "0" म्हणजे दुपारी घेऊ नये. हे दिवसातून 2 वेळा घ्यायचे असते.';
        } else if (q.includes('1-1-1') || q.includes('1 1 1')) {
          reply = '1-1-1 चा अर्थ दिवसातून 3 वेळा: सकाळी, दुपारी आणि रात्री औषध घेणे.';
        } else if (q.includes('paracetamol') || q.includes('calpol')) {
          reply = 'पॅरासिटामॉल ताप आणि अंगदुखीसाठी असते. हे जेवणानंतर घ्यावे आणि दोन डोसमधील अंतर किमान ६ तास ठेवावे.';
        } else {
          reply = 'तुमच्या आरोग्यासाठी डॉक्टरांनी सांगितलेल्या वेळेवर औषधे घ्या. काही अडचण असल्यास डॉक्टरांचा सल्ला घ्या.';
        }
      } else if (lang === 'hi-IN') {
        if (q.includes('1-0-1') || q.includes('1 0 1')) {
          reply = '1-0-1 का मतलब है: "1" सुबह (Morning) और "1" रात (Night) को दवाई लेनी है, और "0" का मतलब दोपहर में नहीं लेनी है। यह दिन में 2 बार लेने के लिए होता है।';
        } else if (q.includes('1-1-1') || q.includes('1 1 1')) {
          reply = '1-1-1 का मतलब है दिन में 3 बार: 1 सुबह (Morning), 1 दोपहर (Afternoon) और 1 रात (Night) को दवाई लेना।';
        } else if (q.includes('paracetamol') || q.includes('calpol')) {
          reply = 'Paracetamol / Calpol बुखार और शरीर दर्द के लिए होती है। इसे खाना खाने के बाद लें और कम से कम 6 घंटे का अंतराल रखें।';
        } else {
          reply = 'अपनी दवाइयां हमेशा डॉक्टर के पर्चे पर लिखे निर्देशानुसार समय पर लें।';
        }
      } else {
        // English
        if (q.includes('1-0-1') || q.includes('1 0 1')) {
          reply = '1-0-1 means: Take 1 dose in the Morning, 0 (None) in the Afternoon, and 1 dose at Night. It indicates a twice-daily dosage schedule.';
        } else if (q.includes('1-1-1') || q.includes('1 1 1')) {
          reply = '1-1-1 means: Take 3 times daily — Morning, Afternoon, and Night after meals.';
        } else if (q.includes('paracetamol') || q.includes('calpol')) {
          reply = 'Paracetamol/Calpol is for fever and mild pain. Take after food with at least a 6-hour gap between doses.';
        } else {
          reply = 'Please follow the exact dosage and timings prescribed by your doctor. Consult a healthcare professional for specific concerns.';
        }
      }

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom-Right Corner) */}
      {!isOpen && (
        <button
          onClick={() => { setIsOpen(true); setIsMinimized(false); }}
          className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 bg-gradient-to-r from-mint-500 to-tealSoft-500 hover:from-mint-600 hover:to-tealSoft-600 text-white px-4 py-3.5 rounded-full shadow-2xl hover:shadow-mint-500/30 transition-all duration-300 transform hover:scale-105 group"
          title="Open AI Voice Assistant (Telugu, Hindi, English, Marathi)"
        >
          <div className="relative">
            <FaRobot className="text-2xl animate-bounce [animation-duration:2.5s]" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            </span>
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-extrabold leading-tight">AI Voice Sahayak</p>
            <p className="text-[10px] text-mint-100 font-medium">తెలుగు • Hindi • English • मराठी</p>
          </div>
        </button>
      )}

      {/* Docked Side Drawer / Floating Assistant Window */}
      {isOpen && (
        <div 
          className={`fixed right-4 sm:right-6 bottom-4 sm:bottom-6 z-50 w-[95vw] sm:w-[420px] bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
            isMinimized ? 'h-[72px]' : 'h-[620px] max-h-[90vh]'
          }`}
        >
          {/* Header Bar */}
          <div className="p-4 bg-gradient-to-r from-mint-500 to-tealSoft-600 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl">
                <FaRobot />
              </div>
              <div>
                <h3 className="text-sm font-bold flex items-center space-x-1.5">
                  <span>AI Voice Sahayak</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                </h3>
                <p className="text-[10px] text-mint-100 font-medium">
                  {lang === 'te-IN' ? 'తెలుగు వాయిస్ అసిస్టెంట్' : lang === 'mr-IN' ? 'मराठी व्हॉइस असिस्टंट' : lang === 'hi-IN' ? 'हिंदी वॉयस असिस्टेंट' : 'English Voice Assistant'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {/* Language Selector: Telugu, English, Marathi, Hindi */}
              <select
                value={lang}
                onChange={(e) => {
                  const newLang = e.target.value;
                  setLang(newLang);
                  localStorage.setItem('preferred_language', newLang);
                  window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang: newLang } }));
                  setMessages(prev => [
                    ...prev,
                    {
                      id: Date.now(),
                      sender: 'ai',
                      text: getGreetingForLang(newLang),
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    }
                  ]);
                }}
                className="text-[11px] bg-white/20 text-white rounded-lg px-2 py-1 font-semibold outline-none cursor-pointer border border-white/30"
                title="Select Voice Language"
              >
                <option value="te-IN" className="text-slate-900 font-medium">తెలుగు (Telugu)</option>
                <option value="en-US" className="text-slate-900 font-medium">English</option>
                <option value="hi-IN" className="text-slate-900 font-medium">हिंदी (Hindi)</option>
                <option value="mr-IN" className="text-slate-900 font-medium">मराठी (Marathi)</option>
              </select>

              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <FaExpandAlt className="text-xs" /> : <FaMinus className="text-xs" />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Close"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>
          </div>

          {/* Assistant Body (Hidden when Minimized) */}
          {!isMinimized && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden bg-slate-50/50 dark:bg-[#0B1220]">
              
              {/* Quick Suggested Chips for Selected Language */}
              <div className="p-2.5 bg-white dark:bg-[#1E293B] border-b border-slate-100 dark:border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar">
                {getSuggestedQuestions().map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="text-[11px] whitespace-nowrap bg-mint-50 dark:bg-slate-800 text-mint-900 dark:text-mint-200 border border-mint-200 dark:border-slate-700 hover:bg-mint-100 dark:hover:bg-slate-700 px-2.5 py-1 rounded-full transition-colors font-medium flex-shrink-0"
                  >
                    💡 {q}
                  </button>
                ))}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start space-x-2.5 ${
                      msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs text-white shrink-0 shadow-sm ${
                        msg.sender === 'user' ? 'bg-health-600' : 'bg-mint-500'
                      }`}
                    >
                      {msg.sender === 'user' ? <FaUser /> : <FaRobot />}
                    </div>

                    <div
                      className={`max-w-[82%] p-3 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-health-500 to-health-600 text-white rounded-tr-none shadow-sm'
                          : 'bg-white dark:bg-[#1E293B] text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700/80 rounded-tl-none shadow-sm'
                      }`}
                    >
                      <p>{msg.text}</p>
                      
                      <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-700/50">
                        <span className={`text-[9px] ${msg.sender === 'user' ? 'text-health-100' : 'text-slate-400'}`}>
                          {msg.time}
                        </span>
                        {msg.sender === 'ai' && (
                          <button
                            onClick={() => speakMessage(msg.text)}
                            className="text-mint-600 dark:text-mint-400 hover:text-mint-700 p-0.5"
                            title="వాయిస్ వినండి / Listen audio"
                          >
                            <FaVolumeUp className="text-[11px]" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400 pl-8">
                    <span className="w-1.5 h-1.5 bg-mint-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-mint-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-mint-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    <span className="text-[11px]">ఆలోచిస్తోంది / Thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Input Area */}
              <div className="p-3 bg-white dark:bg-[#1E293B] border-t border-slate-100 dark:border-slate-800">
                {isListening && (
                  <div className="mb-2 p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center justify-between text-xs text-rose-700 dark:text-rose-300 font-semibold animate-pulse">
                    <span className="flex items-center space-x-1.5">
                      <FaMicrophone className="text-rose-500" />
                      <span>{lang === 'te-IN' ? 'వినబడుతోంది... మాట్లాడండి' : lang === 'mr-IN' ? 'ऐकत आहे... बोला' : lang === 'hi-IN' ? 'सुन रहा हूँ... बोलिए' : 'Listening... Speak now'}</span>
                    </span>
                    <button onClick={toggleVoiceListening} className="text-rose-500 hover:text-rose-700">
                      <FaTimes />
                    </button>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={toggleVoiceListening}
                    className={`p-2.5 rounded-xl transition-all ${
                      isListening
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-mint-50 dark:bg-slate-800 text-mint-600 dark:text-mint-400 hover:bg-mint-100 dark:hover:bg-slate-700'
                    }`}
                    title="Speak Voice Query (Telugu, English, Hindi, Marathi)"
                  >
                    <FaMicrophone className="text-sm" />
                  </button>

                  <input
                    type="text"
                    placeholder={lang === 'te-IN' ? 'ప్రశ్నించండి: ఉదా. 1-0-1 అంటే ఏమిటి?' : lang === 'mr-IN' ? 'विचारा: उदा. 1-0-1 कधी घ्यावे?' : lang === 'hi-IN' ? 'पूछिए: उदा. 1-0-1 कब लेना है?' : 'Ask: e.g. What does 1-0-1 mean?'}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    className="flex-1 py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1220] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-mint-500"
                  />

                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={!input.trim()}
                    className="p-2.5 bg-mint-500 hover:bg-mint-600 disabled:opacity-40 text-white rounded-xl transition-colors shadow-sm"
                  >
                    <FaPaperPlane className="text-xs" />
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </>
  );
};

export default FloatingVoiceAssistant;
