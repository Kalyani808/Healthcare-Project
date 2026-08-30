import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import FloatingVoiceAssistant from '../components/common/FloatingVoiceAssistant';
import OfflineBanner from '../components/common/OfflineBanner';

const DashboardLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-[#0B1220] transition-colors duration-200">
      <Navbar />
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <main className="w-full">
          <Outlet />
        </main>
      </div>
      <FloatingVoiceAssistant />
      <OfflineBanner />
      <Footer />
    </div>
  );
};

export default DashboardLayout;
