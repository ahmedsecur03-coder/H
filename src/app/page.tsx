import HomePageClient from "@/app/(public)/_components/home-page";
import type { Metadata } from 'next';

// This metadata will override the root layout's metadata for this specific page
export const metadata: Metadata = {
  title: 'Hagaaty SMM | حاجاتي - بوابتك لنمو أعمالك الرقمية',
  description: 'Hagaaty SMM هي مركزك المتكامل لخدمات SMM ونظام إحالة فريد لنمو أعمالك بسرعة الصاروخ.',
}

export default function HomePage() {
  return <HomePageClient />;
}
