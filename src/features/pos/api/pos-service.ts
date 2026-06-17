import { collection, doc, writeBatch, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '@/src/lib/firebase/firestore';
import { auth } from '@/src/lib/firebase/auth';

export interface TransactionItemPayload {
  productId: string;
  quantity: number;
  name: string;
  price: number;
  stock: number; // current stock before sale
}

export interface ProcessTransactionPayload {
  tenantId: string;
  cashierId: string;
  items: TransactionItemPayload[];
  outletId: string;
  customerName?: string;
  discount?: number;
  taxRate?: number;
  paymentMethod?: string;
  shippingCost?: number;
  outletName?: string;
  cashierName?: string;
  shiftId: string;
}

export interface ProcessTransactionResponse {
  message: string;
  transactionId: string;
  totalAmount: number;
}

export const posService = {
  /**
   * Memproses transaksi checkout secara lokal (Offline-First) menggunakan writeBatch.
   * Ini langsung menyimpan data ke cache offline Firestore (persistentLocalCache)
   * dan akan disinkronisasikan otomatis saat perangkat terhubung kembali.
   */
  async processTransaction(payload: ProcessTransactionPayload): Promise<ProcessTransactionResponse> {
    if (!payload.tenantId) {
      throw new Error('Tenant ID is required');
    }
    if (!payload.outletId) {
      throw new Error('Outlet ID is required');
    }
    if (payload.items.length === 0) {
      throw new Error('Transaction must contain at least one item');
    }

    // Force a fresh check/refresh of the current user's ID token right before batch execution.
    // This maintains token freshness and ensures that claims like myOutletId() do not resolve to null.
    if (auth.currentUser) {
      await auth.currentUser.getIdToken();
    }

    const batch = writeBatch(db);
    const txRef = doc(collection(db, 'transactions'));

    // 1. Calculate pricing details client-side
    const subtotal = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountVal = payload.discount || 0;
    const finalDiscount = Math.min(subtotal, discountVal);
    const afterDiscount = subtotal - finalDiscount;
    const taxRateVal = payload.taxRate || 0;
    const taxAmount = Math.round(afterDiscount * (taxRateVal / 100));
    const shippingCostVal = payload.shippingCost || 0;
    const totalAmount = afterDiscount + taxAmount + shippingCostVal;

    // Generate receipt number
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const receiptNumber = `REC-${payload.outletId.substring(0, 4).toUpperCase()}-${datePart}-${randomPart}`;

    // 2. Set the new transaction document in /transactions (COMPLETED status, paid paymentStatus)
    const transactionPayload = {
      transactionId: txRef.id,
      tenantId: payload.tenantId,
      outletId: payload.outletId,
      outletName: payload.outletName || "",
      cashierId: payload.cashierId,
      cashierName: payload.cashierName || "Kasir",
      items: payload.items.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      subtotal,
      discount: finalDiscount,
      taxRate: taxRateVal,
      taxAmount: taxAmount,
      shippingCost: shippingCostVal,
      paymentMethod: payload.paymentMethod || "Cash",
      customerName: payload.customerName || "",
      totalAmount,
      createdAt: serverTimestamp(),
      shiftId: payload.shiftId,
      status: "COMPLETED",
      paymentStatus: "paid",
      receiptNumber,
    };
    batch.set(txRef, transactionPayload);

    // 3. Update products & create stock mutations for each item
    for (const item of payload.items) {
      const productRef = doc(db, 'products', item.productId);
      const mutationRef = doc(collection(db, 'stockMutations'));

      // Decrement stock dynamically
      batch.update(productRef, {
        stock: increment(-item.quantity),
        updatedAt: serverTimestamp(),
      });

      // Track the stock mutation as SALE
      const previousStock = item.stock;
      const newStock = previousStock - item.quantity;

      const mutationPayload = {
        tenantId: payload.tenantId,
        outletId: payload.outletId,
        productId: item.productId,
        productName: item.name,
        type: "SALE",
        quantityChanged: -item.quantity,
        previousStock,
        newStock,
        referenceId: txRef.id,
        notes: "Offline POS Checkout Sale",
        createdBy: payload.cashierId,
        createdAt: serverTimestamp(),
      };
      batch.set(mutationRef, mutationPayload);
    }

    try {
      // Execute the batch locally
      await batch.commit();

      return {
        message: "Transaction completed successfully.",
        transactionId: txRef.id,
        totalAmount,
      };
    } catch (error: any) {
      if (error && error.message) {
        throw new Error(error.message);
      }
      throw error;
    }
  },
};
