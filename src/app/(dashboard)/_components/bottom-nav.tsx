
'use client';

import {
  LayoutDashboard,
  ShoppingCart,
  DollarSign,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { dashboardNavItems } from '@/lib/placeholder-data';
import type { NestedNavItem } from '@/lib/types';


export function BottomNavBar() {
  const pathname = usePathname();

  // We only want the top-level items for the bottom nav
  const navItems = dashboardNavItems.filter(item => !item.children);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/80 backdrop-blur-sm md:hidden">
      <div className="grid h-16 grid-cols-5 items-stretch">
        {navItems.slice(0, 5).map((item: NestedNavItem) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href || '#'}
              className={cn(
                'flex flex-col items-center justify-center gap-1.5 pt-2 text-xs transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
