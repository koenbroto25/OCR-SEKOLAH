import React from 'react';

const STEPS = [
  { key: 'uploaded', label: 'Dokumen Diupload' },
  { key: 'review', label: 'Review Admin' },
  { key: 'approved', label: 'Verifikasi Selesai' },
];

export default function StatusTimeline({ currentStatus }) {
  const finished = currentStatus === 'approved';

  return (
    <ol className="flex items-center w-full">
      {STEPS.map((step, idx) => (
        <li
          key={step.key}
          className={`flex items-center ${
            idx < STEPS.length - 1 ? 'w-full' : 'flex-shrink-0'
          }`}
        >
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                finished || idx === 0
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {finished || idx === 0 ? '✓' : idx + 1}
            </div>
            <span className="text-xs mt-1 text-gray-600">{step.label}</span>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className={`flex-1 h-1 mx-2 rounded ${
                finished ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          )}
        </li>
      ))}
    </ol>
  );
}