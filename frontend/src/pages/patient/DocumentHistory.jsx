import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { FaHistory, FaSearch, FaFilter, FaFileAlt, FaEye, FaDownload, FaTrashAlt, FaCheckCircle } from 'react-icons/fa';

const DocumentHistory = () => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [selectedDoc, setSelectedDoc] = useState(null);

  const [documents, setDocuments] = useState([
    {
      id: 1,
      document_name: 'Dr_Sharma_Fever_Prescription',
      document_type: 'Prescription',
      uploaded_at: '2026-08-04',
      size: '1.2 MB',
      image_url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=60',
    },
    {
      id: 2,
      document_name: 'Blood_Report_Hemoglobin',
      document_type: 'Lab Report',
      uploaded_at: '2026-07-28',
      size: '850 KB',
      image_url: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&auto=format&fit=crop&q=60',
    },
    {
      id: 3,
      document_name: 'Discharge_Summary_Solan_Hospital',
      document_type: 'Discharge Summary',
      uploaded_at: '2026-06-15',
      size: '2.4 MB',
      image_url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=60',
    },
  ]);

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.document_name.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'All' || doc.document_type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this document from your vault?')) {
      setDocuments(documents.filter((d) => d.id !== id));
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      
      {/* Title */}
      <div className="flex items-center space-x-4 pb-4 border-b border-slate-100">
        <div className="w-14 h-14 rounded-2xl bg-health-500 text-white flex items-center justify-center text-2xl shadow-md">
          <FaHistory />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Medical Document Vault</h1>
          <p className="text-slate-500 text-xs">All your previous prescriptions and medical reports stored securely</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search documents by name..."
            icon={FaSearch}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <FaFilter className="text-slate-400 text-sm" />
          <span className="text-xs font-semibold text-slate-600">Category:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:border-health-500"
          >
            <option value="All">All Documents</option>
            <option value="Prescription">Prescriptions</option>
            <option value="Lab Report">Lab Reports</option>
            <option value="Discharge Summary">Discharge Summaries</option>
          </select>
        </div>
      </Card>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredDocs.map((doc) => (
          <Card key={doc.id} hoverable className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="relative h-40 bg-slate-100 rounded-2xl overflow-hidden group">
                <img src={doc.image_url} alt={doc.document_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-health-700 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                  {doc.document_type}
                </span>
              </div>
              <h3 className="font-bold text-slate-800 text-sm truncate">{doc.document_name}</h3>
              <p className="text-[11px] text-slate-400">Uploaded on {doc.uploaded_at} • {doc.size}</p>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
              <Button
                variant="soft"
                size="sm"
                className="flex-1"
                icon={FaEye}
                onClick={() => setSelectedDoc(doc)}
              >
                View
              </Button>
              <button
                onClick={() => handleDelete(doc.id)}
                className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 transition-colors"
                title="Delete"
              >
                <FaTrashAlt />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Document Preview Modal */}
      <Modal
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        title={selectedDoc?.document_name || 'Document Preview'}
      >
        {selectedDoc && (
          <div className="space-y-4">
            <img src={selectedDoc.image_url} alt={selectedDoc.document_name} className="w-full max-h-96 object-contain rounded-2xl border border-slate-200" />
            <div className="flex justify-between items-center text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
              <span>Type: <strong>{selectedDoc.document_type}</strong></span>
              <span>Date: <strong>{selectedDoc.uploaded_at}</strong></span>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default DocumentHistory;
