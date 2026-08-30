import React from 'react';
import { ExternalLink, CheckCircle2, XCircle } from 'lucide-react';

/**
 * Detail lengkap satu siswa untuk verifikasi admin.
 */
export default function StudentDetail({ student, onVerify, onReject, onClose }) {
  if (!student) return null;

  const docs = [
    { key: 'ktp', label: 'KTP', url: student.ktp_drive_url },
    { key: 'kk', label: 'KK', url: student.kk_drive_url },
    { key: 'akte', label: 'Akte', url: student.akte_drive_url },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{student.nama}</h2>
            <p className="text-sm text-gray-500">
              {student.id} • {student.kelas} • {student.tahun}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Documents */}
          {docs.map(({ key, label, url }) => {
            const status = student[`${key}_status`];
            const nik = student[`${key}_nik`];
            const nama = student[`${key}_nama`];
            const ttl = student[`${key}_ttl`];
            return (
              <div key={key} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-800">
                    {label} <span className="text-xs text-gray-400">({status})</span>
                  </h3>
                  {url && (
                    <a
                      href={`${url}${url.includes('?') ? '&' : '?'}token=${localStorage.getItem('auth_token') || ''}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 text-sm flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Buka file
                    </a>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <Field label="NIK" value={nik} />
                  <Field label="Nama" value={nama} />
                  <Field label="TTL" value={ttl} />
                </div>
              </div>
            );
          })}

          {/* Mismatch details */}
          {student.mismatch_details && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h3 className="font-bold text-orange-800 mb-2">⚠ Mismatch Terdeteksi</h3>
              <pre className="text-xs text-orange-900 overflow-x-auto">
                {JSON.stringify(student.mismatch_details, null, 2)}
              </pre>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => onVerify(student.id)}
              className="flex-1 py-2 bg-green-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4" /> Approve
            </button>
            <button
              onClick={() => onReject(student.id)}
              className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-red-700"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="font-mono text-gray-800">{value || '—'}</p>
    </div>
  );
}