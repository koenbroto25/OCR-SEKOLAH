import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

/**
 * Checkbox persetujuan bahwa data hasil OCR sudah benar.
 */
export default function VerificationCheckbox({ onVerified }) {
  const [checked, setChecked] = useState(false);

  const handleChange = (e) => {
    const value = e.target.checked;
    setChecked(value);
    if (value && onVerified) onVerified(true);
  };

  return (
    <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          className="w-5 h-5 mt-1 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <span className="flex items-center gap-2 text-sm text-gray-800">
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
          <strong>Saya menyatakan bahwa</strong> data di atas sudah benar sesuai dokumen asli.
        </span>
      </label>
    </div>
  );
}