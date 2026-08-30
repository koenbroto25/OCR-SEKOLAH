// src/utils/crossValidation.js
import { normalizeString } from './validation';

export function validateCrossDocuments(ktpData, kkData, akteData) {
  const mismatches = [];

  // Must match: NIK
  if (ktpData.nik?.formatted !== kkData.nik?.formatted) {
    mismatches.push({
      field: 'NIK',
      ktp: ktpData.nik?.formatted,
      kk: kkData.nik?.formatted,
      akte: null,
      severity: 'critical',
    });
  }

  if (ktpData.nik?.formatted !== akteData.nik?.formatted) {
    mismatches.push({
      field: 'NIK (KTP vs Akte)',
      ktp: ktpData.nik?.formatted,
      kk: null,
      akte: akteData.nik?.formatted,
      severity: 'critical',
    });
  }

  // Must match: Nama
  if (normalizeString(ktpData.nama?.formatted) !== normalizeString(kkData.nama?.formatted)) {
    mismatches.push({
      field: 'Nama (KTP vs KK)',
      ktp: ktpData.nama?.formatted,
      kk: kkData.nama?.formatted,
      akte: null,
      severity: 'critical',
    });
  }

  if (normalizeString(ktpData.nama?.formatted) !== normalizeString(akteData.nama?.formatted)) {
    mismatches.push({
      field: 'Nama (KTP vs Akte)',
      ktp: ktpData.nama?.formatted,
      kk: null,
      akte: akteData.nama?.formatted,
      severity: 'critical',
    });
  }

  // Must match: TTL
  if (ktpData.tanggalLahir?.formatted !== kkData.tanggalLahir?.formatted) {
    mismatches.push({
      field: 'TTL (KTP vs KK)',
      ktp: `${ktpData.tempatLahir?.formatted},${ktpData.tanggalLahir?.formatted}`,
      kk: `${kkData.tempatLahir?.formatted},${kkData.tanggalLahir?.formatted}`,
      akte: null,
      severity: 'critical',
    });
  }

  if (ktpData.tanggalLahir?.formatted !== akteData.tanggalLahir?.formatted) {
    mismatches.push({
      field: 'TTL (KTP vs Akte)',
      ktp: `${ktpData.tempatLahir?.formatted},${ktpData.tanggalLahir?.formatted}`,
      kk: null,
      akte: `${akteData.tempatLahir?.formatted},${akteData.tanggalLahir?.formatted}`,
      severity: 'critical',
    });
  }

  return {
    isValid: mismatches.length === 0,
    mismatches,
  };
}