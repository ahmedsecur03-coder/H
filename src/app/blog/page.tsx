
import BlogPageClient from "@/app/(public)/_components/blog-page";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'المدونة',
  description: 'تابع آخر التحديثات والإعلانات والنصائح من فريق حاجاتي لتعزيز نموك الرقمي.',
}

export default function BlogPage() {
    return <BlogPageClient />;
}
