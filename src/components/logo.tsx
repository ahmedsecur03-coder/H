import { Flame } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 text-primary", className)}>
      <div className="rounded-lg bg-primary/20 p-2">
        <Flame className="h-6 w-6 text-primary" />
      </div>
      <span className="text-xl font-bold font-headline text-foreground">حاجاتي</span>
    </Link>
  );
}
