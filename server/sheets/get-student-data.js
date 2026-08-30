// api/sheets/get-student-data.js
// Path dipertahankan demi kompatibilitas frontend; data kini dari PostgreSQL.
import { query } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';
import { mapStudent } from '../_lib/students.js';

/**
 * GET /api/sheets/get-student-data
 * - Student : data milik sendiri (dari token)
 * - Admin   : ?studentId=STU-001 untuk satu siswa, tanpa param = semua siswa
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = requireAuth(req, res);
    if (!user) return;

    if (user.role === 'admin') {
      const { studentId } = req.query;

      if (studentId) {
        const result = await query('SELECT * FROM students WHERE id = $1', [studentId]);
        if (!result.rows.length) {
          return res.status(404).json({ message: 'Siswa tidak ditemukan' });
        }
        return res.status(200).json(mapStudent(result.rows[0]));
      }

      const all = await query('SELECT * FROM students ORDER BY id');
      return res.status(200).json({ students: all.rows.map(mapStudent) });
    }

    // Student: data miliknya sendiri
    const result = await query('SELECT * FROM students WHERE id = $1', [user.id]);
    if (!result.rows.length) {
      return res.status(404).json({ message: 'Data siswa tidak ditemukan' });
    }

    return res.status(200).json(mapStudent(result.rows[0]));
  } catch (error) {
    console.error('Get student data error:', error);
    return res.status(500).json({ message: 'Gagal memuat data siswa' });
  }
}