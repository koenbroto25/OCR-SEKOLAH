// api/settings.js
import { query } from './_lib/db.js';

export const DEFAULT_SETTINGS = {
  nama_sekolah: 'SMA Negeri 1 Contoh',
  tahun_akademik: '2024/2025',
  school_code: 'SMAN01',
  available_classes: ['10A', '10B', '11A', '11B', '12A', '12B'],
  maintenance_mode: false,
  password_change_required: false,
};

/**
 * Baca semua pengaturan dari tabel 'settings' (key-value).
 */
export async function readSettings() {
  const settings = { ...DEFAULT_SETTINGS };

  try {
    const result = await query('SELECT key, value FROM settings');
    result.rows.forEach(({ key, value }) => {
      if (key === 'available_classes') {
        settings[key] = String(value || '')
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean);
      } else if (key === 'maintenance_mode' || key === 'password_change_required') {
        settings[key] = String(value) === 'true';
      } else if (key in settings) {
        settings[key] = value ?? '';
      }
    });
  } catch (error) {
    console.error('Read settings error (non-fatal):', error.message);
  }

  return settings;
}

/**
 * GET /api/settings — konfigurasi sekolah (publik, dibutuhkan halaman login).
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const settings = await readSettings();
    return res.status(200).json({ settings });
  } catch (error) {
    console.error('Settings error:', error);
    // Fallback: tetap kirim default agar aplikasi tetap jalan
    return res.status(200).json({ settings: DEFAULT_SETTINGS });
  }
}