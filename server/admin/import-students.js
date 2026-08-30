// api/admin/import-students.js
// Import massal siswa dari data Excel yang di-parse di frontend.
// Body: { kelas: '7', paralel: 'A', rows: [{ no, nama_lengkap, nisn, username?, password? }] }
// Username otomatis: NISN (jika valid) atau {kelas}{paralel}{no 3 digit}, mis. 7A001.
// Password otomatis: random 8 karakter jika tidak diisi.
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';
import { appendLog, getClientIP } from '../_lib/students.js';

const EMAIL_DOMAIN = 'siswa.sekolah.id';

function generatePassword(len = 8) {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'; // tanpa i,l,o,1,0 agar mudah dibaca
  let pass = '';
  const bytes = crypto.randomBytes(len);
  for (let i = 0; i < len; i++) pass += chars[bytes[i] % chars.length];
  return pass;
}

function sanitizeUsername(raw) {
  return String(raw || '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 40);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const admin = requireAuth(req, res, 'admin');
    if (!admin) return;

    const { kelas, paralel, rows = [] } = req.body || {};

    if (!kelas || !paralel) {
      return res.status(400).json({ message: 'Kelas dan paralel wajib dipilih' });
    }
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: 'Data siswa kosong' });
    }
    if (rows.length > 500) {
      return res.status(400).json({ message: 'Maksimal 500 siswa per import' });
    }

    const className = `${kelas}${paralel}`; // mis. 7A
    const accounts = [];
    const errors = [];
    const usedUsernames = new Set();

    // Pre-fetch username yang sudah ada agar tidak bentrok + penomoran ID
    const existing = await query('SELECT email FROM students');
    existing.rows.forEach((r) => usedUsernames.add(r.email.split('@')[0].toLowerCase()));

    const idResult = await query(
      `SELECT id FROM students WHERE id LIKE 'STU-%' ORDER BY id DESC LIMIT 1`
    );
    let idCounter = parseInt((idResult.rows[0]?.id || 'STU-000').replace('STU-', ''), 10) || 0;
    const nextId = () => `STU-${String(++idCounter).padStart(3, '0')}`;

    for (const row of rows) {
      const no = parseInt(row.no, 10);
      const nama = String(row.nama_lengkap || '').trim();

      if (!nama) {
        errors.push(`Baris ${row.no || '?'}: nama kosong`);
        continue;
      }

      // Username: NISN (10-12 digit) > username manual > auto {kelas}{paralel}{no}
      let username = '';
      const nisn = String(row.nisn || '').replace(/\D/g, '');
      if (nisn.length >= 10) {
        username = nisn;
      } else if (row.username) {
        username = sanitizeUsername(row.username);
      }
      if (!username) {
        if (!Number.isFinite(no)) {
          errors.push(`Baris ${row.no || '?'} (${nama}): nomor tidak valid`);
          continue;
        }
        username = `${className}${String(no).padStart(3, '0')}`;
      }
      if (usedUsernames.has(username)) {
        errors.push(`Baris ${row.no || '?'} (${nama}): username "${username}" sudah dipakai`);
        continue;
      }
      usedUsernames.add(username);

      const email = `${username}@${EMAIL_DOMAIN}`;
      const password = row.password ? String(row.password).trim() : generatePassword();
      const passwordHash = await bcrypt.hash(password, 10);

      const inserted = await queryOne(
        `INSERT INTO students
           (id, email, password_hash, nama_lengkap, kelas, tahun_akademik, overall_status,
            last_modified, last_modified_by)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending_incomplete', now(), $7)
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        [nextId(), email, passwordHash, nama, className, '', admin.email || 'admin']
      );

      if (inserted) {
        accounts.push({
          no: row.no,
          nama_lengkap: nama,
          kelas: className,
          nisn: nisn || '',
          username,
          email,
          password, // plain hanya dikembalikan saat pembuatan
        });
      } else {
        errors.push(`Baris ${row.no || '?'} (${nama}): email ${email} sudah terdaftar`);
      }
    }

    await appendLog({
      userEmail: admin.email,
      userRole: 'admin',
      action: 'import_students',
      details: `${accounts.length} siswa kelas ${className} dibuat${errors.length ? `, ${errors.length} dilewati` : ''}`,
      ip: getClientIP(req),
    });

    return res.status(201).json({
      message: `${accounts.length} akun siswa dibuat`,
      created: accounts.length,
      skipped: errors.length,
      errors,
      accounts,
    });
  } catch (error) {
    console.error('Import students error:', error);
    return res.status(500).json({ message: 'Gagal import siswa' });
  }
}
