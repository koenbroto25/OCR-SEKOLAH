// scripts/backtest-regex.mjs
// Backtest pola regex OCR (src/utils/patterns.js) terhadap template dokumen nyata.
// Jalankan: node scripts/backtest-regex.mjs
import { extractFields } from '../src/utils/patterns.js';

// ---------- KTP LAMA (format 2000-an, tanpa barcode) ----------
const KTP_LAMA = `PROVINSI JAWA BARAT
KOTA BANDUNG
NIK : 3273011206040001
Nama : BUDI SANTOSO
Tempat/Tgl Lahir : BANDUNG, 12-06-2004
Jenis Kelamin : LAKI-LAKI    Gol. Darah : O
Alamat : JL. MERDEKA NO. 45
RT/RW : 004/007
Kel/Desa : CIKAPUNDUNG
Kecamatan : BANDUNG WETAN
Agama : ISLAM
Status Perkawinan : BELUM KAWIN
Pekerjaan : PELAJAR/MAHASISWA
Kewarganegaraan : WNI
Berlaku Hingga : SEUMUR HIDUP`;

// ---------- e-KTP BARU (dengan QR/barcode) ----------
const KTP_BARU = `NIK : 3273011206040001
Nama : BUDI SANTOSO
Tempat/Tgl Lahir : BANDUNG, 12-06-2004
Jenis Kelamin : LAKI-LAKI    Gol. Darah : O
Alamat : JL. MERDEKA NO. 45
RT/RW : 004/007
Kel/Desa : CIKAPUNDUNG
Kecamatan : BANDUNG WETAN
Agama : ISLAM
Status Perkawinan : BELUM KAWIN
Pekerjaan : PELAJAR/MAHASISWA
Kewarganegaraan : WNI
Berlaku Hingga : SEUMUR HIDUP
[QR_CODE_83CRVQ1ZKZQ01]
https://dukcapil.kemendagri.go.id`;

// ---------- KTP dengan noise OCR umum (salah baca huruf/angka) ----------
const KTP_NOISE = `PROVINSI JAWA BARAT
KOTA BANDUNG
NIK : 3273O112O6O4OOO1
Nama : BOEDI SANTOSO
Tempat/Tgl Lahir : BANDUNG, 12/06/2004
Jenis Kelamin : LAKI LAKI
Alamat : Jl. Merdeka No. 45
RT/RW : 004/007
Kel/Desa : CIKAPUNDUNG
Kecamatan : BANDUNG WETAN
Agama : ISLAM
Status Perkawinan : BELUM KAWIN
Pekerjaan : PELAJAR/MAHASISWA
Kewarganegaraan : WNI
Berlaku Hingga : SEUMUR HIDUP`;

// ---------- KK LAMA (format lama, tanpa barcode) ----------
const KK_LAMA = `KARTU KELUARGA
NOMOR KARTU KELUARGA
3273011206040001
Nama Kepala Keluarga : SUTRISNO
Alamat : JL. MERDEKA NO. 45
RT/RW : 004/007
Kel/Desa : CIKAPUNDUNG
Kecamatan : BANDUNG WETAN
KOTA BANDUNG
PROVINSI JAWA BARAT

Nama : BUDI SANTOSO
NIK : 3273011206040001
Tempat Lahir : BANDUNG
Tanggal Lahir : 12-06-2004
Jenis Kelamin : LAKI-LAKI`;

// ---------- KK BARU (format 2014+, dengan barcode) ----------
const KK_BARU = `KARTU KELUARGA
NOMOR KARTU KELUARGA : 3273011206040001
[BARCODE_3273011206040001]
Nama Kepala Keluarga : SUTRISNO
Alamat : JL. MERDEKA NO. 45
RT/RW : 004/007
Kel/Desa : CIKAPUNDUNG
Kecamatan : BANDUNG WETAN
KOTA BANDUNG
PROVINSI JAWA BARAT

No | Nama Lengkap | NIK | Tempat Lahir | Tanggal Lahir
1 | BUDI SANTOSO | 3273011206040001 | BANDUNG | 12-06-2004
2 | SITI NURHALIZA | 3273015506700002 | BANDUNG | 15-05-1974`;

// ---------- AKTE LAMA ----------
const AKTE_LAMA = `AKTA KELAHIRAN
NOMOR AKTE : 3273-LT-04062004-0012
Yang bertanda tangan di bawah ini menerangkan bahwa berdasarkan catatan kelahiran:
Nama Bayi : BUDI SANTOSO
Tempat Lahir : BANDUNG
Tanggal Lahir : 12-06-2004
Nama Ibu : SITI NURHALIZA
NIK Ibu : 3273015506700002
Nama Ayah : SUTRISNO
NIK Ayah : 3273011206750001`;

// ---------- AKTE BARU (digital, barcode) ----------
const AKTE_BARU = `REPUBLIK INDONESIA
AKTA KELAHIRAN
NOMOR : 3273-LT-04062004-0012
[BARCODE 000123456789]
Berdasarkan surat keterangan yang disampaikan, dengan ini menyatakan:
Nama Bayi : BUDI SANTOSO
Tempat Lahir : BANDUNG
Tanggal Lahir : 12-06-2004
Nama Ibu : SITI NURHALIZA
NIK Ibu : 3273015506700002
Nama Ayah : SUTRISNO`;

