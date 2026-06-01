import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';

import { db } from '@/src/lib/firebase/firestore';
import { productService } from '@/src/features/products/api/product-service';

export interface DailyStatDocument {
  date: string;
  totalRevenue: number;
  totalTransactions: number;
  productsSold: Record<string, number>;
}

export interface DashboardStats {
  aggregateRevenue: number;
  aggregateTransactions: number;
  chartData: Array<{ date: string; revenue: number }>;
  topProducts: Array<{ id: string; name: string; quantity: number }>;
}

export const analyticsService = {
  /**
   * Fetches daily rollup stats for the given tenant within the date range,
   * aggregates them, and resolves product names for top-selling items.
   * 
   * @param tenantId The tenant's identifier
   * @param startDateStr Format: YYYY-MM-DD
   * @param endDateStr Format: YYYY-MM-DD
   */
  async getDashboardStats(
    tenantId: string,
    startDateStr: string,
    endDateStr: string
  ): Promise<DashboardStats> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    if (!startDateStr || !endDateStr) {
      throw new Error('Start date and end date are required');
    }

    // 1. Fetch daily stats from the Firestore sub-collection: stats/${tenantId}/daily
    const dailyStatsRef = collection(db, 'stats', tenantId, 'daily');
    const statsQuery = query(
      dailyStatsRef,
      where('date', '>=', startDateStr),
      where('date', '<=', endDateStr),
      orderBy('date', 'asc')
    );

    const querySnapshot = await getDocs(statsQuery);

    let aggregateRevenue = 0;
    let aggregateTransactions = 0;
    const dailyRevenueMap: Record<string, number> = {};
    const productsSoldMap: Record<string, number> = {};

    // 2. Pre-populate every date in the range with 0 revenue to ensure continuous charting
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    
    // We clone the start date to iterate without mutating the original reference
    const current = new Date(start);
    while (current <= end) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      dailyRevenueMap[dateKey] = 0;
      current.setDate(current.getDate() + 1);
    }

    // 3. Process fetched documents
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as DailyStatDocument;
      const date = data.date || docSnap.id;
      const revenue = typeof data.totalRevenue === 'number' ? data.totalRevenue : 0;
      const transactions = typeof data.totalTransactions === 'number' ? data.totalTransactions : 0;
      const productsSold = data.productsSold || {};

      aggregateRevenue += revenue;
      aggregateTransactions += transactions;

      // Update maps
      if (date in dailyRevenueMap) {
        dailyRevenueMap[date] = revenue;
      } else {
        // Fallback in case document date falls slightly out of range bounds
        dailyRevenueMap[date] = revenue;
      }

      for (const [productId, qty] of Object.entries(productsSold)) {
        productsSoldMap[productId] = (productsSoldMap[productId] || 0) + qty;
      }
    });

    // Format chart data for recharts
    const chartData = Object.entries(dailyRevenueMap)
      .map(([date, revenue]) => ({
        date,
        revenue,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 4. Resolve top-selling products using the catalog
    let topProducts: Array<{ id: string; name: string; quantity: number }> = [];

    try {
      // Fetch all products under this tenant
      const products = await productService.getProducts(tenantId);
      const productMap = new Map(products.map((p) => [p.id, p]));

      topProducts = Object.entries(productsSoldMap)
        .map(([id, quantity]) => {
          const product = productMap.get(id);
          return {
            id,
            name: product ? product.name : `Unknown Product (${id.slice(0, 6)})`,
            quantity,
          };
        })
        .sort((a, b) => b.quantity - a.quantity);
    } catch (err) {
      console.error('Failed to resolve product names in analytics service', err);
      // Fallback: list product IDs as names
      topProducts = Object.entries(productsSoldMap)
        .map(([id, quantity]) => ({
          id,
          name: `Product (${id.slice(0, 6)})`,
          quantity,
        }))
        .sort((a, b) => b.quantity - a.quantity);
    }

    return {
      aggregateRevenue,
      aggregateTransactions,
      chartData,
      topProducts,
    };
  },
};
