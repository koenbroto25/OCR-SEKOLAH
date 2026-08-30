// api/validate/cross-validate.js
import { query } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';
import { mapStudent, runCrossValidation } from '../_lib/students.js';

/**
 * GET /api/validate/cross-validate?filter=mismatch|all
 * Return: { students: [...] } — hasil cross-validation KTP vs KK vs Akte.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    if (!requireAuth(req, res, 'admin')) return;

    const filter = req.query.filter || 'mismatch';
    const result = await query('SELECT * FROM students ORDER BY id');

    const students = [];

    for (const row of result.rows) {
      const data = mapStudent(row);
      const validation = runCrossValidation(data);

      // Sinkronkan hasil validasi terbaru ke DB (jika berubah)
      if (validation.status !== data.cross_validation_status) {
        await query(
          `UPDATE students
           SET cross_validation_status = $1,
               mismatch_details = $2::jsonb
           WHERE id = $3`,
          [
            validation.status,
            validation.mismatches.length ? JSON.stringify(validation.mismatches) : null,
            data.id,
          ]
        );
      }

      if (filter === 'mismatch' && validation.status !== 'mismatch') continue;

      students.push({
        id: data.id,
        nama: data.nama_lengkap,
        kelas: data.kelas,
        tahun: data.tahun_akademik,
        cross_validation_status: validation.status,
        mismatch_details: validation.mismatches,
        ktp_status: data.ktp_status,
        kk_status: data.kk_status,
        akte_status: data.akte_status,
        overall_status: data.overall_status,
      });
    }

    return res.status(200).json({ students });
  } catch (error) {
    console.error('Cross-validate error:', error);
    return res.status(500).json({ message: 'Gagal menjalankan cross-validation' });
  }
}