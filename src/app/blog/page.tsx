'use server';

import BlogPageClient from '@/app/(public)/_components/blog-page';
import { initializeFirebaseServer } from '@/firebase/init-server';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import type { BlogPost } from '@/lib/types';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';

// Revalidate this page at most once every 60 seconds
export const revalidate = 60;

async function getBlogPosts(): Promise<BlogPost[]> {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) return [];

    try {
        const postsQuery = query(collection(firestore, 'blogPosts'), orderBy('publishDate', 'desc'));
        const snapshot = await getDocs(postsQuery);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as BlogPost));
    } catch (error) {
        console.error("Failed to fetch blog posts:", error);
        return [];
    }
}

function BlogPageSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/4 mt-2" /></CardHeader>
                    <CardContent><Skeleton className="h-12 w-full" /></CardContent>
                    <CardFooter><Skeleton className="h-10 w-28" /></CardFooter>
                </Card>
            ))}
        </div>
    )
}


export default async function BlogPage() {
    const posts = await getBlogPosts();
    
    return (
         <Suspense fallback={<BlogPageSkeleton />}>
            <BlogPageClient serverPosts={posts} />
        </Suspense>
    );
}