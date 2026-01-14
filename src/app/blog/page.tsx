'use server';

import BlogPageClient from "@/app/(public)/_components/blog-page";
import { initializeFirebaseServer } from "@/firebase/init-server";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import type { BlogPost } from '@/lib/types';
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export const revalidate = 60; // Revalidate every 60 seconds

async function getPosts() {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) {
        return [];
    }
    const postsQuery = query(collection(firestore, 'blogPosts'), orderBy('publishDate', 'desc'));
    const snapshot = await getDocs(postsQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
}


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

export default async function BlogPage() {
    const posts = await getPosts();

    return (
        <Suspense fallback={<BlogPageSkeleton />}>
            <BlogPageClient serverPosts={posts} />
        </Suspense>
    );
}