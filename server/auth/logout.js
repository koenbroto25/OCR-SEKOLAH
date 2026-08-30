// api/auth/logout.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // JWT bersifat stateless; logout cukup dilakukan client dengan
  // menghapus token dari localStorage.
  return res.status(200).json({ message: 'Logout berhasil' });
}