// ---------- KK modern (Tempat & Tgl dalam satu baris) ----------
const KK_ONE_LINE = `KARTU KELUARGA
NOMOR KARTU KELUARGA : 3273011206040001
Nama Kepala Keluarga : SUTRISNO
Alamat : JL. MERDEKA NO. 45

Nama : BUDI SANTOSO
NIK : 3273011206040001
Tempat / Tgl Lahir : BANDUNG, 12-06-2004
Jenis Kelamin : LAKI-LAKI`;

const cases = [
  {
    name: 'KTP-LAMA (dokumen jelas)',
    docType: 'ktp',
    text: KTP_LAMA,
    expected: {
      nik: '3273011206040001',
      nama: 'BUDI SANTOSO',
      tempatLahir: 'BANDUNG',
      tanggalLahir: '12-06-2004',
      jenisKelamin: 'LAKI-LAKI',
      agama: 'ISLAM',
      alamat: 'JL. MERDEKA NO. 45',
      rtRw: '0004/0007',
      kelurahan: 'CIKAPUNDUNG',
      kecamatan: 'BANDUNG WETAN',
      kabupaten: 'BANDUNG',
      provinsi: 'JAWA BARAT',
    },
  },
  {
    name: 'e-KTP-BARU (+ barcode/QR)',
    docType: 'ktp',
    text: KTP_BARU,
    expected: {
      nik: '3273011206040001',
      nama: 'BUDI SANTOSO',
      tempatLahir: 'BANDUNG',
      tanggalLahir: '12-06-2004',
      kelurahan: 'CIKAPUNDUNG',
      kecamatan: 'BANDUNG WETAN',
    },
  },
  {
    name: 'KTP-NOISE (OCR salah baca umum)',
    docType: 'ktp',
    text: KTP_NOISE,
    expected: {
      nik: '3273011206040001', // O->0 berhasil dinormalisasi
      nama: 'BOEDI SANTOSO',   // nama tetap benar-benar sesuai hasil OCR (valid, diedit manual)
      tempatLahir: 'BANDUNG',
      tanggalLahir: '12-06-2004',
      kelurahan: 'CIKAPUNDUNG',
    },
  },
  {
    name: 'KK-LAMA (dokumen jelas)',
    docType: 'kk',
    text: KK_LAMA,
    expected: {
      noKk: '3273011206040001',
      nama: 'BUDI SANTOSO',
      nik: '3273011206040001',
      ttl: 'BANDUNG, 12-06-2004',
    },
  },
  {
    name: 'KK-MODERN (Tempat/Tgl satu baris)',
    docType: 'kk',
    text: KK_ONE_LINE,
    expected: {
      noKk: '3273011206040001',
      nama: 'BUDI SANTOSO',
      nik: '3273011206040001',
      ttl: 'BANDUNG, 12-06-2004',
    },
  },
  {
    name: 'KK-BARU (format tabel + barcode)',
    docType: 'kk',
    text: KK_BARU,
    expected: {
      noKk: '3273011206040001',
    },
  },
  {
    name: 'AKTE-LAMA (dokumen jelas)',
    docType: 'akte',
    text: AKTE_LAMA,
    expected: {
      nomorAkte: '3273-LT-04062004-0012',
      nama: 'BUDI SANTOSO',
      tempatLahir: 'BANDUNG',
      tanggalLahir: '12-06-2004',
      namaIbu: 'SITI NURHALIZA',
      nikIbu: '3273015506700002',
    },
  },
  {
    name: 'AKTE-BARU digital (NOMOR tanpa "AKTE")',
    docType: 'akte',
    text: AKTE_BARU,
    expected: {
      nomorAkte: '3273-LT-04062004-0012',
      nama: 'BUDI SANTOSO',
      namaIbu: 'SITI NURHALIZA',
      nikIbu: '3273015506700002',
    },
  },
];

let totalPass = 0;
let totalFail = 0;
const critical = ['nik', 'nama', 'nikIbu', 'noKk', 'nomorAkte', 'tempatLahir', 'tanggalLahir', 'ttl', 'namaIbu'];

console.log('='.repeat(92));
console.log(' BACKTEST REGEX OCR — src/utils/patterns.js');
console.log('='.repeat(92));

for (const c of cases) {
  console.log(`\n### ${c.name}  (docType=${c.docType})`);
  const result = extractFields(c.text, c.docType);

  const expectedKeys = Object.keys(c.expected);
  for (const key of expectedKeys) {
    const exp = c.expected[key];
    const got = result[key];
    const tag = critical.includes(key) ? 'PENTING' : 'opsional';

    if (got === undefined) {
      totalFail++;
      console.log(`  FAIL  [${tag}] ${key.padEnd(14)} MISSING (expected: ${exp})`);
      continue;
    }
    const fmt = got.formatted;
    const ok = exp === fmt;
    if (ok) {
      totalPass++;
      console.log(`  PASS  [${tag}] ${key.padEnd(14)} ${fmt}  (isValid=${got.isValid})`);
    } else {
      totalFail++;
      console.log(`  FAIL  [${tag}] ${key.padEnd(14)} expected="${exp}" got="${fmt}" isValid=${got.isValid}`);
    }
  }

  const extras = Object.keys(result).filter((k) => !(k in c.expected));
  for (const key of extras) {
    console.log(`  INFO  ${key.padEnd(14)} "${result[key].formatted}" (terekstrak, tidak dicek)`);
  }
}

console.log('\n' + '='.repeat(92));
console.log(` RINGKASAN: PASS=${totalPass} | FAIL=${totalFail} | TOTAL=${totalPass + totalFail}`);
console.log('='.repeat(92));