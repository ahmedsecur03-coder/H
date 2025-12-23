'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SatelliteDish } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <div className="z-10 flex flex-col items-center">
        <SatelliteDish className="h-24 w-24 text-primary animate-pulse" />
        <h1 className="mt-8 text-6xl font-bold font-headline">404</h1>
        <h2 className="mt-4 text-2xl font-semibold">
          الكوكب غير موجود
        </h2>
        <p className="mt-2 max-w-md text-muted-foreground">
          عذرًا، يبدو أنك خرجت عن المسار المداري. الصفحة التي تبحث عنها قد تكون في مجرة أخرى أو تم نقلها.
        </p>
        <Button asChild className="mt-8">
          <Link href="/">العودة إلى مركز القيادة</Link>
        </Button>
      </div>
    </div>
  );
}
