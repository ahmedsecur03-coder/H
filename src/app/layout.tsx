'use client';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Cairo } from 'next/font/google';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';
import React, { useEffect } from 'react';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import GoogleAnalytics from '@/components/google-analytics';
import Head from 'next/head';
import { FloatingActionButtons } from '@/components/floating-action-buttons';
import { useUser } from '@/firebase';

const fontSans = Cairo({
  subsets: ['arabic'],
  weight: ['400', '700', '900'],
  variable: '--font-sans',
});

const fontHeadline = Cairo({
  subsets: ['arabic'],
  weight: ['900'],
  variable: '--font-headline',
});

function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  const isAuthPage = pathname.startsWith('/auth');
  const isDashboardPage = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
  const isPublicPage = !isDashboardPage && !isAuthPage;

  return (
    <>
      {isPublicPage && <PublicHeader />}
      <div className="flex-1 flex flex-col">
        <main className={cn("flex-1", isPublicPage && "container py-8")}>
          {children}
        </main>
        {isPublicPage && <PublicFooter />}
      </div>
       {(isDashboardPage && user) && <FloatingActionButtons />}
    </>
  );
}


export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  const measurementId = "G-4030VT05Y1";
  
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
       <Head>
        <meta name="theme-color" content="#F39C12" />
        <link rel="apple-touch-icon" href="/icon-192x192.png"></link>
         <link rel="manifest" href="/manifest.json" />
      </Head>
      <body className={cn('font-sans antialiased', fontSans.variable, fontHeadline.variable)}>
        <Suspense>
          <GoogleAnalytics gaId={measurementId} />
        </Suspense>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
           <FirebaseClientProvider>
                <div className="flex flex-col min-h-screen">
                    <Suspense fallback={<div className="flex-1" />}>
                        <AppContent>{children}</AppContent>
                    </Suspense>
                </div>
           </FirebaseClientProvider>
           <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
