// api/[...path].js
// SATU serverless function catch-all untuk seluruh API.
// Vercel Hobby plan membatasi 12 Serverless Functions per deployment;
// dengan menggabungkan semua route ke satu fungsi ini, kita hanya memakai 1.
// Semua handler & helper dipindah ke folder /server (di luar /api) sehingga
// tidak ikut dihitung sebagai fungsi terpisah.
import login from '../server/auth/login.js';
import logout from '../server/auth/logout.js';
import register from '../server/auth/register.js';
import getPending from '../server/admin/get-pending.js';
import updateStatus from '../server/admin/update-status.js';
import updateSettings from '../server/admin/update-settings.js';
import importStudents from '../server/admin/import-students.js';
import driveUpload from '../server/drive/upload.js';
import viewImage from '../server/images/view.js';
import getStudentData from '../server/sheets/get-student-data.js';
import sheetUpload from '../server/sheets/upload.js';
import crossValidate from '../server/validate/cross-validate.js';
import settings from '../server/settings.js';

const ROUTES = {
  '/api/auth/login': login,
  '/api/auth/logout': logout,
  '/api/auth/register': register,
  '/api/admin/get-pending': getPending,
  '/api/admin/update-status': updateStatus,
  '/api/admin/update-settings': updateSettings,
  '/api/admin/import-students': importStudents,
  '/api/drive/upload': driveUpload,
  '/api/images/view': viewImage,
  '/api/sheets/get-student-data': getStudentData,
  '/api/sheets/upload': sheetUpload,
  '/api/validate/cross-validate': crossValidate,
  '/api/settings': settings,
};

export default async function handler(req, res) {
  // Vercel memasukkan segmen path catch-all ke req.query.path (array),
  // sedangkan query string asli tetap tersedia di req.query.
  const segments = req.query?.path || [];
  const pathname = `/api/${Array.isArray(segments) ? segments.join('/') : String(segments)}`;

  const routeHandler = ROUTES[pathname];
  if (!routeHandler) {
    if (!res.writableEnded) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ message: `API tidak ditemukan: ${pathname}` }));
    }
    return undefined;
  }

  try {
    return await routeHandler(req, res);
  } catch (error) {
    console.error(`[API] ${req.method} ${pathname} error:`, error);
    if (!res.writableEnded) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ message: 'Server error' }));
    }
    return undefined;
  }
}