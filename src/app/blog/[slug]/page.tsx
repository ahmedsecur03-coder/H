'use server';
import { initializeFirebaseServer } from '@/firebase/init-server';
import { collection, getDocs } from 'firebase/firestore';
import type { BlogPost } from '@/lib/types';
import { notFound } from 'next/navigation';
import BlogPostPageClient from '@/app/(public)/_components/blog-post-page';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const revalidate = 60; // Revalidate every 60 seconds

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

async function getPostBySlug(slug: string) {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) return null;
    
    const postsRef = collection(firestore, 'blogPosts');
    const snapshot = await getDocs(postsRef);
    const allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
    
    const foundPost = allPosts.find(p => titleToSlug(p.title) === slug);
    return foundPost || null;
}

export async function generateStaticParams() {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) return [];

    try {
        const postsRef = collection(firestore, 'blogPosts');
        const snapshot = await getDocs(postsRef);
        const allPosts = snapshot.docs.map(doc => doc.data() as BlogPost);
        return allPosts.map(post => ({
            slug: titleToSlug(post.title),
        }));
    } catch (error) {
        console.error("Failed to generate static params for blog posts:", error);
        return [];
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

export default async function BlogPostPage({ params }: { params: { slug: string }}) {
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