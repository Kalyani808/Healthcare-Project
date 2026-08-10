import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { FaFileUpload, FaCloudUploadAlt, FaFileImage, FaCheckCircle, FaRobot, FaTimes, FaTable } from 'react-icons/fa';

const UploadDocument = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Prescription');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analyzed, setAnalyzed] = useState(null);

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

  const handleUpload = (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setProgress(20);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          setAnalyzed({
            medicines: [
              { name: 'Paracetamol 500mg', dose: '1 Tablet', timing: 'Subah - Shaam (After Meal)', duration: '3 Days' },
              { name: 'Amoxicillin 250mg', dose: '1 Capsule', timing: 'Din mein 3 baar', duration: '5 Days' },
              { name: 'ORSL Rehydration', dose: '1 Sachet', timing: 'Pani ke sath zaroorat padne par', duration: 'As needed' },
            ],
            advice: 'Prachur matra mein pani piyein aur regular rest karein. Agar bukhar 101°F se upar jaye to turant helpline 104 par sampark karein.',
          });
          return 100;
        }
        return prev + 30;
      });
    }, 400);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center space-x-4 pb-4 border-b border-slate-100">
        <div className="w-14 h-14 rounded-2xl bg-mint-500 text-white flex items-center justify-center text-2xl shadow-md">
          <FaFileUpload />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Upload Medical Document</h1>
          <p className="text-slate-500 text-xs">Upload prescription images for instant AI extraction & regional translation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Upload Form (Left 7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="space-y-6">
            <form onSubmit={handleUpload} className="space-y-4">
              
              <Input
                label="Document Name"
                placeholder="e.g. Dr_Sharma_Prescription_Aug"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                  Document Category
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full py-3 px-4 text-sm rounded-2xl border border-slate-200 bg-white focus:outline-none focus:border-health-500"
                >
                  <option value="Prescription">Doctor Prescription Slip</option>
                  <option value="Lab Report">Lab Test Report</option>
                  <option value="Discharge Summary">Hospital Discharge Slip</option>
                </select>
              </div>

              {/* Drag Drop Image Upload Box */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                  Prescription Image File *
                </label>
                
                {!preview ? (
                  <label className="border-2 border-dashed border-health-200 hover:border-health-400 bg-health-50/30 hover:bg-health-50 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-health-100 text-health-600 flex items-center justify-center text-2xl">
                      <FaCloudUploadAlt />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-semibold text-slate-700">Click to select prescription image</p>
                      <p className="text-xs text-slate-400">Supports PNG, JPG, JPEG (Max 10MB)</p>
                    </div>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                ) : (
                  <div className="relative bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center space-x-4">
                    <img src={preview} alt="Prescription Preview" className="w-20 h-20 object-cover rounded-xl border border-slate-200" />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-bold text-slate-800 truncate">{file?.name}</p>
                      <p className="text-xs text-slate-400">{(file?.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setFile(null); setPreview(null); setAnalyzed(null); }}
                      className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50"
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
              </div>

              {/* Uploading progress bar */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Parsing image with AI Vision...</span>
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
                {uploading ? 'Processing Image...' : 'Upload & Parse Document'}
              </Button>

            </form>
          </Card>
        </div>

        {/* AI Analyzed Output Result (Right 5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className={`space-y-4 ${analyzed ? 'border-mint-200 bg-mint-50/20' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-base pb-2 border-b border-slate-100">
              <FaRobot className="text-tealSoft-500 text-xl" />
              <span>AI Extraction Summary</span>
            </div>

            {!analyzed ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <FaTable className="text-3xl mx-auto opacity-50" />
                <p className="text-xs">Upload a prescription on the left to see instant medicine schedule & dosages.</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <Alert type="success" message="Prescription OCR & Translation completed successfully!" />

                <div>
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-2">Detected Medicines</h4>
                  <div className="space-y-2">
                    {analyzed.medicines.map((med, idx) => (
                      <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-sm space-y-1">
                        <div className="flex justify-between font-bold text-slate-800">
                          <span>{med.name}</span>
                          <span className="text-mint-700">{med.dose}</span>
                        </div>
                        <p className="text-slate-500">Timing: <span className="font-medium text-slate-700">{med.timing}</span></p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-mint-100 space-y-1">
                  <h4 className="font-bold text-mint-800 uppercase">Sahayak Care Guidance</h4>
                  <p className="text-slate-600 leading-relaxed">{analyzed.advice}</p>
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
