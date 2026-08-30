import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import apiClient from '../../utils/apiClient';

const KELAS_OPTIONS = ['7', '8', '9'];
const PARALEL_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const TEMPLATE_HEADERS = ['no', 'nama_lengkap', 'nisn', 'username', 'password'];

export default function BulkImportStudents() {
  const fileRef = useRef(null);
  const [kelas, setKelas] = useState('7');
  const [paralel, setParalel] = useState('A');
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  /** Generate & download template Excel sesuai kelas terpilih. */
  const downloadTemplate = () => {
    const sample = [
      { no: 1, nama_lengkap: 'Budi Santoso', nisn: '', username: '', password: '' },
      { no: 2, nama_lengkap: 'Siti Aminah', nisn: '0071234567', username: '', password: '' },
    ];
    const ws = XLSX.utils.json_to_sheet(sample, { header: TEMPLATE_HEADERS });
    ws['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

    const info = XLSX.utils.aoa_to_sheet([
      ['PETUNJUK PENGISIAN TEMPLATE SISWA'],
      [`Kelas target: ${kelas}${paralel}`],
      [],
      ['no', 'Wajib. Nomor urut siswa (dipakai untuk username otomatis, mis. 7A001).'],
      ['nama_lengkap', 'Wajib. Nama lengkap siswa.'],
      ['nisn', 'Opsional. Jika diisi (min. 10 digit), NISN dipakai sebagai username.'],
      ['username', 'Opsional. Jika dikosongkan, otomatis: NISN atau kelas+nomor (7A001).'],
      ['password', 'Opsional. Jika dikosongkan, dibuat otomatis (8 karakter, mudah dibaca).'],
      [],
      ['Hapus baris contoh sebelum mengisi. Jangan mengubah nama kolom di baris pertama.'],
    ]);
    info['!cols'] = [{ wch: 15 }, { wch: 80 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');
    XLSX.utils.book_append_sheet(wb, info, 'Petunjuk');
    XLSX.writeFile(wb, `Template_Siswa_${kelas}${paralel}.xlsx`);
  };

  /** Parse file Excel yang diupload jadi preview rows. */
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setResult(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const parsed = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!parsed.length) {
          setError('File Excel kosong atau format tidak dikenali');
          setRows([]);
          return;
        }
        const normalized = parsed
          .map((r, i) => ({
            no: r.no ?? r.No ?? i + 1,
            nama_lengkap: String(r.nama_lengkap ?? r.Nama ?? '').trim(),
            nisn: String(r.nisn ?? r.NISN ?? '').trim(),
            username: String(r.username ?? r.Username ?? '').trim(),
            password: String(r.password ?? r.Password ?? '').trim(),
          }))
          .filter((r) => r.nama_lengkap);

        if (!normalized.length) {
          setError('Tidak ada baris dengan kolom "nama_lengkap" yang terisi');
        }
        setRows(normalized);
      } catch {
        setError('Gagal membaca file. Pastikan format .xlsx / .xls');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  /** Kirim ke backend untuk membuat akun. */
  const doImport = async () => {
    setImporting(true);
    setError('');
    try {
      const response = await apiClient.post('/api/admin/import-students', { kelas, paralel, rows });
      setResult(response.data);
      setRows([]);
      setFileName('');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal import siswa');
    } finally {
      setImporting(false);
    }
  };

  /** Download daftar akun (username+password) hasil import. */
  const downloadAccounts = () => {
    if (!result?.accounts?.length) return;
    const ws = XLSX.utils.json_to_sheet(
      result.accounts.map((a, i) => ({
        no: i + 1,
        nama_lengkap: a.nama_lengkap,
        kelas: a.kelas,
        nisn: a.nisn,
        username: a.username,
        email: a.email,
        password: a.password,
      })),
      { header: ['no', 'nama_lengkap', 'kelas', 'nisn', 'username', 'email', 'password'] }
    );
    ws['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 32 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Akun Siswa');
    XLSX.writeFile(wb, `Akun_Siswa_${kelas}${paralel}.xlsx`);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-1">Import Siswa via Excel</h2>
      <p className="text-sm text-gray-600 mb-6">
        Pilih kelas &amp; paralel, unduh template, isi nama siswa, lalu unggah kembali.
        Username &amp; password dibuat otomatis dan dapat diunduh setelah import.
      </p>

      {/* Step 1: pilih kelas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
          <select value={kelas} onChange={(e) => setKelas(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
            {KELAS_OPTIONS.map((k) => <option key={k} value={k}>Kelas {k}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Paralel</label>
          <select value={paralel} onChange={(e) => setParalel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
            {PARALEL_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <button onClick={downloadTemplate}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 flex items-center justify-center gap-2">
          <Download className="w-4 h-4" />
          Download Template ({kelas}{paralel})
        </button>
      </div>

      {/* Step 2: upload */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-6">
        <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
        <FileSpreadsheet className="w-10 h-10 mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-3">
          {fileName ? `File: ${fileName} (${rows.length} baris terbaca)` : 'Pilih file Excel yang sudah diisi'}
        </p>
        <button onClick={() => fileRef.current?.click()}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2 mx-auto">
          <Upload className="w-4 h-4" />
          Pilih File Excel
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Step 3: preview */}
      {rows.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Preview ({rows.length} siswa) — kelas {kelas}{paralel}
          </h3>
          <div className="max-h-60 overflow-y-auto border rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {['No', 'Nama', 'NISN', 'Username', 'Password'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 100).map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-1.5">{r.no}</td>
                    <td className="px-3 py-1.5">{r.nama_lengkap}</td>
                    <td className="px-3 py-1.5">{r.nisn || '—'}</td>
                    <td className="px-3 py-1.5">{r.username || 'otomatis'}</td>
                    <td className="px-3 py-1.5">{r.password || 'otomatis'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={doImport} disabled={importing}
            className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {importing ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {importing ? 'Mengimpor...' : `Import ${rows.length} Siswa ke Kelas ${kelas}${paralel}`}
          </button>
        </div>
      )}

      {/* Step 4: hasil */}
      {result && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-green-800">
              <strong>{result.created} akun dibuat</strong>
              {result.skipped > 0 && <> • {result.skipped} dilewati</>}
            </div>
            <button onClick={downloadAccounts}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download Daftar Akun (.xlsx)
            </button>
          </div>
          {result.errors?.length > 0 && (
            <ul className="mt-3 text-xs text-red-700 list-disc list-inside max-h-32 overflow-y-auto">
              {result.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}