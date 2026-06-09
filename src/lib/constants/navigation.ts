import type { LucideIcon } from 'lucide-react';
import { Briefcase, LayoutDashboard, ReceiptText, Store, Users, Wallet, Settings } from 'lucide-react';

import type { UserRole } from '@/src/types/auth';

export type NavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const OWNER_NAV_LINKS: NavigationItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Cabang Outlet',
    href: '/outlets',
    icon: Store,
  },
  {
    title: 'Produk',
    href: '/products',
    icon: Briefcase,
  },
  {
    title: 'Kasir / POS',
    href: '/pos',
    icon: Wallet,
  },
  {
    title: 'Kasir',
    href: '/cashiers',
    icon: Users,
  },
  {
    title: 'Pengaturan',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export const CASHIER_NAV_LINKS: NavigationItem[] = [
  {
    title: 'Kasir / POS',
    href: '/pos',
    icon: Wallet,
  },
  {
    title: 'Transaksi',
    href: '/transactions',
    icon: ReceiptText,
  },
];

export function getNavigationByRole(role: UserRole | null): NavigationItem[] {
  if (role === 'owner') {
    return OWNER_NAV_LINKS;
  }

  if (role === 'cashier') {
    return CASHIER_NAV_LINKS;
  }

  return [];
}
