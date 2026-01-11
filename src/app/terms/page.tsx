import TermsOfServicePageClient from "@/app/(public)/_components/terms-page";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'شروط الخدمة',
  description: 'اطلع على الشروط والأحكام التي تحكم استخدامك لمنصة وخدمات حاجاتي.',
}

export default function TermsOfServicePage() {
  return <TermsOfServicePageClient />;
}
