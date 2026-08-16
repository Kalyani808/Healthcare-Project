import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import { FaCalendarAlt, FaUserMd, FaStar, FaVideo, FaCheckCircle, FaClock, FaStethoscope } from 'react-icons/fa';

const AppointmentsPage = () => {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [booked, setBooked] = useState(false);

  const doctors = [
    {
      id: 1,
      name: 'Dr. Ananya Sharma',
      specialization: 'General Medicine & Diabetology',
      experience: '12 Years Experience',
      qualification: 'MBBS, MD (General Medicine)',
      fee: '₹250 (Waived for Rural Cards)',
      rating: '4.9',
      availability: 'Today Available',
    },
    {
      id: 2,
      name: 'Dr. Rajesh Verma',
      specialization: 'Pediatrics (Child Health Specialist)',
      experience: '15 Years Experience',
      qualification: 'MBBS, DCH',
      fee: '₹300',
      rating: '4.8',
      availability: 'Tomorrow Available',
    },
    {
      id: 3,
      name: 'Dr. Sunita Rao',
      specialization: 'Gynaecology & Maternal Care',
      experience: '10 Years Experience',
      qualification: 'MBBS, MS (O&G)',
      fee: '₹200',
      rating: '4.9',
      availability: 'Today Available',
    },
  ];

  const [bookingForm, setBookingForm] = useState({
    date: '2026-08-06',
    time: '10:30 AM',
    reason: 'Mild fever and cough since 2 days',
  });

  const handleConfirmBooking = (e) => {
    e.preventDefault();
    setBooked(true);
    setTimeout(() => {
      setBooked(false);
      setSelectedDoctor(null);
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      
      <div className="flex items-center space-x-4 pb-4 border-b border-slate-100">
        <div className="w-14 h-14 rounded-2xl bg-tealSoft-500 text-white flex items-center justify-center text-2xl shadow-md">
          <FaCalendarAlt />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tele-Doctor Consultations</h1>
          <p className="text-slate-500 text-xs">Book direct video or voice calls with qualified medical officers</p>
        </div>
      </div>

      {/* Doctor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {doctors.map((doc) => (
          <Card key={doc.id} hoverable className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-health-50 text-health-600 flex items-center justify-center text-2xl font-bold">
                <FaUserMd />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">{doc.name}</h3>
                <p className="text-xs text-health-600 font-semibold">{doc.specialization}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{doc.qualification} • {doc.experience}</p>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span className="flex items-center text-amber-500 font-bold">
                  <FaStar className="mr-1" /> {doc.rating}
                </span>
                <span className="font-bold text-slate-700">{doc.fee}</span>
              </div>
            </div>

            <Button
              variant="mint"
              size="md"
              fullWidth
              icon={FaVideo}
              onClick={() => setSelectedDoctor(doc)}
            >
              Book Appointment
            </Button>
          </Card>
        ))}
      </div>

      {/* Booking Dialog Modal */}
      <Modal
        isOpen={!!selectedDoctor}
        onClose={() => setSelectedDoctor(null)}
        title={`Book Appointment with ${selectedDoctor?.name}`}
      >
        {selectedDoctor && (
          <form onSubmit={handleConfirmBooking} className="space-y-4">
            {booked && <Alert type="success" message="Appointment Booked Successfully! Confirmation sent via SMS." />}

            <div className="p-3 bg-health-50 rounded-2xl border border-health-100 text-xs space-y-1">
              <p className="font-bold text-health-800">{selectedDoctor.name}</p>
              <p className="text-health-700">{selectedDoctor.specialization}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Appointment Date"
                type="date"
                value={bookingForm.date}
                onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                required
              />
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                  Time Slot *
                </label>
                <select
                  value={bookingForm.time}
                  onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                  className="w-full py-3 px-4 text-sm rounded-2xl border border-slate-200 bg-white"
                >
                  <option value="10:30 AM">10:30 AM (Morning)</option>
                  <option value="02:00 PM">02:00 PM (Afternoon)</option>
                  <option value="06:00 PM">06:00 PM (Evening)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                Symptoms / Health Reason
              </label>
              <textarea
                rows="3"
                value={bookingForm.reason}
                onChange={(e) => setBookingForm({ ...bookingForm, reason: e.target.value })}
                className="w-full p-3 text-sm rounded-2xl border border-slate-200"
              ></textarea>
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth>
              Confirm Appointment Slot
            </Button>
          </form>
        )}
      </Modal>

    </div>
  );
};

export default AppointmentsPage;
