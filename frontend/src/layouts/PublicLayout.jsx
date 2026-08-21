import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import FloatingVoiceAssistant from '../components/common/FloatingVoiceAssistant';

const PublicLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0B1220] transition-colors duration-200">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <FloatingVoiceAssistant />
      <Footer />
    </div>
  );
};

export default PublicLayout;
