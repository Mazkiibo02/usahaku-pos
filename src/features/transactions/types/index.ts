import { Timestamp } from 'firebase/firestore';

export interface TransactionItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Transaction {
  id: string;
  tenantId: string;
  outletId: string;
  cashierId: string;
  items: TransactionItem[];
  totalAmount: number;
  createdAt: Timestamp;
}

export interface TenantDetails {
  id: string;
  name: string;
  ownerId: string;
  logoUrl?: string;
  createdAt: Timestamp;
  lastTransactionAt?: Timestamp | null;
}
