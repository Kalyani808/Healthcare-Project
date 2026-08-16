import React from 'react';
import Card from '../../components/common/Card';
import { FaHeartbeat, FaHandsHelping, FaUniversity, FaShieldAlt, FaLightbulb } from 'react-icons/fa';

const AboutPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-health-600 dark:text-health-400 bg-health-50 dark:bg-slate-800 px-3.5 py-1.5 rounded-full border border-health-100 dark:border-slate-700">
          Our Mission & Vision
        </span>
        <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100">
          Democratizing Healthcare for Every Rural Family
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
          SevaHealth was founded with a single guiding vision: no individual in a rural village should suffer due to unreadable prescriptions, lack of medical guidance, or distance from quality doctors.
        </p>
      </div>

      {/* Core Values Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-health-50 dark:bg-health-950/60 text-health-600 dark:text-health-400 flex items-center justify-center text-xl">
            <FaHandsHelping />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Empathy First</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            We design every button, voice prompt, and card to reduce anxiety and build trust with patients.
          </p>
        </Card>

        <Card className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-mint-50 dark:bg-mint-950/60 text-mint-600 dark:text-mint-400 flex items-center justify-center text-xl">
            <FaLightbulb />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">AI for Good</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Using Computer Vision and Large Language Models to convert complex medical jargon into clear, regional language instructions.
          </p>
        </Card>

        <Card className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-tealSoft-50 dark:bg-tealSoft-950/60 text-tealSoft-600 dark:text-tealSoft-400 flex items-center justify-center text-xl">
            <FaShieldAlt />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Complete Privacy</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Medical document uploads are encrypted and strictly accessible only by the verified patient and authorized medical officers.
          </p>
        </Card>
      </div>

      {/* Impact Story */}
      <div className="bg-gradient-to-r from-health-50 to-mint-50 dark:from-[#172033] dark:to-[#1E293B] rounded-3xl p-8 sm:p-12 border border-health-100 dark:border-slate-700/80 flex flex-col md:flex-row items-center gap-8">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-health-500 to-mint-400 text-white flex items-center justify-center text-3xl font-bold shrink-0 shadow-lg">
          <FaHeartbeat />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Built for Low-Connectivity & High Impact</h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
            Over 65% of rural families struggle to decode handwritten prescriptions provided during primary health center visits. SevaHealth enables local Asha workers, village internet kiosks, and family members to digitize medical documents in seconds.
          </p>
        </div>
      </div>

    </div>
  );
};

export default AboutPage;
