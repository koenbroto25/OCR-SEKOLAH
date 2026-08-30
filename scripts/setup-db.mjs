// scripts/setup-db.mjs — uji koneksi Neon + jalankan db/schema.sql
import pg from 'pg';
import fs from 'fs';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  const v = await pool.query('SELECT version()');
  console.log('KONEKSI OK:', v.rows[0].version.slice(0, 60));

  const sql = fs.readFileSync('db/schema.sql', 'utf8');
  await pool.query(sql);
  console.log('SKEMA: berhasil dijalankan');

  const t = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
  );
  console.log('Tabel:', t.rows.map((r) => r.table_name).join(', '));

  const s = await pool.query('SELECT key FROM settings ORDER BY key');
  console.log('Settings awal:', s.rows.map((r) => r.key).join(', '));
} catch (e) {
  console.error('ERROR:', e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}