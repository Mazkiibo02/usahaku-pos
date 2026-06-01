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
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';

import { useAuthStore } from '@/src/stores/authStore';
import { db } from '@/src/lib/firebase/firebase';
import { uploadTenantLogo, updateTenantLogoUrl } from '@/src/features/settings/services/storageService';

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

      {/* Loader for first fetch */}
      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
            <p className="mt-2 text-sm text-slate-500">Memuat informasi usaha Anda...</p>
          </div>
        </div>
      ) : (
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
                {role} Account
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
      )}

    </div>
  );
}
