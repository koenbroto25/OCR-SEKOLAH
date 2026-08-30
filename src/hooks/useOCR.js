import { useCallback, useState } from 'react';
import { createWorker } from 'tesseract.js';
import { extractFields } from '../utils/patterns';
import { validateReadability, validateExtractedFields } from '../utils/validation';

/**
 * Custom hook untuk menjalankan OCR (Tesseract.js) pada gambar.
 * Mengembalikan state + fungsi recognize.
 */
export function useOCR() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [validationStatus, setValidationStatus] = useState(null);

  const recognize = useCallback(async (imageSrc, docType, lang = 'ind') => {
    setIsProcessing(true);
    setError('');
    setValidationStatus(null);

    try {
      const worker = await createWorker(lang);
      const { data } = await worker.recognize(imageSrc);
      const text = data.text || '';
      const ocrConfidence = data.confidence || 0;

      setConfidence(Math.round(ocrConfidence));

      // 1) Validasi keterbacaan
      const readabilityScore = validateReadability(text);
      if (readabilityScore < 60) {
        setValidationStatus({
          status: 'rejected',
          message: `Foto tidak terbaca jelas (Readability: ${readabilityScore}%). Silakan ambil ulang.`,
          score: readabilityScore,
        });
        await worker.terminate();
        return { fields: {}, text, confidence: ocrConfidence, readabilityScore, ok: false };
      }

      // 2) Ekstraksi field
      const fields = extractFields(text, docType);

      // 3) Validasi field wajib
      const validation = validateExtractedFields(fields, docType);
      if (!validation.valid) {
        setValidationStatus({
          status: 'rejected',
          message: 'Data tidak lengkap. ' + validation.errors.join('. '),
          missingFields: validation.missingFields,
          score: readabilityScore,
        });
        await worker.terminate();
        return { fields, text, confidence: ocrConfidence, readabilityScore, validation, ok: false };
      }

      setValidationStatus({
        status: 'approved',
        message: 'Data berhasil diekstrak dengan benar',
        score: readabilityScore,
      });

      await worker.terminate();
      return { fields, text, confidence: ocrConfidence, readabilityScore, validation, ok: true };
    } catch (err) {
      setError(`Error OCR: ${err.message}`);
      return { fields: {}, text: '', confidence: 0, ok: false, error: err.message };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return { isProcessing, error, confidence, validationStatus, recognize };
}