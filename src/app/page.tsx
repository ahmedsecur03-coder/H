import HomePageClient from "@/app/(public)/_components/home-page";
import type { Metadata } from 'next';

// This metadata will override the root layout's metadata for this specific page
export const metadata: Metadata = {
  title: 'الرئيسية | حاجاتي - بوابتك لنمو أعمالك الرقمية',
  description: 'منصة حاجاتي هي مركزك المتكامل لخدمات SMM، إدارة الحملات الإعلانية، ونظام إحالة فريد لنمو أعمالك بسرعة الصاروخ.',
}

export default function HomePage() {
  return <HomePageClient />;
}
