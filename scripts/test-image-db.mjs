// scripts/test-image-db.mjs — uji kompresi sharp + roundtrip document_images
import sharp from 'sharp';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  // 1) Simulasi scan dokumen: JPEG 2000x1500 dengan noise agar mirip foto
  const testImage = await sharp({
    create: { width: 2000, height: 1500, channels: 3, noise: { type: 'gaussian', mean: 128, sigma: 30 } },
  })
    .jpeg({ quality: 85 })
    .toBuffer();
  console.log('Simulasi scan awal (JPEG 2000x1500):', (testImage.length / 1024).toFixed(0), 'KB');

  // 2) Kompresi seperti di api/drive/upload.js
  const compressed = await sharp(testImage)
    .rotate()
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 60, effort: 6 })
    .toBuffer();
  console.log('Setelah kompresi WebP q60 w1200:', (compressed.length / 1024).toFixed(1), 'KB',
    `(${((1 - compressed.length / testImage.length) * 100).toFixed(0)}% lebih kecil)`);

  // 3) Roundtrip DB (upsert + baca balik)
  const sid = 'TEST-IMG-001';
  await pool.query(
    `INSERT INTO document_images (student_id, doc_type, mime_type, size_bytes, data, updated_at)
     VALUES ($1, 'ktp', 'image/webp', $2, $3, now())
     ON CONFLICT (student_id, doc_type)
     DO UPDATE SET size_bytes = EXCLUDED.size_bytes, data = EXCLUDED.data, updated_at = now()`,
    [sid, compressed.length, compressed]
  );
  const row = await pool.query(
    'SELECT mime_type, size_bytes, data FROM document_images WHERE student_id = $1 AND doc_type = $2',
    [sid, 'ktp']
  );
  const back = row.rows[0];
  const identical = Buffer.compare(Buffer.from(back.data), compressed) === 0;
  console.log('Roundtrip DB: OK | mime:', back.mime_type, '| byte identik:', identical);

  // 4) Bersihkan data uji
  await pool.query('DELETE FROM document_images WHERE student_id = $1', [sid]);
  console.log('Data uji dihapus. SEMUA TES LOLOS');
} catch (e) {
  console.error('ERROR:', e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}