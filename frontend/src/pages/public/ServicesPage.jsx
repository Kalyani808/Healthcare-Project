import React from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Link } from 'react-router-dom';
import { FaFileUpload, FaRobot, FaStethoscope, FaUserNurse, FaFileAlt, FaMobileAlt } from 'react-icons/fa';

const ServicesPage = () => {
  const services = [
    {
      icon: FaFileUpload,
      title: 'AI Prescription & Document Parsing',
      description: 'Upload handwritten prescriptions or lab test images. AI identifies medication names, dosage timings (morning/night), and dietary restrictions in your language.',
      color: 'bg-health-50 text-health-600',
      action: '/patient/upload-document',
      btnText: 'Upload Document',
    },
    {
      icon: FaRobot,
      title: 'Voice-Based AI Symptom Companion',
      description: 'Interactive AI companion that listens to symptoms, asks simple clarifying questions, and provides empathetic first-aid advice.',
      color: 'bg-mint-50 text-mint-600',
      action: '/patient/ai-assistant',
      btnText: 'Talk to AI Assistant',
    },
    {
      icon: FaStethoscope,
      title: 'Tele-Consultation Booking',
      description: 'Connect with certified doctors across General Medicine, Pediatrics, Gynaecology, and Cardiology without traveling long distances.',
      color: 'bg-tealSoft-50 text-tealSoft-600',
      action: '/patient/appointments',
      btnText: 'Book Appointment',
    },
    {
      icon: FaFileAlt,
      title: 'Digital Health Vault',
      description: 'Store all family medical histories, previous prescriptions, and lab test results securely in one organized cloud vault.',
      color: 'bg-blue-50 text-blue-600',
      action: '/patient/document-history',
      btnText: 'Open Medical Vault',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-health-600 bg-health-50 px-3.5 py-1.5 rounded-full">
          Comprehensive Services
        </span>
        <h1 className="text-3xl font-extrabold text-slate-800">
          Everything You Need for Peace of Mind
        </h1>
        <p className="text-slate-600 text-sm">
          Designed specifically to be simple, fast, and accessible on any device.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {services.map((service, index) => {
          const Icon = service.icon;
          return (
            <Card key={index} className="space-y-4 flex flex-col justify-between" hoverable>
              <div className="space-y-3">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${service.color}`}>
                  <Icon />
                </div>
                <h3 className="text-xl font-bold text-slate-800">{service.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{service.description}</p>
              </div>
              <Link to={service.action} className="pt-2 block">
                <Button variant="soft" size="md" fullWidth>
                  {service.btnText}
                </Button>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ServicesPage;
