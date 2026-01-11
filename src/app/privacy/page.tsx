import PrivacyPolicyPageClient from "@/app/(public)/_components/privacy-page";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'سياسة الخصوصية',
  description: 'تعرف على كيفية جمع واستخدام وحماية بياناتك الشخصية عند استخدامك لمنصة حاجاتي.',
}

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyPageClient />;
}
