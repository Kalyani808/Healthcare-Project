import React, { useState, useRef, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { FaCamera, FaSync, FaTimes, FaCheck, FaRedo, FaExclamationTriangle } from 'react-icons/fa';

const CameraCaptureModal = ({ isOpen, onClose, onCapture, title = 'Scan Prescription / Medical Document' }) => {
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
  const [cameraError, setCameraError] = useState(null);
  const [isStarting, setIsStarting] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Start camera stream when modal opens
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, capturedImage]);

  const startCamera = async () => {
    setIsStarting(true);
    setCameraError(null);
    stopCamera();

    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920, max: 2560 },
          height: { ideal: 1080, max: 1440 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(e => console.log('Video play error:', e));
      }
    } catch (err) {
      console.error('Camera access error:', err);
      // Try fallback with basic constraints
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          await videoRef.current.play().catch(e => console.log('Fallback video play error:', e));
        }
      } catch (fallbackErr) {
        setCameraError('Unable to access camera. Please check your browser permissions or upload an image from your files.');
      }
    } finally {
      setIsStarting(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleFlipCamera = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleTakePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirmPhoto = () => {
    if (!capturedImage) return;

    // Convert dataURL to File object
    const byteString = atob(capturedImage.split(',')[1]);
    const mimeString = capturedImage.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
    const filename = `camera_scan_${Date.now()}.jpg`;
    const file = new File([blob], filename, { type: 'image/jpeg' });

    onCapture(file, capturedImage);
    handleClose();
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setCameraError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <div className="space-y-4 pt-1 select-none">
        
        {/* Camera Error Alert */}
        {cameraError ? (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-2xl text-xs text-rose-800 dark:text-rose-300 space-y-2">
            <div className="flex items-center space-x-2 font-bold">
              <FaExclamationTriangle className="text-rose-600 text-sm shrink-0" />
              <span>Camera Permission Required</span>
            </div>
            <p>{cameraError}</p>
            <div className="pt-2 flex justify-end">
              <Button variant="secondary" size="sm" onClick={startCamera}>
                Retry Camera
              </Button>
            </div>
          </div>
        ) : !capturedImage ? (
          /* Live Video Viewfinder */
          <div className="relative bg-black rounded-2xl overflow-hidden aspect-[4/3] max-h-[380px] flex items-center justify-center border border-slate-700 shadow-inner">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover"
            />

            {/* Document Alignment Frame Overlay */}
            <div className="absolute inset-4 border-2 border-dashed border-white/60 rounded-xl pointer-events-none flex flex-col justify-between p-3">
              <span className="text-[10px] bg-black/60 text-white font-bold px-2 py-0.5 rounded w-fit self-center">
                Align Prescription / Report Within Frame
              </span>
              <div className="flex justify-between text-white/40 text-[9px] font-mono">
                <span>[ TOP LEFT ]</span>
                <span>[ TOP RIGHT ]</span>
              </div>
              <div className="flex justify-between text-white/40 text-[9px] font-mono">
                <span>[ BTM LEFT ]</span>
                <span>[ BTM RIGHT ]</span>
              </div>
            </div>

            {/* Camera Switch Button */}
            <button
              type="button"
              onClick={handleFlipCamera}
              className="absolute top-3 right-3 p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all backdrop-blur-sm shadow-md"
              title="Flip Camera (Front / Back)"
            >
              <FaSync className="text-sm" />
            </button>

            {isStarting && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white text-xs font-bold">
                Starting Camera Stream...
              </div>
            )}
          </div>
        ) : (
          /* Captured Photo Preview */
          <div className="relative bg-black rounded-2xl overflow-hidden aspect-[4/3] max-h-[380px] flex items-center justify-center border border-slate-700 shadow-md">
            <img
              src={capturedImage}
              alt="Captured Prescription"
              className="w-full h-full object-contain"
            />
            <span className="absolute bottom-3 left-3 text-[10px] bg-emerald-600 text-white font-black px-2.5 py-1 rounded-lg shadow-md flex items-center space-x-1">
              <FaCheck className="text-xs" /> <span>Photo Captured</span>
            </span>
          </div>
        )}

        {/* Hidden Canvas for Frame Capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Controls Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" size="md" onClick={handleClose}>
            Cancel
          </Button>

          {!capturedImage ? (
            <button
              type="button"
              disabled={Boolean(cameraError) || isStarting}
              onClick={handleTakePhoto}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-lg shadow-teal-500/20 flex items-center space-x-2 transition-all active:scale-95"
            >
              <FaCamera className="text-base" />
              <span>Capture Photo</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="secondary" size="md" icon={FaRedo} onClick={handleRetake}>
                Retake
              </Button>
              <Button variant="primary" size="md" icon={FaCheck} onClick={handleConfirmPhoto}>
                Use Photo & Scan
              </Button>
            </div>
          )}
        </div>

      </div>
    </Modal>
  );
};

export default CameraCaptureModal;
