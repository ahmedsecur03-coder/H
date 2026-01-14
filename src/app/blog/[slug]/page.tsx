
'use client';

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import BlogPostPageClient from '@/app/(public)/_components/blog-post-page';
import { useParams } from 'next/navigation';


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

export default function BlogPostPage() {
    const params = useParams();
    const slug = params.slug as string;

    return (
        <Suspense fallback={<BlogPostPageSkeleton />}>
            <BlogPostPageClient slug={slug} />
        </Suspense>
    );
}
