import { Timestamp } from 'firebase/firestore';

export interface Shift {
  id: string;
  cashierId: string;
  cashierName: string;
  outletId: string;
  startTime: Timestamp; // Opened at
  endTime?: Timestamp | null; // Closed at
  startingCash: number; // Modal Awal di laci
  expectedEndingCash?: number; // Calculated by system (Starting + Cash Sales)
  actualEndingCash?: number; // Counted by cashier physically
  totalCashSales: number; // Incremented during the shift
  totalQrisSales: number; // Incremented during the shift
  status: 'OPEN' | 'CLOSED';
  discrepancy?: number;
  notes?: string;
}
