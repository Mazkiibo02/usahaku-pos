import { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

export interface Cashier {
  uid: string;
  name: string;
  email: string;
  role: 'cashier';
  tenantId: string;
  outletId: string;
  createdAt: Date | Timestamp;
}

export const cashierSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Nama harus minimal 3 karakter.'),
  email: z
    .string()
    .trim()
    .email('Masukkan alamat email yang valid.'),
  password: z
    .string()
    .min(6, 'Password harus minimal 6 karakter.'),
  outletId: z
    .string()
    .min(1, 'Silakan pilih outlet cabang.'),
});

export type CashierFormValues = z.infer<typeof cashierSchema>;
