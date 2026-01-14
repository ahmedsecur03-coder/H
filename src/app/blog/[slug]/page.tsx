'use server';

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { notFound } from 'next/navigation';
import BlogPostPageClient from '@/app/(public)/_components/blog-post-page';

type Props = {
  params: { slug: string }
}

function BlogPostPageSkeleton() {
    return (
        <div className="max-w-4xl mx-auto py-8">
            <Skeleton className="h-8 w-32 mb-4" />
             <div className="space-y-4">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-5 w-1/4 mt-2" />
                <br/>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <br/>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </div>
        </div>
    )
}

// This page now only renders the client component wrapper.
// The actual data fetching will happen on the client side.
export default async function BlogPostPage({ params }: Props) {
    return (
        <Suspense fallback={<BlogPostPageSkeleton />}>
            <BlogPostPageClient slug={params.slug} />
        </Suspense>
    );
}
