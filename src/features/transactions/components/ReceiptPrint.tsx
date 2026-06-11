'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, FileText, Bluetooth, Loader2 } from 'lucide-react';
import type { Transaction } from '../types';
import { transactionService } from '../api/transaction-service';
import { useBluetoothPrinter } from '@/src/shared/hooks/useBluetoothPrinter';

type ReceiptPrintProps = {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
  cashierName: string;
  outletName: string;
};

export function ReceiptPrint({
  isOpen,
  onClose,
  transaction,
  cashierName,
  outletName,
}: ReceiptPrintProps) {
  const [storeName, setStoreName] = useState('Usahaku POS');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('58mm');
  const [, setIsLoading] = useState(false);

  const {
    connectedDevice,
    printerCharacteristic,
    isConnecting,
    connectPrinter,
    disconnectPrinter,
    printReceipt,
  } = useBluetoothPrinter();

  const [isPrinting, setIsPrinting] = useState(false);
  const [printErrorMsg, setPrintErrorMsg] = useState<string | null>(null);

  // Fetch Tenant store name & logo
  useEffect(() => {
    async function fetchTenant() {
      if (!transaction.tenantId) return;
      setIsLoading(true);
      try {
        const tenant = await transactionService.getTenantDetails(transaction.tenantId);
        setStoreName(tenant.name);
        if (tenant.logoUrl) {
          setLogoUrl(tenant.logoUrl);
        } else {
          setLogoUrl(null);
        }
      } catch (err) {
        console.error('Gagal mengambil nama tenant:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (isOpen) {
      fetchTenant();
    }
  }, [isOpen, transaction.tenantId]);

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

  const handlePrint = async () => {
    if (connectedDevice && printerCharacteristic) {
      setIsPrinting(true);
      setPrintErrorMsg(null);
      try {
        await printReceipt(
          transaction,
          storeName,
          outletName,
          cashierName,
          paperWidth
        );
      } catch (err) {
        console.error('Gagal mencetak Bluetooth:', err);
        setPrintErrorMsg(err instanceof Error ? err.message : 'Gagal mengirim data ke printer Bluetooth.');
      } finally {
        setIsPrinting(false);
      }
    } else {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print-receipt-wrapper print:h-auto print:overflow-visible print:max-h-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm no-print print:hidden"
          />

          {/* Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl flex flex-col max-h-[90vh] print:h-auto print:overflow-visible print:max-h-none print:shadow-none print:border-none print:rounded-none print:bg-transparent print:m-0 print:p-0"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-150 pb-4 shrink-0 no-print print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-500" />
                <h2 className="text-lg font-bold text-slate-950">Pratinjau Struk Belanja</h2>
              </div>
              
              <button
                onClick={onClose}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-650"
                aria-label="Tutup pratinjau"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Config & Toggles (Paper Size Selector) */}
            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3 shrink-0 text-sm no-print print:hidden">
              <span className="font-semibold text-slate-650">Ukuran Kertas Thermal:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPaperWidth('58mm')}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                    paperWidth === '58mm'
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-650 hover:bg-slate-100'
                  }`}
                >
                  58 mm
                </button>
                <button
                  onClick={() => setPaperWidth('80mm')}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                    paperWidth === '80mm'
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-650 hover:bg-slate-100'
                  }`}
                >
                  80 mm
                </button>
              </div>
            </div>

            {/* Bluetooth Printer Config */}
            <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-150 bg-slate-50/50 p-3 shrink-0 text-sm no-print print:hidden">
              <div className="flex items-center gap-2">
                <Bluetooth className={`h-4.5 w-4.5 ${connectedDevice ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
                <div className="text-left font-sans">
                  <span className="font-semibold text-slate-700 block text-xs">Printer Bluetooth:</span>
                  <span className="text-[10px] text-slate-500 font-semibold block truncate max-w-[140px]">
                    {connectedDevice ? connectedDevice.name || 'Terhubung' : 'Terputus'}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                {connectedDevice ? (
                  <button
                    type="button"
                    onClick={disconnectPrinter}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-650 hover:bg-slate-100 transition shadow-sm cursor-pointer"
                  >
                    Putuskan
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={connectPrinter}
                    disabled={isConnecting}
                    className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-bold text-white hover:bg-slate-850 transition disabled:opacity-60 flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin text-white" />
                        Konek...
                      </>
                    ) : (
                      'Konek Printer'
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Receipt Area */}
            <div className="mt-4 flex-1 overflow-y-auto bg-slate-100 rounded-xl p-6 flex justify-center items-start border border-slate-200 print:overflow-visible print:h-auto print:max-h-none print:shadow-none print:border-none print:rounded-none print:bg-transparent print:m-0 print:p-0">
              
              {/* PRINTABLE RECEIPT LAYOUT */}
              <div
                id="thermal-receipt-container"
                className={`thermal-receipt-container bg-white p-4 shadow-sm border border-slate-200/50 text-black font-mono text-xs break-all shrink-0 print:mx-auto print:text-black`}
                style={{
                  width: paperWidth,
                  maxWidth: '100%',
                }}
              >
                {/* Header Section */}
                <div className="text-center space-y-1 mb-3">
                  {logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoUrl}
                      alt="Logo Toko"
                      className="grayscale contrast-200 mix-blend-multiply max-w-[40mm] mx-auto mb-2 object-contain"
                    />
                  )}
                  <h3 className="text-sm font-black uppercase tracking-tight">{storeName}</h3>
                  <p className="text-[10px] font-sans font-semibold text-slate-500 uppercase">{outletName}</p>
                </div>

                {/* Dashed line */}
                <div className="border-t border-dashed border-black/30 my-2" />

                {/* Metadata details */}
                <div className="space-y-0.5 text-[10px] uppercase font-sans">
                  <div className="flex justify-between">
                    <span className="text-slate-500">ID STRUK:</span>
                    <span className="font-mono font-bold text-black">{transaction.id.slice(-8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">TANGGAL:</span>
                    <span className="text-black">{formatDate(transaction.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">KASIR:</span>
                    <span className="text-black truncate max-w-[120px]">{cashierName}</span>
                  </div>
                  {transaction.customerName && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">PELANGGAN:</span>
                      <span className="text-black truncate max-w-[120px] font-bold">{transaction.customerName}</span>
                    </div>
                  )}
                </div>

                {/* Dashed line */}
                <div className="border-t border-dashed border-black/30 my-2" />

                {/* Items List Header */}
                <div className="grid grid-cols-12 font-bold text-[10px] uppercase pb-1 mb-1 font-sans text-slate-500">
                  <span className="col-span-6">ITEM</span>
                  <span className="col-span-2 text-center">QTY</span>
                  <span className="col-span-4 text-right">TOTAL</span>
                </div>

                {/* Items List */}
                <div className="space-y-1.5 py-1">
                  {transaction.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 items-start text-[11px] leading-tight">
                      <div className="col-span-6 flex flex-col font-sans">
                        <span className="font-bold text-black">{item.name}</span>
                        <span className="text-[9px] text-slate-500 font-semibold font-mono">
                          {formatPrice(item.price)}
                        </span>
                      </div>
                      <span className="col-span-2 text-center font-bold text-black">{item.quantity}</span>
                      <span className="col-span-4 text-right font-black text-black">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Dashed line */}
                <div className="border-t border-dashed border-black/30 my-2" />

                {/* Total Billing */}
                <div className="space-y-1 py-1 uppercase font-sans">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500 font-semibold">TOTAL ITEM</span>
                    <span className="font-bold text-black">
                      {transaction.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </div>
                  {transaction.subtotal !== undefined && transaction.subtotal !== transaction.totalAmount && (
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500 font-semibold">SUBTOTAL</span>
                      <span className="font-bold text-black">{formatPrice(transaction.subtotal)}</span>
                    </div>
                  )}
                  {transaction.discount !== undefined && transaction.discount > 0 && (
                    <div className="flex justify-between text-[10px] text-rose-600">
                      <span className="font-bold">DISKON</span>
                      <span className="font-bold">-{formatPrice(transaction.discount)}</span>
                    </div>
                  )}
                  {transaction.taxAmount !== undefined && transaction.taxAmount > 0 && (
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-550 font-semibold">PAJAK ({transaction.taxRate}%)</span>
                      <span className="font-bold text-black">+{formatPrice(transaction.taxAmount)}</span>
                    </div>
                  )}
                  {transaction.shippingCost !== undefined && transaction.shippingCost > 0 && (
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-550 font-semibold">ONGKOS KIRIM</span>
                      <span className="font-bold text-black">+{formatPrice(transaction.shippingCost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-black border-t border-dashed border-black/20 pt-1 mt-1">
                    <span className="text-black">TOTAL AKHIR</span>
                    <span className="font-black text-black">{formatPrice(transaction.totalAmount)}</span>
                  </div>
                  {transaction.paymentMethod && (
                    <div className="flex justify-between text-[9px] text-slate-500 font-semibold mt-1">
                      <span>METODE PEMBAYARAN</span>
                      <span className="text-black font-bold">{transaction.paymentMethod}</span>
                    </div>
                  )}
                </div>

                {/* Dashed line */}
                <div className="border-t border-dashed border-black/30 my-3" />

                {/* Footer Section */}
                <div className="text-center space-y-1 text-[10px] font-sans font-semibold text-slate-650 uppercase">
                  <p className="tracking-wide">TERIMA KASIH</p>
                  <p className="text-[8px] text-slate-400">Powered by Usahaku POS</p>
                </div>
              </div>

            </div>

            {/* Bluetooth Print Error message */}
            {printErrorMsg && (
              <div className="mt-3 rounded-lg bg-rose-550/10 border border-rose-200 p-2.5 text-xs text-rose-700 font-semibold no-print print:hidden">
                {printErrorMsg}
              </div>
            )}

            {/* Print and Close Actions */}
            <div className="mt-4 flex gap-3 shrink-0 no-print print:hidden">
              <button
                type="button"
                onClick={onClose}
                disabled={isPrinting}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handlePrint}
                disabled={isPrinting}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-950 py-2.5 text-sm font-bold text-white transition hover:bg-slate-850 shadow-md disabled:opacity-65 cursor-pointer"
              >
                {isPrinting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    Mencetak...
                  </>
                ) : (
                  <>
                    <Printer className="h-4 w-4" />
                    Cetak Struk
                  </>
                )}
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
