import React, { useState } from 'react';
import { Save, ChevronLeft } from 'lucide-react';

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

export default function DataEditor({ data, docType, onSave, onCancel }) {
  // Data berbentuk { field: { raw, formatted, isValid } }
  // Editor hanya mengubah nilai "formatted"
  const [form, setForm] = useState(
    Object.entries(data).reduce((acc, [key, value]) => {
      acc[key] = {
        ...value,
        formatted: value.formatted || value.raw || '',
      };
      return acc;
    }, {})
  );

  const handleChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: { ...prev[key], formatted: value },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">
        ✏️ Edit Data - {docType.toUpperCase()}
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Koreksi data jika ada kesalahan hasil pembacaan OCR.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {Object.entries(form).map(([key, value]) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {LABELS[key] || key}
            </label>
            <input
              type="text"
              value={value.formatted}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        ))}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Simpan
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali
          </button>
        </div>
      </form>
    </div>
  );
}