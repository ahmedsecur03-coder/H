'use server';

import BlogPostPageClient from '@/app/(public)/_components/blog-post-page';
import { initializeFirebaseServer } from '@/firebase/init-server';
import { collection, getDocs } from 'firebase/firestore';
import type { BlogPost } from '@/lib/types';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Revalidate this page at most once every 60 seconds
export const revalidate = 60;

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

// This function tells Next.js which pages to build at build time
export async function generateStaticParams() {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) return [];

    try {
        const postsSnapshot = await getDocs(collection(firestore, 'blogPosts'));
        return postsSnapshot.docs.map(doc => ({
            slug: titleToSlug(doc.data().title),
        }));
    } catch (error) {
        console.error("Failed to generate static params for blog:", error);
        return [];
    }
}

async function getPostBySlug(slug: string): Promise<BlogPost | null> {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) return null;

    try {
        const postsSnapshot = await getDocs(collection(firestore, 'blogPosts'));
        const allPosts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
        const foundPost = allPosts.find(p => titleToSlug(p.title) === slug);
        return foundPost || null;
    } catch (error) {
        console.error("Failed to fetch post by slug:", error);
        return null;
    }
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

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
    const post = await getPostBySlug(params.slug);

    if (!post) {
        notFound();
    }

    return (
        <Suspense fallback={<BlogPostPageSkeleton />}>
            <BlogPostPageClient serverPost={post} />
        </Suspense>
    );
}