import {
  collection,
  doc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDoc,
  arrayUnion,
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

  async createProduct(tenantId: string, data: ProductFormValues, customProductId?: string): Promise<string> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    
    let docRef;
    if (customProductId) {
      docRef = doc(db, 'products', customProductId);
      await setDoc(docRef, {
        tenantId,
        name: data.name,
        description: data.description ?? '',
        price: data.price,
        stock: data.stock,
        sku: data.sku ?? '',
        category: data.category,
        isAvailable: data.isAvailable ?? true,
        imageUrl: data.imageUrl ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const productsRef = collection(db, 'products');
      docRef = await addDoc(productsRef, {
        tenantId,
        name: data.name,
        description: data.description ?? '',
        price: data.price,
        stock: data.stock,
        sku: data.sku ?? '',
        category: data.category,
        isAvailable: data.isAvailable ?? true,
        imageUrl: data.imageUrl ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    if (data.category && data.category.trim() !== '') {
      try {
        const tenantRef = doc(db, 'tenants', tenantId);
        await updateDoc(tenantRef, {
          categories: arrayUnion(data.category.trim()),
        });
      } catch (err) {
        console.error('Error adding category to tenant profile:', err);
      }
    }

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

    if (data.category && data.category.trim() !== '') {
      try {
        const tenantRef = doc(db, 'tenants', tenantId);
        await updateDoc(tenantRef, {
          categories: arrayUnion(data.category.trim()),
        });
      } catch (err) {
        console.error('Error updating category in tenant profile:', err);
      }
    }
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

  async getTenantCategories(tenantId: string): Promise<string[]> {
    if (!tenantId) return [];
    try {
      const tenantRef = doc(db, 'tenants', tenantId);
      const docSnap = await getDoc(tenantRef);
      if (docSnap.exists()) {
        return (docSnap.data().categories as string[]) || [];
      }
    } catch (err) {
      console.error('Error fetching tenant categories:', err);
    }
    return [];
  },
};
