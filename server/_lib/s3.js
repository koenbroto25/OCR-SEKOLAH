// api/_lib/s3.js
// Klien Neon Storage (S3-compatible) + helper presigned URL.
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const ENDPOINT = process.env.AWS_ENDPOINT_URL_S3 || '';
const REGION = process.env.AWS_REGION || 'us-east-2';

/**
 * Mapping docType -> nama bucket Neon Storage.
 * Bucket dibuat oleh pengguna di dashboard Neon: ktp, kartu-keluarga, akte-kelahiran.
 */
export const DOC_BUCKETS = {
  ktp: process.env.AWS_S3_BUCKET_KTP || 'ktp',
  kk: process.env.AWS_S3_BUCKET_KK || 'kartu-keluarga',
  akte: process.env.AWS_S3_BUCKET_AKTE || 'akte-kelahiran',
};

/** Ambil nama bucket untuk jenis dokumen. */
export function bucketForDoc(docType) {
  return DOC_BUCKETS[docType] || '';
}

let client = null;

/** Validasi konfigurasi Neon Storage. Return null jika OK, pesan error jika tidak. */
export function checkS3Config() {
  if (!ENDPOINT) return 'AWS_ENDPOINT_URL_S3 tidak diset';
  if (!process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID.startsWith('ISI_'))
    return 'AWS_ACCESS_KEY_ID belum diisi dari Neon';
  if (!process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY.startsWith('ISI_'))
    return 'AWS_SECRET_ACCESS_KEY belum diisi dari Neon';
  if (!DOC_BUCKETS.ktp || !DOC_BUCKETS.kk || !DOC_BUCKETS.akte)
    return 'Mapping bucket dokumen tidak lengkap';
  return null;
}

/** Klien S3 singleton (endpoint = Neon Storage). */
export function getS3Client() {
  if (!client) {
    client = new S3Client({
      endpoint: ENDPOINT,
      region: REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true, // endpoint custom Neon
    });
  }
  return client;
}

export function getS3Bucket() {
  return DOC_BUCKETS;
}

/** Upload buffer ke Neon Storage (bucket sesuai docType). Return key objek. */
export async function putObject(key, buffer, contentType = 'image/webp', docType = 'ktp') {
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucketForDoc(docType),
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return key;
}

/** Buat presigned GET URL (default berlaku 10 menit). */
export async function getPresignedUrl(key, expiresIn = 600, docType = 'ktp') {
  return getSignedUrl(
    getS3Client(),
    new GetObjectCommand({ Bucket: bucketForDoc(docType), Key: key }),
    { expiresIn }
  );
}

/** Hapus objek (non-fatal). */
export async function deleteObject(key, docType = 'ktp') {
  try {
    await getS3Client().send(
      new DeleteObjectCommand({ Bucket: bucketForDoc(docType), Key: key })
    );
  } catch (error) {
    console.error('S3 delete error:', error.message);
  }
}

export { PutObjectCommand, GetObjectCommand };
