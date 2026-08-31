import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import DashboardLayout from '../layouts/DashboardLayout';

import LandingPage from '../pages/public/LandingPage';
import AboutPage from '../pages/public/AboutPage';
import ServicesPage from '../pages/public/ServicesPage';
import ContactPage from '../pages/public/ContactPage';
import LoginPage from '../pages/public/LoginPage';
import RegisterPage from '../pages/public/RegisterPage';
import NotFoundPage from '../pages/public/NotFoundPage';

import PatientDashboard from '../pages/patient/PatientDashboard';
import PatientProfile from '../pages/patient/PatientProfile';
import UploadDocument from '../pages/patient/UploadDocument';
import DocumentHistory from '../pages/patient/DocumentHistory';
import AIChatAssistant from '../pages/patient/AIChatAssistant';
import AppointmentsPage from '../pages/patient/AppointmentsPage';
import HealthReportsPage from '../pages/patient/HealthReportsPage';
import MedicationReminders from '../pages/patient/MedicationReminders';
import EmergencyAssistance from '../pages/patient/EmergencyAssistance';
import HealthEducation from '../pages/patient/HealthEducation';
import AIRecommendations from '../pages/patient/AIRecommendations';
import DoctorReferrals from '../pages/patient/DoctorReferrals';

import DoctorDashboard from '../pages/doctor/DoctorDashboard';
import DoctorProfile from '../pages/doctor/DoctorProfile';
import PatientList from '../pages/doctor/PatientList';
import AppointmentManagement from '../pages/doctor/AppointmentManagement';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Patient Workspace */}
      <Route path="/patient" element={<DashboardLayout />}>
        <Route index element={<Navigate to="/patient/dashboard" replace />} />
        <Route path="dashboard" element={<PatientDashboard />} />
        <Route path="profile" element={<PatientProfile />} />
        <Route path="upload-document" element={<UploadDocument />} />
        <Route path="reminders" element={<MedicationReminders />} />
        <Route path="recommendations" element={<AIRecommendations />} />
        <Route path="education" element={<HealthEducation />} />
        <Route path="emergency" element={<EmergencyAssistance />} />
        <Route path="referrals" element={<DoctorReferrals />} />
        <Route path="document-history" element={<DocumentHistory />} />
        <Route path="ai-assistant" element={<AIChatAssistant />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="health-reports" element={<HealthReportsPage />} />
      </Route>

      {/* Doctor Workspace - Redirect to Patient Workspace */}
      <Route path="/doctor/*" element={<Navigate to="/patient/dashboard" replace />} />

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
