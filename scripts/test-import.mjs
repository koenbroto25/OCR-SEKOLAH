// scripts/test-import.mjs
// Tes end-to-end endpoint /api/admin/import-students
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Jalankan handler langsung (tanpa HTTP) agar sederhana
async function call(file, { method = 'POST', body = {}, headers = {}, query = {} } = {}) {
  const mod = await import(pathToFileURL(path.join(__dirname, '..', file)).href);
  let statusCode = 0;
  const res = {
    statusCode: 200,
    setHeader() {},
    writeHead(code) { statusCode = code; this.statusCode = code; return this; },
    status(code) { statusCode = code; this.statusCode = code; return this; },
    end(b) { this.body = b; return this; },
    json(obj) { this.body = JSON.stringify(obj); return this; },
    send() {},
    redirect() {},
  };
  const req = { method, body, headers, query, socket: {} };
  await mod.default(req, res);
  return { status: res.statusCode, json: res.body ? JSON.parse(res.body) : null };
}

// Auth admin via bcrypt langsung (meniru login)
const { signToken } = await import(pathToFileURL(path.join(__dirname, '..', 'server/_lib/auth.js')).href);
const adminToken = signToken({ id: 'admin', email: 'admin@sekolah.local', role: 'admin' }, '1h');
// Node/Vercel selalu lowercase nama header
const authHeaders = { authorization: `Bearer ${adminToken}` };

let pass = 0, fail = 0;
function check(name, cond, extra = '') {
  if (cond) { pass++; console.log(`  OK   ${name}`); }
  else { fail++; console.log(`  FAIL ${name} ${extra}`); }
}

console.log('=== TES IMPORT SISWA ===');

// 1. Import tanpa auth harus 401
let r = await call('server/admin/import-students.js', { body: { kelas: '7', paralel: 'A', rows: [] } });
check('tanpa token -> 401', r.status === 401, `(got ${r.status})`);

// 2. Import valid
r = await call('server/admin/import-students.js', {
  headers: authHeaders,
  body: {
    kelas: '7',
    paralel: 'A',
    rows: [
      { no: 1, nama_lengkap: 'Ahmad Nisn', nisn: '1234567890' },
      { no: 2, nama_lengkap: 'Budi Auto' },
      { no: 3, nama_lengkap: 'Cica Manual', username: 'cica.test' },
      { no: 4, nama_lengkap: '' },           // harus error: nama kosong
      { no: 2, nama_lengkap: 'Duplikat No' }, // username 7A002 bentrok -> dilewati
    ],
  },
});
check('status 201', r.status === 201, `(got ${r.status})`);
check('3 akun dibuat', r.json?.created === 3, `(got ${r.json?.created})`);
check('2 dilewati', r.json?.skipped === 2, `(got ${r.json?.skipped})`);
const acc = r.json?.accounts || [];
const nisnAcc = acc.find((a) => a.username === '1234567890');
const autoAcc = acc.find((a) => a.username === '7A002');
const manualAcc = acc.find((a) => a.username === 'cica.test');
check('username = NISN', !!nisnAcc);
check('username auto 7A002', !!autoAcc, JSON.stringify(acc.map((a) => a.username)));
check('username manual', !!manualAcc);
check('password 8 char', acc.every((a) => a.password.length === 8));
check('kelas 7A', acc.every((a) => a.kelas === '7A'));

// 3. Duplikat import -> semua dilewati
let r2 = await call('server/admin/import-students.js', {
  headers: authHeaders,
  body: { kelas: '7', paralel: 'A', rows: [{ no: 1, nama_lengkap: 'Ahmad Nisn', nisn: '1234567890' }] },
});
check('re-import -> skipped 1', r2.json?.skipped === 1, `(got ${r2.json?.skipped})`);

// 4. Login siswa hasil import dengan username saja
const passAuto = autoAcc.password;
const { query } = await import(pathToFileURL(path.join(__dirname, '..', 'server/_lib/db.js')).href);
const row = await query('SELECT email, password_hash FROM students WHERE email = $1', [autoAcc.email]);
const bcrypt = (await import('bcryptjs')).default;
check('hash cocok di DB', await bcrypt.compare(passAuto, row.rows[0].password_hash));

// Login handler dengan username (bukan email penuh)
const { queryOne } = await import(pathToFileURL(path.join(__dirname, '..', 'server/_lib/db.js')).href);
const stu = await queryOne('SELECT * FROM students WHERE email = $1', [autoAcc.email]);
check('siswa ada di DB', !!stu);
check('status awal pending_incomplete', stu.overall_status === 'pending_incomplete');

// 5. Cleanup data uji
const emails = acc.map((a) => a.email);
await query(`DELETE FROM students WHERE email = ANY($1)`, [emails]);
const after = await queryOne('SELECT COUNT(*)::int AS n FROM students WHERE email = ANY($1)', [emails]);
check('cleanup OK', after.n === 0);

console.log(`\nHasil: ${pass} OK, ${fail} FAIL`);
process.exit(fail ? 1 : 0);