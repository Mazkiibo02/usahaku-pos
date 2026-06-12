'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  LogOut,
  ShieldAlert,
  Sparkles,
  MessageCircle,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import Script from 'next/script';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/src/features/auth/hooks/use-auth';
import { auth, db, functions } from '@/src/lib/firebase';

declare global {
  interface Window {
    snap: any;
  }
}

type PaymentState = 'idle' | 'token-generation' | 'waiting-payment' | 'success' | 'pending-confirmation' | 'error';

export function SubscriptionLock() {
  const { role, signOut, tenantId } = useAuth();
  const [isRenewing, setIsRenewing] = useState(false);
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activePlanType, setActivePlanType] = useState<'1-outlet' | '2-outlets' | '4-outlets' | null>(null);

  // States for manual sync and throttling
  const [pendingInvoiceId, setPendingInvoiceId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncCooldown, setSyncCooldown] = useState<number>(0);

  const isOwner = role === 'owner';

  const pricingTiers = [
    {
      type: '1-outlet' as const,
      name: 'Paket 1 Outlet',
      price: 'Rp 25.000',
      period: '/ bln',
      description: 'Ideal untuk toko tunggal/usaha kecil.',
      features: [
        '1 Outlet Aktif',
        'Pencatatan Transaksi Tanpa Batas',
        'Cetak Struk Thermal 58mm',
        'Laporan Penjualan Harian & Bulanan',
      ],
      badge: 'Hemat',
      popular: false,
    },
    {
      type: '2-outlets' as const,
      name: 'Paket 2 Outlets',
      price: 'Rp 50.000',
      period: '/ bln',
      description: 'Cocok untuk pemilik usaha dengan 1 cabang tambahan.',
      features: [
        'Hingga 2 Outlet Aktif',
        'Manajemen Shift Kasir',
        'Laporan Real-time Cabang',
        'Integrasi Logo Usaha Kustom',
      ],
      badge: 'Populer',
      popular: true,
    },
    {
      type: '4-outlets' as const,
      name: 'Paket 4 Outlets',
      price: 'Rp 100.000',
      period: '/ bln',
      description: 'Solusi lengkap untuk multi-cabang skala menengah.',
      features: [
        'Hingga 4 Outlet Aktif',
        'Multi-Kasir Tanpa Batas',
        'Analisis Bisnis Mendalam',
        'Prioritas Dukungan 24/7',
      ],
      badge: 'Terbaik',
      popular: false,
    },
  ];

  const handlePay = async (planType: '1-outlet' | '2-outlets' | '4-outlets') => {
    setIsRenewing(true);
    setPaymentState('token-generation');
    setErrorMessage(null);
    setActivePlanType(planType);

    try {
      let grossAmount = 0;
      if (planType === '1-outlet') grossAmount = 25000;
      else if (planType === '2-outlets') grossAmount = 50000;
      else if (planType === '4-outlets') grossAmount = 100000;

      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error('Autentikasi diperlukan. Silakan masuk kembali.');
      }

      const response = await fetch('/api/midtrans/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          grossAmount,
          tenantId,
          planName: planType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Gagal memproses token pembayaran.');
      }

      const { token, orderId } = await response.json();
      setPendingInvoiceId(orderId);

      if (!window.snap) {
        throw new Error('Midtrans Snap SDK is not loaded yet. Please wait a moment and try again.');
      }

      setPaymentState('waiting-payment');

      window.snap.pay(token, {
        onSuccess: (res: any) => {
          console.log('Payment Success:', res);
          setPaymentState('success');
          setIsRenewing(false);
          setActivePlanType(null);
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        },
        onPending: (res: any) => {
          console.log('Payment Pending:', res);
          setPaymentState('pending-confirmation');
          setIsRenewing(false);
          setActivePlanType(null);
        },
        onError: (res: any) => {
          console.error('Payment Error:', res);
          setPaymentState('error');
          setErrorMessage('Terjadi kesalahan saat memproses pembayaran.');
          setIsRenewing(false);
          setActivePlanType(null);
        },
        onClose: () => {
          console.log('Payment checkout closed');
          setPaymentState('idle');
          setIsRenewing(false);
          setActivePlanType(null);
        }
      });
    } catch (err: any) {
      console.error('Payment initialization failed:', err);
      setPaymentState('error');
      setErrorMessage(err?.message || 'Gagal menyiapkan transaksi. Silakan coba lagi.');
      setIsRenewing(false);
    }
  };

  // Fetch pending invoice on mount/render
  useEffect(() => {
    if (!tenantId || !isOwner) return;

    const fetchPendingInvoice = async () => {
      try {
        const q = query(
          collection(db, 'invoices'),
          where('tenantId', '==', tenantId),
          where('status', '==', 'PENDING')
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const docs = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as { id: string; createdAt?: any }));
          
          // Sort by createdAt descending in-memory to get the latest
          docs.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
          });

          setPendingInvoiceId(docs[0].id);
        } else {
          setPendingInvoiceId(null);
        }
      } catch (err) {
        console.error('Error fetching pending invoices:', err);
      }
    };

    fetchPendingInvoice();
  }, [tenantId, isOwner]);

  // LocalStorage unix-timestamp cooldown logic
  useEffect(() => {
    if (!pendingInvoiceId) {
      setSyncCooldown(0);
      return;
    }

    const key = `sync_lock_${pendingInvoiceId}`;

    const checkCooldown = () => {
      const stored = localStorage.getItem(key);
      if (stored) {
        const boundary = parseInt(stored, 10);
        const remaining = Math.max(0, Math.ceil((boundary - Date.now()) / 1000));
        setSyncCooldown(remaining);
        return remaining;
      }
      setSyncCooldown(0);
      return 0;
    };

    const remaining = checkCooldown();
    if (remaining <= 0) return;

    const interval = setInterval(() => {
      const rem = checkCooldown();
      if (rem <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingInvoiceId]);

  // Call checkPaymentStatus callable Cloud Function
  const handleManualSync = async () => {
    if (!pendingInvoiceId) return;

    // Local Storage Cooldown Boundary check
    const key = `sync_lock_${pendingInvoiceId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const boundary = parseInt(stored, 10);
      if (Date.now() < boundary) {
        const remaining = Math.max(0, Math.ceil((boundary - Date.now()) / 1000));
        alert(`Mohon tunggu ${remaining} detik sebelum menyinkronkan kembali.`);
        return;
      }
    }

    // Set cooldown in LocalStorage and state
    const newBoundary = Date.now() + 15000;
    localStorage.setItem(key, newBoundary.toString());
    setSyncCooldown(15);

    setIsSyncing(true);
    setPaymentState('pending-confirmation');
    setErrorMessage(null);

    try {
      const checkPaymentStatusFn = httpsCallable<{ invoiceId: string }, { status: string; message: string }>(
        functions,
        'checkPaymentStatus'
      );

      const result = await checkPaymentStatusFn({ invoiceId: pendingInvoiceId });
      const { status, message } = result.data;

      if (status === 'PAID') {
        setPaymentState('success');
        // Force refresh the session token to get updated claims
        await auth.currentUser?.getIdToken(true);
      } else {
        if (status === 'PENDING') {
          // Keep as pending-confirmation but show alert
          setPaymentState('pending-confirmation');
          alert(message);
        } else {
          setPaymentState('error');
          setErrorMessage(message);
        }
      }
    } catch (err: any) {
      console.error('Manual sync failed:', err);
      // Handle the case where backend throttling guard blocks it (resource-exhausted)
      const errMessage = err?.message || 'Gagal menyinkronkan status pembayaran.';
      setPaymentState('error');
      setErrorMessage(errMessage);
      alert(errMessage);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-radial from-slate-50 via-slate-100 to-indigo-50/30 px-4 py-12 dark:bg-slate-950">
      <Script
        src={process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
          ? "https://app.midtrans.com/snap/snap.js"
          : "https://app.sandbox.midtrans.com/snap/snap.js"
        }
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
      />

      {/* Background Decorative Blur Gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-40%] left-[-20%] h-[80%] w-[60%] rounded-full bg-indigo-200/30 blur-[120px] dark:bg-indigo-900/20" />
        <div className="absolute bottom-[-40%] right-[-20%] h-[80%] w-[60%] rounded-full bg-rose-200/20 blur-[120px] dark:bg-rose-900/10" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`relative z-10 w-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 p-8 shadow-2xl backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/70 md:p-10 ${
          isOwner ? 'max-w-4xl' : 'max-w-lg'
        }`}
      >
        {/* Glow Header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-tr from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/25">
            <ShieldAlert className="h-9 w-9" />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-400 text-[10px] text-slate-950 font-bold"
            >
              !
            </motion.div>
          </div>

          <h1 className="bg-linear-to-r from-slate-950 to-slate-700 bg-clip-text text-2xl font-black tracking-tight text-transparent dark:from-white dark:to-slate-350 sm:text-3xl">
            {isOwner ? 'Masa Percobaan Telah Habis' : 'Layanan Ditangguhkan'}
          </h1>

          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
            Expired / Perlu Pembaruan
          </div>

          <p className="mt-6 text-sm leading-relaxed text-slate-650 dark:text-slate-400 sm:text-base max-w-2xl">
            {isOwner ? (
              'Terima kasih telah mempercayakan pengelolaan bisnis Anda kepada Usahaku POS. Masa uji coba gratis 30 hari Anda telah berakhir. Perbarui langganan Anda sekarang untuk membuka kembali akses dashboard, pencatatan transaksi kasir, dan fitur premium lainnya.'
            ) : (
              'Masa berlangganan aktif untuk usaha ini telah berakhir. Silakan hubungi pemilik usaha (Owner) Anda agar mereka dapat memperpanjang masa aktif layanan dan Anda dapat kembali menggunakan aplikasi kasir.'
            )}
          </p>
        </div>

        {/* Payment Process Overlay Status Banner */}
        <AnimatePresence>
          {paymentState !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mt-8 rounded-2xl border p-5 text-left ${
                paymentState === 'success'
                  ? 'border-emerald-250 bg-emerald-50 text-emerald-850 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-450'
                  : paymentState === 'pending-confirmation'
                  ? 'border-blue-200 bg-blue-50 text-blue-850 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-450'
                  : paymentState === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-850 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-450'
                  : 'border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-350'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {paymentState === 'success' && <CheckCircle className="h-5 w-5 text-emerald-600" />}
                  {paymentState === 'pending-confirmation' && <Info className="h-5 w-5 text-blue-600" />}
                  {paymentState === 'error' && <AlertTriangle className="h-5 w-5 text-rose-600" />}
                  {(paymentState === 'token-generation' || paymentState === 'waiting-payment') && (
                    <span className="block h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    {paymentState === 'token-generation' && 'Menyiapkan Pembayaran'}
                    {paymentState === 'waiting-payment' && 'Menunggu Pembayaran'}
                    {paymentState === 'success' && 'Pembayaran Berhasil'}
                    {paymentState === 'pending-confirmation' && 'Menunggu Konfirmasi'}
                    {paymentState === 'error' && 'Transaksi Gagal'}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed opacity-90">
                    {paymentState === 'token-generation' && 'Kami sedang menghubungi server pembayaran untuk membuat invoice Anda...'}
                    {paymentState === 'waiting-payment' && 'Silakan selesaikan pembayaran Anda di jendela Midtrans Snap yang terbuka.'}
                    {paymentState === 'success' && 'Terima kasih! Langganan Anda berhasil diperpanjang. Halaman akan dimuat ulang secara otomatis.'}
                    {paymentState === 'pending-confirmation' && 'Pembayaran Anda tertunda atau sedang diproses. Akses akan terbuka otomatis begitu dana diterima.'}
                    {paymentState === 'error' && (errorMessage || 'Terjadi kesalahan. Silakan coba beberapa saat lagi.')}
                  </p>
                  {paymentState === 'error' && (
                    <button
                      onClick={() => {
                        setPaymentState('idle');
                        setIsRenewing(false);
                      }}
                      className="mt-2 text-[10px] font-bold underline cursor-pointer text-rose-600 hover:text-rose-500"
                    >
                      Tutup & Coba Lagi
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feature & Pricing Choices for Owner */}
        {isOwner && (
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {pricingTiers.map((tier) => {
              const isSelected = activePlanType === tier.type;
              const isLoadingThis = isRenewing && isSelected;
              return (
                <div
                  key={tier.type}
                  className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border p-6 transition-all duration-300 ${
                    tier.popular
                      ? 'border-indigo-500 bg-indigo-50/30 shadow-indigo-100/40 dark:border-indigo-400 dark:bg-indigo-950/20 dark:shadow-none ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white/50 dark:border-slate-800 dark:bg-slate-900/50'
                  } hover:translate-y-[-4px] hover:shadow-xl`}
                >
                  {tier.popular && (
                    <span className="absolute top-3 right-3 rounded-full bg-indigo-600 px-2.5 py-0.5 text-[9px] font-black text-white uppercase tracking-wider dark:bg-indigo-500">
                      {tier.badge}
                    </span>
                  )}
                  {!tier.popular && (
                    <span className="absolute top-3 right-3 rounded-full bg-slate-100 px-2.5 py-0.5 text-[9px] font-bold text-slate-650 uppercase tracking-wider dark:bg-slate-800 dark:text-slate-400">
                      {tier.badge}
                    </span>
                  )}

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {tier.name}
                    </h3>
                    <div className="mt-4 flex items-baseline">
                      <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                        {tier.price}
                      </span>
                      <span className="ml-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {tier.period}
                      </span>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-450">
                      {tier.description}
                    </p>

                    <ul className="mt-5 space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[11px] text-slate-650 dark:text-slate-350">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0 mt-1" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={() => handlePay(tier.type)}
                      disabled={isRenewing}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition duration-200 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed ${
                        tier.popular
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400'
                          : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                      }`}
                    >
                      {isLoadingThis ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          <span>Memuat...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" />
                          <span>Pilih Paket</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cashier Informative Banner */}
        {!isOwner && (
          <div className="mt-8 flex gap-3 rounded-2xl bg-amber-50/50 p-4 border border-amber-200/50 dark:bg-amber-950/20 dark:border-amber-900/30">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-left">
              <h4 className="text-xs font-bold text-amber-850 dark:text-amber-400">Hubungi Pemilik Usaha</h4>
              <p className="mt-0.5 text-xs text-amber-850/80 dark:text-amber-500">
                Hubungi owner toko untuk melakukan pembayaran langganan melalui halaman Pengaturan di akun pemilik.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row justify-center items-center">
          {isOwner && pendingInvoiceId && (
            <button
              onClick={handleManualSync}
              disabled={isSyncing || syncCooldown > 0}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-indigo-500 transition active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-400 cursor-pointer"
            >
              {isSyncing ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Menyinkronkan...</span>
                </>
              ) : syncCooldown > 0 ? (
                <span>Cek Status ({syncCooldown}s)</span>
              ) : (
                <span>Cek Status Pembayaran</span>
              )}
            </button>
          )}

          {!isOwner && (
            <a
              href="https://wa.me/6285117821129"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-slate-100 px-6 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-200 transition active:scale-98 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <MessageCircle className="h-4.5 w-4.5 text-emerald-500" />
              Hubungi Owner
            </a>
          )}

          <button
            onClick={() => signOut()}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-650 transition hover:bg-slate-50 active:scale-98 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            Keluar Akun
          </button>
        </div>

        {/* Footer text */}
        <div className="mt-6 text-center text-xs text-slate-450 dark:text-slate-650">
          Usahaku POS v1.0 • Aman & Terpercaya
        </div>
      </motion.div>
    </div>
  );
}
