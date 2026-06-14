# Product Requirements Document (PRD)
**Nama Proyek:** Usahaku POS (Point of Sale & Business Analytics)
**Target Audiens:** UMKM, Pemilik Toko, dan Kasir (Staf).
**Fase Saat Ini:** Fase 10 (SaaS Monetization & Production Deployment - Terstabilisasi)

## Sinopsis Proyek
Usahaku POS adalah aplikasi Multi-Tenant, Progressive Web App (PWA) Kasir (Point of Sale) yang dirancang khusus untuk UMKM Indonesia. Aplikasi ini menyediakan manajemen transaksi kasir real-time, pencetakan struk thermal fisik/digital, dan dasbor analitik bisnis untuk pemilik toko. Aplikasi ini beroperasi menggunakan model Langganan SaaS bertingkat dengan sistem pembatasan sumber daya (*gatekeeping*) yang ketat.

## Struktur Paket & Harga SaaS
Untuk memfasilitasi strategi Product-Led Growth (PLG), pengguna baru (tenant) akan langsung mendapatkan **30-Hari Free Trial (Uji Coba Gratis)** secara otomatis saat pendaftaran dengan batas bawaan **maxOutlets: 2**. Setelah masa uji coba habis atau pemilik memutuskan upgrade, mereka dapat memilih paket berikut:
* **Paket 1-Outlet:** Rp 25.000 / bulan (Membatasi akses hanya untuk 1 outlet aktif).
* **Paket 2-Outlets:** Rp 50.000 / bulan (Membatasi akses hingga 2 outlet aktif).
* **Paket 4-Outlets:** Rp 100.000 / bulan (Membatasi akses hingga 4 outlet aktif).

## Status Pencapaian Fitur (COMPLETED)
* **Autentikasi & Onboarding Tenant:** Berhasil diimplementasikan menggunakan Firebase Auth dan Cloud Functions. Sistem otomatis memberikan 30 hari trial dengan `maxOutlets: 2` dan `outletsCount: 0`.
* **Multi-Tenant Role-Based Access Control (RBAC):** Pemisahan hak akses Pemilik (Owner) dan Kasir (Cashier) menggunakan Firebase Custom Claims (`tenantId` dan `role`). Semua data user disatukan di bawah koleksi root `users` untuk menjaga integritas data.
* **Sinkronisasi Pembuatan Kasir:** Fungsi Cloud Function `createStaffAccount` menulis data langsung ke koleksi root `users` untuk memperbaiki masalah visual pencatatan "Total Kasir" di frontend.
* **Proteksi Layout & Alur Kasir:** Kasir otomatis diarahkan langsung ke halaman kasir/shift dan memblokir dasbor analitik grafik pemilik untuk mencegah error "Missing or insufficient permissions".
* **Sistem Kasir Utama (POS Core):** Kalkulasi keranjang belanja, manajemen produk, manajemen shift (modal awal & akhir laci kas), serta checkout transaksi real-time.
* **Halaman Utama (Landing Page) Baru:** Mengubah rute utama (`/`) menjadi halaman pemasaran premium berbasis Bento Grid, menghapus klaim keliru "Gratis Selamanya", mengomunikasikan skema *30-Days Trial*, dan menyediakan tombol CTA WhatsApp Business terintegrasi.
* **Sistem Gerbang Pembayaran Midtrans (Fase 1, 2 & 3):**
    * Integrasi komponen `SubscriptionLock.tsx` sebagai paywall reaktif global yang menampilkan 3 kolom paket langganan.
    * Cloud Function `generateSnapToken` (2nd-Gen) untuk verifikasi harga produk di sisi server.
    * Cloud Function `midtransWebhook` (2nd-Gen) dilengkapi verifikasi tanda tangan SHA512 HMAC dan Firestore Transaction Guard untuk mencegah race-condition data.
    * **Fitur Fail-Safe Manual Sync:** Fungsi `checkPaymentStatus` (2nd-Gen) sebagai jalur alternatif aman jika webhook Midtrans mengalami penundaan (*delay/lag*). Dilengkapi pembatasan eksekusi (*debounce*) 15 detik di sisi server via `lastCheckedAt` dan di sisi client via `localStorage`. Menggunakan pembaruan paksa reaktif ID Token (`getIdToken(true)`) untuk membuka aplikasi seketika tanpa refresh halaman.
