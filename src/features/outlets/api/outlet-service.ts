import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDoc,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db } from '@/src/lib/firebase/firestore';
import type { Outlet, OutletFormValues } from '../types';

export const outletService = {
  async getOutlets(tenantId: string): Promise<Outlet[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    const outletsRef = collection(db, 'outlets');
    const q = query(
      outletsRef,
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      } as Outlet;
    });
  },

  async createOutlet(tenantId: string, data: OutletFormValues): Promise<string> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    const batch = writeBatch(db);
    const outletsRef = collection(db, 'outlets');
    const newOutletRef = doc(outletsRef);
    
    batch.set(newOutletRef, {
      tenantId,
      name: data.name,
      address: data.address,
      phone: data.phone,
      isActive: true, // MUST strictly inject isActive: true
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const tenantRef = doc(db, 'tenants', tenantId);
    batch.update(tenantRef, {
      outletsCount: increment(1),
    });

    await batch.commit();
    return newOutletRef.id;
  },

  async updateOutlet(
    tenantId: string,
    outletId: string,
    data: Partial<OutletFormValues>
  ): Promise<void> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    if (!outletId) {
      throw new Error('Outlet ID is required');
    }

    const docRef = doc(db, 'outlets', outletId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Outlet not found');
    }

    if (docSnap.data().tenantId !== tenantId) {
      throw new Error('Unauthorized: Tenant ID mismatch');
    }

    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteOutlet(tenantId: string, outletId: string): Promise<void> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    if (!outletId) {
      throw new Error('Outlet ID is required');
    }

    const docRef = doc(db, 'outlets', outletId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Outlet not found');
    }

    if (docSnap.data().tenantId !== tenantId) {
      throw new Error('Unauthorized: Tenant ID mismatch');
    }

    const batch = writeBatch(db);
    batch.delete(docRef);

    const tenantRef = doc(db, 'tenants', tenantId);
    batch.update(tenantRef, {
      outletsCount: increment(-1),
    });

    await batch.commit();
  },
};
