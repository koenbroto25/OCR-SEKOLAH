import React from 'react';
import { Upload } from 'lucide-react';

export default function ImageUpload({ onFileSelected, accept = 'image/jpeg,image/png', disabled = false }) {
  return (
    <label className="block">
      <input
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelected(file);
          e.target.value = '';
        }}
      />
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition">
        <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
        <p className="text-sm font-semibold text-gray-700">Klik untuk upload gambar</p>
        <p className="text-xs text-gray-500 mt-1">JPG atau PNG</p>
      </div>
    </label>
  );
}