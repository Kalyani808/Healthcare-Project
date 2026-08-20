import React from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaFileMedical, FaDownload, FaCheckCircle, FaHeartbeat, FaFilePdf } from 'react-icons/fa';

const HealthReportsPage = () => {
  const reports = [
    {
      id: 1,
      title: 'Annual Family Health Checkup Summary',
      doctor: 'Dr. Ananya Sharma',
      date: '2026-08-01',
      status: 'Normal Health Vitals',
      details: 'Blood Pressure: 120/80 mmHg, Hemoglobin: 13.5 g/dL, Fasting Sugar: 95 mg/dL',
    },
    {
      id: 2,
      title: 'Monsoon Seasonal Fever & Vital Analysis',
      doctor: 'Dr. Rajesh Verma',
      date: '2026-07-20',
      status: 'Recovered',
      details: 'Platelet count normal, mild hydration recommended.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center space-x-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="w-14 h-14 rounded-2xl bg-health-500 text-white flex items-center justify-center text-2xl shadow-md">
          <FaFileMedical />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Health Summary Reports</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs">Official medical summaries issued by your tele-consultation doctors</p>
        </div>
      </div>

      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.id} className="space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-700/80">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 dark:text-rose-400 flex items-center justify-center text-xl font-bold">
                  <FaFilePdf />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">{report.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Issued by {report.doctor} on {report.date}</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-mint-50 dark:bg-mint-950/60 text-mint-700 dark:text-mint-300 rounded-full border border-mint-100 dark:border-mint-800/60">
                {report.status}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#1E293B] p-3.5 rounded-2xl font-mono border border-slate-100 dark:border-slate-700/80">
              {report.details}
            </p>

            <div className="flex justify-end pt-1">
              <Button
                variant="soft"
                size="sm"
                icon={FaDownload}
                onClick={() => alert(`Downloading ${report.title} (PDF)...`)}
              >
                Download PDF
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HealthReportsPage;
