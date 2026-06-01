import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/src/lib/firebase/firestore';
import type { Transaction, TenantDetails } from '../types';

export const transactionService = {
  /**
   * Mengambil riwayat transaksi penjualan yang terisolasi berdasarkan tenantId.
   * Diurutkan dari transaksi terbaru (createdAt desc) dan dibatasi jumlahnya untuk optimalisasi.
   */
  async getTransactions(tenantId: string, limitCount = 50): Promise<Transaction[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      } as Transaction;
    });
  },

  /**
   * Mengambil detail Tenant untuk menampilkan nama toko/usaha di struk belanja.
   */
  async getTenantDetails(tenantId: string): Promise<TenantDetails> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    const docRef = doc(db, 'tenants', tenantId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Tenant not found');
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as TenantDetails;
  },
};
