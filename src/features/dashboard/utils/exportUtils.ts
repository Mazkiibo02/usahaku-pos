import * as XLSX from 'xlsx';
import { format } from 'date-fns';

import type { DashboardStats } from '../services/analyticsService';

/**
 * Exports dashboard statistical data to an Excel (.xlsx) file with separate sheets
 * for daily sales trends and top-selling products.
 * 
 * @param statsData Calculated dashboard statistics
 * @param dateRange Range of selected dates { from: Date; to: Date }
 */
export function exportDashboardToExcel(
  statsData: DashboardStats,
  dateRange: { from: Date; to: Date }
) {
  try {
    // 1. Create workbook
    const wb = XLSX.utils.book_new();

    // 2. Build Daily Revenue Sheet
    const formattedRevenue = statsData.chartData.map((item) => ({
      Tanggal: item.date,
      'Pendapatan (IDR)': item.revenue,
    }));
    const wsRevenue = XLSX.utils.json_to_sheet(formattedRevenue);
    XLSX.utils.book_append_sheet(wb, wsRevenue, 'Ringkasan Pendapatan');

    // 3. Build Top Products Sheet
    const formattedProducts = statsData.topProducts.map((item, index) => ({
      Peringkat: index + 1,
      'Nama Produk': item.name,
      'Jumlah Terjual': item.quantity,
      'ID Produk': item.id,
    }));
    const wsProducts = XLSX.utils.json_to_sheet(formattedProducts);
    XLSX.utils.book_append_sheet(wb, wsProducts, 'Produk Terlaris');

    // 4. Generate Filename containing Date Range
    const fromStr = format(dateRange.from, 'yyyyMMdd');
    const toStr = format(dateRange.to, 'yyyyMMdd');
    const filename = `Laporan_Usahaku_${fromStr}_ke_${toStr}.xlsx`;

    // 5. Trigger download
    XLSX.writeFile(wb, filename);
  } catch (err) {
    console.error('Failed to export dashboard data to Excel', err);
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
