import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import { 
  FaCalendarAlt, 
  FaUserMd, 
  FaStar, 
  FaVideo, 
  FaCheckCircle, 
  FaClock, 
  FaStethoscope,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaAward,
  FaFilter
} from 'react-icons/fa';

const AppointmentsPage = () => {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [booked, setBooked] = useState(false);
  const [filterSpecialty, setFilterSpecialty] = useState('all');

  const doctors = [
    {
      id: 1,
      name: 'Dr. Ananya Sharma',
      specialization: 'General Medicine & Diabetology',
      department: 'general',
      experience: '12 Years Experience',
      qualification: 'MBBS, MD (General Medicine)',
      hospital: 'Apollo Clinics, Jubilee Hills',
      fee: 'Free (Ayushman / Rural Health Card)',
      rating: '4.9',
      reviews: '240+ Patients',
      availability: 'Today: 10:00 AM - 02:00 PM',
      isOnline: true
    },
    {
      id: 2,
      name: 'Dr. Rajesh Verma',
      specialization: 'Pediatrics (Child Health Specialist)',
      department: 'pediatrics',
      experience: '15 Years Experience',
      qualification: 'MBBS, DCH (Pediatrics)',
      hospital: 'Rainbow Children Hospital',
      fee: '₹250 (Waived for BPL)',
      rating: '4.8',
      reviews: '180+ Patients',
      availability: 'Tomorrow: 09:00 AM - 01:00 PM',
      isOnline: false
    },
    {
      id: 3,
      name: 'Dr. Sunita Rao',
      specialization: 'Gynaecology & Maternal Health',
      department: 'gynaecology',
      experience: '10 Years Experience',
      qualification: 'MBBS, MS (Obstetrics & Gynaecology)',
      hospital: 'Fernandez Healthcare',
      fee: 'Free (Maternal Care Scheme)',
      rating: '4.9',
      reviews: '310+ Patients',
      availability: 'Today: 03:00 PM - 07:00 PM',
      isOnline: true
    },
    {
      id: 4,
      name: 'Dr. K. Srinivas Reddy',
      specialization: 'Cardiology & Hypertension Care',
      department: 'cardiology',
      experience: '18 Years Experience',
      qualification: 'MBBS, MD, DM (Cardiology)',
      hospital: 'Care Hospitals, Nampally',
      fee: '₹300',
      rating: '4.9',
      reviews: '420+ Patients',
      availability: 'Today: 11:30 AM - 04:00 PM',
      isOnline: true
    }
  ];

  const [bookingForm, setBookingForm] = useState({
    date: '2026-08-28',
    time: '10:30 AM',
    reason: 'Mild fever and seasonal cough',
  });

  const filteredDoctors = filterSpecialty === 'all' 
    ? doctors 
    : doctors.filter(d => d.department === filterSpecialty);

  const handleConfirmBooking = (e) => {
    e.preventDefault();
    setBooked(true);
    setTimeout(() => {
      setBooked(false);
      setSelectedDoctor(null);
    }, 2500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-teal-800/40 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 bg-teal-500/20 border border-teal-400/30 px-3 py-1 rounded-full text-teal-300 text-xs font-bold uppercase tracking-wider">
            <FaVideo className="text-teal-400" />
            <span>Tele-Consultation Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Doctor Tele-Consultations & Appointments
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Connect directly with verified medical officers and hospital specialists via video calls or audio consultation from home.
          </p>
        </div>
      </div>

      {/* Specialty Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        <span className="text-xs font-black uppercase text-slate-400 flex items-center space-x-1 pr-2">
          <FaFilter /> <span>Specialty:</span>
        </span>
        {[
          { id: 'all', label: 'All Specialists' },
          { id: 'general', label: 'General Medicine' },
          { id: 'pediatrics', label: 'Pediatrics' },
          { id: 'gynaecology', label: 'Maternal Care' },
          { id: 'cardiology', label: 'Cardiology' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterSpecialty(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterSpecialty === tab.id
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white dark:bg-[#1E293B] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredDoctors.map((doc) => (
          <Card key={doc.id} className="p-6 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-md space-y-4 hover:border-teal-400 transition-all">
            
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center text-3xl font-bold shrink-0 shadow-sm relative">
                <FaUserMd />
                {doc.isOnline && (
                  <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" title="Online Now"></span>
                )}
              </div>

              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">{doc.name}</h3>
                  <div className="flex items-center space-x-1 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                    <FaStar /> <span>{doc.rating}</span>
                  </div>
                </div>
                <p className="text-xs font-bold text-teal-700 dark:text-teal-400">{doc.specialization}</p>
                <p className="text-[11px] text-slate-400 font-medium">{doc.qualification} • {doc.experience}</p>
                <p className="text-[11px] text-slate-500 flex items-center space-x-1 pt-0.5">
                  <FaMapMarkerAlt className="text-rose-500 text-[10px]" />
                  <span>{doc.hospital}</span>
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
              <div>
                <span className="text-[10px] text-slate-400 block font-normal">Consultation Fee:</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-black">{doc.fee}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-normal">Next Available:</span>
                <span className="text-slate-700 dark:text-slate-300 font-bold">{doc.availability.split(':')[0]}</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              fullWidth
              icon={FaVideo}
              onClick={() => setSelectedDoctor(doc)}
              className="py-2.5 font-bold text-xs"
            >
              Book Video / Audio Tele-Consultation
            </Button>

          </Card>
        ))}
      </div>

      {/* Booking Modal */}
      {selectedDoctor && (
        <Modal
          isOpen={Boolean(selectedDoctor)}
          onClose={() => setSelectedDoctor(null)}
          title={`Book Appointment: ${selectedDoctor.name}`}
        >
          {booked ? (
            <div className="py-8 text-center space-y-3">
              <FaCheckCircle className="text-5xl text-emerald-500 mx-auto" />
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Tele-Consultation Confirmed!</h3>
              <p className="text-xs text-slate-500">
                You will receive an SMS video consultation link 15 minutes before your scheduled slot.
              </p>
            </div>
          ) : (
            <form onSubmit={handleConfirmBooking} className="space-y-4 pt-2">
              <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-800 text-xs text-teal-900 dark:text-teal-200 space-y-1">
                <p className="font-bold">{selectedDoctor.name} ({selectedDoctor.specialization})</p>
                <p className="text-[11px] text-teal-700 dark:text-teal-300">{selectedDoctor.hospital} • {selectedDoctor.fee}</p>
              </div>

              <Input
                label="Preferred Date"
                type="date"
                value={bookingForm.date}
                onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                required
              />

              <Input
                label="Preferred Time Slot"
                placeholder="e.g. 10:30 AM"
                value={bookingForm.time}
                onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                required
              />

              <Input
                label="Primary Symptoms / Health Concern"
                placeholder="Describe your health concern or symptoms"
                value={bookingForm.reason}
                onChange={(e) => setBookingForm({ ...bookingForm, reason: e.target.value })}
                required
              />

              <Button type="submit" variant="primary" size="lg" fullWidth className="py-3 font-bold">
                Confirm Tele-Consultation Slot
              </Button>
            </form>
          )}
        </Modal>
      )}

    </div>
  );
};

export default AppointmentsPage;
