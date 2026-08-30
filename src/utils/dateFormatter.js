// src/utils/dateFormatter.js

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/** Ubah string tanggal apapun menjadi "DD-MM-YYYY". */
export function formatDate(val) {
  if (!val) return '';
  return String(val).replace(/\s+/g, ' ').trim();
}

/** Format tanggal ISO ke format tampilan Indonesia. */
export function toLocaleDateID(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function getMonthNameID(monthIndex) {
  return MONTHS_ID[monthIndex] || '';
}