import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Clock, XCircle, AlertCircle, Plus, LogOut } from 'lucide-react';
import useAuthStore from '../../hooks/useAuth';
import apiClient from '../../utils/apiClient';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStudentData = async () => {
    try {
      const response = await apiClient.get('/api/sheets/get-student-data');
      setStudentData(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 border-green-200';
      case 'rejected':
        return 'bg-red-50 border-red-200';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved':
        return 'Diterima';
      case 'rejected':
        return 'Ditolak';
      case 'pending':
        return 'Menunggu Verifikasi';
      case 'incomplete':
        return 'Belum Diupload';
      default:
        return '—';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Halo, {studentData?.nama_lengkap || user?.nama_lengkap}! 👋
            </h1>
            <p className="text-sm text-gray-600">
              Kelas {studentData?.kelas || user?.kelas || '-'} • Tahun{' '}
              {studentData?.tahun_akademik || user?.tahun_akademik || '-'}
            </p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 flex items-center gap-1 text-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Success notification from scanner */}
      {location.state?.successDocType && (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            ✅ {location.state.successDocType.toUpperCase()} berhasil diupload. Menunggu
            verifikasi admin.
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Documents Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {['KTP', 'KK', 'Akte'].map((docType) => {
            const docKey = docType.toLowerCase();
            const status = studentData?.[`${docKey}_status`] || 'incomplete';
            const uploadDate = studentData?.[`${docKey}_upload_date`];

            return (
              <div key={docType} className={`border-2 rounded-lg p-6 ${getStatusColor(status)}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{docType}</h3>
                    <p className="text-xs text-gray-600 mt-1">{getStatusLabel(status)}</p>
                  </div>
                  {getStatusIcon(status)}
                </div>

                {uploadDate && (
                  <p className="text-xs text-gray-600 mb-4">
                    Upload:{' '}
                    {new Date(uploadDate).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                )}

                {status === 'incomplete' && (
                  <button
                    onClick={() => navigate('/scanner', { state: { docType } })}
                    className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Upload
                  </button>
                )}

                {status === 'rejected' && (
                  <button
                    onClick={() => navigate('/scanner', { state: { docType } })}
                    className="w-full py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700"
                  >
                    Upload Ulang
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Overall Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Status Keseluruhan</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  studentData?.overall_status === 'approved'
                    ? 'bg-green-600'
                    : studentData?.overall_status === 'rejected'
                    ? 'bg-red-600'
                    : 'bg-yellow-600'
                }`}
              />
              <div>
                <p className="font-semibold text-gray-800">
                  {studentData?.overall_status === 'approved' && '✓ Data Diterima'}
                  {studentData?.overall_status === 'rejected' && '✕ Data Ditolak'}
                  {studentData?.overall_status?.includes('pending') && '⏳ Menunggu Verifikasi'}
                  {!studentData?.overall_status && 'Belum ada upload'}
                </p>
                {studentData?.admin_notes && (
                  <p className="text-sm text-gray-600 mt-1">
                    Catatan: {studentData.admin_notes}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}