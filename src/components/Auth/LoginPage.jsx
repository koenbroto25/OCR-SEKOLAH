import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../hooks/useAuth';
import LoginForm from './LoginForm';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      const role = useAuthStore.getState().user?.role;
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async ({ email, password }) => {
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (!result.success) {
      setError(result.error);
    } else {
      const role = useAuthStore.getState().user?.role;
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
            📸
          </div>
          <h1 className="text-2xl font-bold text-gray-900">OCR Scan Dokumen Siswa</h1>
          <p className="text-sm text-gray-600 mt-1">
            Login untuk mengupload dokumen KTP, KK, dan Akte
          </p>
        </div>

        {/* Info cara login */}
        {showInfo && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-semibold text-blue-900">Cara Login:</p>
            </div>
            <ul className="text-sm text-blue-800 space-y-1 ml-7">
              <li>
                • <strong>Siswa:</strong> Email dari sekolah + password awal diberikan guru
              </li>
              <li>
                • <strong>Admin:</strong> admin / 123456
              </li>
            </ul>
            <button
              onClick={() => setShowInfo(false)}
              className="text-xs text-blue-600 mt-2 underline"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <LoginForm onSubmit={handleLogin} loading={loading} />

        {/* Demo Info */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          <p className="font-semibold mb-1">📝 Informasi Testing:</p>
          <p>Hubungi admin sekolah untuk mendapatkan email dan password pertama Anda.</p>
        </div>
      </div>
    </div>
  );
}