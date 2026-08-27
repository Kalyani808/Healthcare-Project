import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { 
  FaFileMedical, 
  FaDownload, 
  FaCheckCircle, 
  FaHeartbeat, 
  FaFilePdf, 
  FaMicroscope, 
  FaPrint, 
  FaPlus,
  FaNotesMedical
} from 'react-icons/fa';

const HealthReportsPage = () => {
  const reports = [
    {
      id: 1,
      title: 'Complete Health Diagnostic Summary',
      doctor: 'Dr. Ananya Sharma (MD, General Medicine)',
      hospital: 'Apollo Clinics Healthcare',
      date: '2026-08-15',
      status: 'Normal Vitals',
      category: 'Diagnostic Health Checkup',
      metrics: [
        { label: 'Blood Pressure', value: '120/80 mmHg', status: 'optimal' },
        { label: 'Hemoglobin (Hb)', value: '13.5 g/dL', status: 'normal' },
        { label: 'Fasting Sugar (FBS)', value: '95 mg/dL', status: 'normal' },
        { label: 'Serum Creatinine', value: '0.9 mg/dL', status: 'normal' },
      ],
      doctorNotes: 'Patient demonstrates excellent metabolic stability and healthy organ function. Continue regular physical activity and balanced hydration.',
    },
    {
      id: 2,
      title: 'Seasonal Fever & CBC Platelet Profile',
      doctor: 'Dr. Rajesh Verma (DCH, Pediatrics)',
      hospital: 'Rainbow Children & Family Hospital',
      date: '2026-07-28',
      status: 'Fully Recovered',
      category: 'CBC & Infectious Profile',
      metrics: [
        { label: 'Platelet Count', value: '2.4 Lakhs/cumm', status: 'normal' },
        { label: 'WBC / TLC', value: '6,800 /cumm', status: 'normal' },
        { label: 'Body Temp', value: '98.4 °F', status: 'normal' },
      ],
      doctorNotes: 'Viral markers resolved. Platelet count restored to optimal range. Course of antibiotic completed.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-teal-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 bg-teal-500/20 border border-teal-400/30 px-3 py-1 rounded-full text-teal-300 text-xs font-bold uppercase tracking-wider">
              <FaFileMedical className="text-teal-400" />
              <span>Official Clinical Records</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Health Diagnostic & Checkup Summaries
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Official medical checkup summaries, vital sign trends, and certified doctor remarks.
            </p>
          </div>

          <Link to="/patient/upload-document">
            <Button variant="primary" size="md" icon={FaMicroscope} className="shadow-lg shadow-teal-500/20 font-bold text-xs shrink-0">
              Analyze New Lab Report
            </Button>
          </Link>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-6">
        {reports.map((report) => (
          <Card key={report.id} className="p-6 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-md space-y-4">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl font-bold shrink-0">
                  <FaFilePdf />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">{report.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Issued by <strong>{report.doctor}</strong> • {report.hospital} ({report.date})
                  </p>
                </div>
              </div>

              <span className="text-xs font-black uppercase px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full">
                {report.status}
              </span>
            </div>

            {/* Vital Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {report.metrics.map((m, idx) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs">
                  <span className="text-[10px] text-slate-400 font-bold block">{m.label}:</span>
                  <span className="font-black text-slate-900 dark:text-slate-100 text-sm">{m.value}</span>
                </div>
              ))}
            </div>

            {/* Doctor Clinical Advice Remark */}
            <div className="p-3.5 bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900 rounded-xl text-xs space-y-1">
              <span className="font-bold text-teal-900 dark:text-teal-300 flex items-center space-x-1.5">
                <FaNotesMedical className="text-teal-600" />
                <span>Physician Clinical Notes:</span>
              </span>
              <p className="text-slate-700 dark:text-slate-300 pl-5 font-medium leading-relaxed">
                {report.doctorNotes}
              </p>
            </div>

            {/* Action Bar */}
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => window.print()}
                className="py-1.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all"
              >
                <FaPrint /> <span>Print Record</span>
              </button>
              <button
                type="button"
                onClick={() => alert(`Downloading signed medical summary: ${report.title}`)}
                className="py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-all"
              >
                <FaDownload /> <span>Download PDF</span>
              </button>
            </div>

          </Card>
        ))}
      </div>

    </div>
  );
};

export default HealthReportsPage;
