'use client';
import { notFound, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowRight, Loader2 } from 'lucide-react';
import type { BlogPost } from '@/lib/types';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, where, query, limit } from 'firebase/firestore';
import { TicketChat } from '@/app/dashboard/support/[ticketId]/_components/ticket-chat';
import { Skeleton } from '@/components/ui/skeleton';
import BlogPostPageClient from '@/app/(public)/_components/blog-post-page';
import { Suspense, useEffect, useState } from 'react';

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

function BlogPostPageComponent() {
  const params = useParams();
  const slug = params.slug as string;
  const firestore = useFirestore();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;
    setIsLoading(true);
    const postsRef = collection(firestore, 'blogPosts');
    
    // This is inefficient but necessary without a slug field.
    // In a real app, you'd query by slug directly.
    const fetchPosts = async () => {
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

    fetchPosts();
  }, [firestore, slug]);


  if (isLoading) {
    return <BlogPostPageSkeleton />;
  }

  if (!post) {
    // notFound() will be called in useEffect, but this is a fallback.
    return null;
  }

  return <BlogPostPageClient serverPost={post} />;
}

export default function BlogPostPage() {
    return (
        <Suspense fallback={<BlogPostPageSkeleton />}>
            <BlogPostPageComponent />
        </Suspense>
    );
}
