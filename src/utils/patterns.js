// src/utils/patterns.js

export const REGEX_PATTERNS = {
  ktp: {
    nik: {
      pattern: /(?:NIK\s*:?\s*)?(\d{4}\s?\d{4}\s?\d{4}\s?\d{4}|\d{16})/i,
      format: (val) => val.replace(/\s/g, ''),
      validate: (val) => val.length === 16 && /^\d{16}$/.test(val),
    },
    nama: {
      pattern: /(?:NAMA\s*:?\s*)([A-Z\s]{3,50}?)(?=\n|TEMPAT|JENIS|$)/i,
      format: (val) => val.trim(),
      validate: (val) => /^[A-Z\s]{3,50}$/.test(val),
    },
    tempatLahir: {
      pattern: /(?:TEMPAT.*?LAHIR\s*:?\s*)([A-Z\s]+)(?:\s*,|\/)/i,
      format: (val) => val.trim().toUpperCase(),
      validate: (val) => /^[A-Z\s]{3,30}$/.test(val),
    },
    tanggalLahir: {
      pattern: /(?:LAHIR\s*:.*?)(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/,
      format: (val) => {
        const match = val.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
        if (!match) return val;
        const [, d, m, y] = match;
        return `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}`;
      },
      validate: (val) => {
        const match = val.match(/(\d{2})-(\d{2})-(\d{4})/);
        if (!match) return false;
        const [, d, m, y] = match;
        const day = parseInt(d, 10);
        const month = parseInt(m, 10);
        const year = parseInt(y, 10);
        return day >= 1 && day <= 31 && month >= 1 && month <= 12 &&
          year >= 1900 && year <= new Date().getFullYear();
      },
    },
    jenisKelamin: {
      pattern: /(?:JENIS\s+KELAMIN\s*:?\s*)(LAKI-LAKI|PEREMPUAN|L|P)/i,
      format: (val) => {
        const normalized = val.toUpperCase();
        if (normalized === 'L') return 'LAKI-LAKI';
        if (normalized === 'P') return 'PEREMPUAN';
        return normalized;
      },
      validate: (val) => /^(LAKI-LAKI|PEREMPUAN)$/.test(val),
    },
    agama: {
      pattern: /(?:AGAMA\s*:?\s*)(ISLAM|KRISTEN|KATOLIK|HINDU|BUDDHA|KONGHUCU)/i,
      format: (val) => val.toUpperCase(),
      validate: (val) => /^(ISLAM|KRISTEN|KATOLIK|HINDU|BUDDHA|KONGHUCU)$/.test(val),
    },
    alamat: {
      pattern: /(?:ALAMAT|JL\.?)\s*:?\s*(?:JL\.?|JALAN)?\s*(.+?)(?=RT|RW|KEL|DESA|$)/i,
      format: (val) => val.trim().toUpperCase(),
      validate: (val) => val.length > 0,
    },
    rtRw: {
      pattern: /(?:RT\/RW\s*:?\s*)(\d{2,4})[\s\/\\](\d{2,4})/,
      format: (val) => {
        const match = val.match(/(\d{2,4})[\s\/\\](\d{2,4})/);
        if (!match) return val;
        return `${String(match[1]).padStart(4, '0')}/${String(match[2]).padStart(4, '0')}`;
      },
      validate: (val) => /^\d{4}\/\d{4}$/.test(val),
    },
    kelurahan: {
      pattern: /(?:KEL\.?|KELURAHAN|DESA)\s*:?\s*([A-Z\s]{3,50}?)(?=KECAMATAN|$)/i,
      format: (val) => val.trim().toUpperCase(),
      validate: (val) => /^[A-Z\s]{3,50}$/.test(val),
    },
    kecamatan: {
      pattern: /(?:KECAMATAN|KEC\.?)\s*:?\s*([A-Z\s]{3,50}?)(?=KAB|KABUPATEN|KOTA|PROVINSI|$)/i,
      format: (val) => val.trim().toUpperCase(),
      validate: (val) => /^[A-Z\s]{3,50}$/.test(val),
    },
    kabupaten: {
      pattern: /(?:KAB(?:UPATEN)?|KOTA)\.?\s*:?\s*([A-Z\s]{3,50}?)(?=PROVINSI|$)/i,
      format: (val) => val.trim().toUpperCase(),
      validate: (val) => /^[A-Z\s]{3,50}$/.test(val),
    },
    provinsi: {
      pattern: /(?:PROVINSI)\s*:?\s*([A-Z\s]{3,50}?)(?=\n|$)/i,
      format: (val) => val.trim().toUpperCase(),
      validate: (val) => /^[A-Z\s]{3,50}$/.test(val),
    },
  },
kk: {
    noKk: {
      pattern: /(?:NO\.?\s*KK|NOMOR\s+KARTU\s+KELUARGA)\s*:?\s*(\d{4}\s?\d{4}\s?\d{4}\s?\d{4}|\d{16})/i,
      format: (val) => val.replace(/\s/g, ''),
      validate: (val) => val.length === 16 && /^\d{16}$/.test(val),
    },
    nama: {
      pattern: /(?:NAMA\s*:?\s*)([A-Z\s]{3,50}?)(?=NIK|$)/i,
      format: (val) => val.trim().toUpperCase(),
      validate: (val) => /^[A-Z\s]{3,50}$/.test(val),
    },
    nik: {
      pattern: /(?:NIK\s*:?\s*)(\d{16})/i,
      format: (val) => val.replace(/\s/g, ''),
      validate: (val) => /^\d{16}$/.test(val),
    },
    ttl: {
      pattern: /(?:TEMPAT.*?LAHIR|LAHIR)\s*:?\s*([A-Z\s]+)(?:\s*,|\/)\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
      format: (val) => val.trim(),
      validate: (val) => val.length > 0,
    },
  },

  akte: {
    nomorAkte: {
      pattern: /(?:NOMOR\s+(?:SURAT|AKTE)|NO\.?)\s*:?\s*([A-Z0-9\-\/]{5,30})/i,
      format: (val) => val.toUpperCase(),
      validate: (val) => /^[A-Z0-9\-\/]{5,30}$/.test(val),
    },
    nama: {
      pattern: /(?:NAMA\s+(?:BAYI|ANAK))\s*:?\s*([A-Z\s]{3,50}?)(?=TEMPAT|JENIS|$)/i,
      format: (val) => val.trim().toUpperCase(),
      validate: (val) => /^[A-Z\s]{3,50}$/.test(val),
    },
    tempatLahir: {
      pattern: /(?:TEMPAT\s+LAHIR)\s*:?\s*([A-Z\s]{3,30}?)(?=TANGGAL|,)/i,
      format: (val) => val.trim().toUpperCase(),
      validate: (val) => /^[A-Z\s]{3,30}$/.test(val),
    },
    tanggalLahir: {
      pattern: /(?:TANGGAL\s+LAHIR)\s*:?\s*(\d{1,2}[\s\-\/](?:JANUARI|FEBRUARI|MARET|APRIL|MEI|JUNI|JULI|AGUSTUS|SEPTEMBER|OKTOBER|NOVEMBER|DESEMBER)[\s\-\/]\d{4}|\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
      format: (val) => {
        const monthMap = {
          'JANUARI': '01', 'FEBRUARI': '02', 'MARET': '03', 'APRIL': '04',
          'MEI': '05', 'JUNI': '06', 'JULI': '07', 'AGUSTUS': '08',
          'SEPTEMBER': '09', 'OKTOBER': '10', 'NOVEMBER': '11', 'DESEMBER': '12',
        };

        const textMatch = val.match(/(\d{1,2})\s+([A-Z]+)\s+(\d{4})/i);
        if (textMatch) {
          const [, day, month, year] = textMatch;
          const monthNum = monthMap[month.toUpperCase()];
          if (monthNum) return `${String(day).padStart(2, '0')}-${monthNum}-${year}`;
        }

        const numMatch = val.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
        if (numMatch) {
          const [, d, m, y] = numMatch;
          return `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}`;
        }

        return val;
      },
      validate: (val) => {
        const match = val.match(/(\d{2})-(\d{2})-(\d{4})/);
        if (!match) return false;
        const [, d, m, y] = match;
        const day = parseInt(d, 10);
        const month = parseInt(m, 10);
        const year = parseInt(y, 10);
        return day >= 1 && day <= 31 && month >= 1 && month <= 12 &&
          year >= 1900 && year <= new Date().getFullYear();
      },
    },
    namaIbu: {
      pattern: /(?:NAMA\s+IBU|DARI\s+IBU)\s*:?\s*([A-Z\s]{3,50}?)(?=NIK|TANGGAL|$)/i,
      format: (val) => val.trim().toUpperCase(),
      validate: (val) => /^[A-Z\s]{3,50}$/.test(val),
    },
    nikIbu: {
      pattern: /(?:NIK\s+IBU|NIK\s*\/\s*NO\s+KTP\s+IBU)\s*:?\s*(\d{16})/i,
      format: (val) => val.replace(/\s/g, ''),
      validate: (val) => /^\d{16}$/.test(val),
    },
  },
};
export function extractFields(text, docType) {
  const patterns = REGEX_PATTERNS[docType?.toLowerCase()];
  const result = {};

  if (!patterns) {
    console.error(`Unknown document type: ${docType}`);
    return result;
  }

  for (const [fieldName, fieldPattern] of Object.entries(patterns)) {
    const match = text.match(fieldPattern.pattern);
    if (match) {
      const rawValue = match[1] || match[0];
      result[fieldName] = {
        raw: rawValue,
        formatted: fieldPattern.format(rawValue),
        isValid: fieldPattern.validate(fieldPattern.format(rawValue)),
      };
    }
  }

  return result;
}