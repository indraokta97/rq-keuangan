# Kas Rumah Quran UGM

Aplikasi pencatatan keuangan (pemasukan/pengeluaran) untuk Rumah Quran UGM. Dibangun dengan Vite + React + TypeScript + Tailwind CSS v4, grafik Recharts, dan Postgres via Neon yang di-deploy gratis di Vercel. UI berbahasa Indonesia, ringan, dan responsif.

## Status

Selesai dibangun dan terpasang di `C:\laragon\www\rq-keuangan` (project React terpisah, tidak digabung ke `rq-app` Laravel).

## Fitur

- Catatan pemasukan & pengeluaran dengan kategori, tanggal, keterangan, dan **foto bukti** (kwitansi, otomatis dikompres jadi WebP lalu disimpan di **Vercel Blob**)
- Kelola kategori sendiri (warna + ikon pilihan)
- Dashboard: saldo kas, rekap bulan berjalan, grafik arus kas 6 bulan, donat pengeluaran per kategori, transaksi terbaru
- Laporan rekap bulanan/tahunan + ekspor ke file CSV (buka dengan Excel/Google Sheets)
- **Keamanan & akses**: pengunjung yang membuka aplikasi **hanya bisa melihat**; mengelola (tambah/ubah/hapus) butuh **masuk dengan kata sandi pengelola**
- **Tampilan pengunjung (read-only)**: tautan khusus `#/lihat` yang juga hanya bisa melihat, aman dibagikan ke pengurus, donatur, atau publik
- Backup & restore data lewat file JSON
- Pengaturan: nama organisasi, saldo awal, tahun mulai, catatan bulanan
- Dua mode penyimpanan **otomatis terdeteksi**:
  - `lokal` — localStorage browser, siap pakai tanpa server (untuk `npm run dev` / offline)
  - `postgres` — Neon Postgres lewat serverless functions Vercel (untuk deploy)
  - Foto bukti disimpan terpisah di **Vercel Blob**; kolom `bukti` pada transaksi hanya menyimpan URL-nya

## Teknologi

- **Vite 8** + **React 19** + **TypeScript**
- **Tailwind CSS v4** (`@tailwindcss/vite`), desain dengan warna khas Rumah Quran (hijau emerald + emas)
- **Recharts 3** untuk grafik, **lucide-react** untuk ikon
- **@neondatabase/serverless** + serverless functions Vercel di folder `api/`
- Routing hash tanpa library eksternal (`#/dashboard`, `#/lihat` untuk tampilan pengunjung)

## Menjalankan di lokal

```bash
npm install        # instal dependensi
npm run dev        # http://localhost:5173 (mode localStorage)
```

Perintah lain:

```bash
npm run build      # build produksi ke dist/
npm run preview    # pratinjau hasil build
npm run lint       # oxlint
```

Tanpa `DATABASE_URL`, aplikasi otomatis memakai **localStorage** jadi semua fitur jalan tanpa database.

## Struktur

```
api/                      serverless functions Vercel (Postgres/Neon)
  _lib/db.ts              koneksi Neon + buat tabel otomatis
  health.ts / data.ts     cek backend & ambil seluruh data
  transaksi.ts            CRUD transaksi
  upload.ts               unggah foto bukti ke Vercel Blob (butuh BLOB_READ_WRITE_TOKEN)
  kategori.ts             CRUD kategori
  pengaturan.ts           simpan pengaturan
  backup.ts               restore seluruh data (tempat muat data contoh)
src/
  lib/                    types, format, theme, presets, sample, analytics, backend, router, store, upload (konversi WebP)
  components/             ui, layout, charts, FormTransaksi, icons
  pages/                  Dashboard, Transaksi, Kategori, Laporan, Pengaturan
public/
  favicon.svg             ikon aplikasi
```

## Deploy ke Vercel + Neon Postgres (gratis)

1. **Upload ke GitHub** lalu import repo di [Vercel](https://vercel.com/new).
   - Framework otomatis terdeteksi: **Vite** (lihat `vercel.json`).
   - Build command: `npm run build`.
   - Folder `api/` otomatis dikenali sebagai serverless functions — tidak perlu konfigurasi ekstra.

2. **Buat database Neon** di dashboard Vercel:
   - Storage → Create Database → **Neon Postgres** (tier gratis).
   - Salin *connection string*-nya.
   - Di **Settings → Environment Variables**, tambahkan `DATABASE_URL` berisi connection string tersebut. (Vercel juga menyediakan `POSTGRES_URL` — dipakai otomatis jika `DATABASE_URL` tidak ada.)
   - **Redeploy** setelah menambah env variable.

3. **Verifikasi mode Postgres**: buka app → halaman Pengaturan → indikator penyimpanan harus menunjukkan "Tersimpan di cloud · Neon Postgres".

4. **Aktifkan upload foto bukti (Vercel Blob)** — opsional tapi disarankan:
   - Di dashboard Vercel: **Storage → Create Database → Blob** (tier gratis ±10 GB, cukup untuk ribuan kwitansi WebP).
   - Tambahkan environment variable **`BLOB_READ_WRITE_TOKEN`** (disalin dari halaman Blob store) → **Redeploy**.
   - Tanpa token inim, form catatan tetap berfungsi; kolom foto hanya menampilkan peringatan "Upload belum diaktifkan".

5. **Isi data**: tekan **"Muat data contoh"** di halaman Pengaturan (atau import backup JSON). Tabel database dibuat otomatis saat pertama kali data diakses.

> Catatan: mode penyimpanan terdeteksi saat app pertama kali dibuka dan disimpan di localStorage. Jika sudah pernah dibuka tanpa database, hapus data browser atau kunci `rqk::mode` dari localStorage.
> (Update: sekarang probe `/api/health` selalu dilakukan ulang setiap load; kunci mode hanya di-cache untuk mode `postgres`.)

## Keamanan & akses pengelola

Secara bawaan, siapa pun yang membuka aplikasi **hanya bisa melihat** data (rekap, grafik, laporan). Untuk menambah/mengubah/menghapus, pengelola harus **masuk dengan kata sandi**:

- Pasang kata sandi pertama kali di **Pengaturan → Keamanan & masuk** (min. 4 karakter).
- Kata sandi disimpan sebagai **hash SHA-256**, bukan teks asli (localStorage lokal / `app_settings` pada Postgres).
- Setelah kata sandi terpasang, browser lain otomatis tampil sebagai pengunjung (lihat saja). Klik **"Masuk pengelola"** pada banner, masukkan kata sandi → sesi aktif selama tersimpan di browser itu.
- **"Kunci sesi sekarang"** (di Pengaturan) mengembalikan browser ke tampilan pengunjung.
- Menghapus kunci: kosongkan kolom kata sandi di Pengaturan → Simpan.
- Tautan `#/lihat` tetap murni tampilan bahkan bagi pengelola.

> Catatan keamanan: kunci ini mencegah pengubahan oleh pihak luar dan kelalaian — bukan pengganti keamanan tingkat perbankan. Data memang terbuka untuk dilihat publik, sesuai kebutuhan lembaga.

Nama halaman dan seluruh teks UI memakai bahasa Indonesia.

## Nama project

**rq-keuangan** — Kas Rumah Quran UGM, besutan (melayani) Rumah Quran UGM.