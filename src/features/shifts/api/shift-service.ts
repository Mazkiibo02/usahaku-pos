import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import { db } from '@/src/lib/firebase/firestore';
import type { Shift } from '../types';

export const shiftService = {
  /**
   * Mengambil shift yang saat ini sedang aktif (OPEN) untuk user/cashier tertentu.
   */
  async getActiveShift(tenantId: string, cashierId: string): Promise<Shift | null> {
    if (!tenantId || !cashierId) return null;
    const shiftsRef = collection(db, 'tenants', tenantId, 'shifts');
    const q = query(
      shiftsRef,
      where('cashierId', '==', cashierId),
      where('status', '==', 'OPEN'),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const docSnap = querySnapshot.docs[0];
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Shift;
  },

  /**
   * Membuka shift baru dengan mencatat modal awal.
   */
  async openShift(
    tenantId: string,
    data: {
      cashierId: string;
      cashierName: string;
      outletId: string;
      startingCash: number;
    }
  ): Promise<string> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const shiftsRef = collection(db, 'tenants', tenantId, 'shifts');
    const docRef = await addDoc(shiftsRef, {
      cashierId: data.cashierId,
      cashierName: data.cashierName,
      outletId: data.outletId,
      startTime: serverTimestamp(),
      endTime: null,
      startingCash: data.startingCash,
      expectedEndingCash: data.startingCash, // Modal awal di laci di awal shift
      actualEndingCash: null,
      totalCashSales: 0,
      totalQrisSales: 0,
      status: 'OPEN',
    });
    return docRef.id;
  },

  /**
   * Menutup shift yang sedang aktif dengan mencatat waktu selesai dan uang fisik yang dihitung.
   */
  async closeShift(
    tenantId: string,
    shiftId: string,
    data: {
      actualEndingCash: number;
      expectedEndingCash: number;
    }
  ): Promise<void> {
    if (!tenantId) throw new Error('Tenant ID is required');
    if (!shiftId) throw new Error('Shift ID is required');
    const shiftDocRef = doc(db, 'tenants', tenantId, 'shifts', shiftId);
    await updateDoc(shiftDocRef, {
      endTime: serverTimestamp(),
      actualEndingCash: data.actualEndingCash,
      expectedEndingCash: data.expectedEndingCash,
      status: 'CLOSED',
    });
  },
};
