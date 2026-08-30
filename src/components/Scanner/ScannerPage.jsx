import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../hooks/useAuth';
import Header from '../Common/Header';
import DocumentTypeSelect from './DocumentTypeSelect';
import CameraScanner from './CameraScanner';
import DataPreview from '../Preview/DataPreview';
import DataEditor from '../Preview/DataEditor';
import { getCompressedImageBase64 } from '../../utils/imageCompress';
import apiClient from '../../utils/apiClient';
import LoadingSpinner from '../Common/LoadingSpinner';

export default function ScannerPage() {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [docType, setDocType] = useState(location.state?.docType || null);
  const [stage, setStage] = useState('select'); // select | scan | preview | edit
  const [captured, setCaptured] = useState(null); // { data, ocrText, confidence, image }
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSelectDocType = (type) => {
    setDocType(type);
    setStage('scan');
    setError('');
  };

  const handleCapture = (payload) => {
    setCaptured(payload);
    setStage('preview');
  };

  const buildPayload = async (data) => {
    // 1) Kompres gambar & ubah ke base64
    const imageBase64 = await getCompressedImageBase64(base64toFile(captured.image));

    // 2) Upload ke Google Drive
    const driveResponse = await apiClient.post('/api/drive/upload', {
      imageBase64,
      fileName: `${docType.toUpperCase()}_${(user?.nama_lengkap || 'student').replace(/\s+/g, '_')}.jpg`,
      mimeType: 'image/jpeg',
      folderPath: `${user?.sekolah || 'SEKOLAH'}/${user?.tahun || 'TAHUN'}/${user?.kelas || 'KELAS'}`,
    });

    // 3) Simpan ke Google Sheets
    const payload = {
      docType,
      extractedData: data,
      driveUrl: driveResponse.data.webViewLink || driveResponse.data.fileId,
      studentId: user?.id,
    };

    const uploadResponse = await apiClient.post('/api/sheets/upload', payload);
    return uploadResponse.data;
  };

  const handleApprove = async () => {
    setSubmitting(true);
    setError('');
    try {
      await buildPayload(captured.data);
      navigate('/dashboard', { state: { successDocType: docType } });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Gagal mengupload data');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = (editedData) => {
    setCaptured((prev) => ({ ...prev, data: editedData }));
    setStage('preview');
  };

  if (stage === 'select') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Scan Dokumen" subtitle="Unggah dokumen siswa" />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <DocumentTypeSelect onSelect={handleSelectDocType} />
        </div>
      </div>
    );
  }

  if (stage === 'scan') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Scan Dokumen" subtitle="Ambil foto dokumen" />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <CameraScanner
            docType={docType}
            studentName={user?.nama_lengkap || ''}
            onCapture={handleCapture}
            onCancel={() => setStage('select')}
          />
        </div>
      </div>
    );
  }

  if (stage === 'preview') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Review Data" subtitle="Periksa hasil ekstraksi OCR" />
        <div className="max-w-6xl mx-auto px-4 py-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}
          <DataPreview
            data={captured.data}
            docType={docType}
            studentName={user?.nama_lengkap || ''}
            onApprove={handleApprove}
            onEdit={() => setStage('edit')}
            onCancel={() => setStage('scan')}
          />
          {submitting && <LoadingSpinner label="Mengupload data..." />}
        </div>
      </div>
    );
  }

  // stage === 'edit'
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Edit Data" subtitle="Koreksi hasil OCR" />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <DataEditor
          data={captured.data}
          docType={docType}
          onSave={handleSaveEdit}
          onCancel={() => setStage('preview')}
        />
      </div>
    </div>
  );
}

/** Helper: konversi data URL ke File. */
function base64toFile(dataUrl) {
  const [meta, base64] = dataUrl.split(',');
  const mime = meta.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const byteString = atob(base64);
  const arrayBuffer = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    arrayBuffer[i] = byteString.charCodeAt(i);
  }
  return new File([arrayBuffer], 'capture.jpg', { type: mime });
}