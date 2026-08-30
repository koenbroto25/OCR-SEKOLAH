import React from 'react';
import { LayoutDashboard, Settings, Users, ScanLine } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Navigation({ role }) {
  const links =
    role === 'admin'
      ? [
          { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/admin/users', label: 'Manajemen User', icon: Users },
          { to: '/admin/settings', label: 'Pengaturan', icon: Settings },
        ]
      : [
          { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/scanner', label: 'Scan Dokumen', icon: ScanLine },
        ];

  return (
    <nav className="max-w-6xl mx-auto px-4 py-3 flex gap-2">
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
              isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`
          }
        >
          <Icon className="w-4 h-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}