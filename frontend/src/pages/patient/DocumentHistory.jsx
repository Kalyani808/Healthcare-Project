import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import api from '../../api/axios';
import { FaHistory, FaSearch, FaFilter, FaFileAlt, FaEye, FaDownload, FaTrashAlt, FaCheckCircle } from 'react-icons/fa';

const DocumentHistory = () => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/api/documents/');
      setDocuments(res.data || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = (doc.document_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'All' || doc.document_type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this document from your vault?')) {
      try {
        await api.delete(`/api/documents/${id}/`);
        setDocuments(documents.filter((d) => d.id !== id));
      } catch (err) {
        console.error('Failed to delete document:', err);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      
      {/* Title */}
      <div className="flex items-center space-x-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="w-14 h-14 rounded-2xl bg-health-500 text-white flex items-center justify-center text-2xl shadow-md">
          <FaHistory />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Medical Document Vault</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs">All your previous prescriptions and medical reports stored securely</p>
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
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Category:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:border-health-500"
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
              <div className="relative h-40 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden group">
                <img src={doc.file || doc.image_url} alt={doc.document_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <span className="absolute top-3 left-3 bg-white/90 dark:bg-[#1E293B]/90 backdrop-blur-sm text-health-700 dark:text-health-300 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                  {doc.document_type}
                </span>
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{doc.document_name}</h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-400">Uploaded on {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'recently'}</p>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-700/80">
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
                className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
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
            <img src={selectedDoc.file || selectedDoc.image_url} alt={selectedDoc.document_name} className="w-full max-h-96 object-contain rounded-2xl border border-slate-200 dark:border-slate-700" />
            <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#1E293B] p-3 rounded-xl">
              <span>Type: <strong>{selectedDoc.document_type}</strong></span>
              <span>Date: <strong>{selectedDoc.uploaded_at ? new Date(selectedDoc.uploaded_at).toLocaleDateString() : ''}</strong></span>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default DocumentHistory;
