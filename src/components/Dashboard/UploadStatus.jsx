import React from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function UploadStatus({ status }) {
  const config = {
    approved: { icon: CheckCircle, color: 'text-green-600', label: 'Diterima' },
    rejected: { icon: XCircle, color: 'text-red-600', label: 'Ditolak' },
    pending: { icon: Clock, color: 'text-yellow-600', label: 'Menunggu' },
    incomplete: { icon: Clock, color: 'text-gray-400', label: 'Belum Diupload' },
  };

  const { icon: Icon, color, label } = config[status] || config.incomplete;

  return (
    <div className={`flex items-center gap-2 ${color}`}>
      <Icon className="w-5 h-5" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}