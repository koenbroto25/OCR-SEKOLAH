// api/_lib/students.js
// Helper data siswa + validasi + logging berbasis Neon PostgreSQL.
import { query, queryOne } from './db.js';

/**
 * Mapping baris DB -> object API (bentuk sama dengan versi Sheets lama).
 * mismatch_details JSONB sudah di-parse otomatis oleh pg.
 */
export function mapStudent(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    nama_lengkap: row.nama_lengkap,
    nik: row.nik,
    kelas: row.kelas,
    tahun_akademik: row.tahun_akademik,
    nama_sekolah: row.nama_sekolah,
    ktp_status: row.ktp_status,
    ktp_nik: row.ktp_nik,
    ktp_nama: row.ktp_nama,
    ktp_ttl: row.ktp_ttl,
    ktp_alamat: row.ktp_alamat,
    ktp_upload_date: row.ktp_upload_date || '',
    ktp_drive_url: row.ktp_drive_url,
    kk_status: row.kk_status,
    kk_nik: row.kk_nik,
    kk_nama: row.kk_nama,
    kk_ttl: row.kk_ttl,
    kk_alamat: row.kk_alamat,
    kk_upload_date: row.kk_upload_date || '',
    kk_drive_url: row.kk_drive_url,
    akte_status: row.akte_status,
    akte_nik: row.akte_nik,
    akte_nama: row.akte_nama,
    akte_ttl: row.akte_ttl,
    akte_nama_ibu: row.akte_nama_ibu,
    akte_nik_ibu: row.akte_nik_ibu,
    akte_upload_date: row.akte_upload_date || '',
    akte_drive_url: row.akte_drive_url,
    cross_validation_status: row.cross_validation_status,
    mismatch_details: row.mismatch_details || null,
    overall_status: row.overall_status,
    admin_notes: row.admin_notes,
    last_modified: row.last_modified,
    last_modified_by: row.last_modified_by,
  };
}

/** Cari baris siswa mentah berdasarkan ID. */
export async function findStudentRow(studentId) {
  return queryOne('SELECT * FROM students WHERE id = $1', [studentId]);
}

/** Cari baris siswa berdasarkan email (case-insensitive). */
export async function findStudentByEmail(email) {
  return queryOne('SELECT * FROM students WHERE lower(email) = lower($1)', [email]);
}

/** Hitung ID siswa berikutnya: STU-001, dst. */
export async function nextStudentId() {
  const result = await query(
    `SELECT id FROM students WHERE id LIKE 'STU-%' ORDER BY id DESC LIMIT 1`
  );
  const last = result.rows[0]?.id;
  const num = last ? parseInt(last.replace('STU-', ''), 10) : 0;
  return `STU-${String(num + 1).padStart(3, '0')}`;
}

/** Hitung ID operator berikutnya: OP-001, dst. */
export async function nextOperatorId() {
  const result = await query(
    `SELECT id FROM operators WHERE id LIKE 'OP-%' ORDER BY id DESC LIMIT 1`
  );
  const last = result.rows[0]?.id;
  const num = last ? parseInt(last.replace('OP-', ''), 10) : 0;
  return `OP-${String(num + 1).padStart(3, '0')}`;
}

/**
 * Flatten nilai hasil ekstraksi OCR.
 * Bisa berupa string langsung atau object { formatted } dari patterns.js
 */
export function pick(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object') {
    return String(value.formatted ?? value.value ?? '').trim();
  }
  return String(value).trim();
}

/**
 * Susun kolom DB untuk satu jenis dokumen (untuk UPDATE).
 */
export function buildDocValues(docType, extractedData = {}, driveUrl = '') {
  const prefix = docType; // ktp | kk | akte

  const nik = pick(extractedData.nik);
  const nama = pick(extractedData.nama);
  const tempatLahir = pick(extractedData.tempatLahir);
  const tanggalLahir = pick(extractedData.tanggalLahir);
  const ttl =
    tempatLahir || tanggalLahir
      ? `${tempatLahir}, ${tanggalLahir}`.replace(/^,\s*/, '')
      : '';
  const alamat = pick(extractedData.alamat);

  const values = {
    [`${prefix}_nik`]: nik,
    [`${prefix}_nama`]: nama,
    [`${prefix}_ttl`]: ttl,
    [`${prefix}_upload_date`]: new Date().toISOString(),
    [`${prefix}_drive_url`]: driveUrl || '',
    [`${prefix}_status`]: 'pending',
  };

  if (prefix !== 'akte' && alamat) values[`${prefix}_alamat`] = alamat;

  if (prefix === 'akte') {
    values.akte_nama_ibu = pick(extractedData.namaIbu ?? extractedData.nama_ibu);
    values.akte_nik_ibu = pick(extractedData.nikIbu ?? extractedData.nik_ibu);
  }

  return values;
}

