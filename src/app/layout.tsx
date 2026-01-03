'use client';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Poppins, PT_Sans } from 'next/font/google';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';
import React from 'react';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import GoogleAnalytics from '@/components/google-analytics';

const fontSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-sans',
});

const fontHeadline = Poppins({
  subsets: ['latin'],
  weight: ['800'],
  variable: '--font-headline',
});

// This component now correctly uses the hooks *within* the provider's scope.
function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicPage = !pathname.startsWith('/dashboard') && !pathname.startsWith('/admin') && !pathname.startsWith('/auth');

  if (isPublicPage) {
    return (
      <div className="flex flex-col min-h-screen">
        <PublicHeader />
        <main className="flex-1 container py-8">{children}</main>
        <PublicFooter />
      </div>
    );
  }

  // For non-public pages, the layout is handled by their respective layout files.
  return <>{children}</>;
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  const measurementId = "G-4030VT05Y1";
  const siteUrl = "https://hajaty.com";
  
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
       <head>
        <title>منصة حاجاتي | خدمات SMM وزيادة متابعين وإدارة حملات إعلانية</title>
        <meta name="description" content="منصة حاجاتي هي سيرفرك الأول لخدمات التسويق الرقمي. نقدم زيادة متابعين (انستقرام، تيك توك، فيسبوك)، إدارة حملات إعلانية احترافية، وشراء حسابات وكالة لنمو أعمالك." />
        <link rel="canonical" href={siteUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:title" content="منصة حاجاتي | بوابتك لخدمات التسويق الرقمي" />
        <meta property="og:description" content="زيادة متابعين، إدارة حملات إعلانية، شراء حسابات وكالة، وكل ما تحتاجه لنمو أعمالك الرقمية في مكان واحد." />
        <meta property="og:image" content={`${siteUrl}/og-image.png`} />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={siteUrl} />
        <meta property="twitter:title" content="منصة حاجاتي | بوابتك لخدمات التسويق الرقمي" />
        <meta property="twitter:description" content="زيادة متابعين، إدارة حملات إعلانية، شراء حسابات وكالة، وكل ما تحتاجه لنمو أعمالك الرقمية في مكان واحد." />
        <meta property="twitter:image" content={`${siteUrl}/og-image.png`} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3498DB" />
        <link rel="apple-touch-icon" href="/icon-192x192.png"></link>
      </head>
      <body className={cn('font-sans antialiased', fontSans.variable, fontHeadline.variable)}>
        <Suspense>
          <GoogleAnalytics gaId={measurementId} />
        </Suspense>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
           <FirebaseClientProvider>
              <AppContent>{children}</AppContent>
           </FirebaseClientProvider>
           <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
