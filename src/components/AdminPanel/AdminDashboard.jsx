import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Users, AlertCircle, CheckCircle, Clock, Settings, LogOut, Upload } from 'lucide-react';
import useAuthStore from '../../hooks/useAuth';
import apiClient from '../../utils/apiClient';
import StudentDataTable from './StudentDataTable';
import MismatchReview from './MismatchReview';
import BulkImportStudents from './BulkImportStudents';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchData();
  }, [filter, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/admin/get-pending?filter=${filter}`);
      setData(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    await fetchData();
  };
const tabs = [
  { key: 'overview', label: 'Ringkasan', icon: BarChart3 },
  { key: 'students', label: 'Data Siswa', icon: Users },
  { key: 'import', label: 'Import Siswa', icon: Upload },
  { key: 'mismatch', label: 'Mismatch Review', icon: AlertCircle },
  { key: 'settings', label: 'Pengaturan', icon: Settings },
];

const summary = data?.summary || {};

return (
  <div className="min-h-screen bg-gray-50">
    {/* Header */}
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Panel Admin</h1>
          <p className="text-sm text-gray-600 mt-1">
            {user?.email} • Kelola upload dokumen siswa
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

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 rounded-t-lg text-sm font-semibold flex items-center gap-2 whitespace-nowrap ${
                activeTab === key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 py-8">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Overview */}
      {activeTab === 'overview' && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Siswa" value={summary.total ?? 0} color="bg-blue-500 text-white" icon={Users} />
            <StatCard label="Pending" value={summary.pending ?? 0} color="bg-yellow-500 text-white" icon={Clock} />
            <StatCard label="Mismatch" value={summary.mismatch ?? 0} color="bg-orange-500 text-white" icon={AlertCircle} />
            <StatCard label="Approved" value={summary.approved ?? 0} color="bg-green-500 text-white" icon={CheckCircle} />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-bold text-gray-800">Daftar Upload</h2>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="pending">Pending</option>
                <option value="mismatch">Mismatch</option>
                <option value="incomplete">Incomplete</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">Semua</option>
              </select>
            </div>

            {loading ? (
              <p className="text-center text-gray-500 py-8">Memuat data...</p>
            ) : (
              <StudentDataTable
                rows={data?.students || []}
                onSelect={(studentId) => navigate(`/admin?student=${studentId}`)}
              />
            )}
          </div>
        </div>
      )}
{/* Students tab */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-gray-800">Semua Data Siswa</h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">Semua</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          {loading ? (
            <p className="text-center text-gray-500 py-8">Memuat data...</p>
          ) : (
            <StudentDataTable rows={data?.students || []} onSelect={() => {}} />
          )}
        </div>
      )}

      {/* Import tab */}
      {activeTab === 'import' && (
        <BulkImportStudents />
      )}

      {/* Mismatch tab */}
      {activeTab === 'mismatch' && (
        <MismatchReview onAction={handleVerify} />
      )}

      {/* Settings tab */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800">Pengaturan Aplikasi</h2>
            <button
              onClick={() => navigate('/admin/settings')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
            >
              Kelola Pengaturan
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Kelola pengaturan sekolah, tahun akademik, daftar kelas, dan akun operator.
          </p>
        </div>
      )}
    </div>
  </div>
);
}

function StatCard({ label, value, color, icon: Icon }) {
  return (
    <div className={`${color} rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs opacity-75">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        {Icon && <Icon className="w-8 h-8 opacity-50" />}
      </div>
    </div>
  );
}