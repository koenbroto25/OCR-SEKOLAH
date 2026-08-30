// api/admin/update-settings.js
import { query } from '../_lib/db.js';
import { appendLog, getClientIP } from '../_lib/students.js';
import { requireAuth } from '../_lib/auth.js';

const SETTING_KEYS = [
  'nama_sekolah',
  'tahun_akademik',
  'school_code',
  'available_classes',
  'maintenance_mode',
  'password_change_required',
];

/**
 * POST /api/admin/update-settings
 * Body: { nama_sekolah, tahun_akademik, school_code, available_classes: [],
 *         maintenance_mode: bool, password_change_required: bool }
 * Upsert ke tabel 'settings' (key-value).
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const admin = requireAuth(req, res, 'admin');
    if (!admin) return;

    const body = req.body || {};
    const updates = {};

    SETTING_KEYS.forEach((key) => {
      if (!(key in body)) return;
      const value = body[key];
      if (key === 'available_classes') {
        updates[key] = Array.isArray(value) ? value.join(',') : String(value);
      } else if (key === 'maintenance_mode' || key === 'password_change_required') {
        updates[key] = String(Boolean(value));
      } else {
        updates[key] = String(value ?? '');
      }
    });

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: 'Tidak ada pengaturan yang dikirim' });
    }

    for (const [key, value] of Object.entries(updates)) {
      await query(
        `INSERT INTO settings (key, value, updated_at, updated_by)
         VALUES ($1, $2, now(), $3)
         ON CONFLICT (key)
         DO UPDATE SET value = EXCLUDED.value,
                       updated_at = now(),
                       updated_by = EXCLUDED.updated_by`,
        [key, value, admin.email || 'admin']
      );
    }

    await appendLog({
      userEmail: admin.email,
      userRole: 'admin',
      action: 'update_settings',
      details: Object.keys(updates).join(', '),
      ip: getClientIP(req),
    });

    return res
      .status(200)
      .json({ message: 'Pengaturan berhasil disimpan', updated: Object.keys(updates) });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ message: 'Gagal menyimpan pengaturan' });
  }
}