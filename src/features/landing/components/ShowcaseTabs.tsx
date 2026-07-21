'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import Laptop from 'lucide-react/dist/esm/icons/laptop';
import Check from 'lucide-react/dist/esm/icons/check';

export default function ShowcaseTabs() {
  const [activeTab, setActiveTab] = useState<'checkout' | 'analytics'>('checkout');

  return (
    <section id="showcase" className="py-20 sm:py-28 relative z-10 bg-white border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3">Tampilan Antarmuka</h2>
          <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Didesain Untuk Kecepatan Kasir & Ketelitian Owner
          </h3>
          <p className="text-base sm:text-lg text-slate-500 font-medium mt-4">
            Kami membagi fokus menjadi dua area khusus yang saling terintegrasi secara real-time.
          </p>
          
          {/* Tab switch button */}
          <div className="flex justify-center mt-8">
            <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 border border-slate-200">
              <button
                onClick={() => setActiveTab('checkout')}
                className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                  activeTab === 'checkout'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🚀 Layar Kasir (POS)
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                📊 Dashboard Owner
              </button>
            </div>
          </div>
        </div>

        {/* TAB CONTENT A: Layar Kasir */}
        {activeTab === 'checkout' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center animate-fadeIn">
            {/* Text */}
            <div className="space-y-6 lg:pr-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold">
                <Smartphone className="w-3.5 h-3.5" />
                Kecepatan Transaksi Utama
              </div>
              <h4 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Checkout Kilat yang Responsif & Sentuh-Ramah
              </h4>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Layar POS dirancang khusus untuk meminimalkan jumlah ketukan saat melayani pelanggan yang mengantre. Cocok untuk perangkat smartphone Android/iOS maupun tablet kasir.
              </p>
              <ul className="space-y-3.5">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-800 text-sm">Responsif & Bebas Lag</h5>
                    <p className="text-xs text-slate-500 mt-0.5">Teknologi Single Page Application (SPA) memastikan perpindahan menu instan.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-800 text-sm">Pencarian Menu & Filter Cepat</h5>
                    <p className="text-xs text-slate-500 mt-0.5">Cari produk berdasarkan nama atau filter berdasarkan kategori instan dalam satu ketukan.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-800 text-sm">Metode Pembayaran Fleksibel</h5>
                    <p className="text-xs text-slate-500 mt-0.5">Mendukung Tunai, Transfer Bank, QRIS, dan pencatatan kas bon (hutang) pelanggan.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Graphic Mockup Desktop */}
            <div className="flex justify-center">
              <Image
                src="/images/mockup-kasir-desktop.webp"
                alt="Usahaku POS Desktop"
                width={1000}
                height={600}
                className="w-full h-auto object-contain rounded-2xl drop-shadow-2xl"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        )}

        {/* TAB CONTENT B: Dashboard Owner */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center animate-fadeIn">
            {/* Left Column: Graphic Mockup Dashboard */}
            <div className="flex justify-center order-2 lg:order-1">
              <Image
                src="/images/mockup-dashboard-laptop.webp"
                alt="Dashboard Usahaku POS"
                width={1000}
                height={600}
                className="w-full h-auto object-contain rounded-2xl drop-shadow-2xl"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            {/* Right Column: Text descriptions */}
            <div className="space-y-6 lg:pl-8 order-1 lg:order-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-violet-750 text-xs font-bold">
                <Laptop className="w-3.5 h-3.5" />
                Kekuatan Analitik Owner
              </div>
              <h4 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Pantau Bisnis & Ekspor Laporan Tanpa Hambatan
              </h4>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Semua transaksi kasir diakumulasikan secara otomatis ke dashboard pemilik usaha. Dapatkan gambaran performa keuangan yang objektif tanpa rekap manual akhir hari.
              </p>
              <ul className="space-y-3.5">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-800 text-sm">Analisis Multi-Outlet Terpusat</h5>
                    <p className="text-xs text-slate-500 mt-0.5">Bandingkan omzet dan laba bersih antar cabang secara real-time dalam satu layar terpadu.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-800 text-sm">Ekspor Laporan File Excel & PDF</h5>
                    <p className="text-xs text-slate-500 mt-0.5">Unduh data penjualan bulanan atau laporan pajak dalam format yang siap pakai sekali klik.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-800 text-sm">Keamanan Enkripsi Data Transparan</h5>
                    <p className="text-xs text-slate-500 mt-0.5">Semua data transaksi di-backup aman di cloud Firebase dengan enkripsi tingkat tinggi.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
