// api/auth/login.js
import bcrypt from 'bcryptjs';
import { queryOne } from '../_lib/db.js';
import { appendLog, getClientIP } from '../_lib/students.js';
import { signToken } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password harus diisi' });
    }

    // Admin login (email 'admin' atau 'admin@sekolah.local')
    if (email === 'admin' || email === 'admin@sekolah.local') {
      const adminHash = process.env.VITE_ADMIN_PASSWORD_HASH;
      const isValidPassword = adminHash
        ? await bcrypt.compare(password, adminHash)
        : password === '123456';

      if (!isValidPassword) {
        return res.status(401).json({ message: 'Email atau password salah' });
      }

      const token = signToken(
        { id: 'admin', email: 'admin@sekolah.local', role: 'admin' },
        '7d'
      );

      await appendLog({
        userEmail: 'admin@sekolah.local',
        userRole: 'admin',
        action: 'login',
        statusChange: 'success',
        ip: getClientIP(req),
      });

      return res.status(200).json({
        token,
        user: {
          id: 'admin',
          email: 'admin@sekolah.local',
          role: 'admin',
          username: 'admin',
        },
      });
    }

    // Student login (terima email lengkap ATAU username saja, mis. 7A001)
    const loginKey = String(email).toLowerCase();
    const student = await queryOne(
      `SELECT * FROM students
       WHERE lower(email) = $1
          OR lower(email) = $1 || '@siswa.sekolah.id'
       LIMIT 1`,
      [loginKey]
    );

    if (!student) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const passwordMatch = student.password_hash
      ? await bcrypt.compare(password, student.password_hash)
      : false;

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const token = signToken(
      {
        id: student.id,
        email: student.email,
        role: 'student',
        nik: student.nik,
        nama: student.nama_lengkap,
      },
      '7d'
    );

    await appendLog({
      userEmail: student.email,
      userRole: 'student',
      action: 'login',
      studentId: student.id,
      statusChange: 'success',
      ip: getClientIP(req),
    });

    return res.status(200).json({
      token,
      user: {
        id: student.id,
        email: student.email,
        role: 'student',
        nik: student.nik,
        nama_lengkap: student.nama_lengkap,
        kelas: student.kelas,
        tahun_akademik: student.tahun_akademik,
        nama_sekolah: student.nama_sekolah,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}