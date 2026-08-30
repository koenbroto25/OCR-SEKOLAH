-- db/schema.sql
-- Skema Neon PostgreSQL untuk Aplikasi OCR Sekolah
-- Jalankan di Neon SQL Editor atau: psql $DATABASE_URL -f db/schema.sql

-- ============================================================
-- TABEL STUDENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  id                       TEXT PRIMARY KEY,             -- STU-001, dst.
  email                    TEXT UNIQUE NOT NULL,
  password_hash            TEXT NOT NULL DEFAULT '',
  nama_lengkap             TEXT NOT NULL DEFAULT '',
  nik                      TEXT NOT NULL DEFAULT '',
  kelas                    TEXT NOT NULL DEFAULT '',
  tahun_akademik           TEXT NOT NULL DEFAULT '',
  nama_sekolah             TEXT NOT NULL DEFAULT '',

  -- KTP
  ktp_status               TEXT NOT NULL DEFAULT 'incomplete', -- incomplete|pending|approved|rejected
  ktp_nik                  TEXT NOT NULL DEFAULT '',
  ktp_nama                 TEXT NOT NULL DEFAULT '',
  ktp_ttl                  TEXT NOT NULL DEFAULT '',
  ktp_alamat               TEXT NOT NULL DEFAULT '',
  ktp_upload_date          TIMESTAMPTZ,
  ktp_drive_url            TEXT NOT NULL DEFAULT '',

  -- Kartu Keluarga
  kk_status                TEXT NOT NULL DEFAULT 'incomplete',
  kk_nik                   TEXT NOT NULL DEFAULT '',
  kk_nama                  TEXT NOT NULL DEFAULT '',
  kk_ttl                   TEXT NOT NULL DEFAULT '',
  kk_alamat                TEXT NOT NULL DEFAULT '',
  kk_upload_date           TIMESTAMPTZ,
  kk_drive_url             TEXT NOT NULL DEFAULT '',

  -- Akte Kelahiran
  akte_status              TEXT NOT NULL DEFAULT 'incomplete',
  akte_nik                 TEXT NOT NULL DEFAULT '',
  akte_nama                TEXT NOT NULL DEFAULT '',
  akte_ttl                 TEXT NOT NULL DEFAULT '',
  akte_nama_ibu            TEXT NOT NULL DEFAULT '',
  akte_nik_ibu             TEXT NOT NULL DEFAULT '',
  akte_upload_date         TIMESTAMPTZ,
  akte_drive_url           TEXT NOT NULL DEFAULT '',

  -- Validasi & status
  cross_validation_status  TEXT NOT NULL DEFAULT 'incomplete', -- incomplete|valid|mismatch
  mismatch_details         JSONB,                              -- array of mismatch objects
  overall_status           TEXT NOT NULL DEFAULT 'pending_incomplete',
  admin_notes              TEXT NOT NULL DEFAULT '',
  last_modified            TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_modified_by         TEXT NOT NULL DEFAULT '',

  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_students_overall_status ON students (overall_status);
CREATE INDEX IF NOT EXISTS idx_students_cross_validation ON students (cross_validation_status);
CREATE INDEX IF NOT EXISTS idx_students_email ON students (email);

-- ============================================================
-- TABEL OPERATORS
-- ============================================================
CREATE TABLE IF NOT EXISTS operators (
  id             TEXT PRIMARY KEY,   -- OP-001, dst.
  email          TEXT UNIQUE NOT NULL,
  username       TEXT NOT NULL DEFAULT '',
  password_hash  TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'operator',
  created_date   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_modified  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_modified_by TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_operators_email ON operators (email);

-- ============================================================
-- TABEL LOGS (audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS logs (
  id            BIGSERIAL PRIMARY KEY,
  timestamp     TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_email    TEXT NOT NULL DEFAULT '',
  user_role     TEXT NOT NULL DEFAULT '',
  action        TEXT NOT NULL DEFAULT '',
  student_id    TEXT NOT NULL DEFAULT '',
  document_type TEXT NOT NULL DEFAULT '',
  status_change TEXT NOT NULL DEFAULT '',
  details       TEXT NOT NULL DEFAULT '',
  ip_address    TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_student_id ON logs (student_id);

-- ============================================================
-- TABEL SETTINGS (key-value)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  TEXT NOT NULL DEFAULT ''
);

-- ============================================================
-- TABEL DOCUMENT_IMAGES (metadata gambar scan;
-- file gambar disimpan di Neon Storage / S3-compatible via s3_key)
-- ============================================================
CREATE TABLE IF NOT EXISTS document_images (
  id          BIGSERIAL PRIMARY KEY,
  student_id  TEXT NOT NULL,
  doc_type    TEXT NOT NULL CHECK (doc_type IN ('ktp', 'kk', 'akte')),
  mime_type   TEXT NOT NULL DEFAULT 'image/webp',
  size_bytes  INTEGER NOT NULL DEFAULT 0,
  s3_key      TEXT NOT NULL DEFAULT '',
  data        BYTEA,                                  -- fallback legacy (BYTEA)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, doc_type)
);

-- Migrasi untuk database yang sudah punya tabel lama
ALTER TABLE document_images ADD COLUMN IF NOT EXISTS s3_key TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_document_images_student ON document_images (student_id);

-- Data settings awal
INSERT INTO settings (key, value, updated_by) VALUES
  ('nama_sekolah', 'SMA Negeri 1 Contoh', 'system'),
  ('tahun_akademik', '2024/2025', 'system'),
  ('school_code', 'SMAN01', 'system'),
  ('available_classes', '10A,10B,11A,11B,12A,12B', 'system'),
  ('maintenance_mode', 'false', 'system'),
  ('password_change_required', 'false', 'system')
ON CONFLICT (key) DO NOTHING;