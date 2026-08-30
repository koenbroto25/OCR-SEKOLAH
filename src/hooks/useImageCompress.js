import { useCallback } from 'react';
import { getCompressedImageBase64 } from '../utils/imageCompress';

export function useImageCompress() {
  const compressToBase64 = useCallback(async (file) => {
    return getCompressedImageBase64(file);
  }, []);

  return { compressToBase64 };
}