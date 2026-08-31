import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import api from '../../api/axios';
import { 
  FaHistory, 
  FaSearch, 
  FaFilter, 
  FaFileAlt, 
  FaEye, 
  FaDownload, 
  FaTrashAlt, 
  FaCheckCircle, 
  FaPills, 
  FaVial, 
  FaMicroscope, 
  FaPlus,
  FaExternalLinkAlt
} from 'react-icons/fa';

const DocumentHistory = () => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/api/documents/');
      const docData = res.data.results || res.data;
      setDocuments(Array.isArray(docData) ? docData : []);
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
    return matchesSearch;
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
      
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-teal-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 bg-teal-500/20 border border-teal-400/30 px-3 py-1 rounded-full text-teal-300 text-xs font-bold uppercase tracking-wider">
              <FaHistory className="text-teal-400" />
              <span>Encrypted Records Archive</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Medical Documents & Records Vault
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              All your uploaded prescriptions and diagnostic lab reports stored with high-security access.
            </p>
          </div>

          <Link to="/patient/upload-document">
            <Button variant="primary" size="md" icon={FaPlus} className="shadow-lg shadow-teal-500/20 font-bold text-xs shrink-0">
              Upload New Document
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search document name..."
            icon={FaSearch}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold">
          <span className="text-slate-400">Total Records:</span>
          <span className="px-2.5 py-1 bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 rounded-xl">
            {filteredDocs.length} Documents
          </span>
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading document vault...</div>
      ) : filteredDocs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => (
            <Card key={doc.id} hoverable className="p-5 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-md space-y-4 flex flex-col justify-between">
              
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center text-lg font-bold shrink-0">
                      <FaFileAlt />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm line-clamp-1">
                        {doc.document_name}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {new Date(doc.uploaded_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-md">
                    {doc.status === 'translated' || doc.status === 'text_extracted' ? 'Analyzed' : 'Stored'}
                  </span>
                </div>

                {doc.extracted_text && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-2 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/40 dark:border-slate-800 font-mono text-[11px]">
                    {doc.extracted_text}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedDoc(doc)}
                  className="flex-1 py-1.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all"
                >
                  <FaEye /> <span>Preview</span>
                </button>

                {doc.file && (
                  <a
                    href={doc.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                    title="Open Document in New Tab"
                  >
                    <FaExternalLinkAlt className="text-xs" />
                  </a>
                )}

                <Link
                  to="/patient/upload-document"
                  className="py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs transition-all"
                  title="Re-analyze document"
                >
                  <FaMicroscope />
                </Link>

                <button
                  type="button"
                  onClick={() => handleDelete(doc.id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all"
                  title="Delete from Vault"
                >
                  <FaTrashAlt />
                </button>
              </div>

            </Card>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center space-y-3 text-slate-400">
          <FaFileAlt className="text-5xl mx-auto opacity-30 text-teal-500" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No Documents in Vault</h3>
          <p className="text-xs max-w-sm mx-auto">Upload your first prescription or diagnostic lab report to start your clinical archive.</p>
          <Link to="/patient/upload-document">
            <Button variant="primary" size="md" icon={FaPlus} className="mt-2 font-bold text-xs">
              Upload Document Now
            </Button>
          </Link>
        </div>
      )}

      {/* Document View Modal */}
      {selectedDoc && (
        <Modal
          isOpen={Boolean(selectedDoc)}
          onClose={() => setSelectedDoc(null)}
          title={selectedDoc.document_name}
        >
          <div className="space-y-4 pt-2">
            {selectedDoc.file && (
              <div className="bg-slate-900/5 dark:bg-slate-950 rounded-2xl p-2 max-h-[340px] flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-800">
                <img
                  src={selectedDoc.file}
                  alt="Full Document"
                  className="max-h-[320px] max-w-full object-contain rounded-lg"
                />
              </div>
            )}

            {selectedDoc.extracted_text && (
              <div className="space-y-1">
                <h5 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase">Extracted OCR Content:</h5>
                <div className="p-3 bg-slate-900 text-slate-200 font-mono text-xs rounded-xl max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {selectedDoc.extracted_text}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              {selectedDoc.file ? (
                <a
                  href={selectedDoc.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors border border-slate-200 dark:border-slate-700"
                >
                  <FaExternalLinkAlt className="text-xs" />
                  <span>Open in New Tab</span>
                </a>
              ) : <div />}
              <Button variant="secondary" size="md" onClick={() => setSelectedDoc(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default DocumentHistory;
