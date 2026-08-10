import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaCalendarCheck, FaVideo, FaCheck, FaTimes, FaPhoneAlt } from 'react-icons/fa';

const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState([
    { id: 1, patient: 'Ramesh Kumar', village: 'Sundarpur', date: '2026-08-06', time: '10:30 AM', status: 'Confirmed', reason: 'Fever & prescription decoding' },
    { id: 2, patient: 'Sita Devi', village: 'Solan Tehsil', date: '2026-08-06', time: '11:15 AM', status: 'Pending', reason: 'Hypertension consultation' },
    { id: 3, patient: 'Manoj Singh', village: 'Dharampur', date: '2026-08-07', time: '02:00 PM', status: 'Confirmed', reason: 'Diabetes follow-up' },
  ]);

  const updateStatus = (id, newStatus) => {
    setAppointments(appointments.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center space-x-4 pb-4 border-b border-slate-100">
        <div className="w-14 h-14 rounded-2xl bg-tealSoft-500 text-white flex items-center justify-center text-2xl shadow-md">
          <FaCalendarCheck />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Appointment Management Queue</h1>
          <p className="text-slate-500 text-xs">Manage tele-consultation requests and start video calls</p>
        </div>
      </div>

      <div className="space-y-4">
        {appointments.map((app) => (
          <Card key={app.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                <h3 className="font-bold text-slate-800 text-base">{app.patient}</h3>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    app.status === 'Confirmed'
                      ? 'bg-mint-50 text-mint-700 border border-mint-200'
                      : app.status === 'Completed'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {app.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">{app.village} • {app.date} at <strong>{app.time}</strong></p>
              <p className="text-xs text-health-700 font-medium">Reason: {app.reason}</p>
            </div>

            <div className="flex items-center space-x-2">
              {app.status === 'Pending' ? (
                <>
                  <Button variant="mint" size="sm" icon={FaCheck} onClick={() => updateStatus(app.id, 'Confirmed')}>
                    Accept
                  </Button>
                  <Button variant="secondary" size="sm" icon={FaTimes} onClick={() => updateStatus(app.id, 'Cancelled')}>
                    Decline
                  </Button>
                </>
              ) : (
                <Button variant="primary" size="sm" icon={FaVideo} onClick={() => alert(`Starting video call with ${app.patient}...`)}>
                  Start Call
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AppointmentManagement;
