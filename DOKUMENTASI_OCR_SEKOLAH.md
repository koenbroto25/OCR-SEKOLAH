# DOKUMENTASI TEKNIS LENGKAP: APLIKASI OCR SCAN DOKUMEN SISWA SEKOLAH

**Status**: Production-Ready  
**Tech Stack**: React + Vercel + Google Sheets + Google Drive  
**Scale**: 500 siswa, 1 sekolah, expand-ready ke Neon  
**Last Updated**: 2024

---

## TABLE OF CONTENTS

1. [Overview & Architecture](#overview--architecture)
2. [Tech Stack & Dependencies](#tech-stack--dependencies)
3. [Project Structure](#project-structure)
4. [Setup & Installation](#setup--installation)
5. [Google Sheets Schema](#google-sheets-schema)
6. [Google Drive Setup](#google-drive-setup)
7. [Environment Variables](#environment-variables)
8. [Authentication System](#authentication-system)
9. [React Components](#react-components)
10. [Vercel API Routes](#vercel-api-routes)
11. [OCR & Field Extraction](#ocr--field-extraction)
12. [Cross-Validation Logic](#cross-validation-logic)
13. [Admin Dashboard](#admin-dashboard)
14. [Student Dashboard](#student-dashboard)
15. [Image Compression](#image-compression)
16. [Error Handling](#error-handling)
17. [Deployment](#deployment)
18. [Testing Checklist](#testing-checklist)

---

## OVERVIEW & ARCHITECTURE

### System Flow

```
STUDENT FLOW:
─────────────
Student Login (auto-generated creds from Sheets)
    ↓
Select Document Type (KTP/KK/Akte)
    ↓
Capture/Upload Image (1 per session)
    ↓
OCR + Readability Validation
    ↓
Preview + Edit Data
    ↓
Verify: "Data ini benar" (checkbox)
    ↓
Submit to Google Sheets
    ↓
Status: PENDING (tunggu admin verifikasi)
    ↓
View Status Dashboard


ADMIN FLOW:
─────────
Admin Login (fixed: admin / 123456)
    ↓
Dashboard: See all pending uploads
    ↓
Review each submission
    ↓
Cross-Validation: NIK + Nama + TTL match?
    ↓
If Match → APPROVED
If Mismatch → REJECTED + notify student
If incomplete → manual call student
    ↓
Update Sheets + Google Drive organized by class/year


CROSS-VALIDATION:
────────────────
Student upload 3 docs: KTP, KK, Akte
    ↓
Extract: NIK, Nama, TTL dari masing-masing
    ↓
Compare:
  - KTP_NIK == KK_NIK == Akte_NIK?
  - KTP_Nama == KK_Nama == Akte_Nama?
  - KTP_TTL == KK_TTL == Akte_TTL?
    ↓
If ALL MATCH → Auto-approved, move to APPROVED state
If ANY MISMATCH → Reject, notify student + admin for manual verify
If Incomplete (missing 1+ docs) → Pending manual review
```

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL DEPLOYMENT                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐              ┌──────────────────────┐    │
│  │   REACT APP      │              │  SERVERLESS FUNCTIONS│    │
│  │ (Frontend)       │              │  (Backend API)       │    │
│  │                  │──────────────→│                      │    │
│  │ - Login          │              │ /api/auth/login      │    │
│  │ - Dashboard      │              │ /api/auth/register   │    │
│  │ - OCR Scanner    │              │ /api/sheets/upload   │    │
│  │ - Preview Form   │              │ /api/sheets/check-dup│    │
│  │ - Admin Panel    │              │ /api/drive/upload    │    │
│  │ - Status View    │              │ /api/validate        │    │
│  │                  │←──────────────│ /api/admin/get-data  │    │
│  └──────────────────┘              │ /api/admin/update    │    │
│                                    │ /api/settings        │    │
│                                    └──────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         ↓                                    ↓
    ┌────────────┐                   ┌──────────────────┐
    │ Google     │                   │   Google Drive   │
    │ Sheets API │                   │   (Image Storage)│
    │ (Database) │                   │                  │
    └────────────┘                   └──────────────────┘
```

---

## TECH STACK & DEPENDENCIES

### Frontend Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "react-hook-form": "^7.48.0",
    "tesseract.js": "^5.0.0",
    "axios": "^1.6.0",
    "image-compressor": "^0.8.0",
    "tailwindcss": "^3.3.0",
    "lucide-react": "^0.294.0",
    "zustand": "^4.4.0",
    "js-cookie": "^3.0.0",
    "@google-cloud/storage": "^7.0.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

### Backend Dependencies (Vercel Functions)

```json
{
  "dependencies": {
    "google-spreadsheet": "^4.1.0",
    "google-auth-library": "^9.6.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.1.0",
    "axios": "^1.6.0",
    "dotenv": "^16.3.0",
    "sharp": "^0.33.0"
  }
}
```

---

## PROJECT STRUCTURE

```
ocr-sekolah/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── LoginForm.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── Scanner/
│   │   │   ├── CameraScanner.jsx
│   │   │   ├── DocumentTypeSelect.jsx
│   │   │   ├── CapturePreview.jsx
│   │   │   └── ImageUpload.jsx
│   │   ├── Preview/
│   │   │   ├── DataPreview.jsx
│   │   │   ├── DataEditor.jsx
│   │   │   └── VerificationCheckbox.jsx
│   │   ├── Dashboard/
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── UploadStatus.jsx
│   │   │   └── StatusTimeline.jsx
│   │   ├── AdminPanel/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminSettings.jsx
│   │   │   ├── StudentDataTable.jsx
│   │   │   ├── MismatchReview.jsx
│   │   │   ├── StudentDetail.jsx
│   │   │   └── UserManagement.jsx
│   │   └── Common/
│   │       ├── Header.jsx
│   │       ├── Navigation.jsx
│   │       ├── LoadingSpinner.jsx
│   │       └── ErrorAlert.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useSheetsAPI.js
│   │   ├── useOCR.js
│   │   └── useImageCompress.js
│   ├── utils/
│   │   ├── patterns.js (regex patterns)
│   │   ├── validation.js
│   │   ├── imageCompress.js
│   │   ├── dateFormatter.js
│   │   └── apiClient.js
│   ├── store/
│   │   └── authStore.js (Zustand)
│   ├── styles/
│   │   ├── globals.css
│   │   └── tailwind.config.js
│   ├── App.jsx
│   └── index.jsx
├── api/
│   ├── auth/
│   │   ├── login.js
│   │   ├── register.js
│   │   └── logout.js
│   ├── sheets/
│   │   ├── upload.js
│   │   ├── check-duplicate.js
│   │   ├── get-student-data.js
│   │   ├── update-status.js
│   │   └── get-all-students.js
│   ├── drive/
│   │   └── upload.js
│   ├── admin/
│   │   ├── get-pending.js
│   │   ├── verify-data.js
│   │   ├── reject-data.js
│   │   └── update-settings.js
│   ├── validate/
│   │   ├── cross-validate.js
│   │   ├── ocr-readability.js
│   │   └── field-check.js
│   └── middleware/
│       ├── auth.js
│       └── cors.js
├── .env.example
├── .env.local (gitignore)
├── vercel.json
├── package.json
├── package-lock.json
└── README.md
```

---

## SETUP & INSTALLATION

### 1. Clone & Install Dependencies

```bash
# Create project
npm create vite@latest ocr-sekolah -- --template react
cd ocr-sekolah

# Install dependencies
npm install

# Install additional packages
npm install react-router-dom react-hook-form tesseract.js axios image-compressor zustand js-cookie

# Dev dependencies
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2. Project Structure Setup

```bash
# Create folders
mkdir -p src/components/{Auth,Scanner,Preview,Dashboard,AdminPanel,Common}
mkdir -p src/hooks src/utils src/store src/styles
mkdir -p api/{auth,sheets,drive,admin,validate,middleware}

# Create files structure
touch src/App.jsx src/index.jsx
touch src/store/authStore.js
touch src/hooks/useAuth.js src/hooks/useSheetsAPI.js
touch api/auth/login.js api/auth/register.js
```

### 3. Configure Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Initialize
vercel
```

Create `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": [
    "VITE_GOOGLE_SHEETS_ID",
    "VITE_GOOGLE_DRIVE_FOLDER_ID",
    "VITE_GOOGLE_API_KEY",
    "VITE_JWT_SECRET",
    "VITE_ADMIN_PASSWORD_HASH"
  ],
  "functions": {
    "api/**/*.js": {
      "memory": 512,
      "maxDuration": 30
    }
  }
}
```

---

## GOOGLE SHEETS SCHEMA

### Sheet 1: "Students" (Main Data)

**Columns:**

```
A: ID (auto-increment, format: STU-001, STU-002, ...)
B: Email (auto-generated, format: firstname_lastname_nik@sekolah.local)
C: Password_Hash (bcrypt hash)
D: Nama_Lengkap
E: NIK
F: Kelas (10A, 10B, 11A, 11B, 12A, 12B, etc)
G: Tahun_Akademik (2024/2025)
H: Nama_Sekolah

─── KTP Data ───
I: KTP_Status (pending, approved, rejected, incomplete)
J: KTP_NIK
K: KTP_Nama
L: KTP_TTL (Tempat,DD-MM-YYYY)
M: KTP_Alamat
N: KTP_JenisKelamin
O: KTP_Agama
P: KTP_Upload_Date
Q: KTP_Drive_URL

─── KK Data ───
R: KK_Status
S: KK_NIK
T: KK_Nama
U: KK_TTL
V: KK_Alamat
W: KK_Drive_URL
X: KK_Upload_Date

─── Akte Data ───
Y: Akte_Status
Z: Akte_NIK
AA: Akte_Nama
AB: Akte_TTL
AC: Akte_Nama_Ibu
AD: Akte_NIK_Ibu
AE: Akte_Drive_URL
AF: Akte_Upload_Date

─── Cross-Validation & Status ───
AG: Cross_Validation_Status (match, mismatch, incomplete, pending)
AH: Mismatch_Details (JSON: {field: "Nama", ktp: "BUDI", kk: "BUDI SANTO"})
AI: Overall_Status (pending_incomplete, pending_mismatch, pending_review, approved, rejected, manual_verification)
AJ: Admin_Notes (untuk catatan admin)
AK: Last_Modified
AL: Last_Modified_By
```

**Example Row:**

```
ID: STU-001
Email: budi_santo_3276012345678901@sekolah.local
Password_Hash: $2a$10$...
Nama_Lengkap: BUDI SANTO
NIK: 3276012345678901
Kelas: 10A
Tahun_Akademik: 2024/2025
Nama_Sekolah: SMA NEGERI 1

KTP_Status: approved
KTP_NIK: 3276012345678901
KTP_Nama: BUDI SANTO
KTP_TTL: Surabaya,12-01-2008
...
Overall_Status: pending_incomplete (belum upload Akte)
Last_Modified: 2024-01-15 10:30:00
```

### Sheet 2: "Operators" (Admin Users)

**Columns:**

```
A: ID (OP-001)
B: Email
C: Username
D: Password_Hash
E: Role (admin, operator - future)
F: Created_Date
G: Last_Login
H: Last_Modified
```

**Initial Data:**

```
ID: OP-001
Email: admin@sekolah.local
Username: admin
Password_Hash: $2a$10$[bcrypt hash of '123456']
Role: admin
Created_Date: [auto]
Last_Login: [null]
```

### Sheet 3: "Settings" (Admin Configuration)

**Columns:**

```
A: Setting_Name
B: Setting_Value
```

**Data:**

```
Nama_Sekolah: SMA NEGERI 1
Tahun_Akademik_Active: 2024/2025
School_Code: SMN001
Available_Classes: 10A,10B,10C,11A,11B,11C,12A,12B,12C
Maintenance_Mode: false
Password_Change_Required: false
```

### Sheet 4: "Logs" (Activity Tracking)

**Columns:**

```
A: Timestamp
B: User_Email
C: User_Role
D: Action (login, upload_ktp, upload_kk, upload_akte, approve, reject, verify)
E: Student_ID
F: Document_Type
G: Status_Change
H: Details
I: IP_Address
```

### Sheet 5: "Mismatch_Report" (Cross-Validation Tracking)

**Columns:**

```
A: ID (MIS-001)
B: Student_ID
C: Field_Name (Nama, NIK, TTL)
D: Document_1 (KTP)
E: Document_2 (KK)
F: Document_3 (Akte)
G: Resolved (true/false)
H: Resolved_Date
I: Resolved_By (admin email)
J: Created_Date
```

---

## GOOGLE DRIVE SETUP

### Folder Structure

```
SchoolDocuments/
├── SMA_NEGERI_1/                          [Folder: School Name]
│   ├── 2024_2025/                         [Folder: Academic Year]
│   │   ├── 10A/                           [Folder: Class]
│   │   │   ├── KTP_BUDI_SANTO.jpg
│   │   │   ├── KK_BUDI_SANTO.jpg
│   │   │   ├── Akte_BUDI_SANTO.jpg
│   │   │   ├── KTP_AHMAD_WIJAYA.jpg
│   │   │   └── ...
│   │   ├── 10B/
│   │   ├── 11A/
│   │   └── ...
│   └── 2025_2026/
│       └── ...
```

### Setup Instructions

**1. Create Google Drive Project:**

```bash
# Go to Google Cloud Console
# https://console.cloud.google.com/

# Create new project
# Project name: ocr-sekolah
```

**2. Enable APIs:**

- Google Sheets API
- Google Drive API
- Google Auth API

**3. Create Service Account:**

```
IAM & Admin → Service Accounts
Create Service Account
Name: ocr-sekolah-sa
Grant roles:
- Editor (for development)
- Or specific roles for production
```

**4. Create & Download Key:**

```
Service Account → Keys → Add Key → JSON
Save as: service-account-key.json
```

**5. Share Sheets & Drive Folders:**

```
Right-click Google Sheet → Share
Add service account email: ocr-sekolah-sa@...iam.gserviceaccount.com
Role: Editor

Same for Google Drive folder
```

**6. Get IDs:**

```
Google Sheets URL:
https://docs.google.com/spreadsheets/d/[SHEET_ID]/...
VITE_GOOGLE_SHEETS_ID = [SHEET_ID]

Google Drive Folder URL:
https://drive.google.com/drive/folders/[FOLDER_ID]
VITE_GOOGLE_DRIVE_FOLDER_ID = [FOLDER_ID]
```

---

## ENVIRONMENT VARIABLES

Create `.env.local`:

```env
# Google APIs
VITE_GOOGLE_SHEETS_ID=your_google_sheet_id_here
VITE_GOOGLE_DRIVE_FOLDER_ID=your_drive_folder_id_here
VITE_GOOGLE_API_KEY=your_api_key_here

# Service Account (backend only)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY=path_to_json_key_file

# JWT & Security
VITE_JWT_SECRET=your_jwt_secret_key_min_32_chars_here
VITE_JWT_EXPIRY=7d

# Admin Credentials
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD_HASH=$2a$10$... (bcrypt hash of 123456)

# App Config
VITE_APP_NAME=OCR Sekolah
VITE_APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000

# API Keys
VITE_RECAPTCHA_SITE_KEY=optional_for_future

# Image Compression
VITE_IMAGE_QUALITY=75
VITE_IMAGE_MAX_SIZE=500000 (bytes, ~500KB)

# Vercel
VERCEL_ENV=development
```

---

## AUTHENTICATION SYSTEM

### Auth Flow Architecture

```
┌─────────────────────────────────────────┐
│         LOGIN REQUEST                   │
│  (email/password)                       │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│  /api/auth/login (Serverless Function)  │
│  ├─ Query Sheets (Students or Operators)│
│  ├─ Compare password hash with bcrypt   │
│  ├─ If valid: Generate JWT token       │
│  └─ Return: {token, user, role}        │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│  Frontend: Store token in localStorage │
│  Set Authorization header for API calls │
│  Redirect to appropriate dashboard      │
└─────────────────────────────────────────┘
```

### Student Credentials Generation

**Backend Script** (run once at setup):

```javascript
// scripts/generate-student-creds.js

const { GoogleSpreadsheet } = require('google-spreadsheet');
const bcrypt = require('bcryptjs');

async function generateCredentials() {
  // Load student list from Sheets
  // Generate credentials:
  // Email: firstname_lastname_nik@sekolah.local
  // Password: random 8-char (first time only, must change)
  // Password_Hash: bcrypt(password)
  
  // Update Sheets with hash
}

// Run: node scripts/generate-student-creds.js
```

**Frontend: useAuth Hook**

```javascript
// src/hooks/useAuth.js

import { create } from 'zustand';
import axios from 'axios';

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  
  login: async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });
      
      const { token, user } = response.data;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({
        token,
        user,
        isAuthenticated: true
      });
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed'
      };
    }
  },
  
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    set({
      user: null,
      token: null,
      isAuthenticated: false
    });
  },
  
  checkAuth: () => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      set({
        token,
        user: JSON.parse(user),
        isAuthenticated: true
      });
    }
  }
}));

export default useAuthStore;
```

---

## REACT COMPONENTS

### 1. LoginPage.jsx

```javascript
// src/components/Auth/LoginPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../hooks/useAuth';
import LoginForm from './LoginForm';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.error);
    } else {
      navigate('/dashboard');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            📋 OCR Sekolah
          </h1>
          <p className="text-gray-600">
            Sistem Scan Dokumen Digital
          </p>
        </div>

        {/* Info Alert */}
        {showInfo && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-semibold text-blue-900">Cara Login:</p>
            </div>
            <ul className="text-sm text-blue-800 space-y-1 ml-7">
              <li>• <strong>Siswa:</strong> Email dari sekolah + password awal diberikan guru</li>
              <li>• <strong>Admin:</strong> admin / 123456</li>
            </ul>
            <button
              onClick={() => setShowInfo(false)}
              className="text-xs text-blue-600 mt-2 underline"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email / Username
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email atau username"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? '⏳ Memproses...' : '✓ Login'}
          </button>
        </form>

        {/* Demo Info */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          <p className="font-semibold mb-1">📝 Informasi Testing:</p>
          <p>Hubungi admin sekolah untuk mendapatkan email dan password pertama Anda.</p>
        </div>
      </div>
    </div>
  );
}
```

### 2. CameraScanner.jsx (Simplified)

```javascript
// src/components/Scanner/CameraScanner.jsx

import React, { useRef, useState, useEffect } from 'react';
import { createWorker } from 'tesseract.js';
import { AlertCircle, Camera, Upload, RefreshCw } from 'lucide-react';
import { validateReadability } from '../../utils/validation';
import { extractFields } from '../../utils/patterns';

export default function CameraScanner({ 
  docType, 
  onCapture, 
  onCancel,
  studentName 
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const workerRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [validationStatus, setValidationStatus] = useState(null);

  // Initialize Tesseract
  useEffect(() => {
    const initWorker = async () => {
      workerRef.current = await createWorker('ind');
    };
    initWorker();
    
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment'
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setError('');
      }
    } catch (err) {
      setError(`Akses kamera ditolak: ${err.message}`);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  const captureFrame = async () => {
    if (!videoRef.current) return;
    
    setIsProcessing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(async (blob) => {
      await processImage(blob);
    }, 'image/jpeg', 0.9);
  };

  const processImage = async (imageFile) => {
    try {
      setIsProcessing(true);
      setError('');

      // OCR
      const { data: { text, confidence: ocrConfidence } } = 
        await workerRef.current.recognize(imageFile);

      setConfidence(Math.round(ocrConfidence));

      // Validate readability
      const readabilityScore = validateReadability(text);
      if (readabilityScore < 60) {
        setValidationStatus({
          status: 'rejected',
          message: `Foto tidak terbaca jelas (Readability: ${readabilityScore}%). Silakan ambil ulang.`,
          score: readabilityScore
        });
        setIsProcessing(false);
        return;
      }

      // Extract fields
      const fields = extractFields(text, docType);
      
      // Validate extracted fields
      const validation = validateExtractedFields(fields, docType);
      
      if (!validation.valid) {
        setValidationStatus({
          status: 'rejected',
          message: 'Data tidak lengkap. ' + validation.errors.join('. '),
          missingFields: validation.missingFields
        });
        setIsProcessing(false);
        return;
      }

      setValidationStatus({
        status: 'approved',
        message: 'Data berhasil diekstrak dengan benar',
        score: readabilityScore
      });

      // Pass to parent
      onCapture({
        data: fields,
        ocrText: text,
        confidence: ocrConfidence,
        image: canvas.toDataURL('image/jpeg'),
        studentName
      });

    } catch (err) {
      setError(`Error OCR: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      setError('Format file tidak didukung. Gunakan JPG, PNG, atau PDF.');
      return;
    }

    setIsProcessing(true);
    
    if (file.type === 'application/pdf') {
      setError('PDF processing masih dalam pengembangan. Gunakan JPG/PNG untuk sekarang.');
      setIsProcessing(false);
      return;
    }

    await processImage(file);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        📸 Scan {docType.toUpperCase()} - {studentName}
      </h2>

      {/* Camera Preview */}
      {cameraActive && (
        <div className="mb-6 relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full border-4 border-blue-500 rounded-lg bg-black"
          />
          <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-bold">
            OCR: {confidence}%
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        className="hidden"
      />

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-800 flex gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Validation Status */}
      {validationStatus && (
        <div className={`mb-4 p-4 rounded-lg border-l-4 ${
          validationStatus.status === 'approved'
            ? 'bg-green-50 border-green-500'
            : 'bg-red-50 border-red-500'
        }`}>
          <p className={validationStatus.status === 'approved' ? 'text-green-800' : 'text-red-800'}>
            {validationStatus.status === 'approved' ? '✅' : '❌'} {validationStatus.message}
          </p>
          {validationStatus.score && (
            <p className="text-sm mt-1 opacity-75">
              Readability Score: {validationStatus.score}%
            </p>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {!cameraActive ? (
          <button
            onClick={startCamera}
            className="flex-1 min-w-[200px] py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Buka Kamera
          </button>
        ) : (
          <>
            <button
              onClick={captureFrame}
              disabled={isProcessing}
              className="flex-1 min-w-[200px] py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? '⏳ Memproses...' : <>
                <Camera className="w-5 h-5" />
                Ambil Foto
              </>}
            </button>
            <button
              onClick={stopCamera}
              className="px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700"
            >
              ✕
            </button>
          </>
        )}
      </div>

      {/* File Upload Alternative */}
      <div className="border-t pt-4">
        <label className="block mb-2 text-sm font-semibold text-gray-700">
          Atau upload gambar yang sudah ada:
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          onChange={handleFileUpload}
          disabled={isProcessing}
          className="w-full"
        />
      </div>

      {/* Cancel Button */}
      <div className="mt-6">
        <button
          onClick={onCancel}
          className="w-full py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
        >
          Batal
        </button>
      </div>
    </div>
  );
}

function validateExtractedFields(fields, docType) {
  const required = ['nik', 'nama', 'tempatLahir', 'tanggalLahir'];
  const errors = [];
  const missingFields = [];

  for (const fieldName of required) {
    const field = fields[fieldName];
    if (!field) {
      missingFields.push(fieldName);
      errors.push(`Field ${fieldName} tidak ditemukan`);
      continue;
    }

    if (!field.isValid) {
      errors.push(`Field ${fieldName} format tidak valid`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    missingFields
  };
}
```

### 3. DataPreview.jsx

```javascript
// src/components/Preview/DataPreview.jsx

import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Edit2 } from 'lucide-react';

export default function DataPreview({ 
  data, 
  docType, 
  onApprove, 
  onEdit, 
  onCancel,
  studentName 
}) {
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!agreed) {
      alert('Silakan setujui bahwa data sudah benar');
      return;
    }

    setIsSubmitting(true);
    try {
      await onApprove();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format field display
  const displayFields = Object.entries(data).reduce((acc, [key, value]) => {
    if (value?.formatted) {
      acc[key] = {
        label: formatLabel(key),
        value: value.formatted,
        isValid: value.isValid
      };
    }
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      
      <h2 className="text-2xl font-bold mb-2 text-gray-800">
        ✓ Preview Data - {docType.toUpperCase()}
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Periksa kembali data yang sudah diekstrak. Pastikan semua data benar sebelum submit.
      </p>

      {/* Data Display */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        {Object.entries(displayFields).map(([key, field]) => (
          <div key={key} className="flex justify-between items-start py-3 border-b border-gray-200 last:border-b-0">
            <div>
              <label className="font-semibold text-gray-700">{field.label}</label>
              {!field.isValid && (
                <div className="flex items-center gap-1 mt-1 text-yellow-600 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  Format mungkin perlu dicek manual
                </div>
              )}
            </div>
            <div className="text-right">
              <p className={`text-sm font-mono ${field.isValid ? 'text-gray-800' : 'text-yellow-700'}`}>
                {field.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Agreement Checkbox */}
      <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-5 h-5 mt-1 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-800">
            <strong>Saya menyatakan bahwa</strong> data yang sudah diekstrak dari dokumen adalah benar dan sesuai dengan dokumen asli. Saya memahami bahwa data yang tidak sesuai akan ditolak dan perlu verifikasi manual.
          </span>
        </label>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={!agreed || isSubmitting}
          className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          {isSubmitting ? 'Mengirim...' : 'Submit Data'}
        </button>

        <button
          onClick={onEdit}
          className="px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 flex items-center justify-center gap-2"
        >
          <Edit2 className="w-5 h-5" />
          Edit
        </button>

        <button
          onClick={onCancel}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
        >
          Batal
        </button>
      </div>
    </div>
  );
}

function formatLabel(key) {
  const labels = {
    nik: 'NIK',
    nama: 'Nama Lengkap',
    tempatLahir: 'Tempat Lahir',
    tanggalLahir: 'Tanggal Lahir',
    jenisKelamin: 'Jenis Kelamin',
    agama: 'Agama',
    jalan: 'Jalan',
    rtRw: 'RT/RW',
    kelurahan: 'Kelurahan/Desa',
    kecamatan: 'Kecamatan',
    kabupaten: 'Kabupaten/Kota',
    provinsi: 'Provinsi',
    golonganDarah: 'Golongan Darah',
    statusPerkawinan: 'Status Perkawinan',
    pekerjaan: 'Pekerjaan',
    berlakuHingga: 'Berlaku Hingga'
  };
  return labels[key] || key.replace(/([A-Z])/g, ' $1').trim();
}
```

### 4. StudentDashboard.jsx (Status View)

```javascript
// src/components/Dashboard/StudentDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, XCircle, AlertCircle, Plus } from 'lucide-react';
import useAuthStore from '../../hooks/useAuth';
import axios from 'axios';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('/api/sheets/get-student-data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudentData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 border-green-200';
      case 'rejected':
        return 'bg-red-50 border-red-200';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Halo, {studentData?.nama_lengkap}! 👋
            </h1>
            <p className="text-sm text-gray-600">
              Kelas {studentData?.kelas} • Tahun {studentData?.tahun_akademik}
            </p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Documents Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {['KTP', 'KK', 'Akte'].map((docType) => {
            const docKey = docType.toLowerCase();
            const status = studentData?.[`${docKey}_status`] || 'incomplete';
            const uploadDate = studentData?.[`${docKey}_upload_date`];

            return (
              <div
                key={docType}
                className={`border-2 rounded-lg p-6 ${getStatusColor(status)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{docType}</h3>
                    <p className="text-xs text-gray-600 mt-1">
                      {status === 'approved' && 'Diterima'}
                      {status === 'rejected' && 'Ditolak'}
                      {status === 'pending' && 'Menunggu Verifikasi'}
                      {status === 'incomplete' && 'Belum Diupload'}
                    </p>
                  </div>
                  {getStatusIcon(status)}
                </div>

                {uploadDate && (
                  <p className="text-xs text-gray-600 mb-4">
                    Upload: {new Date(uploadDate).toLocaleDateString('id-ID')}
                  </p>
                )}

                {status === 'incomplete' && (
                  <button
                    onClick={() => navigate('/scanner', { state: { docType } })}
                    className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Upload
                  </button>
                )}

                {status === 'rejected' && (
                  <button
                    onClick={() => navigate('/scanner', { state: { docType } })}
                    className="w-full py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700"
                  >
                    Upload Ulang
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Overall Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Status Keseluruhan
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                studentData?.overall_status === 'approved' ? 'bg-green-600' :
                studentData?.overall_status === 'rejected' ? 'bg-red-600' :
                'bg-yellow-600'
              }`}></div>
              <div>
                <p className="font-semibold text-gray-800">
                  {studentData?.overall_status === 'approved' && '✓ Data Diterima'}
                  {studentData?.overall_status === 'rejected' && '✕ Data Ditolak'}
                  {studentData?.overall_status?.includes('pending') && '⏳ Menunggu Verifikasi'}
                </p>
                {studentData?.admin_notes && (
                  <p className="text-sm text-gray-600 mt-1">
                    Catatan: {studentData.admin_notes}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## VERCEL API ROUTES

### 1. /api/auth/login.js

```javascript
// api/auth/login.js

import { GoogleSpreadsheet } from 'google-spreadsheet';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const SHEET_ID = process.env.VITE_GOOGLE_SHEETS_ID;
const JWT_SECRET = process.env.VITE_JWT_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password harus diisi' });
    }

    // Initialize Google Sheets
    const doc = new GoogleSpreadsheet(SHEET_ID);
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n')
    });
    await doc.loadInfo();

    // Check if admin login
    if (email === 'admin' || email === 'admin@sekolah.local') {
      const isValidPassword = await bcrypt.compare(
        password,
        process.env.VITE_ADMIN_PASSWORD_HASH
      );

      if (!isValidPassword) {
        return res.status(401).json({ message: 'Email atau password salah' });
      }

      const token = jwt.sign(
        {
          id: 'admin',
          email: 'admin@sekolah.local',
          role: 'admin'
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        token,
        user: {
          id: 'admin',
          email: 'admin@sekolah.local',
          role: 'admin'
        }
      });
    }

    // Student login - search in Students sheet
    const studentsSheet = doc.sheetsByTitle['Students'];
    const rows = await studentsSheet.getRows();

    const student = rows.find(row => 
      row.email === email || row.email?.toLowerCase() === email.toLowerCase()
    );

    if (!student) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const passwordMatch = await bcrypt.compare(password, student.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const token = jwt.sign(
      {
        id: student.id,
        email: student.email,
        role: 'student',
        niK: student.nik,
        nama: student.nama_lengkap
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      token,
      user: {
        id: student.id,
        email: student.email,
        role: 'student',
        nik: student.nik,
        nama_lengkap: student.nama_lengkap,
        kelas: student.kelas
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}
```

### 2. /api/sheets/check-duplicate.js

```javascript
// api/sheets/check-duplicate.js

import { GoogleSpreadsheet } from 'google-spreadsheet';
import jwt from 'jsonwebtoken';

const SHEET_ID = process.env.VITE_GOOGLE_SHEETS_ID;
const JWT_SECRET = process.env.VITE_JWT_SECRET;

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Token invalid' });
    }

    const { nik, docType } = req.body;

    if (!nik) {
      return res.status(400).json({ message: 'NIK harus diisi' });
    }

    // Initialize Google Sheets
    const doc = new GoogleSpreadsheet(SHEET_ID);
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n')
    });
    await doc.loadInfo();

    const studentsSheet = doc.sheetsByTitle['Students'];
    const rows = await studentsSheet.getRows();

    const docKeyMap = {
      'KTP': 'ktp_nik',
      'KK': 'kk_nik',
      'Akte': 'akte_nik'
    };

    const nikColumn = docKeyMap[docType];

    // Check if this NIK already exists
    const existingRecord = rows.find(row => row[nikColumn] === nik);

    if (existingRecord) {
      return res.status(200).json({
        isDuplicate: true,
        message: `${docType} dengan NIK ini sudah ada. Jika ini siswa baru, hubungi admin.`,
        existingRecord: {
          id: existingRecord.id,
          nama: existingRecord.nama_lengkap,
          status: existingRecord[`${docType.toLowerCase()}_status`]
        }
      });
    }

    return res.status(200).json({
      isDuplicate: false,
      message: 'NIK belum ada di sistem'
    });

  } catch (error) {
    console.error('Check duplicate error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}
```

### 3. /api/sheets/upload.js (Core Upload Function)

```javascript
// api/sheets/upload.js

import { GoogleSpreadsheet } from 'google-spreadsheet';
import jwt from 'jsonwebtoken';

const SHEET_ID = process.env.VITE_GOOGLE_SHEETS_ID;
const JWT_SECRET = process.env.VITE_JWT_SECRET;

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'student') {
      return res.status(401).json({ message: 'Only students can upload' });
    }

    const {
      docType,
      extractedData,
      driveUrl,
      studentId
    } = req.body;

    // Validate input
    if (!docType || !extractedData || !driveUrl) {
      return res.status(400).json({ message: 'Data tidak lengkap' });
    }

    // Initialize Google Sheets
    const doc = new GoogleSpreadsheet(SHEET_ID);
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n')
    });
    await doc.loadInfo();

    const studentsSheet = doc.sheetsByTitle['Students'];
    const rows = await studentsSheet.getRows();

    // Find student row
    const studentRow = rows.find(row => row.id === studentId || row.email === decoded.email);

    if (!studentRow) {
      return res.status(404).json({ message: 'Student data not found' });
    }

    // Update student row with document data
    const docTypeLower = docType.toLowerCase();
    const timestamp = new Date().toISOString();

    studentRow[`${docTypeLower}_status`] = 'pending';
    studentRow[`${docTypeLower}_nik`] = extractedData.nik?.formatted;
    studentRow[`${docTypeLower}_nama`] = extractedData.nama?.formatted;
    studentRow[`${docTypeLower}_ttl`] = extractedData.tempatLahir?.formatted + ',' + extractedData.tanggalLahir?.formatted;
    studentRow[`${docTypeLower}_alamat`] = extractedData.alamat?.formatted;
    studentRow[`${docTypeLower}_drive_url`] = driveUrl;
    studentRow[`${docTypeLower}_upload_date`] = timestamp;
    studentRow.last_modified = timestamp;
    studentRow.last_modified_by = decoded.email;

    await studentRow.save();

    // Log the action
    const logsSheet = doc.sheetsByTitle['Logs'];
    await logsSheet.addRows([
      {
        timestamp,
        user_email: decoded.email,
        user_role: 'student',
        action: `upload_${docTypeLower}`,
        student_id: studentId,
        document_type: docType,
        status_change: 'pending',
        details: `Uploaded ${docType}`
      }
    ]);

    return res.status(200).json({
      message: `${docType} berhasil diupload. Menunggu verifikasi admin.`,
      status: 'pending'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}
```

### 4. /api/drive/upload.js (Image to Google Drive)

```javascript
// api/drive/upload.js

import { google } from 'googleapis';
import imageCompressor from 'image-compressor';

const drive = google.drive('v3');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const {
      imageBase64,
      fileName,
      mimeType = 'image/jpeg',
      folderPath // "SMA_NEGERI_1/2024_2025/10A"
    } = req.body;

    if (!imageBase64 || !fileName || !folderPath) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Authenticate with service account
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n')
      },
      scopes: ['https://www.googleapis.com/auth/drive']
    });

    const driveService = google.drive({
      version: 'v3',
      auth
    });

    // Convert base64 to Buffer
    const imageBuffer = Buffer.from(imageBase64.split(',')[1], 'base64');

    // Create file metadata
    const fileMetadata = {
      name: fileName,
      mimeType: mimeType,
      parents: [process.env.VITE_GOOGLE_DRIVE_FOLDER_ID]
    };

    // Upload file
    const response = await driveService.files.create({
      resource: fileMetadata,
      media: {
        mimeType: mimeType,
        body: imageBuffer
      },
      fields: 'id, webViewLink'
    });

    return res.status(200).json({
      success: true,
      fileId: response.data.id,
      webViewLink: response.data.webViewLink,
      message: 'File berhasil diupload ke Google Drive'
    });

  } catch (error) {
    console.error('Drive upload error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}
```

### 5. /api/validate/cross-validate.js (Cross-Validation)

```javascript
// api/validate/cross-validate.js

import { GoogleSpreadsheet } from 'google-spreadsheet';
import jwt from 'jsonwebtoken';

const SHEET_ID = process.env.VITE_GOOGLE_SHEETS_ID;
const JWT_SECRET = process.env.VITE_JWT_SECRET;

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return res.status(401).json({ message: 'Admin only' });
    }

    const { studentId } = req.query;

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID required' });
    }

    // Initialize Google Sheets
    const doc = new GoogleSpreadsheet(SHEET_ID);
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n')
    });
    await doc.loadInfo();

    const studentsSheet = doc.sheetsByTitle['Students'];
    const rows = await studentsSheet.getRows();
    const studentRow = rows.find(row => row.id === studentId);

    if (!studentRow) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get data from each document
    const ktpData = {
      nik: studentRow.ktp_nik,
      nama: studentRow.ktp_nama,
      ttl: studentRow.ktp_ttl,
      status: studentRow.ktp_status
    };

    const kkData = {
      nik: studentRow.kk_nik,
      nama: studentRow.kk_nama,
      ttl: studentRow.kk_ttl,
      status: studentRow.kk_status
    };

    const akteData = {
      nik: studentRow.akte_nik,
      nama: studentRow.akte_nama,
      ttl: studentRow.akte_ttl,
      status: studentRow.akte_status
    };

    // Perform cross-validation
    const mismatches = [];
    const validation = {
      nik_match: ktpData.nik === kkData.nik && kkData.nik === akteData.nik,
      nama_match: ktpData.nama === kkData.nama && kkData.nama === akteData.nama,
      ttl_match: ktpData.ttl === kkData.ttl && kkData.ttl === akteData.ttl
    };

    if (!validation.nik_match) {
      mismatches.push({
        field: 'NIK',
        ktp: ktpData.nik,
        kk: kkData.nik,
        akte: akteData.nik
      });
    }

    if (!validation.nama_match) {
      mismatches.push({
        field: 'Nama',
        ktp: ktpData.nama,
        kk: kkData.nama,
        akte: akteData.nama
      });
    }

    if (!validation.ttl_match) {
      mismatches.push({
        field: 'TTL',
        ktp: ktpData.ttl,
        kk: kkData.ttl,
        akte: akteData.ttl
      });
    }

    // Determine overall status
    let overallStatus = 'pending_review';
    
    if (!ktpData.status || !kkData.status || !akteData.status) {
      overallStatus = 'pending_incomplete';
    } else if (mismatches.length > 0) {
      overallStatus = 'pending_mismatch';
    }

    return res.status(200).json({
      studentId,
      validation,
      mismatches,
      overallStatus,
      ktpData,
      kkData,
      akteData,
      isValid: mismatches.length === 0
    });

  } catch (error) {
    console.error('Cross-validation error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}
```

### 6. /api/admin/get-pending.js (Admin Dashboard)

```javascript
// api/admin/get-pending.js

import { GoogleSpreadsheet } from 'google-spreadsheet';
import jwt from 'jsonwebtoken';

const SHEET_ID = process.env.VITE_GOOGLE_SHEETS_ID;
const JWT_SECRET = process.env.VITE_JWT_SECRET;

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return res.status(401).json({ message: 'Admin only' });
    }

    const { filter = 'all' } = req.query;

    // Initialize Google Sheets
    const doc = new GoogleSpreadsheet(SHEET_ID);
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n')
    });
    await doc.loadInfo();

    const studentsSheet = doc.sheetsByTitle['Students'];
    const rows = await studentsSheet.getRows();

    // Filter based on status
    let filteredRows = rows;

    if (filter === 'pending') {
      filteredRows = rows.filter(row => 
        row.overall_status?.includes('pending')
      );
    } else if (filter === 'mismatch') {
      filteredRows = rows.filter(row => 
        row.overall_status === 'pending_mismatch'
      );
    } else if (filter === 'incomplete') {
      filteredRows = rows.filter(row => 
        row.overall_status === 'pending_incomplete'
      );
    } else if (filter === 'approved') {
      filteredRows = rows.filter(row => 
        row.overall_status === 'approved'
      );
    } else if (filter === 'rejected') {
      filteredRows = rows.filter(row => 
        row.overall_status === 'rejected'
      );
    }

    // Format response
    const data = filteredRows.map(row => ({
      id: row.id,
      nama: row.nama_lengkap,
      nik: row.nik,
      kelas: row.kelas,
      tahun: row.tahun_akademik,
      email: row.email,
      overall_status: row.overall_status,
      ktp_status: row.ktp_status,
      kk_status: row.kk_status,
      akte_status: row.akte_status,
      mismatch_details: row.mismatch_details ? JSON.parse(row.mismatch_details) : null,
      last_modified: row.last_modified,
      admin_notes: row.admin_notes
    }));

    // Get summary
    const summary = {
      total: rows.length,
      pending: rows.filter(r => r.overall_status?.includes('pending')).length,
      mismatch: rows.filter(r => r.overall_status === 'pending_mismatch').length,
      incomplete: rows.filter(r => r.overall_status === 'pending_incomplete').length,
      approved: rows.filter(r => r.overall_status === 'approved').length,
      rejected: rows.filter(r => r.overall_status === 'rejected').length
    };

    return res.status(200).json({
      data,
      summary,
      filter
    });

  } catch (error) {
    console.error('Get pending error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}
```

---

## OCR & FIELD EXTRACTION

### patterns.js (Regex Patterns)

```javascript
// src/utils/patterns.js

export const REGEX_PATTERNS = {
  ktp: {
    nik: {
      pattern: /(?:NIK\s*:?\s*)?(\d{4}\s?\d{4}\s?\d{4}\s?\d{4}|\d{16})/i,
      format: (val) => val.replace(/\s/g, ''),
      validate: (val) => val.length === 16 && /^\d{16}$/.test(val)
    },
    nama: {
      pattern: /(?:NAMA\s*:?\s*)([A-Z\s]{3,50}?)(?=\n|TEMPAT|JENIS|$)/i,
      format: (val) => val.trim(),
      validate: (val) => /^[A-Z\s]{3,50}$/.test(val)
    },
    tempatLahir: {
      pattern: /(?:TEMPAT.*?LAHIR\s*:?\s*)([A-Z\s]+)(?:\s*,|\/)/i,
      format: (val) => val.trim().toUpperCase(),
      validate: (val) => /^[A-Z\s]{3,30}$/.test(val)
    },
    tanggalLahir: {
      pattern: /(?:LAHIR\s*:.*?)(\d{1,2}[\-\/]\d{1,2}[\-\/]\d{4})/,
      format: (val) => {
        const match = val.match(/(\d{1,2})[\-\/](\d{1,2})[\-\/](\d{4})/);
        if (!match) return val;
        const [_, d, m, y] = match;
        return `${String(d).padStart(2,'0')}-${String(m).padStart(2,'0')}-${y}`;
      },
      validate: (val) => {
        const match = val.match(/(\d{2})-(\d{2})-(\d{4})/);
        if (!match) return false;
        const [_, d, m, y] = match;
        const day = parseInt(d);
        const month = parseInt(m);
        const year = parseInt(y);
        return day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= new Date().getFullYear();
      }
    },
    jenisKelamin: {
      pattern: /(?:JENIS\s+KELAMIN\s*:?\s*)(LAKI-LAKI|PEREMPUAN|L|P)/i,
      format: (val) => {
        const normalized = val.toUpperCase();
        if (normalized === 'L') return 'LAKI-LAKI';
        if (normalized === 'P') return 'PEREMPUAN';
        return normalized;
      },
      validate: (val) => /^(LAKI-LAKI|PEREMPUAN)$/.test(val)
    },
    agama: {
      pattern: /(?:AGAMA\s*:?\s*)(ISLAM|KRISTEN|KATOLIK|HINDU|BUDDHA|KONGHUCU)/i,
      format: (val) => val.toUpperCase(),
      validate: (val) => /^(ISLAM|KRISTEN|KATOLIK|HINDU|BUDDHA|KONGHUCU)$/.test(val)
    },
    alamat: {
      pattern: /(?:ALAMAT|JL\.?)\s*:?\s*(?:JL\.?|JALAN)?\s*(.+?)(?=RT|RW|KEL|DESA|$)/i,
      format: (val) => val.trim().toUpperCase(),
      validate: (val) => val.length > 0
    },
    rtRw: {
      pattern: /(?:RT\/RW\s*:?\s*)(\d{2,4})[\s\/\\](\d{2,4})/,
      format: (val) => {
        const match = val.match(/(\d{2,4})[\s\/\\](\d{2,4})/);
        if (!match) return val;
        return `${String(match[1]).padStart(4,'0')}/${String(match[2]).padStart(4,'0')}`;
      },
      validate: (val) => /^\d{4}\/\d{4}$/.test(val)
    },
    kelurahan: {
      pattern: /(?:KEL\.?|KELURAHAN|DESA)\s*:?\s*([A-Z\s]{3,50}?)(?=KECAMATAN|$)/i,
      format: (val) => val.trim().toUpperCase(),
      validate: (val) => /^[A-Z\s]{3,50}$/.test(val)
    },
    kecamatan: {
      pattern: /(?:KECAMATAN|KEC\.?)\s*:?\s*([A-Z\s]{3,50}?)(?=KAB|KABUPATEN|KOTA|PROVINSI|$)/i,
      format: (val) => val.trim().toUpperCase(),
      validate: (val) => /^[A-Z\s]{3,50}$/.test(val)
    },
    kabupaten: {
      pattern: /(?:KAB(?:UPATEN)?|KOTA)\.?\s*:?\s*([A-Z\s]{3,50}?)(?=PROVINSI|$)/i,
      format: (val) => val.trim().toUpperCase(),
      validate: (val) => /^[A-Z\s]{3,50}$/.test(val)
    },
    provinsi: {
      pattern: /(?:PROVINSI)\s*:?\s*([A-Z\s]{3,50}?)(?=\n|$)/i,
      format: (val) => val.trim().toUpperCase(),
      validate: (val) => /^[A-Z\s]{3,50}$/.test(val)
    }
  },

  kk: {
    noKk: {
      pattern: /(?:NO\.?\s*KK|NOMOR\s+KARTU\s+KELUARGA)\s*:?\s*(\d{4}\s?\d{4}\s?\d{4}\s?\d{4}|\d{16})/i,
      format: (val) => val.replace(/\s/g, ''),
      validate: (val) => val.length === 16 && /^\d{16}$/.test(val)
    },
    nama: {
      pattern: /(?:NAMA\s*:?\s*)([A-Z\s]{3,50}?)(?=NIK|$)/i,
      format: (val) => val.trim().toUpperCase(),
      validate: (val) => /^[A-Z\s]{3,50}$/.test(val)
    },
    nik: {
      pattern: /(?:NIK\s*:?\s*)(\d{16})/i,
      format: (val) => val.replace(/\s/g, ''),
      validate: (val) => /^\d{16}$/.test(val)
    },
    ttl: {
      pattern: /(?:TEMPAT.*?LAHIR|LAHIR)\s*:?\s*([A-Z\s]+)(?:\s*,|\/)\s*(\d{1,2}[\-\/]\d{1,2}[\-\/]\d{4})/i,
      format: (val) => val.trim(),
      validate: (val) => val.length > 0
    }
  },

  akte: {
    nomorAkte: {
      pattern: /(?:NOMOR\s+(?:SURAT|AKTE)|NO\.?)\s*:?\s*([A-Z0-9\-\/]{5,30})/i,
      format: (val) => val.toUpperCase(),
      validate: (val) => /^[A-Z0-9\-\/]{5,30}$/.test(val)
    },
    nama: {
      pattern: /(?:NAMA\s+(?:BAYI|ANAK))\s*:?\s*([A-Z\s]{3,50}?)(?=TEMPAT|JENIS|$)/i,
      format: (val) => val.trim().toUpperCase(),
      validate: (val) => /^[A-Z\s]{3,50}$/.test(val)
    },
    tempatLahir: {
      pattern: /(?:TEMPAT\s+LAHIR)\s*:?\s*([A-Z\s]{3,30}?)(?=TANGGAL|,)/i,
      format: (val) => val.trim().toUpperCase(),
      validate: (val) => /^[A-Z\s]{3,30}$/.test(val)
    },
    tanggalLahir: {
      pattern: /(?:TANGGAL\s+LAHIR)\s*:?\s*(\d{1,2}[\s\-\/](?:JANUARI|FEBRUARI|MARET|APRIL|MEI|JUNI|JULI|AGUSTUS|SEPTEMBER|OKTOBER|NOVEMBER|DESEMBER)[\s\-\/]\d{4}|\d{1,2}[\-\/]\d{1,2}[\-\/]\d{4})/i,
      format: (val) => {
        const monthMap = {
          'JANUARI': '01', 'FEBRUARI': '02', 'MARET': '03', 'APRIL': '04',
          'MEI': '05', 'JUNI': '06', 'JULI': '07', 'AGUSTUS': '08',
          'SEPTEMBER': '09', 'OKTOBER': '10', 'NOVEMBER': '11', 'DESEMBER': '12'
        };
        
        const textMatch = val.match(/(\d{1,2})\s+([A-Z]+)\s+(\d{4})/i);
        if (textMatch) {
          const [_, day, month, year] = textMatch;
          const monthNum = monthMap[month.toUpperCase()];
          if (monthNum) return `${String(day).padStart(2,'0')}-${monthNum}-${year}`;
        }
        
        const numMatch = val.match(/(\d{1,2})[\-\/](\d{1,2})[\-\/](\d{4})/);
        if (numMatch) {
          const [_, d, m, y] = numMatch;
          return `${String(d).padStart(2,'0')}-${String(m).padStart(2,'0')}-${y}`;
        }
        
        return val;
      }
    },
    namaIbu: {
      pattern: /(?:NAMA\s+IBU|DARI\s+IBU)\s*:?\s*([A-Z\s]{3,50}?)(?=NIK|TANGGAL|$)/i,
      format: (val) => val.trim().toUpperCase(),
      validate: (val) => /^[A-Z\s]{3,50}$/.test(val)
    },
    nikIbu: {
      pattern: /(?:NIK\s+IBU|NIK\s*\/\s*NO\s+KTP\s+IBU)\s*:?\s*(\d{16})/i,
      format: (val) => val.replace(/\s/g, ''),
      validate: (val) => /^\d{16}$/.test(val)
    }
  }
};

export function extractFields(text, docType) {
  const patterns = REGEX_PATTERNS[docType];
  const result = {};

  if (!patterns) {
    console.error(`Unknown document type: ${docType}`);
    return result;
  }

  for (const [fieldName, fieldPattern] of Object.entries(patterns)) {
    const match = text.match(fieldPattern.pattern);
    if (match) {
      const rawValue = match[1] || match[0];
      result[fieldName] = {
        raw: rawValue,
        formatted: fieldPattern.format(rawValue),
        isValid: fieldPattern.validate(fieldPattern.format(rawValue))
      };
    }
  }

  return result;
}
```

---

## CROSS-VALIDATION LOGIC

```javascript
// src/utils/crossValidation.js

export function validateCrossDocuments(ktpData, kkData, akteData) {
  const mismatches = [];
  
  // Must match: NIK
  if (ktpData.nik?.formatted !== kkData.nik?.formatted) {
    mismatches.push({
      field: 'NIK',
      ktp: ktpData.nik?.formatted,
      kk: kkData.nik?.formatted,
      akte: null,
      severity: 'critical'
    });
  }

  if (ktpData.nik?.formatted !== akteData.nik?.formatted) {
    mismatches.push({
      field: 'NIK (KTP vs Akte)',
      ktp: ktpData.nik?.formatted,
      kk: null,
      akte: akteData.nik?.formatted,
      severity: 'critical'
    });
  }

  // Must match: Nama
  if (normalizeString(ktpData.nama?.formatted) !== normalizeString(kkData.nama?.formatted)) {
    mismatches.push({
      field: 'Nama (KTP vs KK)',
      ktp: ktpData.nama?.formatted,
      kk: kkData.nama?.formatted,
      akte: null,
      severity: 'critical'
    });
  }

  if (normalizeString(ktpData.nama?.formatted) !== normalizeString(akteData.nama?.formatted)) {
    mismatches.push({
      field: 'Nama (KTP vs Akte)',
      ktp: ktpData.nama?.formatted,
      kk: null,
      akte: akteData.nama?.formatted,
      severity: 'critical'
    });
  }

  // Must match: TTL
  if (ktpData.tanggalLahir?.formatted !== kkData.tanggalLahir?.formatted) {
    mismatches.push({
      field: 'TTL (KTP vs KK)',
      ktp: `${ktpData.tempatLahir?.formatted},${ktpData.tanggalLahir?.formatted}`,
      kk: `${kkData.tempatLahir?.formatted},${kkData.tanggalLahir?.formatted}`,
      akte: null,
      severity: 'critical'
    });
  }

  if (ktpData.tanggalLahir?.formatted !== akteData.tanggalLahir?.formatted) {
    mismatches.push({
      field: 'TTL (KTP vs Akte)',
      ktp: `${ktpData.tempatLahir?.formatted},${ktpData.tanggalLahir?.formatted}`,
      kk: null,
      akte: `${akteData.tempatLahir?.formatted},${akteData.tanggalLahir?.formatted}`,
      severity: 'critical'
    });
  }

  return {
    isValid: mismatches.length === 0,
    mismatches
  };
}

function normalizeString(str) {
  return str?.toUpperCase().trim().replace(/\s+/g, ' ') || '';
}
```

---

## IMAGE COMPRESSION

```javascript
// src/utils/imageCompress.js

import ImageCompressor from 'image-compressor';

export async function compressImage(file) {
  return new Promise((resolve, reject) => {
    new ImageCompressor(file, {
      quality: parseInt(process.env.VITE_IMAGE_QUALITY) || 75,
      maxWidth: 1920,
      maxHeight: 1080,
      mimeType: 'image/jpeg',
      convertSize: 500000, // ~500KB
      success(result) {
        resolve(result);
      },
      error(error) {
        reject(error);
      }
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
```

---

## ADMIN DASHBOARD

### AdminDashboard.jsx

```javascript
// src/components/AdminPanel/AdminDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Users, AlertCircle, CheckCircle, Clock, Settings } from 'lucide-react';
import useAuthStore from '../../hooks/useAuth';
import axios from 'axios';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`/api/admin/get-pending?filter=${filter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard Admin</h1>
            <p className="text-sm text-gray-600 mt-1">Kelola dan verifikasi data siswa</p>
          </div>
          <button onClick={logout} className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50">
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 font-semibold border-b-2 ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <BarChart3 className="w-5 h-5 inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-3 font-semibold border-b-2 ${
              activeTab === 'students'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <Users className="w-5 h-5 inline mr-2" />
            Data Siswa
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-3 font-semibold border-b-2 ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <Settings className="w-5 h-5 inline mr-2" />
            Pengaturan
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && data?.summary && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-6">Ringkasan Status Upload</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
              <StatCard label="Total Siswa" value={data.summary.total} color="bg-blue-100 text-blue-800" />
              <StatCard label="Pending" value={data.summary.pending} color="bg-yellow-100 text-yellow-800" icon={Clock} />
              <StatCard label="Mismatch" value={data.summary.mismatch} color="bg-orange-100 text-orange-800" icon={AlertCircle} />
              <StatCard label="Incomplete" value={data.summary.incomplete} color="bg-red-100 text-red-800" />
              <StatCard label="Approved" value={data.summary.approved} color="bg-green-100 text-green-800" icon={CheckCircle} />
              <StatCard label="Rejected" value={data.summary.rejected} color="bg-red-100 text-red-800" />
            </div>

            {/* Filter & Table */}
            <h3 className="text-lg font-bold text-gray-800 mb-4">Data Siswa Berdasarkan Status</h3>
            
            <div className="flex gap-2 mb-4">
              {['pending', 'mismatch', 'incomplete', 'approved', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-semibold capitalize ${
                    filter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Student Table */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nama</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">NIK</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Kelas</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">KTP</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">KK</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Akte</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data?.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-800 font-medium">{student.nama}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">{student.nik}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{student.kelas}</td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={student.ktp_status} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={student.kk_status} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={student.akte_status} />
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(student.overall_status)}`}>
                          {formatStatus(student.overall_status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => navigate(`/admin/student/${student.id}`)}
                          className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Pengaturan Aplikasi</h2>
            
            <div className="space-y-6">
              <SettingField label="Nama Sekolah" value="SMA NEGERI 1" />
              <SettingField label="Tahun Akademik" value="2024/2025" />
              <SettingField label="Kode Sekolah" value="SMN001" />
              
              <div className="pt-6 border-t">
                <h3 className="font-bold text-gray-800 mb-4">Ubah Password Admin</h3>
                <button onClick={() => navigate('/admin/change-password')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Ubah Password
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon: Icon }) {
  return (
    <div className={`${color} rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs opacity-75">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        {Icon && <Icon className="w-8 h-8 opacity-50" />}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    'approved': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'incomplete': 'bg-gray-100 text-gray-800'
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || colors.incomplete}`}>
      {status === 'incomplete' ? '—' : status?.slice(0, 3).toUpperCase()}
    </span>
  );
}

function SettingField({ label, value }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <input
        type="text"
        value={value}
        readOnly
        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
      />
    </div>
  );
}

function formatStatus(status) {
  const map = {
    'pending_incomplete': 'Incomplete',
    'pending_mismatch': 'Mismatch',
    'pending_review': 'Review',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'manual_verification': 'Manual Verify'
  };
  return map[status] || status;
}

function getStatusColor(status) {
  const colors = {
    'approved': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800',
    'pending_mismatch': 'bg-orange-100 text-orange-800',
    'pending_incomplete': 'bg-red-100 text-red-800',
    'pending_review': 'bg-yellow-100 text-yellow-800',
    'manual_verification': 'bg-blue-100 text-blue-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}
```

---

## VALIDATION

```javascript
// src/utils/validation.js

export function validateReadability(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const avgLineLength = lines.reduce((a, b) => a + b.length, 0) / lines.length || 0;
  
  let score = 0;
  
  if (lines.length > 5) score += 30;
  if (avgLineLength > 5 && avgLineLength < 100) score += 30;
  
  const keywords = ['NIK', 'NAMA', 'LAHIR', 'ALAMAT', 'JENIS', 'AGAMA'];
  const foundKeywords = keywords.filter(k => text.includes(k)).length;
  score += (foundKeywords / keywords.length) * 40;

  return Math.min(100, Math.round(score));
}
```

---

## DEPLOYMENT

### Deploy to Vercel

```bash
# 1. Push to GitHub
git add .
git commit -m "Initial commit: OCR scan app"
git push origin main

# 2. Deploy via Vercel CLI
vercel

# 3. Set environment variables
vercel env add VITE_GOOGLE_SHEETS_ID
vercel env add VITE_GOOGLE_DRIVE_FOLDER_ID
vercel env add VITE_JWT_SECRET
# ... (add all env vars)

# 4. Deploy
vercel --prod
```

### GitHub Actions (Optional - Auto Deploy)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

---

## TESTING CHECKLIST

- [ ] Student login dengan email/password
- [ ] Admin login dengan admin/123456
- [ ] Buka kamera dan ambil foto
- [ ] Upload file JPG/PNG
- [ ] OCR extract fields (KTP/KK/Akte)
- [ ] Readability validation
- [ ] Data preview dan edit
- [ ] Submit data ke Google Sheets
- [ ] Cek status di student dashboard
- [ ] Admin lihat pending list
- [ ] Cross-validation (match/mismatch)
- [ ] Reject submission
- [ ] Approve submission
- [ ] Image compress dan sync ke Google Drive
- [ ] Folder structure di Drive
- [ ] Change admin password
- [ ] Export data
- [ ] Mobile responsiveness
- [ ] Error handling

---

## END OF DOCUMENTATION

Dokumentasi lengkap sudah selesai. Semua komponen, API routes, patterns, dan flow sudah documented.

Next step:
1. Clone struktur folder
2. Install dependencies
3. Setup Google Sheets & Drive
4. Configure environment variables
5. Test locally
6. Deploy ke Vercel
