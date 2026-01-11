import AboutPageClient from "@/app/(public)/_components/about-page";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'من نحن',
  description: 'تعرف على مهمتنا ورؤيتنا في حاجاتي لتمكين رواد الأعمال والشركات في العالم الرقمي.',
}

export default function AboutPage() {
    return <AboutPageClient />;
}