* **Arsitektur Pengaman Pembayaran & Anti-Spam (Idempotency):** Implementasi proteksi penumpukan invoice pending pada endpoint `/api/midtrans/token`. Sistem mendeteksi jika pengguna memiliki invoice aktif berstatus `PENDING` yang berusia kurang dari 24 jam di Firestore. Jika ditemukan, sistem akan **menggunakan kembali (*reuse*) snapToken lama**, sehingga Virtual Account yang sama tetap terkunci tanpa memicu spam pembuatan invoice baru di Midtrans. Didukung oleh *automated unit tests* (`scratch/test-route-logic.ts`).
* **Stabilisasi UX Callback Midtrans Snap:** Mengubah seluruh fungsi penanganan (callback) `window.snap.pay` menjadi *arrow functions* di halaman Pengaturan dan `SubscriptionLock.tsx`. Fungsi ini secara reaktif mereset status `isRenewing` menjadi `false` ketika user sengaja menutup modal pembayaran (*onClose*), gagal (*onError*), atau tertunda (*onPending*), sehingga tombol upgrade tidak terkunci/beku.
* **Sub-Sistem Cetak Struk Thermal Multi-Jalur Universal:**
    * **Web Bluetooth API:** Sistem pencarian langsung (*single-target query*) yang memprioritaskan UUID chip ISSC (`49535343-fe7d-4ae5-8fa9-9fafd205e455`) dengan jeda stabilisasi 1 detik untuk menghentikan loop kueri massal yang dapat membuat chip printer murah seharga 90 ribuan mengalami *crash/firmware panic*.
    * **Web Serial API:** Dukungan koneksi kabel USB bebas driver berbasis komunikasi Serial Virtual COM (Baud rate 9600/115200) sebagai jalur alternatif super stabil di perangkat desktop/laptop.
    * **WebUSB API (Interface Class 7 Fallback):** Menghapus filter ketat pada Serial Port dan menambahkan deteksi langsung perangkat keras kelas USB Printer (`interfaceClass: 7`). Memisahkan tombol aksi koneksi di UI secara mandiri untuk mematuhi aturan ketat *Chromium User Gesture Requirement* dan menghindari `SecurityError`.
    * **Integrasi Jembatan Android RawBT:** Mengimplementasikan protokol pengalihan skema URL kustom (`rawbt:base64,[DATA]`) untuk mengompres data biner struk dari `escPosEncoder.ts` menjadi string Base64. Ini membebaskan pengguna *smartphone* Android dari batasan HTTPS Mixed Content di Chrome Mobile dan memberikan kompabilitas pencetakan 100% instan untuk semua jenis printer thermal murah di pasar Indonesia tanpa proses pairing Bluetooth browser yang rumit.
* **Fitur Berbagi Struk Digital via Gambar (WhatsApp/Platform Lain):** Integrasi pustaka rasterisasi grafis (`html-to-image`) untuk "memotret" komponen pratinjau struk HTML menjadi file gambar `.png` murni di latar belakang. Menggunakan **Web Share API (`navigator.share`)** untuk memicu penelusuran *Share Sheet* bawaan sistem operasi ponsel agar kasir dapat membagikan struk berwujud gambar estetik langsung ke WhatsApp pelanggan (mirip aplikasi M-Banking/E-Wallet modern), dilengkapi fungsi unduh otomatis (*download fallback*) jika dibuka lewat perangkat desktop.
* **Kredensial Firebase Admin Serverless (Vercel Fix):** Memperbaiki error `Could not load the default credentials` pada runtime serverless Vercel dengan menuliskan inisialisasi eksplisit sertifikat akun layanan (*Service Account Key*) menggunakan variabel lingkungan (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, dan penanganan baris baru multiline pada `FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')`).

## Langkah Selanjutnya (IN PROGRESS / PENDING)
* **Refinement Keamanan Akses Riwayat Transaksi Kasir:** Menyempurnakan berkas `firestore.rules` dan kueri halaman transaksi (`app/dashboard/transactions/page.tsx`) agar kasir dapat membaca dokumen koleksi `invoices` yang terisolasi sesuai ID Tenant & ID Outlet mereka untuk kebutuhan cetak ulang (*reprint*) tanpa mengekspos data agregat keuangan toko keseluruhan.
* **Pengujian Real-Device PWA:** Menguji installasi ikon aplikasi "Add to Home Screen" langsung dari jaringan IP lokal untuk memastikan fungsionalitas offline berjalan lancar.