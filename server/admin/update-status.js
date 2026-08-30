// api/admin/update-status.js
import { query, queryOne } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';
import { mapStudent, appendLog, getClientIP } from '../_lib/students.js';

/**
 * POST /api/admin/update-status
 * Body: { studentId, status: 'approved'|'rejected', notes? }
 * Set overall_status + admin_notes, lalu catat ke logs.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const admin = requireAuth(req, res, 'admin');
    if (!admin) return;

    const { studentId, status, notes = '' } = req.body || {};

    if (!studentId || !['approved', 'rejected'].includes(status)) {
      return res
        .status(400)
        .json({ message: "studentId wajib & status harus 'approved' atau 'rejected'" });
    }

    const existing = await queryOne('SELECT * FROM students WHERE id = $1', [studentId]);
    if (!existing) {
      return res.status(404).json({ message: 'Siswa tidak ditemukan' });
    }

    const prevStatus = existing.overall_status;

    const updated = await query(
      `UPDATE students
       SET overall_status = $1,
           admin_notes = CASE WHEN $2 <> '' THEN $2 ELSE admin_notes END,
           last_modified = now(),
           last_modified_by = $3
       WHERE id = $4
       RETURNING *`,
      [status, notes, admin.email || 'admin', studentId]
    );

    await appendLog({
      userEmail: admin.email,
      userRole: 'admin',
      action: 'update_status',
      studentId,
      statusChange: `${prevStatus} -> ${status}`,
      details: notes,
      ip: getClientIP(req),
    });

    return res.status(200).json({
      message: `Status ${studentId} diubah menjadi ${status}`,
      data: mapStudent(updated.rows[0]),
    });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ message: 'Gagal mengubah status' });
  }
}