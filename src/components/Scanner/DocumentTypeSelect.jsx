import React from 'react';
import { FileText, Users, Baby } from 'lucide-react';

const DOC_TYPES = [
  {
    key: 'ktp',
    label: 'KTP',
    description: 'Kartu Tanda Penduduk',
    icon: FileText,
  },
  {
    key: 'kk',
    label: 'KK',
    description: 'Kartu Keluarga',
    icon: Users,
  },
  {
    key: 'akte',
    label: 'Akte',
    description: 'Akte Kelahiran',
    icon: Baby,
  },
];

export default function DocumentTypeSelect({ onSelect, disabledTypes = [] }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">Pilih Jenis Dokumen</h2>
      <p className="text-sm text-gray-600 mb-6">
        Pilih dokumen yang ingin Anda scan. Max 1 dokumen per sesi upload.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {DOC_TYPES.map(({ key, label, description, icon: Icon }) => {
          const disabled = disabledTypes.includes(key);
          return (
            <button
              key={key}
              disabled={disabled}
              onClick={() => onSelect(key)}
              className={`border-2 rounded-lg p-6 text-left transition ${
                disabled
                  ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                  : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
              }`}
            >
              <Icon className="w-10 h-10 mb-3 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-800">{label}</h3>
              <p className="text-xs text-gray-600 mt-1">{description}</p>
              {disabled && (
                <p className="text-xs text-green-600 font-semibold mt-3">
                  ✓ Sudah diupload
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}