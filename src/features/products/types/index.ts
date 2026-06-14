import { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  sku?: string;
  category: string;
  isAvailable: boolean;
  imageUrl?: string | null;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  requiresReview?: boolean;
  reviewReason?: string;
}

export interface StockMutation {
  id?: string;
  tenantId: string;
  outletId: string;
  productId: string;
  productName: string;
  type: "SALE" | "RESTOCK" | "ADJUSTMENT" | "WASTE";
  quantityChanged: number; // negative for sales
  previousStock: number;
  newStock: number;
  referenceId: string; // transactionId
  notes: string;
  createdBy: string;
  createdAt: any; // Timestamp
}

export const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Nama produk minimal harus 3 karakter.'),
  description: z.string().trim().optional(),
  price: z
    .number({ message: 'Harga harus berupa angka yang valid.' })
    .min(0, 'Harga tidak boleh kurang dari 0.'),
  stock: z
    .number({ message: 'Stok harus berupa angka yang valid.' })
    .min(0, 'Stok tidak boleh kurang dari 0.'),
  sku: z.string().trim().optional(),
  category: z
    .string()
    .trim()
    .min(1, 'Kategori wajib diisi.'),
  isAvailable: z.boolean(),
  imageUrl: z.string().trim().optional().nullable(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
