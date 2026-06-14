import React from 'react';
import { Metadata } from 'next';
import LandingPageClient from '@/src/features/landing/components/LandingPageClient';

export const metadata: Metadata = {
  title: "Usahaku POS — Aplikasi Kasir Online & Sistem Penjualan UMKM Premium",
  description: "Sistem POS SaaS terbaik untuk kelola kasir, stok inventaris offline-first, dan keuangan multi-cabang. Coba gratis 30 hari sekarang!",
  keywords: [
    "saas pos",
    "aplikasi kasir",
    "aplikasi penjualan",
    "software kasir toko",
    "pos offline-first",
    "aplikasi kasir cafe",
    "sistem pos umkm",
    "aplikasi kasir murah",
    "pos indonesia"
  ],
  alternates: {
    canonical: "https://usahakupos.my.id",
  },
  openGraph: {
    title: "Usahaku POS — Aplikasi Kasir Online & Sistem Penjualan UMKM Premium",
    description: "Sistem POS SaaS terbaik untuk kelola kasir, stok inventaris offline-first, dan keuangan multi-cabang. Coba gratis 30 hari sekarang!",
    url: "https://usahakupos.my.id",
    siteName: "Usahaku POS",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/images/og-landing.png",
        width: 1200,
        height: 630,
        alt: "Usahaku POS — Aplikasi Kasir Online & Sistem Penjualan UMKM Premium",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Usahaku POS — Aplikasi Kasir Online & Sistem Penjualan UMKM Premium",
    description: "Sistem POS SaaS terbaik untuk kelola kasir, stok inventaris offline-first, dan keuangan multi-cabang. Coba gratis 30 hari sekarang!",
    images: ["/images/og-landing.png"],
  },
};

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Usahaku POS",
    "operatingSystem": "All",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "IDR",
      "description": "Free 30-day Trial"
    },
    "description": "Sistem POS SaaS dengan arsitektur offline-first premium untuk mengelola kasir, stok inventaris, dan keuangan multi-cabang bagi UMKM Indonesia."
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPageClient />
    </>
  );
}
