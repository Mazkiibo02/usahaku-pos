import { httpsCallable } from 'firebase/functions';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { functions } from '@/src/lib/firebase/functions';
import { db } from '@/src/lib/firebase/firestore';
import type { Cashier, CashierFormValues } from '../types';

export const cashierService = {
  /**
   * Panggilan Cloud Function untuk membuat akun staf baru (kasir)
   * secara aman di backend.
   */
  async createCashier(data: CashierFormValues): Promise<{ message: string; uid: string }> {
    const createStaffAccount = httpsCallable<CashierFormValues, { message: string; uid: string }>(
      functions,
      'createStaffAccount',
    );
    
    try {
      const response = await createStaffAccount(data);
      return response.data;
    } catch (error: any) {
      // Tangani error khusus Firebase Functions
      if (error && error.message) {
        throw new Error(error.message);
      }
      throw error;
    }
  },

  /**
   * Mengambil daftar staf/kasir yang terdaftar di bawah tenantId saat ini.
   */
  async getCashiers(tenantId: string): Promise<Cashier[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    
    const staffRef = collection(db, 'staff');
    const q = query(
      staffRef,
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        uid: doc.id,
      } as Cashier;
    });
  },

  /**
   * Memperbarui outlet penugasan (mutasi kasir) di Firestore.
   * Hanya memperbarui document staff di Firestore, tidak membuat/mengubah Auth user.
   */
  async updateCashierOutlet(cashierId: string, outletId: string): Promise<void> {
    if (!cashierId) {
      throw new Error('Cashier ID is required');
    }
    if (!outletId) {
      throw new Error('Outlet ID is required');
    }

    const docRef = doc(db, 'staff', cashierId);
    await updateDoc(docRef, {
      outletId,
      updatedAt: serverTimestamp(),
    });
  },
};
