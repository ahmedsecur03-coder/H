
'use client';
import BlogPageClient from '@/app/(public)/_components/blog-page';

export default function BlogPage() {
    // This now simply renders the client component which handles its own data fetching.
    return <BlogPageClient />;
}
