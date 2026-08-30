// scripts/migrate-s3.js
// Tambah kolom s3_key ke document_images (untuk migrasi ke Neon Storage).
// Jalankan: node scripts/migrate-s3.js
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // muat .env.local, fallback ke .env
dotenv.config();
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await pool.query(
    "ALTER TABLE document_images ADD COLUMN IF NOT EXISTS s3_key TEXT NOT NULL DEFAULT ''"
  );
  const r = await pool.query(
    `SELECT column_name, data_type FROM information_schema.columns
     WHERE table_name = 'document_images' ORDER BY ordinal_position`
  );
  console.log('Migrasi OK. Kolom document_images:');
  r.rows.forEach((x) => console.log(` - ${x.column_name} (${x.data_type})`));
} catch (error) {
  console.error('Migrasi gagal:', error.message);
  if (!process.env.DATABASE_URL) {
    console.error('Hint: DATABASE_URL kosong — cek file .env.local');
  }
  process.exitCode = 1;
} finally {
  await pool.end();
}
