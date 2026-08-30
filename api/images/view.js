// api/images/view.js
// Menyajikan gambar scan dari Neon Storage (S3) dengan fallback ke DB (BYTEA legacy).
// Autentikasi: header Authorization (fetch) ATAU query ?token= (untuk <a href> / <img src>).
import { queryOne } from '../_lib/db.js';
import { verifyToken, extractToken } from '../_lib/auth.js';
import { getPresignedUrl, checkS3Config } from '../_lib/s3.js';

/**
 * GET /api/images/view?studentId=STU-001&docType=ktp[&token=JWT]
 * - Student  : hanya bisa melihat gambarnya sendiri
 * - Admin    : bisa melihat semua
 * Jika gambar ada di Neon Storage -> 302 redirect ke presigned URL (10 menit).
 * Jika legacy BYTEA di DB        -> stream langsung.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.query.token || extractToken(req);
    const user = token ? verifyToken(token) : null;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { studentId, docType } = req.query;
    if (!studentId || !['ktp', 'kk', 'akte'].includes(docType)) {
      return res.status(400).json({ message: 'studentId & docType wajib valid' });
    }

    if (user.role !== 'admin' && user.id !== studentId) {
      return res.status(403).json({ message: 'Tidak diizinkan melihat dokumen siswa lain' });
    }

    const row = await queryOne(
      'SELECT mime_type, data, s3_key FROM document_images WHERE student_id = $1 AND doc_type = $2',
      [studentId, docType]
    );

    if (!row) {
      return res.status(404).json({ message: 'Gambar tidak ditemukan' });
    }

    // 1) Neon Storage -> redirect ke presigned URL
    if (row.s3_key) {
      if (checkS3Config()) {
        return res.status(503).json({ message: 'Neon Storage belum dikonfigurasi' });
      }
      const url = await getPresignedUrl(row.s3_key, 600, docType);
      return res.redirect(302, url);
    }

    // 2) Legacy BYTEA di DB
    if (row.data) {
      res.setHeader('Content-Type', row.mime_type || 'image/webp');
      res.setHeader('Cache-Control', 'private, max-age=300');
      return res.status(200).send(row.data);
    }

    return res.status(404).json({ message: 'Konten gambar kosong' });
  } catch (error) {
    console.error('Image view error:', error);
    return res.status(500).json({ message: 'Gagal memuat gambar' });
  }
}