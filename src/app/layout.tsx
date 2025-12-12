import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AiAssistant from '@/components/ai-assistant';
import { PT_Sans } from 'next/font/google';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={cn('font-body antialiased bg-background', fontSans.variable)}>
        <FirebaseClientProvider>
          {children}
          <AiAssistant />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
