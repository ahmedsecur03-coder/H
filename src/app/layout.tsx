import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { PT_Sans } from 'next/font/google';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';
import DynamicAiAssistant from '@/components/dynamic-ai-assistant';

const fontSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-sans',
});


export const metadata: Metadata = {
  title: 'Hajaty Hub - منصة حاجتي للخدمات الرقمية',
  description: 'منصة حاجتي هي مركزك المتكامل للخدمات الرقمية. نقدم خدمات SMM لجميع المنصات، إدارة حملات إعلانية، نظام إحالة، والمزيد لنمو أعمالك.',
  keywords: ['SMM', 'تسويق رقمي', 'حملات إعلانية', 'زيادة متابعين', 'خدمات رقمية', 'فيسبوك', 'انستغرام', 'تيك توك', 'Hajaty'],
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#0c1222',
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={cn('font-sans antialiased bg-background', fontSans.variable)}>
        <FirebaseClientProvider>
          {children}
          <DynamicAiAssistant />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
