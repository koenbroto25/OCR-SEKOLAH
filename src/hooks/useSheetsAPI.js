import { useCallback, useState } from 'react';
import apiClient from '../utils/apiClient';

/**
 * Custom hook pembungkus API Google Sheets.
 */
export function useSheetsAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const uploadDocument = useCallback(async (payload) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.post('/api/sheets/upload', payload);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Upload gagal');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getStudentData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get('/api/sheets/get-student-data');
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, uploadDocument, getStudentData };
}