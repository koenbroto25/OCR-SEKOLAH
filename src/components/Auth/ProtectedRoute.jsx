import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../hooks/useAuth';

/**
 * Proteksi route berdasarkan role.
 * - role: 'student' | 'admin' | undefined (semua user login)
 */
export default function ProtectedRoute({ role, children }) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    if (role && user?.role !== role) {
      navigate(user?.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, role, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  if (role && user?.role !== role) {
    return null;
  }

  return children;
}