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
  FaHospitalUser, 
  FaStethoscope, 
  FaQuestionCircle 
} from 'react-icons/fa';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

const LandingPage = () => {
  return (
    <div className="space-y-24 pb-20">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 lg:pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left Content */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
            >
              <div className="inline-flex items-center space-x-2 bg-health-50 border border-health-200 px-4 py-2 rounded-full text-health-700 text-xs font-semibold shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-mint-500 animate-ping"></span>
                <span>Bridging Healthcare Access for Rural Bharat</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-800 leading-[1.15] tracking-tight">
                Quality Healthcare for <span className="bg-gradient-to-r from-health-600 via-tealSoft-600 to-mint-600 bg-clip-text text-transparent">Every Village.</span>
              </h1>

              <p className="text-lg text-slate-600 max-w-2xl leading-relaxed mx-auto lg:mx-0">
                A caring digital health companion designed for rural communities. Instantly translate handwriting on prescriptions, talk to our multilingual AI assistant, and connect with qualified doctors from the comfort of your home.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Link to="/patient/ai-assistant">
                  <Button variant="primary" size="lg" icon={FaRobot}>
                    Ask AI Symptom Companion
                  </Button>
                </Link>
                <Link to="/patient/upload-document">
                  <Button variant="mint" size="lg" icon={FaFileUpload}>
                    Upload Prescription Image
                  </Button>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 font-medium">
                <div className="flex items-center space-x-2">
                  <FaCheckCircle className="text-mint-500 text-base" />
                  <span>100% Free Consultation Assistance</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaShieldAlt className="text-health-500 text-base" />
                  <span>Secure Local Storage</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaVolumeUp className="text-tealSoft-500 text-base" />
                  <span>Regional Audio Support</span>
                </div>
              </div>
            </motion.div>

            {/* Hero Right Visual Graphic */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              <div className="relative mx-auto max-w-md bg-gradient-to-tr from-white via-health-50 to-mint-50 p-6 rounded-3xl border border-health-100 shadow-xl shadow-health-100/50">
                
                {/* Floating Doctor Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-md mb-4 flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-health-500 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                    <FaUserMd />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-base">Dr. Ananya Sharma</h4>
                    <p className="text-xs text-health-600 font-semibold">General Medicine Specialist</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Available for Tele-Consultation</p>
                  </div>
                </div>

                {/* AI Assistant Chat Banner */}
                <div className="bg-gradient-to-r from-mint-500 to-tealSoft-600 p-5 rounded-2xl text-white shadow-lg space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold opacity-90">
                    <span className="flex items-center space-x-1.5">
                      <FaRobot />
                      <span>AI Health Sahayak</span>
                    </span>
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">Active</span>
                  </div>
                  <p className="text-sm font-medium leading-snug">
                    "Namaste! Aap exact kin lakshano ka samna kar rahe hain? Main doctor ke paas jane se pehle aapse sahyog kar sakti hoon."
                  </p>
                </div>

                {/* Patient Success Quote */}
                <div className="mt-4 p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 text-xs text-slate-600 flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    R
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">Ram Singh (Village Sundarpur)</p>
                    <p className="text-[11px] text-slate-500">"Uploaded handwritten doctor slip and understood dosage in 10 seconds!"</p>
                  </div>
                </div>

              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="bg-gradient-to-r from-health-500 via-tealSoft-500 to-mint-500 py-12 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold">500+</span>
              <p className="text-sm text-health-50 font-medium">Villages Empowered</p>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold">15,000+</span>
              <p className="text-sm text-health-50 font-medium">Prescriptions Analyzed</p>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold">98.4%</span>
              <p className="text-sm text-health-50 font-medium">AI Translation Accuracy</p>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold">24 / 7</span>
              <p className="text-sm text-health-50 font-medium">Free Rural Helpline</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-health-600 bg-health-50 px-3.5 py-1.5 rounded-full border border-health-100">
            Care Designed For You
          </span>
          <h2 className="text-3xl font-bold text-slate-800">
            Digital Health Companion Built With Empathy
          </h2>
          <p className="text-slate-600 text-sm">
            Everything you need for your family's health, simplified for easy understanding and zero hospital stress.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card hoverable className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-health-50 text-health-600 flex items-center justify-center text-2xl">
              <FaFileUpload />
            </div>
            <h3 className="text-lg font-bold text-slate-800">AI Prescription Reader</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Upload a picture of handwritten doctor notes or lab reports. Our AI extracts tablet names, timing, and dosages in simple regional words.
            </p>
          </Card>

          <Card hoverable className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-mint-50 text-mint-600 flex items-center justify-center text-2xl">
              <FaRobot />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Voice-Guided Health Sahayak</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Feeling unwell? Explain your symptoms in plain words or voice. Get immediate first-aid guidance and recommended specialist types.
            </p>
          </Card>

          <Card hoverable className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-tealSoft-50 text-tealSoft-600 flex items-center justify-center text-2xl">
              <FaStethoscope />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Tele-Doctor Consultations</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Schedule direct video or phone appointments with empathetic medical officers who understand rural health requirements.
            </p>
          </Card>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-slate-50 py-16 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-slate-800">How SevaHealth Works in 3 Steps</h2>
            <p className="text-slate-600 text-sm">Simple enough for any smartphone or village kiosk.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-full bg-health-500 text-white font-bold text-lg flex items-center justify-center mx-auto shadow-md">
                1
              </div>
              <h4 className="font-bold text-slate-800 text-base">Click a Photo or Speak</h4>
              <p className="text-sm text-slate-600">Take a photo of your doctor slip or describe your fever, headache, or pain.</p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-full bg-mint-500 text-white font-bold text-lg flex items-center justify-center mx-auto shadow-md">
                2
              </div>
              <h4 className="font-bold text-slate-800 text-base">Receive Clear Summary</h4>
              <p className="text-sm text-slate-600">Get clean, translated medication guidelines and safety instructions instantly.</p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-full bg-tealSoft-500 text-white font-bold text-lg flex items-center justify-center mx-auto shadow-md">
                3
              </div>
              <h4 className="font-bold text-slate-800 text-base">Connect with Doctor</h4>
              <p className="text-sm text-slate-600">Follow up with a certified doctor or share your digital report with family.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Helpline Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-health-600 to-mint-600 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-bold">Need Immediate Health Guidance?</h3>
            <p className="text-health-50 text-sm max-w-xl">
              Our 24/7 rural health operators are available to assist you in your local language free of charge.
            </p>
          </div>
          <a
            href="tel:104"
            className="flex items-center space-x-3 px-8 py-4 bg-white text-slate-800 font-bold rounded-2xl shadow-lg hover:bg-slate-50 transition-transform hover:scale-105"
          >
            <FaPhoneAlt className="text-rose-500 text-xl" />
            <span>Call Helpline 104 / 108</span>
          </a>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
