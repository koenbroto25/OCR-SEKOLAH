// api/admin/get-pending.js
import { query } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';
import { mapStudent } from '../_lib/students.js';

/**
 * GET /api/admin/get-pending?filter=pending|mismatch|incomplete|approved|rejected|all
 * Return: { summary: { total, pending, mismatch, approved, rejected }, students: [...] }
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    if (!requireAuth(req, res, 'admin')) return;

    const filter = req.query.filter || 'pending';
    const result = await query('SELECT * FROM students ORDER BY id');
    const all = result.rows.map(mapStudent);

    const isPending = (s) =>
      ['pending_review', 'pending'].includes(s.overall_status) ||
      ['ktp_status', 'kk_status', 'akte_status'].some((k) => s[k] === 'pending');

    const matchesFilter = (s) => {
      switch (filter) {
        case 'pending':
          return isPending(s);
        case 'mismatch':
          return s.overall_status === 'pending_mismatch' || s.cross_validation_status === 'mismatch';
        case 'incomplete':
          return s.overall_status === 'pending_incomplete';
        case 'approved':
          return s.overall_status === 'approved';
        case 'rejected':
          return s.overall_status === 'rejected';
        default:
          return true;
      }
    };

    const students = all.filter(matchesFilter).map((s) => ({
      id: s.id,
      nama: s.nama_lengkap,
      nama_lengkap: s.nama_lengkap,
      kelas: s.kelas,
      tahun: s.tahun_akademik,
      tahun_akademik: s.tahun_akademik,
      ktp_status: s.ktp_status,
      ktp_nik: s.ktp_nik,
      ktp_nama: s.ktp_nama,
      ktp_ttl: s.ktp_ttl,
      ktp_drive_url: s.ktp_drive_url,
      kk_status: s.kk_status,
      kk_nik: s.kk_nik,
      kk_nama: s.kk_nama,
      kk_ttl: s.kk_ttl,
      kk_drive_url: s.kk_drive_url,
      akte_status: s.akte_status,
      akte_nik: s.akte_nik,
      akte_nama: s.akte_nama,
      akte_ttl: s.akte_ttl,
      akte_drive_url: s.akte_drive_url,
      cross_validation_status: s.cross_validation_status,
      mismatch_details: s.mismatch_details,
      overall_status: s.overall_status,
      admin_notes: s.admin_notes,
    }));

    const summary = {
      total: all.length,
      pending: all.filter(isPending).length,
      mismatch: all.filter((s) => s.cross_validation_status === 'mismatch').length,
      approved: all.filter((s) => s.overall_status === 'approved').length,
      rejected: all.filter((s) => s.overall_status === 'rejected').length,
    };

    return res.status(200).json({ summary, students });
  } catch (error) {
    console.error('Get pending error:', error);
    return res.status(500).json({ message: 'Gagal memuat data admin' });
  }
}