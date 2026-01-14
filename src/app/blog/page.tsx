'use client';

import BlogPageClient from '@/app/(public)/_components/blog-page';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import type { BlogPost } from '@/lib/types';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';

function BlogPageSkeleton() {
    return (
        <div className="space-y-6 pb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">المدونة والأخبار</h1>
                <p className="text-muted-foreground">
                    تابع آخر التحديثات والإعلانات والنصائح من فريق حاجاتي.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/4 mt-2" /></CardHeader>
                        <CardContent><Skeleton className="h-12 w-full" /></CardContent>
                        <CardFooter><Skeleton className="h-10 w-28" /></CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}


export default function BlogPage() {
    const firestore = useFirestore();
    const postsQuery = useMemoFirebase(() => 
        firestore ? query(collection(firestore, 'blogPosts'), orderBy('publishDate', 'desc')) : null
    , [firestore]);
    
    const { data: posts, isLoading } = useCollection<BlogPost>(postsQuery);
    
    if (isLoading) {
        return <BlogPageSkeleton />;
    }
    
    return (
         <Suspense fallback={<BlogPageSkeleton />}>
            <BlogPageClient serverPosts={posts} />
        </Suspense>
    );
}
