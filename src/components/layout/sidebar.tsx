'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { getNavigationByRole } from '@/src/lib/constants/navigation';
import { cn } from '@/src/lib/utils/cn';
import type { UserRole } from '@/src/types/auth';

type SidebarProps = {
  role: UserRole | null;
  className?: string;
  onNavigate?: () => void;
};

export function Sidebar({ role, className, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const links = getNavigationByRole(role);

  return (
    <aside
      className={cn(
        'flex h-full w-72 flex-col border-r border-slate-200 bg-white',
        className,
      )}
    >
      <div className="border-b border-slate-200 px-6 py-5">
        <p className="text-lg font-semibold tracking-tight text-slate-900">Usahaku POS</p>
        <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">Navigasi</p>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {links.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
