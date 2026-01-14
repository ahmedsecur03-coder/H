
'use client';

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import type { BlogPost } from '@/lib/types';
import { notFound, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import BlogPostPageClient from '@/app/(public)/_components/blog-post-page';


// Helper function to convert title to slug
function titleToSlug(title: string): string {
  if (!title) return '';
  return title
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\u0621-\u064A\u0660-\u0669a-z0-9-]/g, '')
    .replace(/-+/g, '-');
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

function BlogPostContent() {
    const params = useParams();
    const slug = params.slug as string;
    const firestore = useFirestore();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!firestore || !slug) return;

        const findPost = async () => {
            setIsLoading(true);
            const postsRef = collection(firestore, 'blogPosts');
            const snapshot = await getDocs(postsRef);
            const allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
            const foundPost = allPosts.find(p => titleToSlug(p.title) === slug);
            
            if (foundPost) {
                setPost(foundPost);
            } else {
                notFound();
            }
            setIsLoading(false);
        };

        findPost();
    }, [firestore, slug]);
    
    if (isLoading) {
        return <BlogPostPageSkeleton />;
    }

    if (!post) {
        // This will be caught by the notFound() in the effect, but as a fallback:
        return <div>المنشور غير موجود.</div>
    }
    
    return <BlogPostPageClient serverPost={post} />;
}

export default function BlogPostPage() {
    return (
        <Suspense fallback={<BlogPostPageSkeleton />}>
            <BlogPostContent />
        </Suspense>
    );
}

