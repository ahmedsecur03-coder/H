
'use client';

import React, { Suspense, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ThemeProvider } from '@/components/theme-provider';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import { FloatingActionButtons } from '@/components/floating-action-buttons';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { cn } from '@/lib/utils';

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/auth');
  const isDashboardPage = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
  const isPublicPage = !isDashboardPage && !isAuthPage;

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <FirebaseClientProvider>
        <FirebaseErrorListener />
        <div className="flex flex-col min-h-screen">
          {isPublicPage && <PublicHeader />}
          <main className={cn("flex-1", isPublicPage && "container py-8")}>
            {children}
          </main>
          {isPublicPage && <PublicFooter />}
          {isPublicPage && <FloatingActionButtons />}
        </div>
      </FirebaseClientProvider>
    </ThemeProvider>
  );
}
