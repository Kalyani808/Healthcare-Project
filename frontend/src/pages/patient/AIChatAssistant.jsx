import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { FaRobot, FaPaperPlane, FaMicrophone, FaUser, FaCheckCircle, FaVolumeUp } from 'react-icons/fa';

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

  const suggestedQuestions = [
    'Bukhar aur sirdard mein ghar par kya parhej karein?',
    'Prescription par Paracetamol kitne ghante baad lena chahiye?',
    'Kuch dino se pet dard hai, konsa doctor best rahega?',
    'Bachon ko monsoon mein sardi se kaise bachayein?',
  ];

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
      let responseText = 'Aapke lakshan samanye viral infection ke pratit hote hain. Kripya paryapt boiled pani piyein aur regular aaram karein. Agar bukhar 101°F se adhik ho to hamare doctor dwara tele-consultation book karein.';
      
      if (query.toLowerCase().includes('paracetamol')) {
        responseText = 'Paracetamol 500mg ko aamtaur par 6 ghante ke antaral par liya jata hai. Din mein 4 baar se zyada na lein aur hamesha khana khane ke baad lein.';
      } else if (query.toLowerCase().includes('bachon') || query.toLowerCase().includes('sardi')) {
        responseText = 'Bachon ko thande pani se bachayein, ORS ka ghol piyein aur warm kapde pehnayein. Agar sans lene mein katnai ho to turant primary center le jayein.';
      }

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-mint-500 to-tealSoft-500 text-white flex items-center justify-center text-2xl shadow-md">
            <FaRobot />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">AI Health Sahayak</h1>
            <p className="text-slate-500 text-xs">Multilingual voice & text symptom companion for rural families</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold text-mint-700 bg-mint-50 px-3 py-1.5 rounded-full border border-mint-100">
          <span className="w-2 h-2 rounded-full bg-mint-500 animate-pulse"></span>
          <span>Online & Ready</span>
        </div>
      </div>

      {/* Suggested Chips */}
      <div className="flex flex-wrap gap-2">
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="text-xs bg-white text-slate-600 hover:text-health-700 hover:bg-health-50 border border-slate-200 hover:border-health-200 px-3.5 py-1.5 rounded-full transition-all shadow-sm"
          >
            💡 {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Window */}
      <Card className="h-[480px] flex flex-col justify-between p-4 bg-gradient-to-b from-slate-50/50 to-white">
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
                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none shadow-sm'
                }`}
              >
                <p>{msg.text}</p>
                <span className={`block text-[10px] mt-1.5 ${msg.sender === 'user' ? 'text-health-100 text-right' : 'text-slate-400'}`}>
                  {msg.time}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center space-x-2 text-xs text-slate-400 pl-12">
              <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              <span>Sahayak is thinking...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="pt-4 border-t border-slate-100 flex items-center space-x-2">
          <button
            onClick={() => alert('Voice input activated. Speak in Hindi or your local dialect...')}
            className="p-3 text-mint-600 bg-mint-50 hover:bg-mint-100 rounded-2xl transition-colors"
            title="Voice Input"
          >
            <FaMicrophone className="text-lg" />
          </button>
          
          <input
            type="text"
            placeholder="Type your health query in plain Hindi or English..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 py-3 px-4 text-sm rounded-2xl border border-slate-200 focus:outline-none focus:border-health-500"
          />

          <Button variant="mint" size="md" icon={FaPaperPlane} onClick={() => handleSend()}>
            Send
          </Button>
        </div>
      </Card>

    </div>
  );
};

export default AIChatAssistant;
