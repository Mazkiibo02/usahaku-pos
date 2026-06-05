'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Save, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Store,
  ArrowLeft,
  CreditCard,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import Script from 'next/script';
import { httpsCallable } from 'firebase/functions';

import { useAuthStore } from '@/src/stores/authStore';
import { db } from '@/src/lib/firebase/firebase';
import { uploadTenantLogo, updateTenantLogoUrl } from '@/src/features/settings/services/storageService';
import { functions } from '@/src/lib/firebase';

// Custom Toast Notification structure
interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export default function SettingsPage() {
  const { tenantId, role } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [storeName, setStoreName] = useState<string>('Memuat nama usaha...');
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [activeTab, setActiveTab] = useState<'logo' | 'subscription'>('logo');
  const [maxOutlets, setMaxOutlets] = useState<number>(2);
  const [subscription, setSubscription] = useState<any>(null);
  const [isRenewing, setIsRenewing] = useState(false);
  const [paymentState, setPaymentState] = useState<'idle' | 'token-generation' | 'waiting-payment' | 'success' | 'pending-confirmation' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activePlanType, setActivePlanType] = useState<'1-outlet' | '2-outlets' | '4-outlets' | null>(null);

  // Function to trigger beautiful floating toasts
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Fetch Tenant Data (Logo & Store Name)
  const fetchTenantData = useCallback(async () => {
    if (!tenantId) return;
    setIsLoading(true);
    try {
      const docRef = doc(db, 'tenants', tenantId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setStoreName(data.name || 'Usahaku POS');
        if (data.logoUrl) {
          setExistingLogoUrl(data.logoUrl);
          setPreviewUrl(data.logoUrl);
        }
        setMaxOutlets(data.maxOutlets ?? 2);
        setSubscription(data.subscription ?? null);
      } else {
        showToast('Data usaha tidak ditemukan.', 'error');
      }
    } catch (err) {
      console.error('Error fetching tenant details:', err);
      showToast('Gagal memuat detail usaha.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, showToast]);

  useEffect(() => {
    if (tenantId) {
      fetchTenantData();
    }
  }, [tenantId, fetchTenantData]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'subscription') {
        setActiveTab('subscription');
      }
    }
  }, []);

  const handlePay = async (planType: '1-outlet' | '2-outlets' | '4-outlets') => {
    setIsRenewing(true);
    setPaymentState('token-generation');
    setErrorMessage(null);
    setActivePlanType(planType);

    try {
      const generateSnapTokenFn = httpsCallable<{ planType: string }, { token: string; redirectUrl: string; orderId: string }>(
        functions,
        'generateSnapToken'
      );

      const result = await generateSnapTokenFn({ planType });
      const { token } = result.data;

      if (!window.snap) {
        throw new Error('Midtrans Snap SDK is not loaded yet. Please wait a moment and try again.');
      }

      setPaymentState('waiting-payment');

      window.snap.pay(token, {
        onSuccess: function (res: any) {
          console.log('Payment Success:', res);
          setPaymentState('success');
          setIsRenewing(false);
          fetchTenantData();
        },
        onPending: function (res: any) {
          console.log('Payment Pending:', res);
          setPaymentState('pending-confirmation');
          setIsRenewing(false);
        },
        onError: function (res: any) {
          console.error('Payment Error:', res);
          setPaymentState('error');
          setErrorMessage('Terjadi kesalahan saat memproses pembayaran.');
          setIsRenewing(false);
        },
        onClose: function () {
          console.log('Payment checkout closed');
          setPaymentState('idle');
          setIsRenewing(false);
        }
      });
    } catch (err: any) {
      console.error('Payment initialization failed:', err);
      setPaymentState('error');
      setErrorMessage(err?.message || 'Gagal menyiapkan transaksi. Silakan coba lagi.');
      setIsRenewing(false);
    }
  };

  // Handle File Selection with validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Hanya file gambar yang diperbolehkan!', 'warning');
      return;
    }

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast('Ukuran file maksimal 2 MB!', 'warning');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    showToast('Pratinjau gambar berhasil dimuat.', 'info');
  };

  // Remove selected file or existing logo preview
  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(existingLogoUrl || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast('Perubahan pratinjau dibatalkan.', 'info');
  };

  // Submit Upload and Persistence
  const handleSaveLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    if (!selectedFile) {
      showToast('Silakan pilih file logo baru terlebih dahulu!', 'warning');
      return;
    }

    setIsSaving(true);
    showToast('Sedang mengunggah logo ke Cloud Storage...', 'info');

    try {
      // 1. Upload file to Storage
      const uploadedUrl = await uploadTenantLogo(tenantId, selectedFile);
      
      // 2. Save new URL to Firestore tenant doc
      await updateTenantLogoUrl(tenantId, uploadedUrl);

      setExistingLogoUrl(uploadedUrl);
      setSelectedFile(null);
      showToast('Logo usaha Anda berhasil diperbarui!', 'success');
      
      // Refresh UI state
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Error saving tenant logo:', err);
      showToast(err.message || 'Gagal menyimpan logo usaha.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Drag and Drop support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Hanya file gambar yang diperbolehkan!', 'warning');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('Ukuran file maksimal 2 MB!', 'warning');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    showToast('File dijatuhkan dan pratinjau dimuat.', 'info');
  };

  // Access check
  if (role !== 'owner') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 mb-4">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Akses Ditolak</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-md">
          Maaf, halaman pengaturan logo usaha ini hanya dapat diakses oleh Pemilik Usaha (Owner). 
          Silakan hubungi administrator jika Anda merasa ini adalah kesalahan.
        </p>
        <Link 
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      
      {/* Floating Animated Toast Banner */}
      <div className="pointer-events-none fixed right-6 top-20 z-50 flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md min-w-[280px] max-w-sm ${
                toast.type === 'success' 
                  ? 'border-emerald-200/50 bg-emerald-50/90 text-emerald-800' 
                  : toast.type === 'error'
                  ? 'border-rose-200/50 bg-rose-50/90 text-rose-800'
                  : toast.type === 'warning'
                  ? 'border-amber-200/50 bg-amber-50/90 text-amber-800'
                  : 'border-blue-200/50 bg-blue-50/90 text-blue-800'
              }`}
            >
              {toast.type === 'success' && <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />}
              {toast.type === 'error' && <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />}
              {toast.type === 'warning' && <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />}
              {toast.type === 'info' && <Info className="h-5 w-5 shrink-0 text-blue-600" />}
              <span className="text-sm font-semibold">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Pengaturan Usaha
          </h1>
          <p className="text-sm text-slate-500 md:text-base">
            Konfigurasi identitas visual usaha Anda untuk struk belanja POS dan laporan PDF.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('logo')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 mb-[-2px] transition ${
            activeTab === 'logo'
              ? 'border-indigo-650 text-indigo-600 border-indigo-650'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Logo Usaha
        </button>
        <button
          onClick={() => setActiveTab('subscription')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 mb-[-2px] transition ${
            activeTab === 'subscription'
              ? 'border-indigo-650 text-indigo-600 border-indigo-650'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Paket Langganan
        </button>
      </div>

      {/* Loader for first fetch */}
      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
            <p className="mt-2 text-sm text-slate-500">Memuat informasi usaha Anda...</p>
          </div>
        </div>
      ) : activeTab === 'logo' ? (
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* Card left: Store Info Summary */}
          <div className="md:col-span-1 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4 shadow-inner">
                <Store className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 truncate max-w-full">
                {storeName}
              </h3>
              <span className="mt-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-650 uppercase tracking-wider">
                {role === 'owner' ? 'Akun Pemilik' : 'Akun Kasir'}
              </span>
              
              <div className="mt-6 w-full border-t border-slate-100 pt-4 text-left space-y-3 text-xs text-slate-500">
                <div>
                  <span className="font-semibold block text-slate-400">ID Outlet Utama</span>
                  <span className="font-mono text-slate-700 select-all block mt-0.5 truncate">{tenantId}</span>
                </div>
                <div>
                  <span className="font-semibold block text-slate-400">Status Layanan</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Aktif (Lokal Emulator)
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-amber-50/50 p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                <Info className="h-4.5 w-4.5 text-amber-600 shrink-0" />
                <span>Rekomendasi Logo</span>
              </div>
              <p className="text-xs leading-relaxed text-amber-700">
                Untuk hasil cetak thermal POS terbaik, gunakan logo dengan latar belakang putih polos atau transparan, kontras tinggi, dan berbentuk persegi. 
                Sistem akan menyaring gambar ke hitam-putih murni agar terbaca tajam pada kertas thermal monochrome.
              </p>
            </div>
          </div>

          {/* Card right: Custom Logo Uploader */}
          <div className="md:col-span-2">
            <form onSubmit={handleSaveLogo} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
              
              <div className="border-b border-slate-150 px-6 py-4">
                <h2 className="text-md font-bold text-slate-900">Custom Logo Toko</h2>
                <p className="text-xs text-slate-550 mt-0.5">
                  Unggah file gambar baru untuk menggantikan logo toko saat ini.
                </p>
              </div>

              <div className="p-6 space-y-6 flex-1">
                
                {/* Drag and Drop Container */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                    previewUrl 
                      ? 'border-indigo-200 bg-slate-50/30' 
                      : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50/30 cursor-pointer'
                  }`}
                  onClick={() => !previewUrl && fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  {previewUrl ? (
                    <div className="space-y-4">
                      {/* Image Preview Window */}
                      <div className="relative mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt="Logo Preview"
                          className="h-full w-full object-contain"
                        />
                      </div>
                      
                      {/* File details or preview status */}
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800">
                          {selectedFile ? selectedFile.name : 'Logo Aktif Saat Ini'}
                        </p>
                        {selectedFile && (
                          <p className="text-[10px] text-slate-450 font-mono">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </p>
                        )}
                      </div>

                      {/* Remove Preview Button */}
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-600 shadow-sm transition hover:bg-rose-50 hover:border-rose-200"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Batalkan Perubahan
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 cursor-pointer">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-500 border border-slate-200/50">
                        <Upload className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-800">
                          Klik untuk Unggah atau Seret File
                        </p>
                        <p className="text-xs text-slate-500">
                          PNG, JPG, JPEG atau GIF (Maks. 2 MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Print optimization preview simulation */}
                {previewUrl && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-650">
                      <ImageIcon className="h-4 w-4 text-slate-500" />
                      <span>Simulasi Cetak Kertas Thermal POS (Hitam-Putih)</span>
                    </div>
                    
                    <div className="flex justify-center py-2 bg-white rounded-lg border border-slate-200/60">
                      {/* Monochrome Preview */}
                      <div className="p-3 bg-white text-black font-mono text-[9px] text-center border border-black/10 w-[40mm]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt="Thermal Receipt Preview Logo"
                          className="grayscale contrast-200 mix-blend-multiply max-w-[32mm] mx-auto mb-1 object-contain h-10"
                        />
                        <div className="border-t border-dashed border-black/30 my-1" />
                        <span className="font-sans font-bold uppercase tracking-tight block text-[8px]">{storeName}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="border-t border-slate-150 bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 shrink-0">
                <Link
                  href="/dashboard"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Kembali
                </Link>
                
                <button
                  type="submit"
                  disabled={isSaving || !selectedFile}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Simpan Logo
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

        </div>
      ) : (
        <div className="space-y-6">
          <Script
            src="https://app.sandbox.midtrans.com/snap/snap.js"
            data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
            strategy="afterInteractive"
          />

          {/* Current Subscription Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Detail Langganan Aktif</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="text-xs text-slate-400 font-semibold block">Paket Saat Ini</span>
                <span className="text-base font-bold text-slate-800 mt-1 block">
                  {subscription?.status === 'TRIAL' 
                    ? 'Trial 30 Hari' 
                    : subscription?.status === 'PAID' 
                    ? `Paket ${maxOutlets} Outlet` 
                    : 'Expired'}
                </span>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="text-xs text-slate-400 font-semibold block">Kapasitas Outlet</span>
                <span className="text-base font-bold text-slate-800 mt-1 block">
                  {maxOutlets} Outlet
                </span>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="text-xs text-slate-400 font-semibold block">Berlaku Hingga</span>
                <span className="text-base font-bold text-slate-800 mt-1 block">
                  {subscription?.currentPeriodEnd 
                    ? subscription.currentPeriodEnd.toDate().toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      }) 
                    : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Tiers */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Upgrade atau Perbarui Paket</h3>
            <p className="text-sm text-slate-500 mb-6">
              Pilih paket yang sesuai dengan jumlah cabang usaha Anda. Pembayaran instan & aman via Midtrans.
            </p>

            {/* Payment Process Overlay Status Banner */}
            <AnimatePresence>
              {paymentState !== 'idle' && (
                <div className={`mb-6 rounded-2xl border p-5 text-left ${
                  paymentState === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : paymentState === 'pending-confirmation'
                    ? 'border-blue-200 bg-blue-50 text-blue-800'
                    : paymentState === 'error'
                    ? 'border-rose-200 bg-rose-50 text-rose-800'
                    : 'border-slate-200 bg-slate-50 text-slate-800'
                }`}>
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
                        {paymentState === 'success' && 'Terima kasih! Langganan Anda berhasil diperbarui.'}
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
                </div>
              )}
            </AnimatePresence>

            <div className="grid gap-6 sm:grid-cols-3">
              {[
                {
                  type: '1-outlet' as const,
                  name: 'Paket 1 Outlet',
                  price: 'Rp 25.000',
                  period: '/ bln',
                  description: 'Ideal untuk toko tunggal/usaha kecil.',
                  features: ['1 Outlet Aktif', 'Pencatatan Transaksi Tanpa Batas', 'Laporan Penjualan Harian & Bulanan'],
                },
                {
                  type: '2-outlets' as const,
                  name: 'Paket 2 Outlets',
                  price: 'Rp 50.000',
                  period: '/ bln',
                  description: 'Cocok untuk pemilik usaha dengan 1 cabang tambahan.',
                  features: ['Hingga 2 Outlet Aktif', 'Manajemen Shift Kasir', 'Laporan Real-time Cabang'],
                  popular: true,
                },
                {
                  type: '4-outlets' as const,
                  name: 'Paket 4 Outlets',
                  price: 'Rp 100.000',
                  period: '/ bln',
                  description: 'Solusi lengkap untuk multi-cabang skala menengah.',
                  features: ['Hingga 4 Outlet Aktif', 'Multi-Kasir Tanpa Batas', 'Analisis Bisnis Mendalam'],
                }
              ].map((tier) => {
                const isSelected = activePlanType === tier.type;
                const isLoadingThis = isRenewing && isSelected;
                return (
                  <div
                    key={tier.type}
                    className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border p-6 transition-all duration-300 ${
                      tier.popular
                        ? 'border-indigo-500 bg-indigo-50/10 shadow-indigo-100/40'
                        : 'border-slate-200 bg-white'
                    } hover:-translate-y-1 hover:shadow-lg`}
                  >
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">{tier.name}</h3>
                      <div className="mt-4 flex items-baseline">
                        <span className="text-2xl font-black text-slate-900">{tier.price}</span>
                        <span className="ml-1 text-xs font-semibold text-slate-500">{tier.period}</span>
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-slate-500">{tier.description}</p>
                      <ul className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                        {tier.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-[11px] text-slate-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => handlePay(tier.type)}
                      disabled={isRenewing}
                      className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                        tier.popular
                          ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
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
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
