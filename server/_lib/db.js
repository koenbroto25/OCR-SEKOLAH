// api/_lib/db.js
// Koneksi ke Neon PostgreSQL (serverless).
// Menggunakan satu Pool global agar bisa dipakai ulang antar-invocation warm.
import pg from 'pg';

const { Pool } = pg;

const CONNECTION_STRING =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || '';

let pool = null;

/**
 * Ambil Pool Postgres (singleton).
 * Neon membutuhkan SSL; untuk dev lokal ke database lain, SSL tetap aman
 * dengan rejectUnauthorized: false.
 */
export function getPool() {
  if (!pool) {
    if (!CONNECTION_STRING) {
      throw new Error(
        'DATABASE_URL tidak diset. Isi connection string Neon di .env.local'
      );
    }
    pool = new Pool({
      connectionString: CONNECTION_STRING,
      ssl: { rejectUnauthorized: false },
      max: 5, // batasi koneksi agar cocok untuk serverless
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    });
  }
  return pool;
}

/**
 * Helper query sederhana.
 * Contoh: await query('SELECT * FROM students WHERE id = $1', ['STU-001'])
 */
export async function query(text, params = []) {
  const client = getPool();
  const start = Date.now();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error(
      `DB query error (${Date.now() - start}ms):`,
      error.message,
      '\nQuery:',
      text.slice(0, 120)
    );
    throw error;
  }
}

/**
 * Ambil satu baris atau null.
 */
export async function queryOne(text, params = []) {
  const result = await query(text, params);
  return result.rows[0] || null;
}

/**
 * Tutup pool (untuk testing / cold shutdown).
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export default getPool;