import { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  price: number;
  sku?: string;
  category: string;
  isAvailable: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Product name must be at least 3 characters.'),
  description: z.string().trim().optional(),
  price: z
    .number({ message: 'Price must be a valid number.' })
    .min(0, 'Price must be greater than or equal to 0.'),
  sku: z.string().trim().optional(),
  category: z
    .string()
    .trim()
    .min(1, 'Category is required.'),
  isAvailable: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
