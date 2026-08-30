// scripts/test-s3.js
// Deteksi bucket Neon Storage + tes end-to-end upload/read/delete.
// Jalankan: node scripts/test-s3.js
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';

const ENDPOINT = process.env.AWS_ENDPOINT_URL_S3;
const REGION = process.env.AWS_REGION || 'us-east-2';

const s3 = new S3Client({
  endpoint: ENDPOINT,
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

try {
  const buckets = ['ktp', 'kartu-keluarga', 'akte-kelahiran'];
  console.log('Menguji ketiga bucket:', buckets.join(', '), '\n');

  for (const bucket of buckets) {
    // Buat gambar uji (scan-like: putih + garis hitam) -> WebP
    const testImage = await sharp({
      create: { width: 800, height: 600, channels: 3, background: '#ffffff' },
    })
      .composite([
        { input: Buffer.from('<svg><rect x="50" y="200" width="700" height="40" fill="black"/></svg>'), top: 0, left: 0 },
      ])
      .webp({ quality: 60 })
      .toBuffer();

    // Upload
    const key = `_test/ocr-test-${Date.now()}.webp`;
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: testImage, ContentType: 'image/webp' }));
    process.stdout.write(`[${bucket}] Upload OK (${testImage.length}B) `);

    // Read back via presigned URL
    const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 60 });
    const resp = await fetch(url);
    const buf = Buffer.from(await resp.arrayBuffer());
    process.stdout.write(`| Read HTTP ${resp.status}, identik=${buf.equals(testImage)} `);

    // Bersihkan
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    console.log(`| Delete OK`);
  }

  console.log('\nTES END-TO-END KETIGA BUCKET BERHASIL ✓');
} catch (error) {
  console.error('TES GAGAL:', error.name, '-', error.message);
  if (error.Code) console.error('Code:', error.Code);
  process.exitCode = 1;
}
