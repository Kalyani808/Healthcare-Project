import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaHeartbeat, 
  FaRobot, 
  FaFileUpload, 
  FaUserMd, 
  FaPhoneAlt, 
  FaShieldAlt, 
  FaCheckCircle, 
  FaVolumeUp, 
  FaClock, 
  FaAmbulance, 
  FaVial, 
  FaMicroscope, 
  FaNotesMedical, 
  FaCalendarCheck,
  FaArrowRight,
  FaAward,
  FaLanguage,
  FaMapMarkerAlt
} from 'react-icons/fa';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

const LandingPage = () => {
  return (
    <div className="space-y-24 pb-20 overflow-hidden">
      
      {/* 🌟 HERO SECTION: ENTERPRISE HEALTHCARE PLATFORM */}
      <section className="relative pt-12 lg:pt-20 pb-12">
        {/* Subtle Background Glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
            >
              <div className="inline-flex items-center space-x-2 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-4 py-1.5 rounded-full text-teal-800 dark:text-teal-300 text-xs font-bold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Next-Generation Digital Health Intelligence for India</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.12] tracking-tight">
                AI Healthcare That Understands <span className="bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-700 bg-clip-text text-transparent">Every Prescription.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed mx-auto lg:mx-0 font-normal">
                Instantly comprehend doctor handwriting, analyze diagnostic lab reports, manage 3-slot daily medication reminders, and access 24/7 emergency dispatch with voice guidance in <strong>Telugu, Hindi, Marathi, and English</strong>.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link to="/patient/upload-document" className="w-full sm:w-auto">
                  <Button variant="primary" size="lg" icon={FaMicroscope} className="w-full sm:w-auto text-sm sm:text-base font-bold shadow-lg shadow-teal-500/20">
                    Analyze Rx or Lab Report
                  </Button>
                </Link>
                <Link to="/patient/reminders" className="w-full sm:w-auto">
                  <Button variant="secondary" size="lg" icon={FaClock} className="w-full sm:w-auto text-sm sm:text-base font-bold">
                    Medication Reminders
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200/80 dark:border-slate-800 text-left">
                <div>
                  <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">~5.2s</h4>
                  <p className="text-[11px] text-slate-500 font-semibold">Fast OCR Analysis</p>
                </div>
                <div>
                  <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">4 Languages</h4>
                  <p className="text-[11px] text-slate-500 font-semibold">Te • Hi • Mr • En Audio</p>
                </div>
                <div>
                  <h4 className="text-xl sm:text-2xl font-black text-teal-600 dark:text-teal-400">100% Free</h4>
                  <p className="text-[11px] text-slate-500 font-semibold">Public Health Mission</p>
                </div>
              </div>
            </motion.div>

            {/* Right Interactive Mockup Visual */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              <div className="bg-white dark:bg-[#172033] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-xl space-y-4">
                
                {/* Clinical Header Badge */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center text-sm shadow-xs">
                      <FaNotesMedical />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">Live AI Clinical Extraction</h4>
                      <p className="text-[10px] text-slate-400">Prescription & Diagnostic Lab Report</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-md">
                    Verified
                  </span>
                </div>

                {/* Sample Detected Medicine Card */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border-l-4 border-teal-500 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Augmentin 625mg</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-100 text-teal-800 dark:bg-slate-800 dark:text-teal-300 rounded-full">98% Match</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                    <span className="p-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 font-bold">🌅 Morning: 1</span>
                    <span className="p-1 rounded-lg bg-slate-200 text-slate-500 font-bold">☀️ Noon: 0</span>
                    <span className="p-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 font-bold">🌙 Night: 1</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    🎯 <strong>Purpose:</strong> Treats bacterial throat & chest infections. Take after food.
                  </p>
                </div>

                {/* Sample Lab Test Parameter */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border-l-4 border-emerald-500 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">Hemoglobin (Hb)</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">🟢 Normal</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-black text-slate-800 dark:text-slate-200">13.5 g/dL</span>
                    <span className="text-slate-400 text-[10px]">Normal: 12.0 - 16.5 g/dL</span>
                  </div>
                </div>

                {/* Spoken Audio Banner */}
                <div className="p-3 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl text-white flex items-center justify-between text-xs font-bold shadow-md">
                  <div className="flex items-center space-x-2">
                    <FaVolumeUp />
                    <span>🔊 తెలుగు వాయిస్ సాయం (Spoken Audio)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-white/20 rounded-md">Playing</span>
                </div>

              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 🏥 CORE HEALTHCARE CAPABILITIES GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-black uppercase text-teal-600 dark:text-teal-400 tracking-wider">
            All-In-One Healthcare Platform
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Designed for Patient Safety & Convenience
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Eliminating medical jargon and communication barriers for patients, families, and healthcare professionals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Prescription & Lab OCR */}
          <Card hoverable className="p-6 space-y-3 border border-slate-200/80 dark:border-slate-700">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-xl shadow-md shadow-teal-500/20">
              <FaMicroscope />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Prescription & Lab OCR</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Fast 5-second handwriting extraction for doctor prescriptions and diagnostic lab reports with healthy reference ranges.
            </p>
            <Link to="/patient/upload-document" className="inline-flex items-center space-x-1 text-xs font-bold text-teal-600 hover:text-teal-700 pt-2">
              <span>Try Analyzer</span> <FaArrowRight className="text-[10px]" />
            </Link>
          </Card>

          {/* Card 2: Medication Reminders */}
          <Card hoverable className="p-6 space-y-3 border border-slate-200/80 dark:border-slate-700">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-md shadow-amber-500/20">
              <FaClock />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Medication Reminders</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Visual Morning, Afternoon, and Night pill schedules with 1-click sync from prescriptions and caregiver alerts.
            </p>
            <Link to="/patient/reminders" className="inline-flex items-center space-x-1 text-xs font-bold text-amber-600 hover:text-amber-700 pt-2">
              <span>View Timeline</span> <FaArrowRight className="text-[10px]" />
            </Link>
          </Card>

          {/* Card 3: 24/7 Emergency & First Aid */}
          <Card hoverable className="p-6 space-y-3 border border-slate-200/80 dark:border-slate-700">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center text-xl shadow-md shadow-rose-500/20">
              <FaAmbulance />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Emergency & 108 SOS</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              1-Tap emergency speed dial (108 Ambulance, 112 SOS), interactive clinical first aid guides, and nearby 24/7 hospitals.
            </p>
            <Link to="/patient/emergency" className="inline-flex items-center space-x-1 text-xs font-bold text-rose-600 hover:text-rose-700 pt-2">
              <span>Emergency Hub</span> <FaArrowRight className="text-[10px]" />
            </Link>
          </Card>

          {/* Card 4: Voice Health Sahayak */}
          <Card hoverable className="p-6 space-y-3 border border-slate-200/80 dark:border-slate-700">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-md shadow-emerald-500/20">
              <FaRobot />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Multilingual Sahayak</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ask symptom questions and listen to dosage advice in Telugu, Hindi, Marathi, and English voice speech.
            </p>
            <Link to="/patient/ai-assistant" className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 pt-2">
              <span>Talk to Sahayak</span> <FaArrowRight className="text-[10px]" />
            </Link>
          </Card>

        </div>
      </section>

      {/* 🚑 24/7 EMERGENCY SPEED CALLOUT BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-black uppercase tracking-wider">
              Emergency Response Network
            </span>
            <h3 className="text-2xl sm:text-3xl font-black">Need Immediate Medical Assistance?</h3>
            <p className="text-xs sm:text-sm text-rose-100 max-w-xl">
              Instant free ambulance dispatch, automated GPS coordinate transmission, and hospital trauma center finder.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <a
              href="tel:108"
              className="px-6 py-3.5 bg-white text-rose-600 hover:bg-rose-50 font-black rounded-2xl shadow-lg transition-all flex items-center space-x-2 text-sm"
            >
              <FaPhoneAlt /> <span>Call 108 (Free)</span>
            </a>
            <Link
              to="/patient/emergency"
              className="px-6 py-3.5 bg-rose-800 hover:bg-rose-900 text-white font-bold rounded-2xl shadow-md transition-all text-sm"
            >
              First Aid Guides
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
