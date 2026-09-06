import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/src/lib/firebase/admin';
import { GoogleGenAI } from '@google/genai';

// Vercel Hobby limit is 10s by default. We extend it to 60s for AI generation.
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Tidak ada akses (Unauthorized)' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      console.error('[AI Insights] Token verification failed:', error);
      return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 });
    }

    const { role, tenantId } = decodedToken;

    // 1. RBAC Check: Cashiers are strictly blocked
    if (role === 'cashier') {
      return NextResponse.json({ error: 'Akses Ditolak: Hak akses tidak mencukupi.' }, { status: 403 });
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'ID Tenant tidak ditemukan.' }, { status: 400 });
    }

    // 2. Monetization Gate: Check Subscription Tier
    const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan.' }, { status: 404 });
    }

    const tenantData = tenantDoc.data();
    const subscription = tenantData?.subscription;

    // If there is no subscription, they are on Freemium.
    if (!subscription) {
      return NextResponse.json(
        { error: 'Fitur AI Analyst hanya tersedia untuk pelanggan berbayar (Paket 1 Outlet atau lebih).' },
        { status: 403 }
      );
    }

    // If there is a subscription, check if it's expired
    const isExpiredStatus = subscription.status === 'EXPIRED';
    let isExpiredDate = false;
    if (subscription.currentPeriodEnd) {
      // Handle both Firestore Timestamp and Date objects
      const endDate = subscription.currentPeriodEnd.toDate ? subscription.currentPeriodEnd.toDate() : new Date(subscription.currentPeriodEnd);
      isExpiredDate = endDate.getTime() < Date.now();
    }

    if (isExpiredStatus || isExpiredDate) {
      return NextResponse.json(
        { error: 'Masa berlangganan Anda telah berakhir. Silakan perbarui langganan untuk menggunakan fitur AI.' },
        { status: 403 }
      );
    }

    // 3. Data Retrieval: Fetch recent invoices for the tenant
    // We limit to 100 recent invoices to keep prompt size manageable and fast
    const invoicesSnapshot = await adminDb
      .collection('invoices')
      .where('tenantId', '==', tenantId)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    if (invoicesSnapshot.empty) {
      return NextResponse.json({
        insights: 'Belum ada data transaksi yang cukup untuk dianalisis oleh AI. Silakan catat beberapa transaksi terlebih dahulu.',
      });
    }

    // 4. Data Processing: Aggregate metrics
    let totalRevenue = 0;
    let totalItemsSold = 0;
    const itemsCountMap: Record<string, number> = {};

    invoicesSnapshot.forEach((doc) => {
      const data = doc.data();
      totalRevenue += data.totalAmount || 0;
      
      if (Array.isArray(data.items)) {
        data.items.forEach((item: any) => {
          totalItemsSold += item.quantity || 0;
          if (item.name) {
            itemsCountMap[item.name] = (itemsCountMap[item.name] || 0) + (item.quantity || 1);
          }
        });
      }
    });

    const averageOrderValue = Math.round(totalRevenue / invoicesSnapshot.size);
    
    // Get top 5 selling products
    const topProducts = Object.entries(itemsCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => `${name} (${qty} terjual)`);

    // 5. Generate Insights using Gemini API
    const prompt = `
Anda adalah Business Analyst AI cerdas untuk UMKM. Tugas Anda memberikan 4 poin analisis yang SANGAT SINGKAT, tajam, dan *to the point* (maksimal total 50-70 kata).
Gunakan Markdown (bold) untuk penekanan dan jangan gunakan basa-basi atau kalimat pembuka/penutup. Wajib gunakan format emoji persis seperti di bawah ini:

📈 **Performa:** [1 kalimat evaluasi tren penjualan & AOV]
📦 **Prioritas Restock:** [Sebutkan 1-2 produk terlaris spesifik yang wajib di-stok ulang karena perputarannya cepat]
🎯 **Ide Bundling:** [1 ide paket penawaran gabungan produk terlaris untuk menaikkan nilai transaksi]
📢 **Strategi Promo:** [1 ide diskon/pemasaran taktis untuk produk terlaris]

DATA PENJUALAN TERBARU (${invoicesSnapshot.size} transaksi terakhir):
- Pendapatan: Rp ${totalRevenue.toLocaleString('id-ID')}
- Rata-rata Nilai Transaksi (AOV): Rp ${averageOrderValue.toLocaleString('id-ID')}
- Produk Terlaris: ${topProducts.length > 0 ? topProducts.join(', ') : 'Belum ada'}
    `;

    // Initialize Gemini client inside try-catch to avoid top-level crashes
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Kunci API Gemini belum diatur di server.' }, { status: 500 });
    }
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    return NextResponse.json({ insights: response.text });

  } catch (error: any) {
    console.error('[AI Insights] Server error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server saat memproses Analisis AI.', details: error?.message },
      { status: 500 }
    );
  }
}
