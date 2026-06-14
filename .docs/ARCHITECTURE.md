# Dokumen Arsitektur Teknis
**Nama Proyek:** Usahaku POS

## Stack Teknologi Utama
* **Frontend:** Next.js 14/15 (App Router), React, Tailwind CSS v4.
* **Manajemen Status & UI:** Zustand, Recharts (Visualisasi), Lucide React (Ikon).
* **Ekstensi Citra Grafis Struk:** `html-to-image` / `html2canvas` (Konversi DOM ke Gambar).
* **Mesin PWA:** `@ducanh2912/next-pwa`.
* **Backend (BaaS):** Firebase Ecosystem (Auth, Firestore, Cloud Storage).
* **Logika Serverless:** Firebase Cloud Functions (2nd Gen, Node.js 22), Next.js API Routes.
* **Kredensial Admin Server:** `firebase-admin/app` (Inisialisasi Eksplisit).
* **Gerbang Pembayaran & Jembatan Cetak Eksternal:** Midtrans Core API & Snap JS Client, RawBT Android Protocol.

## Keputusan Arsitektur Kunci (ADRs)

### 1. Inisialisasi Firebase Terpadu & Sertifikasi Serverless (Singleton Pattern)
* **Keputusan:** Seluruh modul Firebase Client diinisialisasi dalam satu gerbang terpadu (`src/lib/firebase/firebase.ts`) dengan pelindung objek global (`globalThis._emulatorsStarted`) demi stabilitas Next.js Fast Refresh.
* **Implementasi Serverless Vercel:** Untuk komponen Admin backend (`src/lib/firebase/admin.ts`), inisialisasi wajib dilakukan secara eksplisit menggunakan enkapsulasi sertifikat `admin.credential.cert` untuk menghindari error kegagalan memuat kredensial default (`Could not load the default credentials`). String private key dibersihkan dari simbol literal baris baru menggunakan ekspresi regular: `privateKey.replace(/\\n/g, '\n')`.

### 2. Multi-Tenancy & Autentikasi Custom Claims
* **Keputusan:** Menyuntikkan identitas bisnis (`tenantId`), peran operasional (`role`), dan konteks berlangganan secara mutakhir langsung ke dalam token sesi Firebase Custom Claims.
* **Struktur Payload Token:** `{ tenantId: string, role: 'owner' | 'cashier' }`. Skema ini memotong latensi pembacaan database Firestore yang berulang pada setiap pergantian rute halaman (*route changes*).

### 3. Mesin Cetak Struk Multi-Channel & Abstraksi Perangkat Keras
* **Keputusan:** Mengembangkan arsitektur pengiriman byte data terpadu (*unified data pipeline*) yang dapat mendistribusikan data biner ESC/POS dari `escPosEncoder.ts` ke berbagai channel output fisik maupun digital secara fleksibel.
* **Strategi Channel Output:**
    1. **Metode Browser Desktop (`window.print()`):** Menggunakan utilitas native `@media print` dengan modifier `print:` dari Tailwind v4 untuk menyembunyikan layout dashboard kasir (`print:hidden`) dan mengisolasi komponen struk dalam dimensi tetap `print:w-[58mm]`.
    2. **Metode Web Bluetooth API Direct Scan:** Mengunci pencarian hanya pada UUID Layanan Utama chip ISSC (`49535343-fe7d-4ae5-8fa9-9fafd205e455`) dan memotong sistem perulangan sekuensial UUID acak yang terbukti memicu kegagalan memori (*buffer overflow/panic disconnect*) pada mikro-kontroler printer murah.
    3. **Metode WebUSB API (Interface Class 7):** Berfungsi sebagai jalan tol koneksi kabel USB pada laptop dengan mengklaim titik akhir bulk (*bulk endpoints*) dari perangkat beridentitas resmi kelas printer (`interfaceClass: 7`).
    4. **Metode Klien Android RawBT Link Redirect:** Menyediakan jembatan bebas hambatan keamanan HTTPS Sandbox untuk perangkat seluler Android melalui pengalihan URL Protokol Kustom `rawbt:base64,` yang mengirimkan payload terkompresi Base64 langsung ke aplikasi background RawBT di ponsel kasir.

