import { Flame } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 text-primary", className)}>
      <img src="https://hagaaty.com/logo.png" alt="Hagaaty Logo" className="h-8 w-auto" />
      <span className="text-xl font-bold font-headline text-foreground">حاجاتي</span>
    </Link>
  );
}
