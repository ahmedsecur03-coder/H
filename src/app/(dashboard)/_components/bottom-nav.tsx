
'use client';

import { dashboardNavItems } from '@/lib/placeholder-data';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function BottomNavBar() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t bg-background/95 backdrop-blur-sm md:hidden">
      <nav className="flex h-full items-center justify-around">
        {dashboardNavItems.map((item) => {
          // For bottom nav, we only care about top-level items.
          // And we check if the current path starts with the item's href.
          const isActive = item.href ? pathname.startsWith(item.href) : false;

          return (
            <TooltipProvider key={item.label} delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href || '#'}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 text-muted-foreground transition-colors hover:text-primary',
                      isActive && 'text-primary'
                    )}
                  >
                    {item.icon && <item.icon className="h-6 w-6" />}
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </nav>
    </div>
  );
}
