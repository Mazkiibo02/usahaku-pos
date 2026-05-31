import { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

export interface Outlet {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export const outletFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Outlet name must be at least 3 characters.'),
  address: z
    .string()
    .trim()
    .min(5, 'Address must be at least 5 characters.'),
  phone: z
    .string()
    .trim()
    .min(8, 'Phone number must be at least 8 characters.'),
  isActive: z.boolean().default(true),
});

export type OutletFormValues = z.infer<typeof outletFormSchema>;
