import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import FloatingVoiceAssistant from '../components/common/FloatingVoiceAssistant';
import HealthcarePageBackground from '../components/common/HealthcarePageBackground';

const PublicLayout = () => {
  const location = useLocation();

  const getPageVariant = () => {
    const path = location.pathname;
    if (path.includes('emergency')) return 'emergency';
    if (path.includes('services')) return 'records';
    return 'default';
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0B1220] transition-colors duration-200">
      <Navbar />
      <HealthcarePageBackground variant={getPageVariant()} className="flex-grow flex flex-col">
        <main className="flex-grow">
          <Outlet />
        </main>
      </HealthcarePageBackground>
      <FloatingVoiceAssistant />
      <Footer />
    </div>
  );
};

export default PublicLayout;
