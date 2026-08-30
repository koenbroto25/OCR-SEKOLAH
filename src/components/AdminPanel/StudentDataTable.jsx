import React from 'react';

function StatusBadge({ status }) {
  const colors = {
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    pending_mismatch: 'bg-orange-100 text-orange-800',
    pending_incomplete: 'bg-red-100 text-red-800',
    pending_review: 'bg-yellow-100 text-yellow-800',
    incomplete: 'bg-gray-100 text-gray-800',
  };
  const label = {
    approved: 'Approved',
    rejected: 'Rejected',
    pending: 'Pending',
    pending_mismatch: 'Mismatch',
    pending_incomplete: 'Incomplete',
    pending_review: 'Review',
    incomplete: '—',
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
        colors[status] || colors.incomplete
      }`}
    >
      {label[status] || status?.slice(0, 3).toUpperCase() || '—'}
    </span>
  );
}

export default function StudentDataTable({ rows = [], onSelect }) {
  if (!rows.length) {
    return <p className="text-center text-gray-500 py-8">Tidak ada data.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500">
            <th className="py-3 pr-4">ID</th>
            <th className="py-3 pr-4">Nama</th>
            <th className="py-3 pr-4">Kelas</th>
            <th className="py-3 pr-4">KTP</th>
            <th className="py-3 pr-4">KK</th>
            <th className="py-3 pr-4">Akte</th>
            <th className="py-3 pr-4">Status</th>
            {onSelect && <th className="py-3">Aksi</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 pr-4 font-mono text-gray-600">{row.id}</td>
              <td className="py-3 pr-4 font-semibold text-gray-800">{row.nama}</td>
              <td className="py-3 pr-4">{row.kelas}</td>
              <td className="py-3 pr-4">
                <StatusBadge status={row.ktp_status} />
              </td>
              <td className="py-3 pr-4">
                <StatusBadge status={row.kk_status} />
              </td>
              <td className="py-3 pr-4">
                <StatusBadge status={row.akte_status} />
              </td>
              <td className="py-3 pr-4">
                <StatusBadge status={row.overall_status} />
              </td>
              {onSelect && (
                <td className="py-3">
                  <button
                    onClick={() => onSelect(row.id)}
                    className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100"
                  >
                    Detail
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}