/**
 * Buat klausa SET dinamis + params untuk UPDATE dari object kolom.
 * Return { setClause, params }
 */
export function buildUpdate(columnValues, startIdx = 1) {
  const keys = Object.keys(columnValues).filter(
    (k) => columnValues[k] !== undefined
  );
  const setClause = keys.map((k, i) => `${k} = $${startIdx + i}`).join(', ');
  const params = keys.map((k) => {
    const v = columnValues[k];
    // Kolom JSONB (mismatch_details) perlu dikirim sebagai string
    return v !== null && typeof v === 'object' ? JSON.stringify(v) : v;
  });
  return { setClause, params };
}

/** Normalisasi nama untuk pencocokan lintas dokumen. */
function normalizeName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Normalisasi TTL untuk pencocokan. */
function normalizeTTL(ttl) {
  return String(ttl || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Cross-validation server-side antara KTP, KK, dan Akte
 * dari object siswa (hasil mapStudent).
 */
export function runCrossValidation(data) {
  const mismatches = [];
  const docs = ['ktp', 'kk', 'akte'].filter((d) =>
    ['pending', 'approved'].includes(data[`${d}_status`])
  );

  if (docs.length < 2) {
    return { status: 'incomplete', mismatches: [] };
  }

  const pairs =
    docs.length === 3
      ? [['ktp', 'kk'], ['ktp', 'akte'], ['kk', 'akte']]
      : [[docs[0], docs[1]]];

  pairs.forEach(([x, y]) => {
    const labelX = x.toUpperCase();
    const labelY = y.toUpperCase();

    if (data[`${x}_nik`] && data[`${y}_nik`] && data[`${x}_nik`] !== data[`${y}_nik`]) {
      mismatches.push({
        field: `NIK (${labelX} vs ${labelY})`,
        [x]: data[`${x}_nik`],
        [y]: data[`${y}_nik`],
        severity: 'critical',
      });
    }
    if (
      data[`${x}_nama`] &&
      data[`${y}_nama`] &&
      normalizeName(data[`${x}_nama`]) !== normalizeName(data[`${y}_nama`])
    ) {
      mismatches.push({
        field: `Nama (${labelX} vs ${labelY})`,
        [x]: data[`${x}_nama`],
        [y]: data[`${y}_nama`],
        severity: 'critical',
      });
    }
    if (
      data[`${x}_ttl`] &&
      data[`${y}_ttl`] &&
      normalizeTTL(data[`${x}_ttl`]) !== normalizeTTL(data[`${y}_ttl`])
    ) {
      mismatches.push({
        field: `TTL (${labelX} vs ${labelY})`,
        [x]: data[`${x}_ttl`],
        [y]: data[`${y}_ttl`],
        severity: 'critical',
      });
    }
  });

  return { status: mismatches.length ? 'mismatch' : 'valid', mismatches };
}

/** Hitung overall_status siswa berdasarkan status semua dokumen. */
export function computeOverallStatus(data, crossStatus) {
  const statuses = [data.ktp_status, data.kk_status, data.akte_status];
  const incompleteCount = statuses.filter((s) => !s || s === 'incomplete').length;

  if (incompleteCount > 0) return 'pending_incomplete';
  if (crossStatus === 'mismatch') return 'pending_mismatch';
  if (statuses.every((s) => s === 'approved')) return 'approved';
  if (statuses.some((s) => s === 'rejected')) return 'pending_review';
  return 'pending_review';
}

/** Catat aktivitas ke tabel logs (non-fatal jika gagal). */
export async function appendLog({
  userEmail = '',
  userRole = '',
  action = '',
  studentId = '',
  docType = '',
  statusChange = '',
  details = '',
  ip = '',
}) {
  try {
    await query(
      `INSERT INTO logs (user_email, user_role, action, student_id, document_type, status_change, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userEmail, userRole, action, studentId, docType, statusChange, details, ip]
    );
  } catch (error) {
    console.error('Log write error:', error.message);
  }
}

/** Ambil IP klien dari request Vercel/Node. */
export function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    ''
  );
}