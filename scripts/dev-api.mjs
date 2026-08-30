// scripts/dev-api.mjs
// Dev server API lokal — menjalankan handler Vercel serverless tanpa Vercel CLI.
// Dipakai bersama `npm run dev` (Vite mem-proxy /api -> :3000).
// Jalankan: npm run dev:api
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_DIR = path.join(__dirname, '..', 'api');
const PORT = process.env.DEV_API_PORT || 3000;

/** Tambah helper Express-style (status/json/send/redirect) ke res Node murni,
 *  meniru runtime Vercel. */
function enhanceRes(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (obj) => {
    const body = JSON.stringify(obj);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Length', Buffer.byteLength(body));
    res.end(body);
    return res;
  };
  res.send = (data) => {
    if (Buffer.isBuffer(data)) {
      res.setHeader('Content-Length', data.length);
      res.end(data);
    } else if (typeof data === 'string') {
      res.end(data);
    } else {
      res.end(String(data));
    }
    return res;
  };
  res.redirect = (code, url) => {
    if (typeof code !== 'number') {
      url = code;
      code = 302;
    }
    res.statusCode = code;
    res.setHeader('Location', url);
    res.end();
    return res;
  };
  return res;
}

/** Routing sederhana: /api/auth/login -> api/auth/login.js */
async function resolveHandler(pathname) {
  const rel = pathname.replace(/^\/api\//, '');
  if (!rel || rel.includes('..')) return null;
  const file = path.join(API_DIR, rel + '.js');
  try {
    return (await import(pathToFileURL(file).href)).default;
  } catch {
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // CORS + preflight (meniru api/middleware/cors.js)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  // Parse body JSON / form
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf8');
    try {
      req.body = raw ? JSON.parse(raw) : {};
    } catch {
      req.body = {};
    }
  } else {
    req.body = {};
  }

  req.query = Object.fromEntries(url.searchParams);

  const handler = await resolveHandler(pathname);
  const enhanced = enhanceRes(res);
  if (!handler) {
    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: `API tidak ditemukan: ${pathname}` }));
  }

  try {
    await handler(req, enhanced);
  } catch (error) {
    console.error(`[API] ${req.method} ${pathname} error:`, error);
    if (!res.writableEnded) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Server error' }));
    }
  }
});

server.listen(PORT, () => {
  console.log(`Dev API berjalan di http://localhost:${PORT}`);
  console.log('Vite (npm run dev) akan mem-proxy /api ke sini.');
});
