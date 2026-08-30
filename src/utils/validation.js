// src/utils/validation.js

/**
 * Menilai keterbacaan hasil OCR berdasarkan jumlah baris, panjang rata-rata
 * baris, dan kehadiran keyword khas dokumen kependudukan.
 * Skor 0-100.
 */
export function validateReadability(text) {
  const lines = text.split('\n').filter((l) => l.trim());
  const avgLineLength = lines.reduce((a, b) => a + b.length, 0) / lines.length || 0;

  let score = 0;

  if (lines.length > 5) score += 30;
  if (avgLineLength > 5 && avgLineLength < 100) score += 30;

  const keywords = ['NIK', 'NAMA', 'LAHIR', 'ALAMAT', 'JENIS', 'AGAMA'];
  const foundKeywords = keywords.filter((k) => text.includes(k)).length;
  score += (foundKeywords / keywords.length) * 40;

  return Math.min(100, Math.round(score));
}

/**
 * Validasi field yang diekstrak dari dokumen. Setiap dokumen wajib memiliki
 * NIK, Nama, Tempat Lahir, dan Tanggal Lahir.
 */
export function validateExtractedFields(fields, docType) {
  const required = ['nik', 'nama', 'tempatLahir', 'tanggalLahir'];
  const errors = [];
  const missingFields = [];

  for (const fieldName of required) {
    const field = fields[fieldName];
    if (!field) {
      missingFields.push(fieldName);
      errors.push(`Field ${fieldName} tidak ditemukan`);
      continue;
    }

    if (!field.isValid) {
      errors.push(`Field ${fieldName} format tidak valid`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    missingFields,
  };
}

/** Normalisasi string untuk perbandingan antar dokumen. */
export function normalizeString(str) {
  return str?.toUpperCase().trim().replace(/\s+/g, ' ') || '';
}

/** Validasi NIK Indonesia (16 digit). */
export function isValidNIK(nik) {
  return /^\d{16}$/.test(String(nik || '').replace(/\s/g, ''));
}