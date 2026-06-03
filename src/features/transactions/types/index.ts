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
  customerName?: string;
  discount?: number;
  taxRate?: number;
  taxAmount?: number;
  shippingCost?: number;
  paymentMethod?: string;
  subtotal?: number;
  outletName?: string;
  cashierName?: string;
  shiftId?: string;
}

export interface TenantDetails {
  id: string;
  name: string;
  ownerId: string;
  logoUrl?: string;
  createdAt: Timestamp;
  lastTransactionAt?: Timestamp | null;
}
