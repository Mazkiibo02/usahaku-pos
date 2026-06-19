'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Check, Loader2 } from 'lucide-react';
import type { Transaction } from '../types';
import { transactionService } from '../api/transaction-service';
import { toBlob } from 'html-to-image';

type ReceiptModalProps = {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  storeName: string;
  onPrintManual: () => void;
};

export function ReceiptModal({
  isOpen,
  onClose,
  transaction,
  storeName,
  onPrintManual,
}: ReceiptModalProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const receiptFileRef = useRef<File | null>(null);

  useEffect(() => {
    async function fetchTenant() {
      if (!transaction?.tenantId) return;
      try {
        const tenant = await transactionService.getTenantDetails(transaction.tenantId);
        if (tenant.logoUrl) {
          setLogoUrl(tenant.logoUrl);
        } else {
          setLogoUrl(null);
        }
      } catch (err) {
        console.error('Gagal mengambil logo tenant:', err);
      }
    }

    if (isOpen && transaction) {
      fetchTenant();
    }
  }, [isOpen, transaction]);

  // Pre-rasterize receipt image in background on mount/logoUrl change
  useEffect(() => {
    let active = true;

    async function generateImage() {
      if (!isOpen || !transaction) return;
      
      // Wait for a short moment to ensure DOM is fully rendered and styled, and images are loaded
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      if (!active) return;
      
      const element = document.getElementById('success-receipt-container');
      if (!element) return;

      setIsGenerating(true);
      try {
        const blob = await toBlob(element, {
          cacheBust: true,
          backgroundColor: '#ffffff',
          style: {
            margin: '0',
            boxShadow: 'none',
            border: 'none',
          },
        });

        if (!blob) {
          throw new Error('Gagal menghasilkan gambar struk.');
        }

        if (!active) return;

        const file = new File([blob], `struk-${transaction.id.slice(-8).toUpperCase()}.png`, {
          type: 'image/png',
        });

        receiptFileRef.current = file;
        setShareError(null);
      } catch (err) {
        console.error('Gagal pre-render gambar struk:', err);
      } finally {
        if (active) {
          setIsGenerating(false);
        }
      }
    }

    if (isOpen && transaction) {
      generateImage();
    } else {
      receiptFileRef.current = null;
    }

    return () => {
      active = false;
    };
  }, [isOpen, transaction, logoUrl]);

  const shareReceiptAsWhatsApp = () => {
    if (!transaction) return;
    
    if (!receiptFileRef.current) {
      setShareError('Struk sedang dipersiapkan, silakan coba lagi dalam beberapa saat.');
      return;
    }

    setShareError(null);

    try {
      const file = receiptFileRef.current;

      // Check for Web Share API support
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({
          files: [file],
          title: 'Struk Belanja',
          text: `Terima kasih telah berbelanja di ${storeName}!`,
        }).catch((err) => {
          console.error('navigator.share failed:', err);
          if (err instanceof Error && err.name !== 'AbortError') {
            setShareError(`Gagal membagikan struk: ${err.message}`);
          }
        });
      } else {
        // Fallback for browsers/platforms not supporting file sharing (e.g. desktop Chrome)
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Gagal memproses bagikan gambar:', err);
      setShareError(
        err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses gambar struk.'
      );
    }
  };

  if (!transaction) return null;

  // IDR Currency Formatter
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Date Formatter
  const formatDate = (timestamp: { toDate?: () => Date } | Date | null | undefined) => {
    if (!timestamp) return '-';
    const date = 'toDate' in timestamp && typeof timestamp.toDate === 'function' 
      ? timestamp.toDate() 
      : new Date(timestamp as Date | string | number);
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const totalQty = transaction.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 font-sans no-print">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 p-6 shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 shrink-0 border-b border-slate-200">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Pembayaran Berhasil</h2>
                <p className="text-xs text-slate-400 font-semibold">Struk digital telah diterbitkan</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-slate-450 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
                aria-label="Tutup pratinjau"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Receipt Scroller Frame */}
            <div className="flex-1 overflow-y-auto py-4 px-1 flex justify-center items-start">
              {/* DIGITAL THERMAL SLIP CONTAINER */}
              <div 
                id="success-receipt-container"
                className="relative w-full bg-white px-5 py-6 shadow-md rounded-2xl border border-slate-200 text-slate-800 font-mono text-xs break-all overflow-hidden"
              >
                
                {/* Slip Header */}
                <div className="text-center space-y-1 mb-4">
                  {logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoUrl}
                      alt="Logo Toko"
                      crossOrigin="anonymous"
                      className="grayscale contrast-200 mix-blend-multiply max-w-[40mm] mx-auto mb-2 object-contain"
                    />
                  )}
                  <h3 className="text-base font-black uppercase tracking-tight text-slate-900">{storeName}</h3>
                  <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 font-sans font-bold uppercase">
                    <span>{transaction.outletName || 'Cabang Utama'}</span>
                  </div>
                </div>

                {/* Dashed Separator */}
                <div className="border-t border-dashed border-black/20 my-3" />

                {/* Metadata Details */}
                <div className="space-y-1 text-[10px] uppercase font-sans text-slate-600">
                  <div className="flex justify-between">
                    <span>ID STRUK:</span>
                    <span className="font-mono font-bold text-slate-900">{transaction.id.slice(-8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TANGGAL:</span>
                    <span className="text-slate-900 font-semibold">{formatDate(transaction.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>KASIR:</span>
                    <span className="text-slate-900 font-semibold truncate max-w-[150px]">{transaction.cashierName || 'Kasir'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PELANGGAN:</span>
                    <span className="text-slate-900 font-extrabold truncate max-w-[150px]">{transaction.customerName || 'UMUM'}</span>
                  </div>
                </div>

                {/* Dashed Separator */}
                <div className="border-t border-dashed border-black/20 my-3" />

                {/* Items List Header */}
                <div className="grid grid-cols-12 font-bold text-[10px] uppercase pb-1 mb-1 font-sans text-slate-400">
                  <span className="col-span-6">ITEM</span>
                  <span className="col-span-2 text-center">QTY</span>
                  <span className="col-span-4 text-right">TOTAL</span>
                </div>

                {/* Items List */}
                <div className="space-y-2 py-1">
                  {transaction.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 items-start text-[11px] leading-tight">
                      <div className="col-span-6 flex flex-col font-sans">
                        <span className="font-bold text-slate-900">{item.name}</span>
                        <span className="text-[9px] text-slate-400 font-semibold font-mono">
                          {formatPrice(item.price)}
                        </span>
                      </div>
                      <span className="col-span-2 text-center font-bold text-slate-900">{item.quantity}</span>
                      <span className="col-span-4 text-right font-bold text-slate-900 font-mono">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Dashed Separator */}
                <div className="border-t border-dashed border-black/20 my-3" />

                {/* Billing Breakdown */}
                <div className="space-y-1.5 py-1 uppercase font-sans text-[10px] text-slate-600">
                  <div className="flex justify-between">
                    <span>TOTAL ITEM</span>
                    <span className="font-bold text-slate-900">{totalQty}</span>
                  </div>
                  {transaction.subtotal !== undefined && transaction.subtotal !== transaction.totalAmount && (
                    <div className="flex justify-between">
                      <span>SUBTOTAL</span>
                      <span className="font-bold text-slate-900 font-mono">{formatPrice(transaction.subtotal)}</span>
                    </div>
                  )}
                  {transaction.discount !== undefined && transaction.discount > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>DISKON</span>
                      <span className="font-mono">-{formatPrice(transaction.discount)}</span>
                    </div>
                  )}
                  {transaction.taxAmount !== undefined && transaction.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span>PAJAK ({transaction.taxRate}%)</span>
                      <span className="font-bold text-slate-900 font-mono">+{formatPrice(transaction.taxAmount)}</span>
                    </div>
                  )}
                  {transaction.shippingCost !== undefined && transaction.shippingCost > 0 && (
                    <div className="flex justify-between">
                      <span>ONGKOS KIRIM</span>
                      <span className="font-bold text-slate-900 font-mono">+{formatPrice(transaction.shippingCost)}</span>
                    </div>
                  )}
                  
                  {/* Final Total */}
                  <div className="flex justify-between text-xs font-black border-t border-dashed border-black/20 pt-2 mt-1.5 text-slate-900">
                    <span>TOTAL AKHIR</span>
                    <span className="font-black text-sm text-slate-900 font-mono">{formatPrice(transaction.totalAmount)}</span>
                  </div>

                  {/* Payment Method */}
                  {transaction.paymentMethod && (
                    <div className="flex justify-between text-[9px] text-slate-500 font-bold mt-2">
                      <span>METODE PEMBAYARAN:</span>
                      <span className="text-slate-700 font-extrabold">{transaction.paymentMethod}</span>
                    </div>
                  )}
                </div>

                {/* Dashed Separator */}
                <div className="border-t border-dashed border-black/20 my-4" />

                {/* Receipt Footer */}
                <div className="text-center space-y-1 text-[10px] font-sans font-bold text-slate-400 uppercase">
                  <p className="tracking-widest">TERIMA KASIH</p>
                  <p className="text-[8px] tracking-wide">Powered by Usahaku POS</p>
                </div>
              </div>
            </div>

            {/* Sharing Error alert */}
            {shareError && (
              <div className="mt-3 rounded-lg bg-rose-50 border border-rose-100 p-2 text-center text-xs text-rose-700 font-semibold shrink-0 animate-fadeIn">
                {shareError}
              </div>
            )}

            {/* Action Buttons Footer */}
            <div className="mt-4 flex flex-col gap-2 shrink-0">
              {/* Kirim WhatsApp button */}
              <button
                type="button"
                onClick={shareReceiptAsWhatsApp}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold text-white text-xs py-3.5 transition active:scale-[0.98] disabled:opacity-60 cursor-pointer shadow-md shadow-emerald-950/10"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    Sedang Mempersiapkan Struk...
                  </>
                ) : (
                  <>
                    {/* SVG WhatsApp Icon */}
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.99L2 22l5.188-1.359a9.926 9.926 0 0 0 4.82 1.242h.004c5.506 0 9.99-4.478 9.99-9.986 0-2.67-1.037-5.18-2.92-7.067C17.199 3.037 14.683 2 12.012 2zm5.795 14.193c-.319.897-1.579 1.647-2.179 1.71-.599.064-1.199.314-3.856-.732-3.397-1.341-5.586-4.793-5.756-5.018-.17-.225-1.355-1.802-1.355-3.44 0-1.637.854-2.438 1.159-2.766.305-.328.67-.409.897-.409.226 0 .452.003.649.012.203.01.474-.077.74.567.273.657.927 2.26 1.007 2.423.08.163.169.263-.293.409-.124.146-.263.328-.113.585.15.257.662 1.092 1.417 1.764.975.867 1.796 1.137 2.056 1.267.26.13.409.11.56-.062.15-.173.655-.76.83-1.02.176-.26.353-.217.596-.127.243.09 1.547.73 1.81.86.263.13.438.196.503.308.065.113.065.656-.254 1.553z" />
                    </svg>
                    Kirim WhatsApp
                  </>
                )}
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onPrintManual}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-100 font-bold text-slate-700 text-xs py-3.5 transition active:scale-[0.98] cursor-pointer shadow-sm"
                >
                  <Printer className="h-4 w-4 text-slate-500" />
                  Cetak Manual
                </button>
                
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 font-black text-white text-xs py-3.5 transition active:scale-[0.98] cursor-pointer shadow-lg shadow-slate-900/10"
                >
                  <Check className="h-4 w-4" />
                  Tutup / Selesai
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
