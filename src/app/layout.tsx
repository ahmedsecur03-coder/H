
'use client';

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Tajawal } from 'next/font/google';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { ThemeProvider } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { WhatsAppIcon } from '@/components/ui/icons';
import { doc } from 'firebase/firestore';

const fontSans = Tajawal({
  subsets: ['arabic'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-sans',
});

const fontHeadline = Tajawal({
  subsets: ['arabic'],
  weight: ['800'],
  variable: '--font-headline',
});

// We can't set metadata in a client component, but we can leave this here
// as it will be used by the build process if possible.
// export const metadata: Metadata = {
//   title: 'Hajaty Hub - منصة حاجتي للخدمات الرقمية',
//   description: 'منصة حاجتي هي مركزك المتكامل للخدمات الرقمية. نقدم خدمات SMM لجميع المنصات، إدارة حملات إعلانية، نظام إحالة، والمزيد لنمو أعمالك.',
//   keywords: ['SMM', 'تسويق رقمي', 'حملات إعلانية', 'زيادة متابعين', 'خدمات رقمية', 'فيسبوك', 'انستغرام', 'تيك توك', 'Hajaty'],
//   manifest: '/manifest.json',
// };

// export const viewport: Viewport = {
//   themeColor: '#0c1222',
// };

function WhatsappSupportButton() {
  const firestore = useFirestore();
  const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
  const { data: settingsData } = useDoc<any>(settingsDocRef);
  
  const whatsappLink = settingsData?.whatsappSupport || "#";

  return (
    <Button
      asChild
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg bg-green-500 hover:bg-green-600 text-white hover:scale-110 transition-transform duration-300"
    >
      <Link href={whatsappLink} target="_blank">
        <WhatsAppIcon className="h-7 w-7" />
        <span className="sr-only">تواصل معنا عبر واتساب</span>
      </Link>
    </Button>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <title>Hajaty Hub - منصة حاجتي للخدمات الرقمية</title>
        <meta name="description" content="منصة حاجتي هي مركزك المتكامل للخدمات الرقمية. نقدم خدمات SMM لجميع المنصات، إدارة حملات إعلانية، نظام إحالة، والمزيد لنمو أعمالك." />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={cn('font-sans antialiased bg-background', fontSans.variable, fontHeadline.variable)}>
         <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <FirebaseClientProvider>
            {children}
            <WhatsappSupportButton />
            <Toaster />
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
