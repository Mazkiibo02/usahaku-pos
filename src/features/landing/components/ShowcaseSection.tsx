'use client';

import React, { useState } from 'react';
import {
  Smartphone,
  Laptop,
  Check
} from 'lucide-react';

export default function ShowcaseSection() {
  const [activeTab, setActiveTab] = useState<'checkout' | 'analytics'>('checkout');

  return (
    <section id="showcase" className="py-20 sm:py-28 relative z-10 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3">Tampilan Antarmuka</h2>
          <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Didesain Untuk Kecepatan Kasir & Ketelitian Owner
          </h3>
          <p className="text-base sm:text-lg text-slate-505 font-medium mt-4">
            Kami membagi fokus menjadi dua area khusus yang saling terintegrasi secara real-time.
          </p>
          
          {/* Tab switch button */}
          <div className="flex justify-center mt-8">
            <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 border border-slate-200">
              <button
                onClick={() => setActiveTab('checkout')}
                className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                  activeTab === 'checkout'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                🚀 Layar Kasir (POS)
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-850'
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
              <p className="text-slate-655 text-sm sm:text-base leading-relaxed">
                Layar POS dirancang khusus untuk meminimalkan jumlah ketukan saat melayani pelanggan yang mengantre. Cocok untuk perangkat smartphone Android/iOS maupun tablet kasir.
              </p>
              <ul className="space-y-3.5">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-850 text-sm">Responsif & Bebas Lag</h5>
                    <p className="text-xs text-slate-500 mt-0.5">Teknologi Single Page Application (SPA) memastikan perpindahan menu instan.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-850 text-sm">Pencarian Menu & Filter Cepat</h5>
                    <p className="text-xs text-slate-500 mt-0.5">Cari produk berdasarkan nama atau filter berdasarkan kategori instan dalam satu ketukan.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-850 text-sm">Metode Pembayaran Fleksibel</h5>
                    <p className="text-xs text-slate-500 mt-0.5">Mendukung Tunai, Transfer Bank, QRIS, dan pencatatan kas bon (hutang) pelanggan.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Graphic Mockup checkout layout */}
            <div className="bg-slate-50 rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xl relative overflow-hidden">
              <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-inner flex flex-col min-h-[380px]">
                
                {/* Mock POS Tablet View Header */}
                <div className="bg-slate-900 px-4 py-3 text-white flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></span>
                    Usahaku POS - Mode Kasir
                  </span>
                  <span className="text-slate-400">Kasir: Fitri Indah</span>
                </div>

                {/* Tablet POS Simulator Layout */}
                <div className="grid grid-cols-12 flex-1 min-h-0 text-slate-800">
                  
                  {/* Left: Products Grid (8 cols) */}
                  <div className="col-span-8 p-3 border-r border-slate-200 space-y-3 bg-slate-55/30">
                    <div className="flex gap-2">
                      <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-md text-[10px] font-bold">Semua</span>
                      <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-505">Makanan</span>
                      <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-550">Minuman</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white border border-slate-200 rounded-xl p-2 text-center shadow-xs">
                        <span className="text-xl">🍜</span>
                        <p className="font-extrabold text-[10px] mt-1 truncate">Nasi Goreng</p>
                        <p className="text-[8px] text-slate-400 font-bold mt-0.5">25k</p>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-2 text-center shadow-xs">
                        <span className="text-xl">🍗</span>
                        <p className="font-extrabold text-[10px] mt-1 truncate">Ayam Bakar</p>
                        <p className="text-[8px] text-slate-400 font-bold mt-0.5">20k</p>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-2 text-center shadow-xs">
                        <span className="text-xl">☕</span>
                        <p className="font-extrabold text-[10px] mt-1 truncate">Es Kopi Susu</p>
                        <p className="text-[8px] text-slate-400 font-bold mt-0.5">15k</p>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-2 text-center shadow-xs">
                        <span className="text-xl">🍟</span>
                        <p className="font-extrabold text-[10px] mt-1 truncate">Kentang Goreng</p>
                        <p className="text-[8px] text-slate-400 font-bold mt-0.5">12k</p>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-2 text-center shadow-xs">
                        <span className="text-xl">🍹</span>
                        <p className="font-extrabold text-[10px] mt-1 truncate">Es Lemon Tea</p>
                        <p className="text-[8px] text-slate-400 font-bold mt-0.5">8k</p>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-2 text-center shadow-xs">
                        <span className="text-xl">🍌</span>
                        <p className="font-extrabold text-[10px] mt-1 truncate">Banana Split</p>
                        <p className="text-[8px] text-slate-400 font-bold mt-0.5">18k</p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Checkout Bill (4 cols) */}
                  <div className="col-span-4 bg-white p-3 flex flex-col justify-between h-full">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 border-b border-slate-100 pb-1.5">
                        <span>STRUK BARU</span>
                        <span>#0112</span>
                      </div>
                      
                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                        <div className="text-[9px] space-y-1">
                          <div className="flex justify-between">
                            <span className="font-bold">Nasi Goreng x1</span>
                            <span className="text-slate-550">25.000</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-bold">Es Kopi Susu x2</span>
                            <span className="text-slate-550">30.000</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-800">
                        <span>Total</span>
                        <span className="text-indigo-600">Rp 55.000</span>
                      </div>
                      <button className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg text-[9px] hover:bg-indigo-500 cursor-default">
                        Metode Pembayaran
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT B: Dashboard Owner */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center animate-fadeIn">
            {/* Left Column: Graphic Mockup Dashboard */}
            <div className="bg-slate-50 rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xl relative overflow-hidden order-2 lg:order-1">
              <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-inner flex flex-col min-h-[380px] p-4 sm:p-6 space-y-4">
                
                {/* Header */}
                <div className="flex justify-between items-center font-sans">
                  <div>
                    <div className="font-black text-sm text-slate-850">Analisis Laba & Omzet</div>
                    <p className="text-[10px] text-slate-400 font-bold">Ringkasan performa 3 outlet aktif</p>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold">
                    Ekspor Laporan
                  </span>
                </div>

                {/* 3 outlet bar charts comparison */}
                <div className="space-y-3 flex-1 justify-center flex flex-col font-sans">
                  {/* Outlet 1 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-605">
                      <span>Cabang Kemang (Jakarta)</span>
                      <span>Rp 12.4M (Terbesar)</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>

                  {/* Outlet 2 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-605">
                      <span>Cabang Blok M (Jakarta)</span>
                      <span>Rp 8.2M</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-400 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>

                  {/* Outlet 3 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-605">
                      <span>Cabang Braga (Bandung)</span>
                      <span>Rp 5.1M</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-400 rounded-full" style={{ width: '40%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Best selling item table widget */}
                <div className="border-t border-slate-100 pt-3 text-[10px] font-sans">
                  <span className="font-extrabold text-slate-500 tracking-wider block mb-2">PRODUK TERLARIS BULAN INI</span>
                  <div className="flex justify-between text-[9px] text-slate-400 border-b border-slate-100 pb-1.5 font-bold uppercase">
                    <span>Nama Menu</span>
                    <span>Terjual</span>
                    <span>Pendapatan</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    <div className="flex justify-between py-1.5">
                      <span className="font-bold text-slate-700">1. Nasi Goreng Gila</span>
                      <span className="font-bold text-slate-600">1,245 Porsi</span>
                      <span className="font-extrabold text-indigo-600">Rp 31.1M</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="font-bold text-slate-700">2. Kopi Aren Jumbo</span>
                      <span className="font-bold text-slate-600">980 Gelas</span>
                      <span className="font-extrabold text-indigo-600">Rp 14.7M</span>
                    </div>
                  </div>
                </div>

              </div>
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
                Semua transaksi kasir diakumulasikan secara otomatis to dashboard pemilik usaha. Dapatkan gambaran performa keuangan yang objektif tanpa rekap manual akhir hari.
              </p>
              <ul className="space-y-3.5">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-850 text-sm">Analisis Multi-Outlet Terpusat</h5>
                    <p className="text-xs text-slate-500 mt-0.5">Bandingkan omzet dan laba bersih antar cabang secara real-time dalam satu layar terpadu.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-850 text-sm">Ekspor Laporan File Excel & PDF</h5>
                    <p className="text-xs text-slate-500 mt-0.5">Unduh data penjualan bulanan atau laporan pajak dalam format yang siap pakai sekali klik.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-850 text-sm">Keamanan Enkripsi Data Transparan</h5>
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
