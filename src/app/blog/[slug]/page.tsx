'use client';

import { notFound, useParams } from 'next/navigation';
import BlogPostPageClient from '@/app/(public)/_components/blog-post-page';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import type { BlogPost } from '@/lib/types';
import { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

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

function BlogPostSkeleton() {
    return (
        <div className="max-w-4xl mx-auto py-8 space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-96 w-full" />
        </div>
    );
}

export default function BlogPostPage() {
    const params = useParams();
    const slug = params.slug as string;
    const firestore = useFirestore();

    const postsQuery = useMemoFirebase(
      () => (firestore ? query(collection(firestore, 'blogPosts')) : null),
      [firestore]
    );
    const { data: allPosts, isLoading } = useCollection<BlogPost>(postsQuery);

    const [post, setPost] = useState<BlogPost | null | undefined>(undefined);

    useEffect(() => {
        if (!isLoading && allPosts) {
            const foundPost = allPosts.find(p => titleToSlug(p.title) === slug);
            setPost(foundPost || null);
        }
    }, [isLoading, allPosts, slug]);

    if (isLoading || post === undefined) {
        return <BlogPostSkeleton />;
    }

    if (post === null) {
        notFound();
    }

    return <BlogPostPageClient serverPost={post} />;
}
