import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import apiClient from '../../utils/apiClient';

/**
 * Tab untuk meninjau data yang mismatch / butuh verifikasi manual.
 */
export default function MismatchReview({ onAction }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/validate/cross-validate?filter=mismatch');
      setRows(response.data?.students || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (studentId, action) => {
    try {
      await apiClient.post('/api/admin/update-status', {
        studentId,
        status: action, // 'approved' | 'rejected'
        notes,
        docType: selected?.behavior === 'all' ? 'all' : selected?.docType,
      });
      setNotes('');
      setSelected(null);
      onAction?.();
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memperbarui status');
    }
  };

  if (loading) {
    return <p className="text-center text-gray-500 py-8">Memuat data...</p>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-2">Review Mismatch Dokumen</h2>
      <p className="text-sm text-gray-600 mb-6">
        Data antar dokumen tidak cocok. Periksa manual lalu setujui atau tolak.
      </p>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {!rows.length && (
        <div className="p-6 text-center bg-green-50 border border-green-200 rounded-lg text-green-700">
          ✅ Tidak ada data mismatch. Semua konsisten.
        </div>
      )}

      {rows.map((row) => (
        <div key={row.id} className="border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <p className="font-semibold text-gray-800">{row.nama}</p>
              <p className="text-xs text-gray-500">
                {row.id} • Kelas {row.kelas} • {row.nik}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelected(selected === row.id ? null : row.id)}
                className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold"
              >
                {selected === row.id ? 'Tutup' : 'Review'}
              </button>
            </div>
          </div>

          {selected === row.id && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="mb-3">
                <p className="text-sm font-semibold mb-2">Detail Mismatch:</p>
                <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-x-auto">
                  {JSON.stringify(row.mismatch_details || row, null, 2)}
                </pre>
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan Admin
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Catatan untuk siswa (opsional)"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(row.id, 'approved')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold flex items-center gap-1 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleAction(row.id, 'rejected')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold flex items-center gap-1 hover:bg-red-700"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}