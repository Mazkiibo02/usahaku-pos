import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, Store, DollarSign, Printer, Receipt, WifiOff, Lock, ShieldCheck, Users, CheckCircle2 } from 'lucide-react';
import Header from '@/src/features/landing/components/Header';
import dynamic from 'next/dynamic';

const ShowcaseTabs = dynamic(() => import('@/src/features/landing/components/ShowcaseTabs'), { ssr: true });

export const metadata: Metadata = {
  title: "Usahaku POS — Aplikasi Kasir Online & Sistem Penjualan UMKM Premium",
  description: "Sistem POS SaaS terbaik untuk kelola kasir, stok inventaris offline-first, dan keuangan multi-cabang. Coba gratis 30 hari sekarang!",
  keywords: [
    "saas pos",
    "aplikasi kasir",
    "aplikasi penjualan",
    "software kasir toko",
    "pos offline-first",
    "aplikasi kasir cafe",
    "sistem pos umkm",
    "aplikasi kasir murah",
    "pos indonesia"
  ],
  alternates: {
    canonical: "https://usahakupos.my.id",
  },
  openGraph: {
    title: "Usahaku POS — Aplikasi Kasir Online & Sistem Penjualan UMKM Premium",
    description: "Sistem POS SaaS terbaik untuk kelola kasir, stok inventaris offline-first, dan keuangan multi-cabang. Coba gratis 30 hari sekarang!",
    url: "https://usahakupos.my.id",
    siteName: "Usahaku POS",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/images/og-landing.png",
        width: 1200,
        height: 630,
        alt: "Usahaku POS — Aplikasi Kasir Online & Sistem Penjualan UMKM Premium",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Usahaku POS — Aplikasi Kasir Online & Sistem Penjualan UMKM Premium",
    description: "Sistem POS SaaS terbaik untuk kelola kasir, stok inventaris offline-first, dan keuangan multi-cabang. Coba gratis 30 hari sekarang!",
    images: ["/images/og-landing.png"],
  },
};

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Usahaku POS",
    "operatingSystem": "All",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "IDR",
      "description": "Free 30-day Trial"
    },
    "description": "Sistem POS SaaS dengan arsitektur offline-first premium untuk mengelola kasir, stok inventaris, dan keuangan multi-cabang bagi UMKM Indonesia."
  };

  return (
    <div className="bg-slate-50 text-slate-900 font-sans min-h-screen selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* BACKGROUND DECORATIONS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] aspect-square rounded-full bg-linear-to-tr from-indigo-300/30 to-purple-400/20 blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[45%] aspect-square rounded-full bg-linear-to-br from-blue-300/20 to-violet-300/30 blur-[100px]" />
      </div>

      {/* FLOATING HEADER */}
      <Header />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-8 pb-16 sm:pb-24 lg:pt-16 lg:pb-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              {/* Promo Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs sm:text-sm font-bold mb-6 animate-bounce">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                Aplikasi Kasir Pintar #1 untuk UMKM Indonesia
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-none mb-6">
                <span className="block text-slate-900 mb-2">Ubah HP Anda Menjadi</span>
                <span className="block bg-clip-text text-transparent bg-linear-to-r from-indigo-600 via-violet-600 to-indigo-800">
                  Mesin Kasir Pintar.
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg sm:text-xl text-slate-600 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
                Kelola banyak cabang, pantau shift kasir, dan cetak struk otomatis. Tanpa alat mahal, cukup pakai perangkat yang Anda miliki.
              </p>

              {/* Dual CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <Link prefetch={false}
                  href="/register"
                  className="w-full sm:w-auto px-8 py-4 bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-lg rounded-2xl shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Mulai Gratis Sekarang
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="https://wa.me/6285117821129?text=Halo%20tim%20Usahaku%20POS,%20saya%20ingin%20dibantu%20mendaftarkan%20toko%20saya"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg rounded-2xl shadow-xl shadow-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/30 transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.79-4.896c1.6.952 3.16 1.457 4.937 1.459 5.485 0 9.95-4.46 9.954-9.94.002-2.657-1.019-5.155-2.877-7.015C17.004 1.748 14.509.726 11.988.726c-5.495 0-9.96 4.461-9.963 9.94-.001 1.882.5 3.719 1.459 5.381L2.52 21.442l5.327-1.398zm11.367-7.443c-.301-.15-1.78-.877-2.056-.977-.276-.1-.476-.15-.676.15-.2.3-.778.977-.952 1.177-.175.2-.35.225-.651.075-.302-.15-1.272-.469-2.423-1.496-.895-.798-1.5-1.784-1.675-2.084-.175-.3-.018-.463.132-.612.135-.135.301-.35.451-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.676-1.628-.926-2.228-.244-.589-.493-.509-.676-.518-.175-.008-.375-.01-.575-.01-.2 0-.525.075-.8.375-.276.3-1.052 1.027-1.052 2.505 0 1.478 1.077 2.903 1.227 3.102.15.2 2.122 3.241 5.14 4.547.717.31 1.277.496 1.711.634.721.23 1.378.197 1.897.12.579-.087 1.78-.727 2.03-1.427.25-.7.25-1.3.175-1.428-.075-.125-.275-.2-.575-.35z"/>
                  </svg>
                  Tanya via WhatsApp
                </a>
              </div>

              {/* Quick Proof Items */}
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-slate-500 text-sm font-semibold mb-12 sm:mb-16">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500 stroke-[3px]" /> 30 Hari Free Trial
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500 stroke-[3px]" /> Tanpa Alat Tambahan
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500 stroke-[3px]" /> Pendaftaran 1 Menit
                </span>
              </div>
            </div>

            {/* DUAL DEVICE MOCKUP AREA */}
            <div className="relative max-w-5xl mx-auto mt-6">
              {/* Ambient Background Glow for mockups */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[80%] aspect-video rounded-full bg-indigo-500/10 blur-[80px]" />
              </div>

              <div className="relative max-w-4xl mx-auto">
                <Image
                  src="/images/mockup-dashboard-laptop.webp"
                  alt="Dashboard Usahaku POS"
                  width={1200}
                  height={800}
                  className="w-full h-auto object-contain rounded-xl drop-shadow-2xl"
                  priority={true}
                  fetchPriority="high"
                  loading="eager"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <Image
                  src="/images/mockup-kasir-hp.webp"
                  alt="Simulator Kasir HP"
                  width={400}
                  height={800}
                  className="absolute -bottom-10 -left-10 w-2/3 max-w-[280px] sm:max-w-[340px] h-auto z-10 drop-shadow-2xl"
                  priority={true}
                  fetchPriority="high"
                  loading="eager"
                  sizes="(max-width: 768px) 66vw, 340px"
                />
              </div>
            </div>
          </div>
        </section>

        {/* TRUSTED BY MSMEs / BRANDING SECTION */}
        <section className="bg-white border-y border-slate-200 py-12 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-xs font-black tracking-widest text-slate-400 uppercase mb-8">
              DIDESAIN KHUSUS UNTUK KEMUDAHAN OPERASIONAL BERBAGAI BISNIS UMKM
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8 justify-items-center items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
              <div className="flex items-center gap-2 font-bold text-slate-700">
                <Store className="w-5 h-5 text-indigo-500" />
                <span>Warung Makan</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-slate-700">
                <Store className="w-5 h-5 text-indigo-500" />
                <span>Coffee Shop</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-slate-700">
                <Store className="w-5 h-5 text-indigo-500" />
                <span>Fashion Retail</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-slate-700">
                <Store className="w-5 h-5 text-indigo-500" />
                <span>Layanan Jasa</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-slate-700 col-span-2 md:col-span-1">
                <Store className="w-5 h-5 text-indigo-500" />
                <span>Toko Kelontong</span>
              </div>
            </div>
          </div>
        </section>

        {/* BENTO GRID FEATURES SECTION */}
        <section id="fitur" className="py-20 sm:py-28 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3">Fitur Kelas Enterprise</h2>
              <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
                Fitur Kelas Enterprise, Harga UMKM
              </h3>
              <p className="text-base sm:text-lg text-slate-500 font-medium">
                Segala yang Anda butuhkan untuk mengembangkan bisnis, dirancang khusus untuk kenyamanan operasional harian tanpa biaya bulanan yang mencekik.
              </p>
            </div>

            {/* BENTO GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Box 1 (Large Box - 2 cols): Sistem Pembayaran Digital Otomatis */}
              <div className="md:col-span-2 bg-linear-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative shadow-lg group hover:-translate-y-1 transition-all duration-300 min-h-[320px]">
                <div className="absolute -bottom-8 -right-8 w-64 h-64 rounded-full bg-white/5 blur-2xl group-hover:bg-white/10 transition-colors duration-300" />
                
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-xl sm:text-2xl font-black mb-3">Sistem Pembayaran Digital Otomatis</h4>
                    <p className="text-indigo-100 text-sm sm:text-base max-w-md leading-relaxed">
                      Integrasi QRIS dan Transfer Bank Production secara real-time (Powered by Midtrans). Verifikasi otomatis transaksi secara instan tanpa perlu cek mutasi manual.
                    </p>
                  </div>

                  <div className="mt-8 flex items-center gap-4 bg-white/10 backdrop-blur-xs p-3 rounded-2xl max-w-sm border border-white/10">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-white stroke-[3px]" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold">Integrasi Resmi Midtrans • QRIS & Bank Transfer</span>
                  </div>
                </div>
              </div>

              {/* Box 2 (Standard Box - 1 col): Dukungan Printer Thermal Universal */}
              <div className="bg-sky-50 border border-sky-100 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xs group hover:-translate-y-1 transition-all duration-300 min-h-[320px]">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center mb-6 text-sky-600">
                    <Printer className="w-6 h-6" />
                  </div>
                  <h4 className="text-xl font-black text-slate-800 mb-3">Dukungan Printer Thermal Universal</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Cetak struk fisik instan lewat Bluetooth (Android RawBT) atau Kabel USB tanpa ribet pasang driver.
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-sky-100/50 flex flex-col space-y-2">
                  <span className="text-[10px] text-sky-600 font-extrabold uppercase tracking-wide">Metode Cetak Lengkap</span>
                  <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-650">
                    <span className="px-2 py-1 bg-white rounded border border-slate-200">Bluetooth RawBT</span>
                    <span className="px-2 py-1 bg-white rounded border border-slate-200">Kabel USB</span>
                    <span className="px-2 py-1 bg-white rounded border border-slate-200">Bebas Driver</span>
                  </div>
                </div>
              </div>

              {/* Box 3 (Standard Box - 1 col): Kirim Struk Digital */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xs group hover:-translate-y-1 transition-all duration-300 min-h-[320px]">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-600">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <h4 className="text-xl font-black text-slate-800 mb-3">Kirim Struk Digital</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Fitur pengiriman struk belanja instan via WhatsApp Link Integration dan Email Notifikasi.
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-emerald-100/50 flex flex-col space-y-2">
                  <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wide">E-Receipt & Paperless</span>
                  <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-650">
                    <span className="px-2 py-1 bg-white rounded border border-slate-200">WhatsApp Link</span>
                    <span className="px-2 py-1 bg-white rounded border border-slate-200">Email Notif</span>
                    <span className="px-2 py-1 bg-white rounded border border-slate-200">Coming Soon</span>
                  </div>
                </div>
              </div>

              {/* Box 4 (Large Box - 2 cols): PWA Offline Mode */}
              <div className="md:col-span-2 bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative shadow-lg group hover:-translate-y-1 transition-all duration-300 min-h-[320px]">
                <div className="absolute -bottom-8 -right-8 w-64 h-64 rounded-full bg-white/5 blur-2xl group-hover:bg-white/10 transition-colors duration-300" />
                
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                      <WifiOff className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-xl sm:text-2xl font-black mb-3">PWA Offline Mode</h4>
                    <p className="text-slate-300 text-sm sm:text-base max-w-md leading-relaxed">
                      Aplikasi tetap berjalan dan menyimpan antrean transaksi meski Wi-Fi mati. Data otomatis disinkronkan ke cloud saat koneksi internet kembali normal.
                    </p>
                  </div>

                  <div className="mt-8 flex items-center gap-4 bg-white/10 backdrop-blur-xs p-3 rounded-2xl max-w-sm border border-white/10">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-white stroke-[3px]" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold">Transaksi Jalan Terus Tanpa Khawatir Internet Mati</span>
                  </div>
                </div>
              </div>

              {/* Box 5 (Standard Box - 1 col): Manajemen Shift */}
              <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xs group hover:-translate-y-1 transition-all duration-300 min-h-[320px]">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 text-amber-600">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h4 className="text-xl font-black text-slate-800 mb-3">Manajemen Shift</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Kunci modal awal dan pantau selisih laci kasir secara akurat. Hindari kebocoran finansial dengan pencatatan otomatis serah-terima shift kasir.
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-amber-100/50 flex items-center justify-between text-xs text-slate-600">
                  <span className="font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    Laci Kasir Aman
                  </span>
                  <span className="text-slate-400">Selisih 0%</span>
                </div>
              </div>

              {/* Box 6 (Large Box - 2 cols): Multi-Cabang & Multi-User */}
              <div className="md:col-span-2 bg-indigo-50 border border-indigo-100 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xs group hover:-translate-y-1 transition-all duration-300 min-h-[320px] relative overflow-hidden">
                <div className="absolute right-0 bottom-0 w-1/2 opacity-25 group-hover:opacity-40 transition-opacity duration-300 hidden sm:block">
                  <svg className="w-full h-auto text-indigo-300" viewBox="0 0 200 100">
                    <rect x="10" y="40" width="20" height="50" rx="3" fill="currentColor" />
                    <rect x="40" y="20" width="20" height="70" rx="3" fill="currentColor" />
                    <rect x="70" y="55" width="20" height="35" rx="3" fill="currentColor" />
                    <rect x="100" y="10" width="20" height="80" rx="3" fill="currentColor" />
                  </svg>
                </div>

                <div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center mb-6 text-indigo-600">
                    <Store className="w-6 h-6" />
                  </div>
                  <h4 className="text-xl sm:text-2xl font-black text-slate-800 mb-3">Multi-Cabang & Multi-User</h4>
                  <p className="text-slate-500 text-sm sm:text-base max-w-md leading-relaxed">
                    Pantau performa berbagai outlet dari satu dashboard pusat. Batasi akses staf dengan otorisasi role kasir vs owner demi keamanan data.
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-indigo-100/50 flex flex-wrap gap-4 text-xs font-bold text-slate-650">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Akses Role Staf</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Konsolidasi Laporan</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* SCREEN SHOWCASE SECTION (TAB INTERFACE) */}
        <ShowcaseTabs />

        {/* FREQUENTLY ASKED QUESTIONS SECTION */}
        <section id="faq" className="py-20 sm:py-28 bg-slate-100 border-t border-slate-200/60 relative z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3">FAQ</h2>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Pertanyaan yang Sering Diajukan</h3>
            </div>

            <div className="space-y-6">
              {/* FAQ 1 */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs">
                <h5 className="font-bold text-slate-800 text-base mb-2">Apakah Usahaku POS menyediakan masa uji coba gratis?</h5>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Ya! Kami menyediakan 30 Hari Free Trial (Uji Coba Gratis) dengan fitur premium lengkap dan kapasitas hingga 2 outlet untuk seluruh pengguna baru. Setelah masa uji coba berakhir, Anda dapat memilih paket berlangganan transparan mulai dari Rp 25.000/bulan sesuai dengan skala bisnis Anda.
                </p>
              </div>

              {/* FAQ 2 */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs">
                <h5 className="font-bold text-slate-800 text-base mb-2">Bagaimana cara kerja mode offline jika internet mati?</h5>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Usahaku POS menggunakan teknologi Progressive Web App (PWA) modern. Saat Wi-Fi atau seluler terputus, aplikasi tetap berjalan normal untuk input pesanan. Seluruh data disimpan di penyimpanan lokal browser Anda, lalu disinkronkan otomatis ke server saat Anda online kembali.
                </p>
              </div>

              {/* FAQ 3 */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs">
                <h5 className="font-bold text-slate-800 text-base mb-2">Printer thermal apa saja yang didukung?</h5>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Kami mendukung hampir seluruh printer thermal bluetooth standar berukuran kertas 58mm dan 80mm yang umum dijual di marketplace. Anda juga bisa mengunduh struk berformat PDF untuk dicetak via komputer biasa atau dikirim sebagai bukti digital.
                </p>
              </div>

              {/* FAQ 4 */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs">
                <h5 className="font-bold text-slate-800 text-base mb-2">Apakah saya bisa menggunakan satu akun untuk banyak cabang?</h5>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Tentu saja. Dengan mendaftar sebagai Owner, Anda dapat membuat beberapa tenant/outlet dan mengundang kasir atau manajer yang berbeda untuk mengelola tiap cabang secara mandiri dari satu akun dashboard pusat Anda.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HPP CALCULATOR BRIDGING FEATURE SECTION */}
        <section className="py-20 sm:py-28 bg-white border-t border-slate-200/60 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              
              {/* Column 1: Copywriting & Navigation CTA */}
              <div className="lg:col-span-6 space-y-6 lg:pr-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs sm:text-sm font-bold mb-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  Fitur Baru: Kalkulator Harga Pokok Penjualan
                </div>
                
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                  Hitung HPP &amp; Simulasi Harga Jual Otomatis,{' '}
                  <span className="text-indigo-700 font-extrabold">
                    Bebas Boncos!
                  </span>
                </h2>
                
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
                  Gunakan Kalkulator HPP interaktif kami secara gratis. Simulasikan margin keuntungan, biaya bahan baku, hingga operasional menu kuliner Anda langsung dari landing page.
                </p>
                
                <div className="pt-2">
                  <Link prefetch={false}
                    href="/tools/kalkulator-hpp"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-base sm:text-lg rounded-2xl shadow-xl shadow-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-500/35 transform hover:-translate-y-1 active:scale-98 transition-all duration-300"
                  >
                    Coba Kalkulator HPP Gratis →
                  </Link>
                </div>

                {/* Trust/Proof items */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-slate-600 text-xs sm:text-sm font-bold pt-4 border-t border-slate-100">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-indigo-600 shrink-0" />
                    Simulasi Margin Real-time
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-indigo-600 shrink-0" />
                    Rekomendasi Harga Otomatis
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-indigo-600 shrink-0" />
                    Tanpa Pendaftaran &amp; Gratis
                  </span>
                </div>
              </div>
              
              {/* Column 2: Static Image Mockup */}
              <div className="lg:col-span-6 flex justify-center">
                <div className="relative max-w-md w-full">
                  <Image
                    src="/images/mockup-hpp-hp.webp"
                    alt="Kalkulator HPP"
                    width={500}
                    height={800}
                    className="w-full h-auto object-contain rounded-2xl drop-shadow-2xl"
                    sizes="(max-width: 1024px) 100vw, 500px"
                  />
                </div>
              </div>
              
            </div>
          </div>
        </section>

        {/* FINAL HIGH-CONVERTING CTA SECTION */}
        <section className="py-16 sm:py-24 bg-linear-to-tr from-indigo-900 via-indigo-950 to-slate-950 text-white relative overflow-hidden text-center">
          {/* Decorative Grid overlays */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-size-[24px_24px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] aspect-square rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-6">
              Mulai Kembangkan Bisnis Anda Hari Ini
            </h2>
            <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto mb-10 leading-relaxed">
              Bergabunglah dengan ratusan pemilik toko di Indonesia yang telah beralih ke Usahaku POS. Mudah dioperasikan, aman, dan tanpa biaya bulanan tersembunyi.
            </p>

            {/* Dual buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link prefetch={false}
                href="/register"
                className="w-full sm:w-auto px-8 py-4 bg-linear-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-bold text-lg rounded-2xl shadow-xl shadow-indigo-500/20 transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Coba Gratis Sekarang
              </Link>
              <a
                href="https://wa.me/6285117821129?text=Halo%20tim%20Usahaku%20POS,%20saya%20ingin%20dibantu%20mendaftarkan%20toko%20saya"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg rounded-2xl shadow-xl shadow-emerald-500/20 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
              >
                Hubungi Tim Sales
              </a>
            </div>

            <p className="text-xs text-slate-400 mt-6 font-semibold">
              ✓ 30 Hari Free Trial (Uji Coba Gratis) • Tanpa Kontrak Mengikat
            </p>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Branding Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                  <Store className="w-4.5 h-4.5" />
                </div>
                <span className="font-extrabold text-lg text-white">UsahakuPOS</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                Solusi digital pencatatan kasir dan analitik penjualan UMKM Indonesia. Ringan, handal, dan dapat diandalkan secara offline.
              </p>
            </div>

            {/* Links columns */}
            <div>
              <div className="font-bold text-white text-xs uppercase tracking-wider mb-4">Aplikasi</div>
              <ul className="space-y-2.5 text-xs">
                <li><a href="#fitur" className="hover:text-white transition-colors">Fitur POS</a></li>
                <li><a href="#showcase" className="hover:text-white transition-colors">Tampilan Layar</a></li>
                <li><Link prefetch={false} href="/tools/kalkulator-hpp" className="hover:text-white transition-colors">Kalkulator HPP</Link></li>
              </ul>
            </div>

            <div>
              <div className="font-bold text-white text-xs uppercase tracking-wider mb-4">Pengguna</div>
              <ul className="space-y-2.5 text-xs">
                <li><Link prefetch={false} href="/login" className="hover:text-white transition-colors">Login Kasir / Owner</Link></li>
                <li><Link prefetch={false} href="/register" className="hover:text-white transition-colors">Daftar Akun Baru</Link></li>
                <li><a href="https://wa.me/6285117821129" className="hover:text-white transition-colors">Bantuan Teknis</a></li>
              </ul>
            </div>

            <div>
              <div className="font-bold text-white text-xs uppercase tracking-wider mb-4">Legalitas</div>
              <ul className="space-y-2.5 text-xs">
                <li><a href="#" className="hover:text-white transition-colors">Kebijakan Privasi</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Syarat & Ketentuan</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Usahaku POS. Hak Cipta Dilindungi.</p>
            <div className="flex gap-4 mt-4 sm:mt-0">
              <a href="#" className="hover:text-slate-400">Instagram</a>
              <a href="#" className="hover:text-slate-400">Facebook</a>
              <a href="#" className="hover:text-slate-400">WhatsApp</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
