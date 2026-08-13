import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import api from '../../api/axios';
import { FaFileUpload, FaCloudUploadAlt, FaRobot, FaTimes, FaTable, FaEye, FaDownload, FaPills, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const UploadDocument = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Prescription');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analyzed, setAnalyzed] = useState(null);
  const [showRawDetails, setShowRawDetails] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (!selected.type.startsWith('image/')) {
        alert('Please select an image file (.png, .jpg, .jpeg) for medical prescription parsing.');
        return;
      }
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      if (!docName) {
        setDocName(selected.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setProgress(20);

    const formData = new FormData();
    formData.append('document_name', docName || file.name);
    formData.append('document_type', 'image');
    formData.append('file', file);

    try {
      // Step 1: Upload document
      const response = await api.post('/api/documents/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const docId = response.data.id;
      setProgress(40);

      // Step 2: Trigger background task (returns 202 Accepted)
      await api.post(`/api/documents/${docId}/extract-text/`);
      setProgress(50);

      // Step 3: Poll GET /api/documents/{id}/extraction-status/ every 2 seconds until complete
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await api.get(`/api/documents/${docId}/extraction-status/`);
          const statusData = statusRes.data;

          if (statusData.status === 'complete') {
            clearInterval(pollInterval);
            setProgress(100);
            setUploading(false);

            setAnalyzed({
              extracted_text: statusData.extracted_text || statusData.text || '',
              medicines: statusData.medicines || [],
              medicines_only: statusData.medicines_only || (statusData.lines ? statusData.lines.map(l => l.text) : []),
              confidence: statusData.confidence || 0.88,
              num_lines: statusData.num_lines || (statusData.medicines ? statusData.medicines.length : 0),
              is_handwritten: statusData.is_handwritten_detected,
              requires_review: statusData.requires_manual_review,
              db_doc: response.data,
            });
          } else if (statusData.status === 'failed') {
            clearInterval(pollInterval);
            setUploading(false);
            alert('ICR text extraction failed: ' + (statusData.error || 'Unknown error'));
          } else {
            setProgress((prev) => Math.min(prev + 10, 90));
          }
        } catch (pollErr) {
          console.error('Polling error:', pollErr);
        }
      }, 2000);

    } catch (err) {
      console.error('Failed to process prescription image:', err);
      setUploading(false);
      alert('Extraction failed: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center space-x-4 pb-4 border-b border-slate-100">
        <div className="w-14 h-14 rounded-2xl bg-mint-500 text-white flex items-center justify-center text-2xl shadow-md">
          <FaFileUpload />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Upload Medical Document</h1>
          <p className="text-slate-500 text-xs">Upload prescription images for instant AI medicine extraction & regional care guidance</p>
        </div>
      </div>

      {/* Equal 50/50 Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* LEFT SIDE (50% Width, ~500px Height Container) */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="h-[520px] flex flex-col justify-between space-y-4 overflow-hidden">
            <form onSubmit={handleUpload} className="h-full flex flex-col justify-between space-y-3">

              <div className="space-y-3">
                <Input
                  label="Document Name"
                  placeholder="e.g. Dr_Sharma_Prescription_Aug"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  required
                />

                {!preview ? (
                  <label className="border-2 border-dashed border-health-200 hover:border-health-400 bg-health-50/30 hover:bg-health-50 rounded-2xl h-[280px] flex flex-col items-center justify-center cursor-pointer transition-all space-y-3 p-4">
                    <div className="w-16 h-16 rounded-2xl bg-health-100 text-health-600 flex items-center justify-center text-3xl">
                      <FaCloudUploadAlt />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-semibold text-slate-700">Click to select prescription image</p>
                      <p className="text-xs text-slate-400">Supports PNG, JPG, JPEG (Max 10MB)</p>
                    </div>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs text-slate-500 font-semibold px-1">
                      <span>Prescription Image View</span>
                      <button
                        type="button"
                        onClick={() => { setFile(null); setPreview(null); setAnalyzed(null); }}
                        className="text-rose-500 hover:underline flex items-center space-x-1"
                      >
                        <FaTimes /> <span>Remove File</span>
                      </button>
                    </div>
                    <div className="relative bg-slate-900/5 rounded-2xl border border-slate-200 h-[280px] flex items-center justify-center p-2 overflow-hidden group">
                      <img
                        src={preview}
                        alt="Prescription Preview"
                        className="max-h-[260px] max-w-full object-contain rounded-lg shadow-sm transition-transform duration-300 group-hover:scale-105"
                      />
                      <a
                        href={preview}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white text-slate-700 rounded-xl shadow-md backdrop-blur transition-all"
                        title="View Full Resolution"
                      >
                        <FaEye />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Uploading Progress */}
              {uploading && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Extracting medicines with ICR Vision...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-health-500 to-mint-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="mint"
                size="lg"
                fullWidth
                disabled={!file || uploading}
                icon={FaFileUpload}
              >
                {uploading ? 'Extracting Medicines...' : 'Upload & Extract Medicines'}
              </Button>

            </form>
          </Card>
        </div>

        {/* RIGHT SIDE (50% Width, ~500px Height Container) */}
        <div className="lg:col-span-1 space-y-4">
          <Card className={`h-[520px] flex flex-col justify-between ${analyzed ? 'border-mint-200 bg-mint-50/10' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-base">
                <FaRobot className="text-tealSoft-500 text-xl" />
                <span>AI Medicine Extraction</span>
              </div>
              {analyzed && (
                <span className="text-[11px] font-semibold text-mint-700 bg-mint-100 px-2.5 py-1 rounded-full flex items-center space-x-1">
                  <FaPills /> <span>{analyzed.medicines_only?.length || 0} Medicines Found</span>
                </span>
              )}
            </div>

            {!analyzed ? (
              <div className="my-auto py-16 text-center text-slate-400 space-y-3">
                <FaTable className="text-4xl mx-auto opacity-40 text-tealSoft-400" />
                <p className="text-sm font-medium text-slate-600">Upload prescription image on left panel</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">Extracted medicine names, dosages, and instructions will appear here instantly.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between pt-3 space-y-3 overflow-hidden">

                {/* Confidence Badge */}
                {analyzed.confidence >= 0.90 ? (
                  <Alert type="success" message={`✓✓ High confidence - Ready for processing (${(analyzed.confidence * 100).toFixed(1)}%)`} />
                ) : analyzed.confidence >= 0.80 ? (
                  <Alert type="success" message={`✓ Text Extracted Successfully (${(analyzed.confidence * 100).toFixed(1)}% confidence)`} />
                ) : (
                  <Alert type="warning" message={`⚠️ Low confidence - Please review manually (${(analyzed.confidence * 100).toFixed(1)}%)`} />
                )}

                {/* DETECTED MEDICINES CARDS PANEL (500px Height Equal View) */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 max-h-[300px]">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>DETECTED MEDICINES</span>
                    <span className="text-[10px] text-slate-400 font-normal">Filtered Medicine Names Only</span>
                  </h4>

                  {analyzed.medicines && analyzed.medicines.length > 0 ? (
                    analyzed.medicines.map((med, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#f0f9f7] border-l-4 border-[#1abc9c] rounded-r-xl shadow-sm space-y-1 transition-all hover:bg-white hover:shadow-md"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-800 text-sm">
                          <span className="text-slate-900">{med.medicine || med.raw_line}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-mint-100 text-mint-800 font-bold">
                            {(med.confidence ? (med.confidence * 100).toFixed(0) : 88)}% match
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span className="truncate pr-2">{med.raw_line || med.found_as}</span>
                          {med.dosage && (
                            <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md flex-shrink-0">
                              {med.dosage} {med.frequency ? `• ${med.frequency}` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : analyzed.medicines_only && analyzed.medicines_only.length > 0 ? (
                    analyzed.medicines_only.map((medStr, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#f0f9f7] border-l-4 border-[#1abc9c] rounded-r-xl shadow-sm text-slate-800 font-medium text-sm flex items-center justify-between transition-all hover:bg-white hover:shadow-md"
                      >
                        <span className="font-semibold text-slate-800 leading-snug">{medStr}</span>
                        <span className="text-[10px] uppercase font-bold text-mint-800 bg-mint-100 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                          Rx
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-slate-700 space-y-3 text-xs">
                      <div className="flex items-center space-x-2 font-bold text-amber-900 text-sm">
                        <span>⚠️ No Valid Medicines Identified</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        {analyzed.quality_reason || "Image quality or handwriting clarity is too low for accurate extraction."}
                      </p>
                      <div className="bg-white p-3 rounded-xl border border-amber-200/60 space-y-1">
                        <p className="font-bold text-amber-900">Tips for Clearer Extraction:</p>
                        <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                          <li>Take photo directly from above (avoid tilt)</li>
                          <li>Ensure bright, even lighting with no glare</li>
                          <li>Keep prescription flat and in sharp focus</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Optional Expandable Raw OCR Text Footer */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowRawDetails(!showRawDetails)}
                    className="w-full text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <span>{showRawDetails ? 'Hide Full Raw Text Details' : 'Show Full Raw Text Details'}</span>
                    {showRawDetails ? <FaChevronUp /> : <FaChevronDown />}
                  </button>

                  {showRawDetails && (
                    <div className="mt-2 p-2.5 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-xl max-h-24 overflow-y-auto">
                      {analyzed.extracted_text}
                    </div>
                  )}
                </div>

              </div>
            )}
          </Card>
        </div>

      </div>

    </div>
  );
};

export default UploadDocument;
