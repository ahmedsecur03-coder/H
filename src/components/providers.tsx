'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { ThemeProvider } from '@/components/theme-provider';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import { FloatingActionButtons } from '@/components/floating-action-buttons';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { cn } from '@/lib/utils';

/**
 * This component contains the actual UI logic and will only be rendered
 * after the FirebaseClientProvider has initialized.
 */
function AppContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname.startsWith('/auth');
    const isDashboardPage = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
    const isPublicPage = !isDashboardPage && !isAuthPage;

    return (
        <div className="flex flex-col min-h-screen">
            <FirebaseErrorListener />
            {isPublicPage && <PublicHeader />}
            <main className={cn("flex-1", isPublicPage && "container py-8")}>
                {children}
            </main>
            {isPublicPage && <PublicFooter />}
            {isPublicPage && <FloatingActionButtons />}
        </div>
    );
}

/**
 * The main Providers component. Its role is to set up the context providers
 * in the correct order.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <FirebaseClientProvider>
          {/* AppContent and its children will only render after Firebase services are available */}
          <AppContent>{children}</AppContent>
      </FirebaseClientProvider>
    </ThemeProvider>
  );
}
