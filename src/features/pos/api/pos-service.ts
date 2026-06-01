import { httpsCallable } from 'firebase/functions';
import { functions } from '@/src/lib/firebase/functions';

export interface TransactionItemPayload {
  productId: string;
  quantity: number;
}

export interface ProcessTransactionPayload {
  items: TransactionItemPayload[];
  outletId?: string;
}

export interface ProcessTransactionResponse {
  message: string;
  transactionId: string;
  totalAmount: number;
}

export const posService = {
  /**
   * Panggilan Cloud Function untuk memproses transaksi penjualan
   * secara aman di backend dengan isolasi tenant dan validasi stok.
   */
  async processTransaction(payload: ProcessTransactionPayload): Promise<ProcessTransactionResponse> {
    const processTransactionFn = httpsCallable<ProcessTransactionPayload, ProcessTransactionResponse>(
      functions,
      'processTransaction',
    );
    
    try {
      const response = await processTransactionFn(payload);
      return response.data;
    } catch (error: any) {
      if (error && error.message) {
        throw new Error(error.message);
      }
      throw error;
    }
  },
};
