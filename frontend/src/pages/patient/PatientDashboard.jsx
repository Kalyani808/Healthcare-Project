import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { 
  FaRobot, 
  FaFileUpload, 
  FaCalendarCheck, 
  FaHistory, 
  FaSmile, 
  FaArrowRight, 
  FaNotesMedical,
  FaLightbulb,
  FaFileMedical
} from 'react-icons/fa';

const PatientDashboard = () => {
  const { user } = useAuth();

  const mockDocuments = [
    { id: 1, name: 'Dr_Sharma_Fever_Prescription.png', type: 'Prescription', date: '2026-08-04', status: 'Parsed by AI' },
    { id: 2, name: 'Blood_Report_Hemoglobin.jpg', type: 'Lab Report', date: '2026-07-28', status: 'Normal' },
  ];

  return (
    <div className="space-y-8 pb-12">
      
      {/* Greeting Banner */}
      <div className="bg-gradient-to-r from-health-500 via-tealSoft-500 to-mint-500 rounded-3xl p-6 sm:p-8 text-white shadow-soft relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold bg-white/20 px-3 py-1 rounded-full w-fit backdrop-blur-sm">
            <FaSmile className="text-amber-200 text-sm" />
            <span>Digital Health Companion Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Namaste, {user?.name || 'Ramesh Kumar'}!
          </h1>
          <p className="text-health-50 text-sm max-w-xl">
            We are glad to assist you. Your family's medical records are safely updated, and your next health checkup is on schedule.
          </p>
        </div>
      </div>

      {/* Quick Action Grid with Health Reports Link */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Link to="/patient/ai-assistant">
          <Card hoverable className="p-5 flex items-center space-x-4 border-mint-100 bg-mint-50/40 h-full">
            <div className="w-12 h-12 rounded-2xl bg-mint-500 text-white flex items-center justify-center text-xl shrink-0 shadow-md">
              <FaRobot />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Ask AI Assistant</h4>
              <p className="text-[11px] text-slate-500">Symptom check in Hindi</p>
            </div>
          </Card>
        </Link>

        <Link to="/patient/upload-document">
          <Card hoverable className="p-5 flex items-center space-x-4 border-health-100 bg-health-50/40 h-full">
            <div className="w-12 h-12 rounded-2xl bg-health-500 text-white flex items-center justify-center text-xl shrink-0 shadow-md">
              <FaFileUpload />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Upload Rx Image</h4>
              <p className="text-[11px] text-slate-500">Parse doctor notes</p>
            </div>
          </Card>
        </Link>

        <Link to="/patient/health-reports">
          <Card hoverable className="p-5 flex items-center space-x-4 border-amber-100 bg-amber-50/40 h-full">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shrink-0 shadow-md">
              <FaFileMedical />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Health Reports</h4>
              <p className="text-[11px] text-slate-500">Lab & vital diagnostics</p>
            </div>
          </Card>
        </Link>

        <Link to="/patient/appointments">
          <Card hoverable className="p-5 flex items-center space-x-4 border-tealSoft-100 bg-tealSoft-50/40 h-full">
            <div className="w-12 h-12 rounded-2xl bg-tealSoft-500 text-white flex items-center justify-center text-xl shrink-0 shadow-md">
              <FaCalendarCheck />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Book Doctor</h4>
              <p className="text-[11px] text-slate-500">Tele-consultation</p>
            </div>
          </Card>
        </Link>

        <Link to="/patient/document-history">
          <Card hoverable className="p-5 flex items-center space-x-4 border-slate-100 bg-white h-full">
            <div className="w-12 h-12 rounded-2xl bg-slate-700 text-white flex items-center justify-center text-xl shrink-0 shadow-md">
              <FaHistory />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Medical Vault</h4>
              <p className="text-[11px] text-slate-500">2 documents saved</p>
            </div>
          </Card>
        </Link>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left 8 cols */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Upcoming Appointment Card */}
          <Card className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
                <FaCalendarCheck className="text-health-500" />
                <span>Next Upcoming Appointment</span>
              </h3>
              <span className="text-xs font-semibold px-2.5 py-1 bg-mint-50 text-mint-700 rounded-full border border-mint-100">
                Confirmed
              </span>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-sm">Dr. Ananya Sharma (General Medicine)</h4>
                <p className="text-xs text-slate-500">Scheduled for Tomorrow, 10:30 AM (Tele-Video Call)</p>
                <p className="text-[11px] text-health-600 font-medium">Link will be sent to your phone number +91 98765 43210</p>
              </div>
              <Link to="/patient/appointments">
                <Button variant="soft" size="sm">
                  View Details
                </Button>
              </Link>
            </div>
          </Card>

          {/* Recent Medical Documents */}
          <Card className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
                <FaNotesMedical className="text-mint-500" />
                <span>Recent Prescriptions & Reports</span>
              </h3>
              <Link to="/patient/document-history" className="text-xs text-health-600 font-semibold hover:underline flex items-center space-x-1">
                <span>View All</span>
                <FaArrowRight className="text-[10px]" />
              </Link>
            </div>

            <div className="space-y-3">
              {mockDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3.5 bg-white border border-slate-100 rounded-2xl hover:border-health-200 transition-colors shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-health-50 text-health-600 flex items-center justify-center font-bold text-xs">
                      PDF
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">{doc.name}</h4>
                      <p className="text-[11px] text-slate-400">{doc.date} • {doc.type}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-tealSoft-50 text-tealSoft-700 rounded-full border border-tealSoft-100">
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>

        </div>

        {/* Right 4 cols: Rural Health Tips & Emergency Box */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Health Tip Card */}
          <Card className="bg-gradient-to-b from-mint-50/60 to-white border-mint-100 space-y-4">
            <div className="flex items-center space-x-2 text-mint-700">
              <FaLightbulb className="text-lg text-amber-500" />
              <h4 className="font-bold text-sm">Monsoon Season Health Tip</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Always drink boiled water during rains to protect against stomach infections. If fever lasts more than 2 days, consult your primary health officer immediately.
            </p>
            <div className="pt-2">
              <Link to="/patient/ai-assistant">
                <Button variant="mint" size="sm" fullWidth icon={FaRobot}>
                  Ask AI About Water Safety
                </Button>
              </Link>
            </div>
          </Card>

          {/* Emergency Helpline Box */}
          <Card className="space-y-3 border-rose-100 bg-rose-50/30">
            <h4 className="font-bold text-slate-800 text-sm text-rose-700">Need Immediate Advice?</h4>
            <p className="text-xs text-slate-600">
              Call free national health line <strong>104 / 108</strong> anytime to speak with a medical assistant.
            </p>
          </Card>

        </div>

      </div>

    </div>
  );
};

export default PatientDashboard;
