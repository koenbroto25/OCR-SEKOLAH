// src/utils/imageCompress.js
import ImageCompressor from 'compressorjs';

/**
 * Kompres gambar menggunakan compressorjs (API callback sesuai dokumentasi).
 */
export async function compressImage(file) {
  return new Promise((resolve, reject) => {
    new ImageCompressor(file, {
      quality: parseInt(import.meta.env.VITE_IMAGE_QUALITY, 10) || 75,
      maxWidth: 1920,
      maxHeight: 1080,
      mimeType: 'image/jpeg',
      convertSize: parseInt(import.meta.env.VITE_IMAGE_MAX_SIZE, 10) || 500000, // ~500KB
      success(result) {
        resolve(result);
      },
      error(error) {
        reject(error);
      },
    });
  });
}

export async function convertToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

export async function getCompressedImageBase64(file) {
  try {
    const compressed = await compressImage(file);
    const base64 = await convertToBase64(compressed);
    return base64;
  } catch (error) {
    console.error('Compression error:', error);
    throw error;
  }
}