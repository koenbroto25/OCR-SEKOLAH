import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Edit2 } from 'lucide-react';

const LABELS = {
  nik: 'NIK',
  nama: 'Nama Lengkap',
  tempatLahir: 'Tempat Lahir',
  tanggalLahir: 'Tanggal Lahir',
  jenisKelamin: 'Jenis Kelamin',
  agama: 'Agama',
  alamat: 'Alamat',
  rtRw: 'RT/RW',
  kelurahan: 'Kelurahan/Desa',
  kecamatan: 'Kecamatan',
  kabupaten: 'Kabupaten/Kota',
  provinsi: 'Provinsi',
  noKk: 'No. Kartu Keluarga',
  nomorAkte: 'Nomor Akte',
  namaIbu: 'Nama Ibu',
  nikIbu: 'NIK Ibu',
  ttl: 'Tempat, Tanggal Lahir',
};

function formatLabel(key) {
  return LABELS[key] || key.replace(/([A-Z])/g, ' $1').trim();
}

export default function DataPreview({ data, docType, onApprove, onEdit, onCancel, studentName }) {
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!agreed) {
      alert('Silakan setujui bahwa data sudah benar');
      return;
    }

    setIsSubmitting(true);
    try {
      await onApprove();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format field display
  const displayFields = Object.entries(data).reduce((acc, [key, value]) => {
    if (value?.formatted) {
      acc[key] = {
        label: formatLabel(key),
        value: value.formatted,
        isValid: value.isValid,
      };
    }
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">
        ✓ Preview Data - {docType.toUpperCase()}
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Periksa kembali data yang sudah diekstrak. Pastikan semua data benar sebelum submit.
      </p>

      {/* Data Display */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        {Object.entries(displayFields).map(([key, field]) => (
          <div
            key={key}
            className="flex justify-between items-start py-3 border-b border-gray-200 last:border-b-0"
          >
            <div>
              <label className="font-semibold text-gray-700">{field.label}</label>
              {!field.isValid && (
                <div className="flex items-center gap-1 mt-1 text-yellow-600 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  Format mungkin perlu dicek manual
                </div>
              )}
            </div>
            <div className="text-right">
              <p
                className={`text-sm font-mono ${
                  field.isValid ? 'text-gray-800' : 'text-yellow-700'
                }`}
              >
                {field.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Agreement Checkbox */}
      <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-5 h-5 mt-1 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-800">
            <strong>Saya menyatakan bahwa</strong> data yang sudah diekstrak dari dokumen
            adalah benar dan sesuai dengan dokumen asli. Saya memahami bahwa data yang
            tidak sesuai akan ditolak dan perlu verifikasi manual.
          </span>
        </label>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={!agreed || isSubmitting}
          className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          {isSubmitting ? 'Mengirim...' : 'Submit Data'}
        </button>

        <button
          onClick={onEdit}
          className="px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 flex items-center justify-center gap-2"
        >
          <Edit2 className="w-5 h-5" />
          Edit
        </button>

        <button
          onClick={onCancel}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
        >
          Batal
        </button>
      </div>
    </div>
  );
}