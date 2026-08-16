import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { FaUsers, FaSearch, FaUser, FaPhone, FaFileMedical, FaEye } from 'react-icons/fa';

const PatientList = () => {
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  const patients = [
    { id: 1, name: 'Ramesh Kumar', phone: '+91 98765 43210', dob: '1985-04-12', gender: 'Male', language: 'Hindi', village: 'Sundarpur Village', lastVisit: '2026-08-04', emergency: '+91 98123 45678' },
    { id: 2, name: 'Sita Devi', phone: '+91 98111 00022', dob: '1968-11-20', gender: 'Female', language: 'Hindi', village: 'Solan Tehsil', lastVisit: '2026-07-29', emergency: '+91 98111 00099' },
    { id: 3, name: 'Manoj Singh', phone: '+91 98444 33221', dob: '1992-02-15', gender: 'Male', language: 'Punjabi', village: 'Dharampur District', lastVisit: '2026-07-18', emergency: '+91 98444 33299' },
  ];

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.village.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex items-center space-x-4 pb-4 border-b border-slate-100">
        <div className="w-14 h-14 rounded-2xl bg-health-500 text-white flex items-center justify-center text-2xl shadow-md">
          <FaUsers />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Rural Patient Registry</h1>
          <p className="text-slate-500 text-xs">Directory of patients registered across village health kiosks</p>
        </div>
      </div>

      <Card className="p-4">
        <Input
          placeholder="Search patients by name or village..."
          icon={FaSearch}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredPatients.map((p) => (
          <Card key={p.id} hoverable className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-health-50 text-health-600 flex items-center justify-center text-xl font-bold">
                  <FaUser />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{p.name}</h3>
                  <p className="text-xs text-slate-500">{p.village}</p>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-2xl">
                <p>Phone: <strong className="text-slate-800">{p.phone}</strong></p>
                <p>Language: <strong className="text-slate-800">{p.language}</strong></p>
                <p>Last Consulted: <strong className="text-slate-800">{p.lastVisit}</strong></p>
              </div>
            </div>

            <Button
              variant="soft"
              size="sm"
              fullWidth
              icon={FaEye}
              onClick={() => setSelectedPatient(p)}
            >
              View Health History
            </Button>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
        title={`Patient Records — ${selectedPatient?.name}`}
      >
        {selectedPatient && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-health-50 rounded-2xl border border-health-100 space-y-2">
              <p>Village: <strong>{selectedPatient.village}</strong></p>
              <p>DOB: <strong>{selectedPatient.dob}</strong> ({selectedPatient.gender})</p>
              <p>Primary Phone: <strong>{selectedPatient.phone}</strong></p>
              <p>Emergency Contact: <strong>{selectedPatient.emergency}</strong></p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-700 uppercase">Uploaded Medical Documents</h4>
              <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                <span className="font-medium">Dr_Sharma_Fever_Prescription.png</span>
                <span className="text-mint-700 font-bold">Parsed by AI</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default PatientList;
