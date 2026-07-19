import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/src/lib/firebase/firestore';
import type { Transaction, TenantDetails } from '../types';

export const transactionService = {
  /**
   * Mengambil riwayat transaksi penjualan yang terisolasi berdasarkan tenantId.
   * Diurutkan dari transaksi terbaru (createdAt desc) dan dibatasi jumlahnya untuk optimalisasi.
   */
  /**
   * Mengambil riwayat transaksi penjualan yang terisolasi berdasarkan tenantId.
   * Diurutkan dari transaksi terbaru (createdAt desc) dan dibatasi jumlahnya untuk optimalisasi.
   */
  async getTransactions(
    tenantId: string,
    limitCount = 50,
    outletId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Transaction[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    const transactionsRef = collection(db, 'transactions');
    const queryConstraints: QueryConstraint[] = [where('tenantId', '==', tenantId)];

    if (outletId && outletId.trim() !== '') {
      queryConstraints.push(where('outletId', '==', outletId));
    }

    if (startDate) {
      queryConstraints.push(where('createdAt', '>=', startDate));
    }

    if (endDate) {
      queryConstraints.push(where('createdAt', '<=', endDate));
    }

    queryConstraints.push(orderBy('createdAt', 'desc'));
    queryConstraints.push(limit(limitCount || 50));

    const q = query(transactionsRef, ...queryConstraints);
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
   * Mengambil riwayat transaksi penjualan dalam rentang tanggal tertentu.
   */
  async getTransactionsInDateRange(
    tenantId: string,
    startDateStr: string,
    endDateStr: string,
    outletId?: string
  ): Promise<Transaction[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    const startTimestamp = new Date(startDateStr + 'T00:00:00');
    const endTimestamp = new Date(endDateStr + 'T23:59:59.999');

    const transactionsRef = collection(db, 'transactions');
    let q;

    if (outletId && outletId.trim() !== '') {
      q = query(
        transactionsRef,
        where('tenantId', '==', tenantId),
        where('outletId', '==', outletId),
        where('createdAt', '>=', startTimestamp),
        where('createdAt', '<=', endTimestamp),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        transactionsRef,
        where('tenantId', '==', tenantId),
        where('createdAt', '>=', startTimestamp),
        where('createdAt', '<=', endTimestamp),
        orderBy('createdAt', 'desc')
      );
    }

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
