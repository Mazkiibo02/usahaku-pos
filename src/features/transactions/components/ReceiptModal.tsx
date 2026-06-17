'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Check, CreditCard, User, Clock, FileText, MapPin } from 'lucide-react';
import type { Transaction } from '../types';

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
              <div className="relative w-full bg-white px-5 py-6 shadow-md rounded-2xl border border-slate-200 text-slate-800 font-mono text-xs break-all overflow-hidden">
                
                {/* Lunas / PAID Watermark Stamp */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-10">
                  <div className="border-4 border-dashed border-emerald-600/30 text-emerald-600/30 font-black text-3xl py-2 px-5 rounded-2xl uppercase tracking-widest rotate-15 border-dashed">
                    LUNAS / PAID
                  </div>
                </div>

                {/* Slip Header */}
                <div className="text-center space-y-1 mb-4">
                  <h3 className="text-base font-black uppercase tracking-tight text-slate-900">{storeName}</h3>
                  <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 font-sans font-bold uppercase">
                    <MapPin className="h-3 w-3" />
                    <span>{transaction.outletName || 'Cabang Utama'}</span>
                  </div>
                </div>

                {/* Dashed Separator */}
                <div className="border-t border-dashed border-slate-350 my-3" />

                {/* Metadata Details */}
                <div className="space-y-1.5 text-[10px] uppercase font-sans text-slate-600">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5 text-slate-400" /> ID STRUK:</span>
                    <span className="font-mono font-bold text-slate-900">{transaction.id.slice(-8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-slate-400" /> TANGGAL:</span>
                    <span className="text-slate-900 font-semibold">{formatDate(transaction.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1"><User className="h-3.5 w-3.5 text-slate-400" /> KASIR:</span>
                    <span className="text-slate-900 font-semibold truncate max-w-[150px]">{transaction.cashierName || 'Kasir'}</span>
                  </div>
                  {transaction.customerName && (
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1"><User className="h-3.5 w-3.5 text-slate-400" /> PELANGGAN:</span>
                      <span className="text-slate-900 font-extrabold truncate max-w-[150px]">{transaction.customerName}</span>
                    </div>
                  )}
                </div>

                {/* Dashed Separator */}
                <div className="border-t border-dashed border-slate-350 my-3" />

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
                <div className="border-t border-dashed border-slate-350 my-3" />

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
                  <div className="flex justify-between text-xs font-black border-t border-dashed border-slate-300 pt-2 mt-1.5 text-slate-900">
                    <span>TOTAL BAYAR</span>
                    <span className="font-black text-sm text-slate-900 font-mono">{formatPrice(transaction.totalAmount)}</span>
                  </div>

                  {/* Payment Method */}
                  {transaction.paymentMethod && (
                    <div className="flex justify-between text-[9px] text-slate-400 font-bold mt-2">
                      <span className="flex items-center gap-1"><CreditCard className="h-3 w-3 text-slate-400" /> METODE PEMBAYARAN:</span>
                      <span className="text-slate-700 font-extrabold">{transaction.paymentMethod}</span>
                    </div>
                  )}
                </div>

                {/* Dashed Separator */}
                <div className="border-t border-dashed border-slate-350 my-4" />

                {/* Receipt Footer */}
                <div className="text-center space-y-1 text-[10px] font-sans font-bold text-slate-400 uppercase">
                  <p className="tracking-widest">TERIMA KASIH</p>
                  <p className="text-[8px] tracking-wide">Powered by Usahaku POS</p>
                </div>
              </div>
            </div>

            {/* Action Buttons Footer */}
            <div className="mt-4 flex gap-3 shrink-0">
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
