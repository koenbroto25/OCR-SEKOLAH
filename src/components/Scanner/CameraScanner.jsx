import React, { useRef, useState, useEffect } from 'react';
import { createWorker } from 'tesseract.js';
import { AlertCircle, Camera, Upload, RefreshCw } from 'lucide-react';
import { validateReadability, validateExtractedFields } from '../../utils/validation';
import { extractFields } from '../../utils/patterns';

export default function CameraScanner({ docType, onCapture, onCancel, studentName }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const workerRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [validationStatus, setValidationStatus] = useState(null);

  // Initialize Tesseract worker
  useEffect(() => {
    const initWorker = async () => {
      workerRef.current = await createWorker('ind');
    };
    initWorker();

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment',
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setError('');
      }
    } catch (err) {
      setError(`Akses kamera ditolak: ${err.message}`);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setCameraActive(false);
  };

  const captureFrame = async () => {
    if (!videoRef.current) return;

    setIsProcessing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      await processImage(blob, canvas);
    }, 'image/jpeg', 0.9);
  };

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });

  const processImage = async (imageFile, sourceCanvas) => {
    try {
      setIsProcessing(true);
      setError('');

      // OCR
      const {
        data: { text, confidence: ocrConfidence },
      } = await workerRef.current.recognize(imageFile);

      setConfidence(Math.round(ocrConfidence));

      // Validate readability
      const readabilityScore = validateReadability(text);
      if (readabilityScore < 60) {
        setValidationStatus({
          status: 'rejected',
          message: `Foto tidak terbaca jelas (Readability: ${readabilityScore}%). Silakan ambil ulang.`,
          score: readabilityScore,
        });
        setIsProcessing(false);
        return;
      }

      // Extract fields
      const fields = extractFields(text, docType);

      // Validate extracted fields
      const validation = validateExtractedFields(fields, docType);

      if (!validation.valid) {
        setValidationStatus({
          status: 'rejected',
          message: 'Data tidak lengkap. ' + validation.errors.join('. '),
          missingFields: validation.missingFields,
          score: readabilityScore,
        });
        setIsProcessing(false);
        return;
      }

      setValidationStatus({
        status: 'approved',
        message: 'Data berhasil diekstrak dengan benar',
        score: readabilityScore,
      });

      // Pass to parent
      const imageDataUrl = sourceCanvas
        ? sourceCanvas.toDataURL('image/jpeg')
        : await fileToDataUrl(imageFile);

      onCapture({
        data: fields,
        ocrText: text,
        confidence: ocrConfidence,
        image: imageDataUrl,
        studentName,
      });
    } catch (err) {
      setError(`Error OCR: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      setError('Format file tidak didukung. Gunakan JPG, PNG, atau PDF.');
      return;
    }

    setIsProcessing(true);

    if (file.type === 'application/pdf') {
      setError('PDF processing masih dalam pengembangan. Gunakan JPG/PNG untuk sekarang.');
      setIsProcessing(false);
      return;
    }

    await processImage(file, null);
  };
return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        📸 Scan {docType.toUpperCase()} - {studentName}
      </h2>

      {/* Camera Preview */}
      {cameraActive && (
        <div className="mb-6 relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full border-4 border-blue-500 rounded-lg bg-black"
          />
          <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-bold">
            OCR: {confidence}%
          </div>
        </div>
      )}

      <canvas ref={canvasRef} width={1920} height={1080} className="hidden" />

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-800 flex gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Validation Status */}
      {validationStatus && (
        <div
          className={`mb-4 p-4 rounded-lg border-l-4 ${
            validationStatus.status === 'approved'
              ? 'bg-green-50 border-green-500'
              : 'bg-red-50 border-red-500'
          }`}
        >
          <p
            className={
              validationStatus.status === 'approved' ? 'text-green-800' : 'text-red-800'
            }
          >
            {validationStatus.status === 'approved' ? '✅' : '❌'} {validationStatus.message}
          </p>
          {validationStatus.score && (
            <p className="text-sm mt-1 opacity-75">
              Readability Score: {validationStatus.score}%
            </p>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {!cameraActive ? (
          <button
            onClick={startCamera}
            className="flex-1 min-w-[200px] py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Buka Kamera
          </button>
        ) : (
          <>
            <button
              onClick={captureFrame}
              disabled={isProcessing}
              className="flex-1 min-w-[200px] py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                '⏳ Memproses...'
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  Ambil Foto
                </>
              )}
            </button>
            <button
              onClick={stopCamera}
              className="px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700"
            >
              ✕
            </button>
          </>
        )}
      </div>

      {/* File Upload Alternative */}
      <div className="border-t pt-4">
        <label className="block mb-2 text-sm font-semibold text-gray-700">
          Atau upload gambar yang sudah ada:
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          onChange={handleFileUpload}
          disabled={isProcessing}
          className="w-full"
        />
      </div>

      {/* Cancel Button */}
      <div className="mt-6">
        <button
          onClick={onCancel}
          className="w-full py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Batal
        </button>
      </div>
    </div>
  );
}