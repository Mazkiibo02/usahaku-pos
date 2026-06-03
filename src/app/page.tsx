'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Smartphone,
  Laptop,
  Printer,
  Wifi,
  WifiOff,
  Users,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  DollarSign,
  Store,
  BarChart3,
  Receipt,
  FileSpreadsheet,
  Lock,
  RefreshCw,
  LogIn,
  ChevronRight,
  Menu,
  X,
  Check,
  Star,
  Play
} from 'lucide-react';

// Types for interactive simulator
type Product = {
  id: string;
  name: string;
  price: number;
  category: 'food' | 'drink';
  emoji: string;
};

const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Nasi Goreng Spesial', price: 25000, category: 'food', emoji: '🍜' },
  { id: '2', name: 'Ayam Geprek Sambal Korek', price: 18000, category: 'food', emoji: '🍗' },
  { id: '3', name: 'Es Teh Manis Jumbo', price: 6000, category: 'drink', emoji: '🍹' },
  { id: '4', name: 'Kopi Susu Gula Aren', price: 15000, category: 'drink', emoji: '☕' },
  { id: '5', name: 'Pisang Goreng Keju', price: 12000, category: 'food', emoji: '🍌' },
  { id: '6', name: 'Jus Alpukat Kocok', price: 17000, category: 'drink', emoji: '🥑' },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'checkout' | 'analytics'>('checkout');
  
  // Interactive Phone Simulator State
  const [phoneCart, setPhoneCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isPhoneOffline, setIsPhoneOffline] = useState(false);
  const [phonePendingSync, setPhonePendingSync] = useState(0);
  const [showPhoneReceipt, setShowPhoneReceipt] = useState(false);
  const [receiptCode, setReceiptCode] = useState('');

  // Dashboard state
  const [dashboardTimeframe, setDashboardTimeframe] = useState<'hari' | 'minggu'>('hari');

  // Sync animation timer
  useEffect(() => {
    if (!isPhoneOffline && phonePendingSync > 0) {
      const timer = setTimeout(() => {
        setPhonePendingSync(0);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isPhoneOffline, phonePendingSync]);

  // Handle adding product in simulator
  const addToPhoneCart = (product: Product) => {
    setPhoneCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromPhoneCart = (productId: string) => {
    setPhoneCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const clearPhoneCart = () => {
    setPhoneCart([]);
  };

  const handlePhoneCheckout = () => {
    if (phoneCart.length === 0) return;
    
    // Generate a random receipt number
    const code = 'TRX-' + Math.floor(100000 + Math.random() * 900000);
    setReceiptCode(code);
    
    if (isPhoneOffline) {
      setPhonePendingSync((prev) => prev + 1);
    }
    
    setShowPhoneReceipt(true);
  };

  const totalPhoneCart = phoneCart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <div className="bg-slate-50 text-slate-900 font-sans min-h-screen selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      
      {/* BACKGROUND DECORATIONS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] aspect-square rounded-full bg-linear-to-tr from-indigo-300/30 to-purple-400/20 blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[45%] aspect-square rounded-full bg-linear-to-br from-blue-300/20 to-violet-300/30 blur-[100px]" />
      </div>

      {/* FLOATING HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-50/80 border-b border-slate-200/50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
                <Store className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-linear-to-r from-slate-900 to-indigo-950">
                Usahaku<span className="text-indigo-600">POS</span>
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#fitur" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
                Fitur Utama
              </a>
              <a href="#demo" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
                Demo Interaktif
              </a>
              <a href="#showcase" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
                Tampilan Layar
              </a>
              <a href="#faq" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
                Pertanyaan
              </a>
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-bold text-slate-700 hover:text-indigo-600 px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
              >
                <LogIn className="w-4 h-4" />
                Masuk
              </Link>
              <Link
                href="/register"
                className="text-sm font-bold text-white bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-5 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Daftar Sekarang
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 border-b border-slate-200 backdrop-blur-md absolute top-full left-0 w-full animate-fadeIn shadow-lg">
            <div className="px-4 pt-2 pb-6 space-y-3">
              <a
                href="#fitur"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                Fitur Utama
              </a>
              <a
                href="#demo"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                Demo Interaktif
              </a>
              <a
                href="#showcase"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                Tampilan Layar
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                Pertanyaan
              </a>
              <hr className="border-slate-100 my-2" />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 transition-colors text-center shadow-md shadow-indigo-500/10"
                >
                  Daftar
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

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
              <Link
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
                <Check className="w-4 h-4 text-emerald-500 stroke-[3px]" /> Gratis Selamanya
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

            <div className="relative flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-12">
              
              {/* LAPTOP MOCKUP (Dashboard Visual) */}
              <div className="w-full md:w-[65%] bg-slate-900 rounded-3xl p-3 sm:p-4 shadow-2xl border border-slate-700/50 transform hover:scale-[1.01] transition-transform duration-500 relative order-2 md:order-1">
                {/* Screen Header / Glossy Reflection */}
                <div className="absolute top-0 left-0 right-0 h-[60%] bg-linear-to-b from-white/5 to-transparent rounded-t-2xl pointer-events-none" />
                
                {/* Laptop Internal Screen Container */}
                <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 text-slate-300 font-mono text-xs shadow-inner">
                  
                  {/* Mock Browser Header */}
                  <div className="bg-slate-900 px-4 py-3 flex items-center gap-2 border-b border-slate-800">
                    <div className="flex gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-rose-500/80 block"></span>
                      <span className="w-3 h-3 rounded-full bg-amber-500/80 block"></span>
                      <span className="w-3 h-3 rounded-full bg-emerald-500/80 block"></span>
                    </div>
                    <div className="mx-auto bg-slate-950/80 text-[10px] text-slate-500 px-4 py-1 rounded-md w-1/2 text-center border border-slate-800/40 select-none">
                      admin.usahakupos.com/dashboard
                    </div>
                  </div>

                  {/* Mock Dashboard Area */}
                  <div className="p-4 sm:p-6 space-y-4 font-sans text-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-400">Ringkasan Penjualan</h4>
                        <p className="text-xs text-slate-500">Cabang Kemang • Hari Ini</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDashboardTimeframe('hari')}
                          className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                            dashboardTimeframe === 'hari'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          Hari Ini
                        </button>
                        <button
                          onClick={() => setDashboardTimeframe('minggu')}
                          className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                            dashboardTimeframe === 'minggu'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          Minggu Ini
                        </button>
                      </div>
                    </div>

                    {/* KPI Widget Cards */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Omzet</p>
                        <p className="text-xs sm:text-sm font-black text-indigo-400 mt-1">
                          {dashboardTimeframe === 'hari' ? 'Rp 2.450.000' : 'Rp 18.920.000'}
                        </p>
                        <span className="text-[9px] text-emerald-400 font-bold">↑ 12.4% vs kemarin</span>
                      </div>
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Transaksi</p>
                        <p className="text-xs sm:text-sm font-black text-slate-200 mt-1">
                          {dashboardTimeframe === 'hari' ? '84 Order' : '612 Order'}
                        </p>
                        <span className="text-[9px] text-slate-500 font-bold">Rata-rata Rp {dashboardTimeframe === 'hari' ? '29k' : '31k'}</span>
                      </div>
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Shift Kasir</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <p className="text-xs sm:text-sm font-black text-emerald-400">Aktif</p>
                        </div>
                        <span className="text-[9px] text-slate-500 font-bold">Kasir: Budi Utama</span>
                      </div>
                    </div>

                    {/* SVG Analytics Graph */}
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/60 h-40 flex flex-col justify-between">
                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span>Grafik Pendapatan</span>
                        <span className="text-indigo-400 font-bold">Rp (Ribu)</span>
                      </div>
                      
                      {/* Interactive SVG Chart */}
                      <div className="w-full h-24 relative flex items-end">
                        <svg className="w-full h-full text-indigo-500" viewBox="0 0 300 80" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          {/* Paths depending on timeframe */}
                          {dashboardTimeframe === 'hari' ? (
                            <>
                              <path
                                d="M 0 65 Q 40 45 80 55 T 160 20 T 240 35 T 300 10 L 300 80 L 0 80 Z"
                                fill="url(#chart-grad)"
                              />
                              <path
                                d="M 0 65 Q 40 45 80 55 T 160 20 T 240 35 T 300 10"
                                fill="none"
                                stroke="rgb(99, 102, 241)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                            </>
                          ) : (
                            <>
                              <path
                                d="M 0 70 L 50 50 L 100 60 L 150 25 L 200 40 L 250 15 L 300 5 L 300 80 L 0 80 Z"
                                fill="url(#chart-grad)"
                              />
                              <path
                                d="M 0 70 L 50 50 L 100 60 L 150 25 L 200 40 L 250 15 L 300 5"
                                fill="none"
                                stroke="rgb(99, 102, 241)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                            </>
                          )}
                        </svg>
                        
                        {/* Hover values tooltip */}
                        <div className="absolute top-1 right-[10%] bg-slate-950/90 text-[8px] text-white px-2 py-0.5 rounded border border-slate-800">
                          {dashboardTimeframe === 'hari' ? '14:00 - Rp 850k' : 'Sabtu - Rp 3.8M'}
                        </div>
                      </div>

                      {/* X Axis labels */}
                      <div className="flex justify-between text-[8px] text-slate-500">
                        {dashboardTimeframe === 'hari' ? (
                          <>
                            <span>08:00</span>
                            <span>11:00</span>
                            <span>14:00</span>
                            <span>17:00</span>
                            <span>20:00</span>
                          </>
                        ) : (
                          <>
                            <span>Sen</span>
                            <span>Sel</span>
                            <span>Rab</span>
                            <span>Kam</span>
                            <span>Jum</span>
                            <span>Sab</span>
                            <span>Ming</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Bottom grid: Best sellers list */}
                    <div className="flex items-center justify-between text-xs border-t border-slate-800/80 pt-3 text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                        Semua data tersinkronisasi otomatis
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold hover:text-indigo-400 cursor-pointer">
                        Lihat Laporan Lengkap →
                      </span>
                    </div>

                  </div>

                </div>
              </div>

              {/* MOBILE PHONE MOCKUP (Interactive Cashier App) */}
              <div className="w-full max-w-[290px] bg-slate-900 rounded-[3.2rem] p-3.5 shadow-2xl border-4 border-slate-700/80 transform hover:-translate-y-2 md:-translate-y-4 hover:rotate-1 rotate-0 md:-rotate-1 transition-all duration-500 relative order-1 md:order-2 z-20 group">
                {/* Glow ring on hover */}
                <div className="absolute -inset-1 rounded-[3.3rem] bg-linear-to-tr from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300 pointer-events-none" />

                {/* Phone Speaker and Camera (Dynamic Island cutout) */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-950 rounded-full flex items-center justify-between px-2.5 z-30 select-none">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
                  <div className="w-12 h-1 bg-slate-850 rounded-full" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
                </div>

                {/* Inner Screen Container */}
                <div className="bg-slate-100 rounded-[2.5rem] overflow-hidden aspect-9/19 flex flex-col justify-between text-slate-800 relative select-none">
                  
                  {/* App Header Status Bar */}
                  <div className="bg-white pt-6 pb-2.5 px-5 flex items-center justify-between border-b border-slate-200">
                    <span className="text-[10px] font-bold text-slate-800">14:58</span>
                    
                    {/* Toggle Button for Offline Mode */}
                    <button
                      onClick={() => setIsPhoneOffline(!isPhoneOffline)}
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-extrabold tracking-wider transition-colors ${
                        isPhoneOffline 
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                      }`}
                      title={isPhoneOffline ? "Klik untuk mengaktifkan koneksi" : "Klik untuk mencoba simulasi offline"}
                    >
                      {isPhoneOffline ? (
                        <>
                          <WifiOff className="w-2.5 h-2.5" /> OFFLINE
                        </>
                      ) : (
                        <>
                          <Wifi className="w-2.5 h-2.5 text-indigo-600" /> ONLINE
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="w-3 h-2 bg-slate-800 rounded-sm relative inline-block">
                        <span className="absolute top-0.5 right-0.5 bottom-0.5 left-0.5 bg-emerald-500 rounded-xs"></span>
                      </span>
                    </div>
                  </div>

                  {/* Simulator Screen Body */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    
                    {/* Active Offline Alert Notification */}
                    {isPhoneOffline && (
                      <div className="bg-rose-50 border border-rose-100 rounded-xl p-2 text-[9px] text-rose-800 leading-tight flex gap-1.5 items-start">
                        <WifiOff className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Mode Offline Aktif</p>
                          <p className="text-slate-500">Antrean struk akan disimpan dan otomatis disinkronkan saat Wi-Fi menyala kembali.</p>
                        </div>
                      </div>
                    )}

                    {/* App Sync Indicator */}
                    {phonePendingSync > 0 && !isPhoneOffline && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2 text-[9px] text-emerald-800 leading-tight flex gap-1.5 items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <RefreshCw className="w-3 h-3 text-emerald-500 animate-spin" />
                          <span className="font-semibold">Sinkronisasi {phonePendingSync} data transaksi...</span>
                        </div>
                        <span className="text-[8px] bg-emerald-500 text-white font-bold px-1 py-0.5 rounded">Sukses</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 tracking-wide uppercase px-0.5">
                      <span>Menu Kasir</span>
                      <span>Ketuk Item</span>
                    </div>

                    {/* Interactive Item Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {INITIAL_PRODUCTS.map((prod) => {
                        const inCartCount = phoneCart.find(item => item.product.id === prod.id)?.quantity || 0;
                        return (
                          <button
                            key={prod.id}
                            onClick={() => addToPhoneCart(prod)}
                            className="bg-white p-2.5 rounded-xl border border-slate-200/80 hover:border-indigo-400 hover:shadow-sm text-left relative transition-all active:scale-95 group/item"
                          >
                            <span className="text-lg block mb-1">{prod.emoji}</span>
                            <h5 className="font-bold text-[10px] text-slate-800 line-clamp-1 group-hover/item:text-indigo-600">{prod.name}</h5>
                            <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Rp {prod.price.toLocaleString('id-ID')}</p>
                            
                            {inCartCount > 0 && (
                              <span className="absolute top-1 right-1 bg-indigo-600 text-white text-[8px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                                {inCartCount}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Interactive Cart Panel at Bottom */}
                  <div className="bg-white border-t border-slate-200 p-3 space-y-2">
                    {phoneCart.length === 0 ? (
                      <div className="py-4 text-center text-[10px] text-slate-400 font-semibold italic">
                        Keranjang masih kosong
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {/* Compact items list in Cart */}
                        <div className="max-h-[64px] overflow-y-auto space-y-1 pr-0.5">
                          {phoneCart.map((item) => (
                            <div key={item.product.id} className="flex justify-between items-center text-[9px] bg-slate-50 px-2 py-1 rounded">
                              <span className="font-semibold text-slate-700 line-clamp-1 w-2/3">
                                {item.product.name}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={(e) => { e.stopPropagation(); removeFromPhoneCart(item.product.id); }}
                                  className="w-3.5 h-3.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold flex items-center justify-center text-[10px] transition-colors"
                                >
                                  -
                                </button>
                                <span className="font-bold text-slate-800">{item.quantity}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); addToPhoneCart(item.product); }}
                                  className="w-3.5 h-3.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold flex items-center justify-center text-[10px] transition-colors"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Total pricing and clear button */}
                        <div className="flex justify-between items-center border-t border-slate-100 pt-1.5 text-[10px]">
                          <button
                            onClick={clearPhoneCart}
                            className="text-rose-500 font-bold hover:underline"
                          >
                            Hapus
                          </button>
                          <div className="text-right">
                            <span className="text-[8px] text-slate-400 font-semibold block">Total Bayar</span>
                            <span className="font-black text-indigo-600">Rp {totalPhoneCart.toLocaleString('id-ID')}</span>
                          </div>
                        </div>

                        {/* Pay Button */}
                        <button
                          onClick={handlePhoneCheckout}
                          className="w-full bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-2 rounded-xl text-[10px] text-center shadow-md transition-all active:scale-98"
                        >
                          Bayar Sekarang
                        </button>
                      </div>
                    )}
                  </div>

                  {/* SIMULATED RECEIPT POPUP (Receipt screen) */}
                  {showPhoneReceipt && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40 animate-fadeIn">
                      <div className="bg-white w-full rounded-2xl p-4 shadow-xl text-center space-y-3 border border-slate-100 max-w-[240px] animate-scaleUp">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                          <Check className="w-6 h-6 stroke-[3px]" />
                        </div>
                        <div>
                          <h4 className="font-black text-xs text-slate-800">Transaksi Berhasil!</h4>
                          <p className="text-[8px] text-slate-400 font-bold mt-0.5">{receiptCode}</p>
                        </div>
                        
                        {/* Receipt details list */}
                        <div className="border-t border-b border-dashed border-slate-200 py-2 text-left text-[9px] space-y-1 font-mono text-slate-600">
                          {phoneCart.map((item) => (
                            <div key={item.product.id} className="flex justify-between">
                              <span>{item.product.name} x{item.quantity}</span>
                              <span>{(item.product.price * item.quantity).toLocaleString('id-ID')}</span>
                            </div>
                          ))}
                          <div className="border-t border-dashed border-slate-200 pt-1 flex justify-between font-black text-slate-800">
                            <span>TOTAL</span>
                            <span>Rp {totalPhoneCart.toLocaleString('id-ID')}</span>
                          </div>
                        </div>

                        {isPhoneOffline && (
                          <div className="bg-amber-50 rounded-lg p-1.5 text-[8px] text-amber-800 text-left font-sans">
                            ⚠️ Struk disimpan secara lokal karena offline, sinkronisasi otomatis nanti.
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setShowPhoneReceipt(false);
                            clearPhoneCart();
                          }}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 rounded-lg text-[9px] transition-colors"
                        >
                          Transaksi Baru
                        </button>
                      </div>
                    </div>
                  )}

                </div>

              </div>

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
            
            {/* Box 1 (Large Box - 2 cols): PWA Offline Mode */}
            <div className="md:col-span-2 bg-linear-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative shadow-lg group hover:-translate-y-1 transition-all duration-300 min-h-[320px]">
              {/* Abstract layout background */}
              <div className="absolute -bottom-8 -right-8 w-64 h-64 rounded-full bg-white/5 blur-2xl group-hover:bg-white/10 transition-colors duration-300" />
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                    <WifiOff className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-xl sm:text-2xl font-black mb-3">PWA Offline Mode</h4>
                  <p className="text-indigo-100 text-sm sm:text-base max-w-md leading-relaxed">
                    Aplikasi tetap berjalan dan menyimpan antrean transaksi meski Wi-Fi mati. Data otomatis disinkronkan ke cloud saat koneksi internet kembali normal.
                  </p>
                </div>

                <div className="mt-8 flex items-center gap-4 bg-white/10 backdrop-blur-xs p-3 rounded-2xl max-w-sm border border-white/10">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-white stroke-[3px]" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold">Transaksi Jalan Terus Tanpa Khawatir Kuota Habis</span>
                </div>
              </div>
            </div>

            {/* Box 2 (Standard Box - 1 col): Cetak Struk Instan */}
            <div className="bg-sky-50 border border-sky-100 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-sm group hover:-translate-y-1 transition-all duration-300 min-h-[320px]">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center mb-6 text-sky-600">
                  <Printer className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-black text-slate-800 mb-3">Cetak Struk Instan</h4>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Dukungan printer thermal Bluetooth & simpan sebagai PDF. Kirim struk instan digital via WhatsApp/Email langsung ke pelanggan Anda.
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-sky-100/50 flex flex-col space-y-2">
                <span className="text-[10px] text-sky-600 font-extrabold uppercase tracking-wide">Mendukung Printer Thermal</span>
                <div className="flex gap-2 text-xs font-bold text-slate-600">
                  <span className="px-2 py-1 bg-white rounded border border-slate-200">58mm</span>
                  <span className="px-2 py-1 bg-white rounded border border-slate-200">80mm</span>
                  <span className="px-2 py-1 bg-white rounded border border-slate-200">PDF E-Receipt</span>
                </div>
              </div>
            </div>

            {/* Box 3 (Standard Box - 1 col): Manajemen Shift */}
            <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-sm group hover:-translate-y-1 transition-all duration-300 min-h-[320px]">
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

            {/* Box 4 (Large Box - 2 cols): Multi-Cabang */}
            <div className="md:col-span-2 bg-indigo-50 border border-indigo-100 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-sm group hover:-translate-y-1 transition-all duration-300 min-h-[320px] relative overflow-hidden">
              {/* Decorative mini graph mockup */}
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

              <div className="mt-8 pt-4 border-t border-indigo-100/50 flex flex-wrap gap-4 text-xs font-bold text-slate-600">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Akses Role Staff</span>
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

      {/* DETAILED INTERACTIVE DEMO / WORKFLOW SECTION */}
      <section id="demo" className="py-20 sm:py-28 bg-slate-900 text-white relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-[40%] aspect-square rounded-full bg-indigo-500/10 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[40%] aspect-square rounded-full bg-violet-500/10 blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold tracking-wider uppercase mb-3 inline-block">
              Demo Interaktif Aplikasi
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
              Coba Langsung Simulasi Transaksi
            </h2>
            <p className="text-sm sm:text-base text-slate-400 font-medium">
              Gunakan simulator kasir interaktif di bawah ini untuk melihat kecepatan transaksi dan fleksibilitas mode offline kami.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Steps & Explanatory Left side */}
            <div className="lg:col-span-5 space-y-8">
              
              <div className="space-y-4">
                <h3 className="text-2xl font-black">Bagaimana Cara Kerjanya?</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Kami menghilangkan kerumitan sistem POS tradisional. Anda bisa mendaftar dan mulai berjualan langsung dalam beberapa ketukan.
                </p>
              </div>

              {/* Step list cards */}
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-2xl flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shrink-0">
                    1
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-white">Tambahkan Produk Anda</h5>
                    <p className="text-xs text-slate-400 mt-1">Masukkan nama, harga, dan gambar/emoji produk. Atur kategori menu agar mudah ditemukan kasir.</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-2xl flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shrink-0">
                    2
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-white">Mulai Buka Shift Kasir</h5>
                    <p className="text-xs text-slate-400 mt-1">Masukkan nominal modal awal pada laci uang sebagai rekaman awal sebelum melayani transaksi.</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-2xl flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shrink-0">
                    3
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-white">Kasir Siap Transaksi</h5>
                    <p className="text-xs text-slate-400 mt-1">Ketuk menu di layar handphone untuk menambah ke keranjang, cetak struk via bluetooth atau kirim online.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 bg-linear-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg transition-all"
                >
                  Mulai Buat Toko Anda Sekarang
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

            </div>

            {/* Simulated Live POS App Right side */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-6 w-full max-w-md relative">
                
                {/* Floating offline simulation trigger */}
                <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-3 rounded-xl mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-slate-300">Simulator Dashboard</span>
                  </div>
                  <button
                    onClick={() => setIsPhoneOffline(!isPhoneOffline)}
                    className={`text-[10px] font-bold px-3 py-1 rounded transition-colors ${
                      isPhoneOffline
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/20'
                    }`}
                  >
                    {isPhoneOffline ? "Simulasi Online kembali" : "Simulasi Putuskan Koneksi (Offline)"}
                  </button>
                </div>

                {/* Smartphone Emulator container */}
                <div className="bg-slate-950 rounded-[2.5rem] p-3 border-4 border-slate-800 max-w-[280px] mx-auto shadow-2xl">
                  
                  {/* Phone Internal Screen */}
                  <div className="bg-slate-50 rounded-4xl overflow-hidden aspect-9/19 flex flex-col justify-between text-slate-800 relative select-none">
                    
                    {/* Status Bar */}
                    <div className="bg-white pt-5 pb-2 px-4 flex items-center justify-between border-b border-slate-200">
                      <span className="text-[9px] font-bold text-slate-500">14:58</span>
                      <div className="flex items-center gap-1">
                        {isPhoneOffline ? (
                          <span className="flex items-center gap-0.5 text-[8px] bg-rose-500 text-white font-extrabold px-1 rounded">
                            <WifiOff className="w-2 h-2" /> OFFLINE
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-[8px] bg-emerald-50 text-emerald-600 font-extrabold px-1 rounded">
                            <Wifi className="w-2 h-2" /> ONLINE
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Simulator Menu */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider px-1">Ketuk menu di bawah</p>
                      
                      <div className="grid grid-cols-2 gap-1.5">
                        {INITIAL_PRODUCTS.map((prod) => {
                          const count = phoneCart.find(item => item.product.id === prod.id)?.quantity || 0;
                          return (
                            <button
                              key={prod.id}
                              onClick={() => addToPhoneCart(prod)}
                              className="bg-white p-2 rounded-lg border border-slate-200 hover:border-indigo-400 text-left relative transition-all active:scale-95 text-slate-700"
                            >
                              <span className="text-base block mb-0.5">{prod.emoji}</span>
                              <h6 className="font-bold text-[9px] line-clamp-1">{prod.name}</h6>
                              <p className="text-[8px] text-slate-400 mt-0.5">Rp {prod.price.toLocaleString('id-ID')}</p>
                              {count > 0 && (
                                <span className="absolute top-1 right-1 bg-indigo-600 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                  {count}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom Cart Drawer */}
                    <div className="bg-white border-t border-slate-250 p-2">
                      {phoneCart.length === 0 ? (
                        <div className="py-3 text-center text-[9px] text-slate-400 font-semibold italic">
                          Keranjang kosong
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="max-h-[50px] overflow-y-auto space-y-0.5">
                            {phoneCart.map((item) => (
                              <div key={item.product.id} className="flex justify-between items-center text-[8px] bg-slate-50 px-1.5 py-0.5 rounded">
                                <span className="font-semibold text-slate-700 line-clamp-1 w-2/3">{item.product.name}</span>
                                <span className="font-bold text-slate-800">x{item.quantity}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-between items-center border-t border-slate-100 pt-1 text-[9px]">
                            <span className="text-[8px] text-slate-400 font-bold">Total</span>
                            <span className="font-black text-indigo-600">Rp {totalPhoneCart.toLocaleString('id-ID')}</span>
                          </div>

                          <button
                            onClick={handlePhoneCheckout}
                            className="w-full bg-indigo-600 text-white font-bold py-1.5 rounded-lg text-[9px] text-center"
                          >
                            Simulasi Bayar
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Successful Checkout Popup */}
                    {showPhoneReceipt && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 z-40">
                        <div className="bg-white w-full rounded-xl p-3 shadow-xl text-center space-y-2 border border-slate-100 max-w-[200px]">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                            <Check className="w-5 h-5 stroke-[3px]" />
                          </div>
                          <div>
                            <h4 className="font-black text-[10px] text-slate-800">Struk Terbit!</h4>
                            <p className="text-[8px] text-slate-400 font-bold">{receiptCode}</p>
                          </div>
                          <div className="border-t border-b border-dashed border-slate-200 py-1 text-left text-[8px] font-mono text-slate-500">
                            {phoneCart.map((item) => (
                              <div key={item.product.id} className="flex justify-between">
                                <span>{item.product.name} x{item.quantity}</span>
                                <span>{(item.product.price * item.quantity).toLocaleString('id-ID')}</span>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => {
                              setShowPhoneReceipt(false);
                              clearPhoneCart();
                            }}
                            className="w-full bg-slate-950 text-white font-bold py-1 rounded text-[8px]"
                          >
                            Tutup
                          </button>
                        </div>
                      </div>
                    )}

                  </div>

                </div>

                {/* Hand pointing to simulator */}
                <div className="absolute -left-6 bottom-16 bg-slate-950/95 border border-slate-800 text-white px-3 py-1.5 rounded-xl shadow-lg items-center gap-2 max-w-[140px] hidden md:flex animate-bounce">
                  <Play className="w-3 h-3 text-indigo-400 shrink-0 fill-current" />
                  <span className="text-[9px] font-bold">Coba klik menu & bayar</span>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* DETAILED SCREEN / UI SHOWCASE SECTION */}
      <section id="showcase" className="py-20 sm:py-28 relative z-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-20">
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
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🚀 Layar Kasir (POS)
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                    activeTab === 'analytics'
                      ? 'bg-white text-indigo-600 shadow-sm'
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
                      <h6 className="font-extrabold text-slate-850 text-sm">Responsif & Bebas Lag</h6>
                      <p className="text-xs text-slate-500 mt-0.5">Teknologi Single Page Application (SPA) memastikan perpindahan menu instan.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[3px]" />
                    </div>
                    <div>
                      <h6 className="font-extrabold text-slate-850 text-sm">Pencarian Menu & Filter Cepat</h6>
                      <p className="text-xs text-slate-500 mt-0.5">Cari produk berdasarkan nama atau filter berdasarkan kategori instan dalam satu ketukan.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[3px]" />
                    </div>
                    <div>
                      <h6 className="font-extrabold text-slate-850 text-sm">Metode Pembayaran Fleksibel</h6>
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
                        <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-500">Makanan</span>
                        <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-500">Minuman</span>
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
                              <span className="text-slate-500">25.000</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-bold">Es Kopi Susu x2</span>
                              <span className="text-slate-500">30.000</span>
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
                  <div className="flex justify-between items-center">
                    <div>
                      <h5 className="font-black text-sm text-slate-800">Analisis Laba & Omzet</h5>
                      <p className="text-[10px] text-slate-400 font-bold">Ringkasan performa 3 outlet aktif</p>
                    </div>
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold">
                      Ekspor Laporan
                    </span>
                  </div>

                  {/* 3 outlet bar charts comparison */}
                  <div className="space-y-3 flex-1 justify-center flex flex-col">
                    {/* Outlet 1 */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-600">
                        <span>Cabang Kemang (Jakarta)</span>
                        <span>Rp 12.4M (Terbesar)</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>

                    {/* Outlet 2 */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-600">
                        <span>Cabang Blok M (Jakarta)</span>
                        <span>Rp 8.2M</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-400 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                    </div>

                    {/* Outlet 3 */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-600">
                        <span>Cabang Braga (Bandung)</span>
                        <span>Rp 5.1M</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-400 rounded-full" style={{ width: '40%' }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Best selling item table widget */}
                  <div className="border-t border-slate-100 pt-3 text-[10px]">
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
                  Semua transaksi kasir diakumulasikan secara otomatis ke dashboard pemilik usaha. Dapatkan gambaran performa keuangan yang objektif tanpa rekap manual akhir hari.
                </p>
                <ul className="space-y-3.5">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[3px]" />
                    </div>
                    <div>
                      <h6 className="font-extrabold text-slate-850 text-sm">Analisis Multi-Outlet Terpusat</h6>
                      <p className="text-xs text-slate-500 mt-0.5">Bandingkan omzet dan laba bersih antar cabang secara real-time dalam satu layar terpadu.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[3px]" />
                    </div>
                    <div>
                      <h6 className="font-extrabold text-slate-850 text-sm">Ekspor Laporan File Excel & PDF</h6>
                      <p className="text-xs text-slate-500 mt-0.5">Unduh data penjualan bulanan atau laporan pajak dalam format yang siap pakai sekali klik.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[3px]" />
                    </div>
                    <div>
                      <h6 className="font-extrabold text-slate-850 text-sm">Keamanan Enkripsi Data Transparan</h6>
                      <p className="text-xs text-slate-500 mt-0.5">Semua data transaksi di-backup aman di cloud Firebase dengan enkripsi tingkat tinggi.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          )}

        </div>
      </section>

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
              <h5 className="font-bold text-slate-850 text-base mb-2">Apakah Usahaku POS benar-benar bisa gratis?</h5>
              <p className="text-sm text-slate-500 leading-relaxed">
                Ya! Kami menyediakan paket gratis selamanya yang mencakup fungsionalitas dasar kasir, mode offline, dan pencatatan transaksi untuk 1 outlet. Anda dapat mendaftar tanpa kartu kredit.
              </p>
            </div>

            {/* FAQ 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs">
              <h5 className="font-bold text-slate-850 text-base mb-2">Bagaimana cara kerja mode offline jika internet mati?</h5>
              <p className="text-sm text-slate-500 leading-relaxed">
                Usahaku POS menggunakan teknologi Progressive Web App (PWA) modern. Saat Wi-Fi atau seluler terputus, aplikasi tetap berjalan normal untuk input pesanan. Seluruh data disimpan di penyimpanan lokal browser Anda, lalu disinkronkan otomatis ke server saat Anda online kembali.
              </p>
            </div>

            {/* FAQ 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs">
              <h5 className="font-bold text-slate-850 text-base mb-2">Printer thermal apa saja yang didukung?</h5>
              <p className="text-sm text-slate-500 leading-relaxed">
                Kami mendukung hampir seluruh printer thermal bluetooth standar berukuran kertas 58mm dan 80mm yang umum dijual di marketplace. Anda juga bisa mengunduh struk berformat PDF untuk dicetak via komputer biasa atau dikirim sebagai bukti digital.
              </p>
            </div>

            {/* FAQ 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs">
              <h5 className="font-bold text-slate-850 text-base mb-2">Apakah saya bisa menggunakan satu akun untuk banyak cabang?</h5>
              <p className="text-sm text-slate-500 leading-relaxed">
                Tentu saja. Dengan mendaftar sebagai Owner, Anda dapat membuat beberapa tenant/outlet dan mengundang kasir atau manajer yang berbeda untuk mengelola tiap cabang secara mandiri dari satu akun dashboard pusat Anda.
              </p>
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
          <p className="text-base sm:text-lg text-slate-350 max-w-xl mx-auto mb-10 leading-relaxed">
            Bergabunglah dengan ratusan pemilik toko di Indonesia yang telah beralih ke Usahaku POS. Mudah dioperasikan, aman, dan tanpa biaya bulanan tersembunyi.
          </p>

          {/* Dual buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
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
            ✓ Gratis 14 Hari Demo Fitur Premium • Tanpa Kontrak Mengikat
          </p>
        </div>
      </section>

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
              <h6 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Aplikasi</h6>
              <ul className="space-y-2.5 text-xs">
                <li><a href="#fitur" className="hover:text-white transition-colors">Fitur POS</a></li>
                <li><a href="#demo" className="hover:text-white transition-colors">Demo Simulator</a></li>
                <li><a href="#showcase" className="hover:text-white transition-colors">Tampilan Layar</a></li>
              </ul>
            </div>

            <div>
              <h6 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Pengguna</h6>
              <ul className="space-y-2.5 text-xs">
                <li><Link href="/login" className="hover:text-white transition-colors">Login Kasir / Owner</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Daftar Akun Baru</Link></li>
                <li><a href="https://wa.me/6285117821129" className="hover:text-white transition-colors">Bantuan Teknis</a></li>
              </ul>
            </div>

            <div>
              <h6 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Legalitas</h6>
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
