// api/sheets/upload.js
// Path dipertahankan demi kompatibilitas frontend; data kini dari PostgreSQL.
import { query, queryOne } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';
import {
  mapStudent,
  buildDocValues,
  buildUpdate,
  runCrossValidation,
  computeOverallStatus,
  appendLog,
  getClientIP,
} from '../_lib/students.js';

const VALID_DOCS = ['ktp', 'kk', 'akte'];

/**
 * POST /api/sheets/upload
 * Body: { docType, extractedData, driveUrl, studentId? }
 * Simpan hasil OCR + link Drive ke PostgreSQL, lalu jalankan cross-validation
 * jika semua dokumen sudah ada.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = requireAuth(req, res);
    if (!user) return;

    const { docType, extractedData = {}, driveUrl = '', studentId } = req.body || {};

    if (!VALID_DOCS.includes(docType)) {
      return res
        .status(400)
        .json({ message: `docType harus salah satu dari: ${VALID_DOCS.join(', ')}` });
    }

    const targetStudentId = studentId || user.id;
    if (user.role !== 'admin' && targetStudentId !== user.id) {
      return res
        .status(403)
        .json({ message: 'Tidak diizinkan mengupload untuk siswa lain' });
    }

    const existing = await queryOne('SELECT * FROM students WHERE id = $1', [
      targetStudentId,
    ]);
    if (!existing) {
      return res.status(404).json({ message: 'Siswa tidak ditemukan' });
    }

    // 1) Susun kolom dokumen
    const docValues = buildDocValues(docType, extractedData, driveUrl);

    // 2) Cross-validation terhadap data gabungan (existing + doc baru)
    const merged = { ...mapStudent(existing), ...docValues };
    const cross = runCrossValidation(merged);
    docValues.cross_validation_status = cross.status;
    docValues.mismatch_details = cross.mismatches.length ? cross.mismatches : null;

    // 3) Hitung overall status
    const overallSnapshot = { ...merged, ...docValues };
    docValues.overall_status = computeOverallStatus(overallSnapshot, cross.status);

    docValues.last_modified = new Date().toISOString();
    docValues.last_modified_by = user.email || user.id;

    // 4) UPDATE dinamis
    const { setClause, params } = buildUpdate(docValues);
    params.push(targetStudentId);

    const updated = await query(
      `UPDATE students SET ${setClause} WHERE id = $${params.length} RETURNING *`,
      params
    );

    await appendLog({
      userEmail: user.email,
      userRole: user.role,
      action: 'upload_document',
      studentId: targetStudentId,
      docType,
      statusChange: `-> pending (cross: ${cross.status})`,
      details: driveUrl,
      ip: getClientIP(req),
    });

    return res.status(201).json({
      message: `${docType.toUpperCase()} berhasil disimpan`,
      crossValidation: cross,
      overallStatus: updated.rows[0].overall_status,
      data: mapStudent(updated.rows[0]),
    });
  } catch (error) {
    console.error('Sheets upload error:', error);
    return res.status(500).json({ message: 'Gagal menyimpan data ke database' });
  }
}