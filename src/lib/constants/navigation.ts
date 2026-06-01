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
    title: 'Outlets',
    href: '/outlets',
    icon: Store,
  },
  {
    title: 'Products',
    href: '/products',
    icon: Briefcase,
  },
  {
    title: 'Cashiers',
    href: '/cashiers',
    icon: Users,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export const CASHIER_NAV_LINKS: NavigationItem[] = [
  {
    title: 'POS',
    href: '/pos',
    icon: Wallet,
  },
  {
    title: 'Transactions',
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
