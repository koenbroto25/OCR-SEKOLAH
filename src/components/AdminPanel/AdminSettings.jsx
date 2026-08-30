import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../utils/apiClient';

export default function AdminSettings() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nama_sekolah: '',
    tahun_akademik: '',
    school_code: '',
    available_classes: '',
    maintenance_mode: 'false',
    password_change_required: 'false',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await apiClient.get('/api/settings');
      const settings = response.data.settings || {};
      setForm({
        nama_sekolah: settings.nama_sekolah || '',
        tahun_akademik: settings.tahun_akademik || '',
        school_code: settings.school_code || '',
        available_classes: (settings.available_classes || []).join(','),
        maintenance_mode: String(settings.maintenance_mode ?? false),
        password_change_required: String(settings.password_change_required ?? false),
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      const payload = {
        nama_sekolah: form.nama_sekolah,
        tahun_akademik: form.tahun_akademik,
        school_code: form.school_code,
        available_classes: form.available_classes
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
        maintenance_mode: form.maintenance_mode === 'true',
        password_change_required: form.password_change_required === 'true',
      };
      await apiClient.post('/api/admin/update-settings', payload);
      setSuccess('Pengaturan berhasil disimpan');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-center text-gray-500 py-8">Memuat...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Pengaturan Aplikasi</h1>
            <p className="text-sm text-gray-600 mt-1">Konfigurasi sekolah dan sistem</p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              ✅ {success}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Sekolah</label>
              <input
                type="text"
                value={form.nama_sekolah}
                onChange={(e) => handleChange('nama_sekolah', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tahun Akademik</label>
              <input
                type="text"
                value={form.tahun_akademik}
                onChange={(e) => handleChange('tahun_akademik', e.target.value)}
                placeholder="2024/2025"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">School Code</label>
              <input
                type="text"
                value={form.school_code}
                onChange={(e) => handleChange('school_code', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daftar Kelas (pisahkan koma)
              </label>
              <input
                type="text"
                value={form.available_classes}
                onChange={(e) => handleChange('available_classes', e.target.value)}
                placeholder="10A,10B,11A,11B,12A,12B"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance Mode</label>
              <select
                value={form.maintenance_mode}
                onChange={(e) => handleChange('maintenance_mode', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="false">Off</option>
                <option value="true">On</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wajib Ganti Password
              </label>
              <select
                value={form.password_change_required}
                onChange={(e) => handleChange('password_change_required', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="false">Tidak</option>
                <option value="true">Ya</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </form>
      </div>
    </div>
  );
}