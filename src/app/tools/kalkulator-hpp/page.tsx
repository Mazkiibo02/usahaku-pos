import { Metadata } from 'next';
import HppCalculatorClient from '@/src/features/tools/components/HppCalculatorClient';

export const metadata: Metadata = {
  title: "Kalkulator HPP Makanan & Simulasi Harga Jual Gratis | Usahaku POS",
  description: "Hitung Harga Pokok Penjualan (HPP) menu kuliner, kafe, dan restoran Anda secara akurat. Tentukan harga jual ideal dengan margin profit maksimal tanpa takut boncos.",
  keywords: [
    "kalkulator hpp makanan",
    "cara hitung hpp cafe",
    "hitung harga jual makanan",
    "rumus hpp produk kuliner",
    "kalkulator keuntungan resto"
  ],
  openGraph: {
    title: "Kalkulator HPP Makanan & Simulasi Harga Jual Gratis | Usahaku POS",
    description: "Hitung Harga Pokok Penjualan (HPP) menu kuliner, kafe, dan restoran Anda secara akurat. Tentukan harga jual ideal dengan margin profit maksimal tanpa takut boncos.",
    url: "https://usahakupos.my.id/tools/kalkulator-hpp",
    siteName: "Usahaku POS",
    locale: "id_ID",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function HppCalculatorPage() {
  return <HppCalculatorClient />;
}
