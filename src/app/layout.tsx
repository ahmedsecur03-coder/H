import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Tajawal } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Suspense } from 'react';
import GoogleAnalytics from '@/components/google-analytics';
import Head from 'next/head';
import { Providers } from '@/components/providers';
import type { Metadata } from 'next';
import Script from 'next/script';


export const metadata: Metadata = {
  title: {
    template: '%s | حاجاتي - بوابتك لنمو أعمالك الرقمية',
    default: 'حاجاتي - بوابتك لنمو أعمالك الرقمية',
  },
  description: 'منصتك المتكاملة لخدمات SMM، إدارة الحملات الإعلانية، ونظام إحالة فريد لنمو أعمالك بسرعة الصاروخ.',
  openGraph: {
    title: 'حاجاتي - بوابتك لنمو أعمالك الرقمية',
    description: 'نوفر حلولاً متكاملة لزيادة المتابعين، إدارة الحملات الإعلانية، وحسابات وكالة موثوقة.',
    url: 'https://hajaty.com',
    siteName: 'Hagaaty',
    images: [
      {
        url: 'https://hajaty.com/og-image.png', // Replace with your actual OG image URL
        width: 1200,
        height: 630,
      },
    ],
    locale: 'ar_AR',
    type: 'website',
  },
   twitter: {
    card: 'summary_large_image',
    title: 'حاجاتي - بوابتك لنمو أعمالك الرقمية',
    description: 'منصتك المتكاملة لخدمات SMM، إدارة الحملات الإعلانية، ونظام إحالة فريد لنمو أعمالك بسرعة الصاروخ.',
    images: ['https://hajaty.com/og-image.png'], // Replace with your actual OG image URL
  },
}


const fontSans = Tajawal({
  subsets: ['arabic'],
  weight: ['400', '700', '900'],
  variable: '--font-sans',
});

const fontHeadline = Tajawal({
  subsets: ['arabic'],
  weight: ['900'],
  variable: '--font-headline',
});


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
        <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        />
        <Script
            id="google-analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
            __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());

                gtag('config', '${measurementId}');
            `,
            }}
        />
        <Suspense>
          <GoogleAnalytics gaId={measurementId} />
        </Suspense>
        <Providers>
            {children}
            <Toaster />
        </Providers>
      </body>
    </html>
  );
}