### 4. Arsitektur Idempotensi Transaksi & Penggunaan Kembali Token Midtrans
* **Keputusan:** Menerapkan pengaman berlapis (*idempotency guard*) pada API rute Next.js `/api/midtrans/token` guna menghentikan perilaku *Transaction Spamming* (penumpukan tagihan gantung berulang di gerbang pembayaran akibat kasir menekan tombol upgrade berkali-kali).
* **Logika Rekayasa Kendali Kontrol:** Sebelum rute melempar kueri pengisian dana baru ke Midtrans Snap API via `snap.createTransaction()`, server wajib mengeksekusi kueri pemindaian awal ke Firestore koleksi `invoices`. Jika sistem menemukan invoice berstatus `'PENDING'` milik penyewa (`tenantId`) tersebut yang berusia kurang dari 24 jam, proses request ke Midtrans otomatis dibatalkan (*short-circuit*). Server akan langsung mengembalikan objek cache token lama (`snapToken` & `redirectUrl`) ke sisi klien. Metode ini menjamin kestabilan nomor Virtual Account (VA) yang konsisten dan menjaga kebersihan penyimpanan database dari data sampah (*invoice bloating*).

### 5. Penguncian Status Siklus Callback Midtrans Snap UI
* **Keputusan:** Menghilangkan sintaks fungsi tradisional pada opsi parameter inisialisasi `window.snap.pay` dan menggantinya secara mutlak ke bentuk fungsi panah (*arrow functions*) di seluruh komponen interseptor paywall (`SubscriptionLock.tsx`) dan halaman Settings.
* **Implementasi Kontrol State:** Fungsi panah ini secara atomik mereset variabel status lokal React `isRenewing` menjadi `false` dan membersihkan cache token pada pemicu callback `onClose()`, `onError()`, dan `onPending()`. Hal ini menjamin status visual tombol di frontend akan langsung terlepas dari kondisi beku (*disabled loading state*) seketika setelah bingkai iframe Midtrans ditutup oleh pengguna.

### 6. Pipeline Rasterisasi Gambar & Web Share API (Struk Digital)
* **Keputusan:** Mewujudkan fitur pembagian struk digital berwujud gambar utuh tanpa membebani server backend dengan beban penyimpanan file gambar (*image hosting overhead*).
* **Alur Eksekusi Sisi Klien:** Website menangkap referensi DOM elemen pratinjau struk HTML, mengisolasinya secara visual, lalu melempar komponen tersebut ke pustaka rasterisasi `html-to-image` untuk dikonversi menjadi file biner Blob bertipe `image/png` secara instan. File biner ini dibungkus ke dalam objek berkas `File` standar web, diverifikasi melalui metode pembatasan keamanan `navigator.canShare({ files })`, dan ditembakkan langsung ke antarmuka **Web Share API (`navigator.share`)** guna memicu penelusuran *Native Share Sheet* bawaan sistem operasi seluler (Android/iOS) kasir untuk dikirimkan langsung ke kontak WhatsApp pelanggan.

### 7. Isolasi Hak Keamanan Perangkat Keras Sandbox (Chromium User Gesture)
* **Keputusan:** Mematuhi aturan kebijakan privasi mutlak Google Chrome yang melarang penayangan dialog perizinan perangkat keras (USB/Serial) melalui rantai kode asinkronus otomatis (seperti memicu WebUSB sesaat setelah Web Serial melempar error di dalam blok `catch`).
* **Implementasi Struktur UI:** Seluruh fungsi interaksi perangkat keras wajib dieksekusi secara sinkronus di bawah satu ketukan fisik tombol manusia. Kode program dirombak dengan memisahkan tombol penghubung menjadi aksi mandiri yang independen pada elemen UI (`onClick={connectWebUsbPrinter}` dan `onClick={connectUsbPrinter}`). Hal ini memastikan parameter *User Gesture Context* tetap valid di mata mesin peramban Chromium dan mencegah munculnya `SecurityError: Must be handling a user gesture`.

### 8. Pipeline Infrastruktur Integrasi & Pengiriman (CI/CD)
* **Keputusan:** Vercel Hosting secara terprogram diikat khusus ke cabang Git `staging` sebagai saringan akhir produksi operasional (*live environment*). Jalur integrasi kode fitur baru wajib dirakit melalui cabang fitur independen (`feat/*` atau `fix/*`), diuji di tautan *Vercel Preview Deployment*, lalu digabungkan (*merge*) ke cabang utama `main` sebelum dipindahkan secara resmi ke cabang produksi `staging`.