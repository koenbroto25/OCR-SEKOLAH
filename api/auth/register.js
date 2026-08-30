// api/auth/register.js
import bcrypt from 'bcryptjs';
import { query, queryOne } from '../_lib/db.js';
import { appendLog, nextStudentId, nextOperatorId } from '../_lib/students.js';
import { requireAuth } from '../_lib/auth.js';

/**
 * POST   -> buat user baru (admin; role student/operator)
 * GET    -> list semua user (admin)
 * DELETE -> hapus user (admin)
 */
export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const admin = requireAuth(req, res, 'admin');
      if (!admin) return;

      const { email, username, password, role = 'student', nama_lengkap, kelas } =
        req.body || {};

      if (!email || !password) {
        return res.status(400).json({ message: 'Email dan password wajib diisi' });
      }
      if (!['student', 'operator'].includes(role)) {
        return res.status(400).json({ message: 'Role tidak valid' });
      }

      // Cek email sudah terdaftar (di kedua tabel)
      const studentExists = await queryOne(
        'SELECT id FROM students WHERE lower(email) = lower($1)',
        [email]
      );
      const operatorExists = await queryOne(
        'SELECT id FROM operators WHERE lower(email) = lower($1)',
        [email]
      );
      if (studentExists || operatorExists) {
        return res.status(409).json({ message: 'Email sudah terdaftar' });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      if (role === 'student') {
        const id = await nextStudentId();
        await query(
          `INSERT INTO students (id, email, password_hash, nama_lengkap, kelas, last_modified, last_modified_by)
           VALUES ($1, $2, $3, $4, $5, now(), $6)`,
          [id, email, passwordHash, nama_lengkap || '', kelas || '', admin.email || 'admin']
        );

        await appendLog({
          userEmail: admin.email,
          userRole: 'admin',
          action: 'create_student',
          studentId: id,
          details: `Created account for ${email}`,
        });

        return res.status(201).json({ message: 'User berhasil dibuat', id });
      }

      // operator
      const id = await nextOperatorId();
      await query(
        `INSERT INTO operators (id, email, username, password_hash, role, last_modified_by)
         VALUES ($1, $2, $3, $4, 'operator', $5)`,
        [id, email, username || '', passwordHash, admin.email || 'admin']
      );

      await appendLog({
        userEmail: admin.email,
        userRole: 'admin',
        action: 'create_operator',
        studentId: id,
        details: `Created account for ${email}`,
      });

      return res.status(201).json({ message: 'User berhasil dibuat', id });
    }

    if (req.method === 'GET') {
      const admin = requireAuth(req, res, 'admin');
      if (!admin) return;

      const users = [];

      const students = await query(
        'SELECT id, email, nama_lengkap, kelas, overall_status FROM students ORDER BY id'
      );
      students.rows.forEach((r) =>
        users.push({
          id: r.id,
          email: r.email,
          role: 'student',
          kelas: r.kelas,
          nama_lengkap: r.nama_lengkap,
          overall_status: r.overall_status,
        })
      );

      const operators = await query(
        'SELECT id, email, username, role FROM operators ORDER BY id'
      );
      operators.rows.forEach((r) =>
        users.push({
          id: r.id,
          email: r.email,
          username: r.username,
          role: r.role || 'operator',
        })
      );

      // Admin built-in
      users.unshift({
        id: 'admin',
        email: 'admin@sekolah.local',
        username: 'admin',
        role: 'admin',
      });

      return res.status(200).json({ users });
    }

    if (req.method === 'DELETE') {
      const admin = requireAuth(req, res, 'admin');
      if (!admin) return;

      const { id } = req.query;
      if (!id || id === 'admin') {
        return res.status(400).json({ message: 'ID user tidak valid' });
      }

      const studentDeleted = await query('DELETE FROM students WHERE id = $1', [id]);
      const operatorDeleted = await query('DELETE FROM operators WHERE id = $1', [id]);

      if (!studentDeleted.rowCount && !operatorDeleted.rowCount) {
        return res.status(404).json({ message: 'User tidak ditemukan' });
      }

      await appendLog({
        userEmail: admin.email,
        userRole: 'admin',
        action: 'delete_user',
        studentId: id,
        details: `Deleted user ${id}`,
      });

      return res.status(200).json({ message: 'User berhasil dihapus' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}