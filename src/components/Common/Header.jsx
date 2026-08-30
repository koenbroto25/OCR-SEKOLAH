import React from 'react';
import { LogOut } from 'lucide-react';
import useAuthStore from '../../hooks/useAuth';

export default function Header({ title, subtitle }) {
  const { user, logout } = useAuthStore();

  return (
    <header className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-800">
              {user?.nama_lengkap || user?.username || user?.email}
            </p>
            <p className="text-xs text-gray-500 capitalize">Role: {user?.role}</p>
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
    </header>
  );
}