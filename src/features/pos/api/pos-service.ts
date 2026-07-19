import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
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
  cashTendered?: number;
  changeAmount?: number;
}

export interface ProcessTransactionResponse {
  message: string;
  transactionId: string;
  totalAmount: number;
}

export const posService = {
  /**
   * Memproses transaksi checkout secara atomik menggunakan runTransaction.
   * Melakukan validasi stok real-time (Read-First) sebelum menulis data.
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

    // Force a fresh check/refresh of the current user's ID token right before execution.
    // This maintains token freshness and ensures that claims like tenantId and role are fully synchronized.
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true);
    }

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

    const transactionRef = doc(collection(db, 'transactions'));

    try {
      await runTransaction(db, async (transaction) => {
        // --- READ PHASE ---
        const productRefs = payload.items.map(item => doc(db, 'products', item.productId));
        const productSnaps = await Promise.all(productRefs.map(ref => transaction.get(ref)));

        // --- VALIDATION PHASE ---
        for (let i = 0; i < payload.items.length; i++) {
          const item = payload.items[i];
          const snap = productSnaps[i];
          if (!snap.exists()) {
            throw new Error(`Produk tidak ditemukan: ${item.name}`);
          }
          const productData = snap.data();
          const currentStock = productData.stock ?? 0;
          if (currentStock < item.quantity) {
            throw new Error(`Stok produk "${item.name}" tidak mencukupi (Tersedia: ${currentStock}, Diminta: ${item.quantity})`);
          }
        }

        // --- WRITE PHASE ---
        // 1. Mutate product documents to reduce stock & create mutation logs
        for (let i = 0; i < payload.items.length; i++) {
          const item = payload.items[i];
          const snap = productSnaps[i];
          const productData = snap.data();
          const currentStock = productData?.stock ?? 0;
          const newStock = currentStock - item.quantity;
          const productRef = snap.ref;

          transaction.update(productRef, {
            stock: newStock,
            updatedAt: serverTimestamp(),
          });
        }

        // Common Payload for both Invoice and Transaction
        const commonPayload = {
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
          taxAmount,
          shippingCost: shippingCostVal,
          paymentMethod: payload.paymentMethod || "Cash",
          customerName: payload.customerName || "",
          totalAmount,
          createdAt: serverTimestamp(),
          shiftId: payload.shiftId,
          status: "COMPLETED",
          paymentStatus: "paid",
          receiptNumber,
          ...(payload.cashTendered !== undefined ? { cashTendered: payload.cashTendered } : {}),
          ...(payload.changeAmount !== undefined ? { changeAmount: payload.changeAmount } : {}),
        };

        // 2. Write new document to /transactions collection
        transaction.set(transactionRef, {
          transactionId: transactionRef.id,
          ...commonPayload,
        });

      });

      return {
        message: "Transaction completed successfully.",
        transactionId: transactionRef.id,
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
