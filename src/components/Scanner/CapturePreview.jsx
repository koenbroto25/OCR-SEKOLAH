import React from 'react';
import { Eye, RefreshCw } from 'lucide-react';

const DOC_LABEL = { ktp: 'KTP', kk: 'KK', akte: 'Akte' };

export default function CapturePreview({ image, docType, onRetake, onContinue }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">
        Preview Foto {DOC_LABEL[docType]}
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Periksa apakah foto jelas dan seluruh bagian dokumen terlihat.
      </p>

      <div className="mb-6 rounded-lg overflow-hidden border border-gray-200">
        <img src={image} alt={`Preview ${DOC_LABEL[docType]}`} className="w-full" />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onContinue}
          className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <Eye className="w-5 h-5" />
          Lanjut ke OCR
        </button>
        <button
          onClick={onRetake}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Ambil Ulang
        </button>
      </div>
    </div>
  );
}