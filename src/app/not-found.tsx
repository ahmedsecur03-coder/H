'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SatelliteDish } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
       <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,hsl(var(--muted))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted))_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
       <div className="absolute left-1/4 top-1/3 h-32 w-32 bg-primary/10 rounded-full filter blur-3xl animate-blob"></div>
       <div className="absolute right-1/4 bottom-1/3 h-32 w-32 bg-secondary/10 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>

      <div className="z-10 flex flex-col items-center">
        <div className="relative">
          <SatelliteDish className="h-24 w-24 text-primary " />
           <div className="absolute inset-0 -z-10 bg-primary/20 rounded-full filter blur-3xl"></div>
        </div>
        <h1 className="mt-8 text-6xl font-bold font-headline animated-gradient-text bg-gradient-to-br from-primary via-destructive to-primary">404</h1>
        <h2 className="mt-4 text-2xl font-semibold">
          فقدنا الاتصال بالمدار
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
