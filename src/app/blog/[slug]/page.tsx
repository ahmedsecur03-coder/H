'use server';

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { notFound } from 'next/navigation';
import BlogPostPageClient from '@/app/(public)/_components/blog-post-page';
import { initializeFirebaseServer } from '@/firebase/init-server';
import { collection, getDocs, query, orderBy, where, limit } from 'firebase/firestore';
import type { BlogPost } from '@/lib/types';
import type { Metadata, ResolvingMetadata } from 'next';


type Props = {
  params: { slug: string }
}

function titleToSlug(title: string): string {
    if (!title) return '';
    return title.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\u0621-\u064A\u0660-\u0669a-z0-9-]/g, '').replace(/-+/g, '-');
}

function slugToTitle(slug: string): string {
  if (!slug) return '';
  // This is a simplification. A robust solution might require storing the original title or a lookup map.
  return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}


async function getPostBySlug(slug: string): Promise<BlogPost | null> {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) return null;
    try {
        const postsRef = collection(firestore, 'blogPosts');
        // This is not perfectly efficient as it relies on fetching and filtering.
        // A better approach in a real app might be to query by a 'slug' field.
        const snapshot = await getDocs(postsRef);
        const allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
        const post = allPosts.find(p => titleToSlug(p.title) === slug);
        return post || null;
    } catch (error) {
        console.error("Failed to fetch post by slug:", error);
        return null;
    }
}


// This function generates the metadata for each blog post page
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    return {
      title: 'المنشور غير موجود',
      description: 'لم نتمكن من العثور على المقالة التي تبحث عنها.',
    }
  }

  // optionally access and extend (rather than replace) parent metadata
  // const previousImages = (await parent).openGraph?.images || []

  return {
    title: post.title,
    description: post.content.substring(0, 160).replace(/#/g, '').trim() + '...',
    openGraph: {
      title: post.title,
      description: post.content.substring(0, 160).replace(/#/g, '').trim() + '...',
      type: 'article',
      publishedTime: post.publishDate,
      authors: ['Hagaaty'], // Replace with actual author name if available
    },
  }
}


// This function tells Next.js which routes to pre-build
export async function generateStaticParams() {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) return [];
    try {
        const postsRef = collection(firestore, 'blogPosts');
        const snapshot = await getDocs(postsRef);
        const posts = snapshot.docs.map(doc => doc.data() as BlogPost);
        return posts.map((post) => ({
            slug: titleToSlug(post.title),
        }));
    } catch (error) {
        console.error("Failed to generate static params for blog:", error);
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

export default async function BlogPostPage({ params }: Props) {
    const post = await getPostBySlug(params.slug);

    if (!post) {
        notFound();
    }
    
    // Pass the server-fetched post to the client component
    return (
        <Suspense fallback={<BlogPostPageSkeleton />}>
            <BlogPostPageClient serverPost={post} />
        </Suspense>
    );
}
