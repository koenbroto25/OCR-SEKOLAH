import React, { useState, useEffect } from 'react';
import { ArrowLeft, UserPlus, Trash2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../utils/apiClient';

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    role: 'student',
    password: '',
    nama_lengkap: '',
    kelas: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/api/auth/register');
      setUsers(response.data.users || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat user');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await apiClient.post('/api/auth/register', newUser);
      setNewUser({ email: '', username: '', role: 'student', password: '', nama_lengkap: '', kelas: '' });
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat user');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Yakin ingin menghapus user ini?')) return;
    try {
      await apiClient.delete(`/api/auth/register?id=${userId}`);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus user');
    }
  };
return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Manajemen User</h1>
            <p className="text-sm text-gray-600 mt-1">Kelola akun siswa dan operator</p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Create user */}
        <form onSubmit={handleCreate} className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5" /> Tambah User
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="email"
              placeholder="Email"
              required
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Username"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Nama Lengkap"
              value={newUser.nama_lengkap}
              onChange={(e) => setNewUser({ ...newUser, nama_lengkap: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Kelas (siswa)"
              value={newUser.kelas}
              onChange={(e) => setNewUser({ ...newUser, kelas: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="password"
              placeholder="Password Awal"
              required
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="student">Siswa</option>
              <option value="operator">Operator</option>
            </select>
          </div>
          <button
            type="submit"
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
          >
            Buat Akun
          </button>
        </form>

        {/* User list */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Daftar User ({users.length})</h2>
          {loading ? (
            <p className="text-center text-gray-500 py-4">Memuat...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500">
                    <th className="py-3 pr-4">Email</th>
                    <th className="py-3 pr-4">Username</th>
                    <th className="py-3 pr-4">Role</th>
                    <th className="py-3 pr-4">Kelas</th>
                    <th className="py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4 text-gray-800">{u.email}</td>
                      <td className="py-3 pr-4">{u.username || '—'}</td>
                      <td className="py-3 pr-4 capitalize">
                        {u.role} {u.role === 'admin' && '(fixed)'}
                      </td>
                      <td className="py-3 pr-4">{u.kelas || '—'}</td>
                      <td className="py-3">
                        <button
                          onClick={() => handleDelete(u.id)}
                          disabled={u.role === 'admin'}
                          className="text-red-600 hover:text-red-800 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}