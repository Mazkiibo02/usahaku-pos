'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Wifi,
  WifiOff,
  Check,
  Play
} from 'lucide-react';

type Product = {
  id: string;
  name: string;
  price: number;
  category: 'food' | 'drink';
  emoji: string;
};

interface DemoSectionProps {
  isPhoneOffline: boolean;
  setIsPhoneOffline: (val: boolean) => void;
  phoneCart: { product: Product; quantity: number }[];
  addToPhoneCart: (prod: Product) => void;
  phonePendingSync: number;
  showPhoneReceipt: boolean;
  setShowPhoneReceipt: (val: boolean) => void;
  receiptCode: string;
  clearPhoneCart: () => void;
  handlePhoneCheckout: () => void;
  totalPhoneCart: number;
  INITIAL_PRODUCTS: Product[];
}

export default function DemoSection({
  isPhoneOffline,
  setIsPhoneOffline,
  phoneCart,
  addToPhoneCart,
  phonePendingSync,
  showPhoneReceipt,
  setShowPhoneReceipt,
  receiptCode,
  clearPhoneCart,
  handlePhoneCheckout,
  totalPhoneCart,
  INITIAL_PRODUCTS
}: DemoSectionProps) {
  return (
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
                  <h4 className="font-bold text-sm text-white">Tambahkan Produk Anda</h4>
                  <p className="text-xs text-slate-400 mt-1">Masukkan nama, harga, dan gambar/emoji produk. Atur kategori menu agar mudah ditemukan kasir.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-2xl flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Mulai Buka Shift Kasir</h4>
                  <p className="text-xs text-slate-400 mt-1">Masukkan nominal modal awal pada laci uang sebagai rekaman awal sebelum melayani transaksi.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-2xl flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Kasir Siap Transaksi</h4>
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
              <div className="bg-slate-955 rounded-[2.5rem] p-3 border-4 border-slate-800 max-w-[280px] mx-auto shadow-2xl">
                
                {/* Phone Internal Screen */}
                <div className="bg-slate-50 rounded-4xl overflow-hidden aspect-9/19 flex flex-col justify-between text-slate-800 relative select-none">
                  
                  {/* Status Bar */}
                  <div className="bg-white pt-5 pb-2 px-4 flex items-center justify-between border-b border-slate-200">
                    <span className="text-[9px] font-bold text-slate-505">14:58</span>
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
                            className="bg-white p-2 rounded-lg border border-slate-200 hover:border-indigo-400 text-left relative transition-all active:scale-95 text-slate-700 font-sans"
                          >
                            <span className="text-base block mb-0.5">{prod.emoji}</span>
                            <p className="font-bold text-[9px] line-clamp-1">{prod.name}</p>
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
                  <div className="bg-white border-t border-slate-200 p-2">
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
                          <p className="font-black text-[10px] text-slate-800">Struk Terbit!</p>
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
                          className="w-full bg-slate-955 text-white font-bold py-1 rounded text-[8px]"
                        >
                          Tutup
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Hand pointing to simulator */}
              <div className="absolute -left-6 bottom-16 bg-slate-955/95 border border-slate-800 text-white px-3 py-1.5 rounded-xl shadow-lg items-center gap-2 max-w-[140px] hidden md:flex animate-bounce">
                <Play className="w-3 h-3 text-indigo-400 shrink-0 fill-current" />
                <span className="text-[9px] font-bold">Coba klik menu & bayar</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
