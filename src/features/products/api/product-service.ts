import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/src/lib/firebase/firestore';
import type { Product, ProductFormValues } from '../types';

export const productService = {
  async getProducts(tenantId: string): Promise<Product[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    const productsRef = collection(db, 'products');
    const q = query(
      productsRef,
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      } as Product;
    });
  },

  async createProduct(tenantId: string, data: ProductFormValues): Promise<string> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    const productsRef = collection(db, 'products');
    const docRef = await addDoc(productsRef, {
      tenantId,
      name: data.name,
      description: data.description ?? '',
      price: data.price,
      sku: data.sku ?? '',
      category: data.category,
      isAvailable: data.isAvailable ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateProduct(
    tenantId: string,
    productId: string,
    data: Partial<ProductFormValues>
  ): Promise<void> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    if (!productId) {
      throw new Error('Product ID is required');
    }

    const docRef = doc(db, 'products', productId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Product not found');
    }

    if (docSnap.data().tenantId !== tenantId) {
      throw new Error('Unauthorized: Tenant ID mismatch');
    }

    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteProduct(tenantId: string, productId: string): Promise<void> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    if (!productId) {
      throw new Error('Product ID is required');
    }

    const docRef = doc(db, 'products', productId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Product not found');
    }

    if (docSnap.data().tenantId !== tenantId) {
      throw new Error('Unauthorized: Tenant ID mismatch');
    }

    await deleteDoc(docRef);
  },
};
