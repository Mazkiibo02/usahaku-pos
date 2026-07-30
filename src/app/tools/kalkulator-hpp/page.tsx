import { Metadata } from 'next';
import HppCalculatorClient from '@/src/features/tools/components/HppCalculatorClient';

export const metadata: Metadata = {
  title: "Kalkulator HPP & Simulasi Harga Jual Bisnis Gratis | Usahaku POS",
  description: "Hitung Harga Pokok Penjualan (HPP) produk retail, jasa, bengkel, dan kuliner Anda secara akurat. Tentukan harga jual ideal dengan margin profit maksimal tanpa takut rugi.",
  keywords: [
    "kalkulator hpp bisnis",
    "kalkulator hpp retail dan jasa",
    "cara hitung hpp usaha",
    "hitung harga jual produk",
    "rumus hpp modal usaha",
    "kalkulator keuntungan umkm"
  ],
  openGraph: {
    title: "Kalkulator HPP & Simulasi Harga Jual Bisnis Gratis | Usahaku POS",
    description: "Hitung Harga Pokok Penjualan (HPP) produk retail, jasa, bengkel, dan kuliner Anda secara akurat. Tentukan harga jual ideal dengan margin profit maksimal tanpa takut rugi.",
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
