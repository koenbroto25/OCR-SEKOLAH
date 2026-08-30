// api/drive/upload.js
// Kini menyimpan gambar scan langsung ke Neon PostgreSQL (BYTEA)
// dengan kompresi maksimal server-side (WebP q60, max lebar 1200px).
// Path & bentuk response dipertahankan agar frontend tidak berubah.
import sharp from 'sharp';
import { query, queryOne } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';
import { appendLog, getClientIP } from '../_lib/students.js';
import { checkS3Config, putObject, deleteObject } from '../_lib/s3.js';

const VALID_DOCS = ['ktp', 'kk', 'akte'];
const MAX_WIDTH = 1200;   // cukup untuk OCR & verifikasi visual
const WEBP_QUALITY = 60;  // kompresi maksimal, teks dokumen masih terbaca

/**
 * Parse input base64 (data URL atau base64 murni) -> Buffer.
 */
function parseBase64(input) {
  if (!input) return null;
  const match = /^data:[^;]+;base64,(.*)$/s.exec(input);
  return Buffer.from(match ? match[1] : input, 'base64');
}

/**
 * Deteksi docType dari body atau nama file (mis. "KTP_Budi_Santoso.jpg").
 */
function detectDocType(body) {
  if (body.docType && VALID_DOCS.includes(body.docType)) return body.docType;
  const name = String(body.fileName || '').toUpperCase();
  if (name.startsWith('KTP')) return 'ktp';
  if (name.startsWith('KK')) return 'kk';
  if (name.startsWith('AKTE') || name.startsWith('AKTA')) return 'akte';
  return '';
}

/**
 * POST /api/drive/upload
 * Body: { imageBase64, fileName, mimeType?, folderPath?, docType? }
 * Return: { webViewLink, fileId, sizeBytes, mimeType } â€” webViewLink adalah
 * URL internal /api/images/view yang dilindungi JWT.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = requireAuth(req, res);
    if (!user) return;

    const s3Error = checkS3Config();
    if (s3Error) {
      return res.status(503).json({ message: `Neon Storage belum dikonfigurasi: ${s3Error}` });
    }

    const { imageBase64, fileName = '' } = req.body || {};

    const docType = detectDocType(req.body || {});
    if (!docType) {
      return res
        .status(400)
        .json({ message: `docType tidak dikenali (harus: ${VALID_DOCS.join(', ')})` });
    }

    const studentId = user.id;
    const raw = parseBase64(imageBase64);
    if (!raw || raw.length === 0) {
      return res.status(400).json({ message: 'imageBase64 wajib diisi' });
    }

    // Kompresi maksimal server-side -> WebP
    const compressed = await sharp(raw)
      .rotate() // otomatis sesuai EXIF orientation
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY, effort: 6 })
      .toBuffer();

    // Upload ke Neon Storage (bucket sesuai jenis dokumen)
    const s3Key = `${studentId}/${docType}-${Date.now()}.webp`;
    await putObject(s3Key, compressed, 'image/webp', docType);

    // Upsert metadata (1 gambar terbaru per siswa per jenis dokumen)
    const previous = await queryOne(
      'SELECT s3_key FROM document_images WHERE student_id = $1 AND doc_type = $2',
      [studentId, docType]
    );
    if (previous?.s3_key && previous.s3_key !== s3Key) {
      await deleteObject(previous.s3_key, docType); // hapus versi lama agar tidak menumpuk
    }

    await query(
      `INSERT INTO document_images (student_id, doc_type, mime_type, size_bytes, s3_key, updated_at)
       VALUES ($1, $2, 'image/webp', $3, $4, now())
       ON CONFLICT (student_id, doc_type)
       DO UPDATE SET mime_type = 'image/webp',
                     size_bytes = EXCLUDED.size_bytes,
                     s3_key = EXCLUDED.s3_key,
                     data = NULL,
                     updated_at = now()`,
      [studentId, docType, compressed.length, s3Key]
    );

    const webViewLink = `/api/images/view?studentId=${encodeURIComponent(studentId)}&docType=${docType}`;

    await appendLog({
      userEmail: user.email,
      userRole: user.role,
      action: 'upload_image',
      studentId,
      docType,
      details: `stored in Neon Storage, ${raw.length}B -> ${compressed.length}B (webp q${WEBP_QUALITY})`,
      ip: getClientIP(req),
    });

    return res.status(201).json({
      message: 'Gambar berhasil disimpan',
      webViewLink,
      url: webViewLink,
      fileId: s3Key,
      sizeBytes: compressed.length,
      originalSizeBytes: raw.length,
      mimeType: 'image/webp',
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return res.status(500).json({ message: 'Gagal menyimpan gambar' });
  }
}
