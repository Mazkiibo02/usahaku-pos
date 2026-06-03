import * as XLSX from 'xlsx';
import { format } from 'date-fns';

import type { Transaction } from '@/src/features/transactions/types';
import type { Outlet } from '@/src/features/outlets/types';
import type { Cashier } from '@/src/features/cashiers/types';

/**
 * Exports transaction list to an Excel (.xlsx) file with detailed columns.
 * 
 * @param transactions List of transactions in the selected date range
 * @param outlets List of outlets for name lookup
 * @param cashiers List of cashiers for name lookup
 * @param ownerId Current logged in owner's ID
 * @param ownerName Current logged in owner's name
 * @param dateRange Range of selected dates { from: Date; to: Date }
 */
export function exportDashboardToExcel(
  transactions: Transaction[],
  outlets: Outlet[],
  cashiers: Cashier[],
  ownerId: string | null,
  ownerName: string | null,
  dateRange: { from: Date; to: Date }
) {
  try {
    // 1. Create workbook
    const wb = XLSX.utils.book_new();

    const outletMap = new Map(outlets.map((o) => [o.id, o.name]));
    const cashierMap = new Map(cashiers.map((c) => [c.uid, c.name]));

    // 2. Build Transaction List Sheet
    const formattedTransactions = transactions.map((tx) => {
      // Get Branch name (outletName)
      const branchName = tx.outletName || (tx.outletId ? outletMap.get(tx.outletId) : '') || 'Unknown Branch';

      // Get Cashier name (cashierName)
      let staffName = tx.cashierName;
      if (!staffName && tx.cashierId) {
        staffName = cashierMap.get(tx.cashierId);
      }
      if (!staffName && tx.cashierId && tx.cashierId === ownerId) {
        staffName = ownerName || 'Owner';
      }
      if (!staffName) {
        staffName = 'Staf/Owner';
      }

      // Calculate Total Items
      const totalItems = tx.items ? tx.items.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;

      // Format Date
      let txDate = '-';
      if (tx.createdAt) {
        const d = (tx.createdAt as any).toDate ? (tx.createdAt as any).toDate() : new Date(tx.createdAt as any);
        txDate = format(d, 'yyyy-MM-dd HH:mm');
      }

      return {
        Tanggal: txDate,
        Cabang: branchName,
        'Nama Kasir': staffName,
        'Total Item': totalItems,
        'Pendapatan (IDR)': tx.totalAmount || 0,
      };
    });

    const wsTransactions = XLSX.utils.json_to_sheet(formattedTransactions);
    XLSX.utils.book_append_sheet(wb, wsTransactions, 'Laporan Penjualan');

    // 3. Generate Filename containing Date Range
    const fromStr = format(dateRange.from, 'yyyyMMdd');
    const toStr = format(dateRange.to, 'yyyyMMdd');
    const filename = `Laporan_Usahaku_${fromStr}_ke_${toStr}.xlsx`;

    // 4. Trigger download
    XLSX.writeFile(wb, filename);
  } catch (err) {
    console.error('Failed to export transaction data to Excel', err);
    alert('Gagal mengekspor data ke Excel. Silakan coba lagi.');
  }
}

/**
 * Triggers standard browser print dialog, dynamically injecting a helper CSS class
 * on document body to hide POS sidebar, dashboard filters, and headers for a pristine A4 scale.
 */
export function printDashboardToPDF() {
  if (typeof window === 'undefined') return;

  // Add identifier class to body
  document.body.classList.add('printing-dashboard');

  // Trigger print dialog
  window.print();

  // Handle cleanup on completion or cancellation
  const cleanup = () => {
    document.body.classList.remove('printing-dashboard');
  };

  // Modern browsers support this event
  window.onafterprint = cleanup;

  // Fallback cleanup timer in case of browser quirks
  setTimeout(cleanup, 2000);
}
