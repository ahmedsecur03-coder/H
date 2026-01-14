
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import BlogPostPageClient from '@/app/(public)/_components/blog-post-page';
import { initializeFirebaseServer } from '@/firebase/init-server';
import { collection, getDocs, query } from 'firebase/firestore';
import type { BlogPost } from '@/lib/types';
import { notFound } from 'next/navigation';
import type { Metadata, ResolvingMetadata } from 'next';

// This tells Next.js to revalidate this page every 60 seconds.
// It allows new blog posts created after the build to be rendered.
export const revalidate = 60;

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

// This function fetches a single post on the server based on the slug
async function getPostBySlug(slug: string): Promise<BlogPost | null> {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) return null;

    try {
        const postsRef = collection(firestore, 'blogPosts');
        const snapshot = await getDocs(postsRef);
        const allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
        const foundPost = allPosts.find(p => titleToSlug(p.title) === slug);
        return foundPost || null;
    } catch (error) {
        console.error(`Failed to fetch post for slug "${slug}":`, error);
        return null;
    }
}

// This function generates the metadata for the page on the server
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    return {
      title: 'المنشور غير موجود',
    };
  }

  return {
    title: post.title,
    description: post.content.substring(0, 160).replace(/#/g, '').trim() + '...',
    openGraph: {
        title: post.title,
        description: post.content.substring(0, 160).replace(/#/g, '').trim() + '...',
        type: 'article',
        publishedTime: post.publishDate,
    }
  };
}

// This function generates the static paths for all blog posts at build time
export async function generateStaticParams() {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) return [];

    try {
        const postsRef = collection(firestore, 'blogPosts');
        const snapshot = await getDocs(postsRef);
        return snapshot.docs.map(doc => ({
            slug: titleToSlug(doc.data().title),
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

// This is the main server component for an individual blog post page.
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
