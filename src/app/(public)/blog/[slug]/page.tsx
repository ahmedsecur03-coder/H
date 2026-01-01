
'use client';
import { doc, getDoc, collection, getDocs, orderBy, limit, where, query } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { notFound, useParams } from 'next/navigation';
import type { BlogPost } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function BlogPostPageSkeleton() {
    return (
        <div className="max-w-4xl mx-auto py-8">
            <Skeleton className="h-8 w-36 mb-4" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-4 w-1/3 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4 mt-4">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-5/6" />
                     <Skeleton className="h-5 w-full mt-6" />
                    <Skeleton className="h-5 w-2/3" />
                </CardContent>
            </Card>
        </div>
    );
}


export default function BlogPostPage() {
    const firestore = useFirestore();
    const params = useParams();
    const slug = params.slug as string;
    
    const [prevPost, setPrevPost] = useState<{ id: string, title: string } | null>(null);
    const [nextPost, setNextPost] = useState<{ id: string, title: string } | null>(null);
    const [isAdjacentLoading, setIsAdjacentLoading] = useState(true);

    const postDocRef = useMemoFirebase(
        () => (firestore && slug ? doc(firestore, 'blogPosts', slug) : null),
        [firestore, slug]
    );

    const { data: post, isLoading } = useDoc<BlogPost>(postDocRef);

    useEffect(() => {
        if (!firestore || !post) return;

        const fetchAdjacentPosts = async () => {
            setIsAdjacentLoading(true);
            const postsRef = collection(firestore, 'blogPosts');
            
            const nextQuery = query(postsRef, where('publishDate', '>', post.publishDate), orderBy('publishDate', 'asc'), limit(1));
            const prevQuery = query(postsRef, where('publishDate', '<', post.publishDate), orderBy('publishDate', 'desc'), limit(1));
            
            const [nextSnap, prevSnap] = await Promise.all([getDocs(nextQuery), getDocs(prevQuery)]);

            const nextPostData = nextSnap.docs[0]?.data();
            setNextPost(nextSnap.empty ? null : { id: nextSnap.docs[0].id, title: nextPostData?.title });
            
            const prevPostData = prevSnap.docs[0]?.data();
            setPrevPost(prevSnap.empty ? null : { id: prevSnap.docs[0].id, title: prevPostData?.title });
            
            setIsAdjacentLoading(false);
        };

        fetchAdjacentPosts();

    }, [firestore, post]);


    if (isLoading) {
        return <BlogPostPageSkeleton />;
    }

    if (!post) {
        notFound();
    }
    
    return (
        <div className="max-w-4xl mx-auto py-8">
            <Button variant="ghost" asChild className="mb-4">
                <Link href="/blog">
                    <ArrowRight className="ml-2 h-4 w-4" />
                    العودة إلى المدونة
                </Link>
            </Button>
            <article>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl md:text-4xl font-headline leading-tight">{post.title}</CardTitle>
                        <CardDescription>
                             نُشر في: {new Date(post.publishDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none">
                        <ReactMarkdown
                            components={{
                                h2: ({node, ...props}) => <h2 className="font-headline" {...props} />,
                                h3: ({node, ...props}) => <h3 className="font-headline" {...props} />,
                            }}
                        >
                            {post.content}
                        </ReactMarkdown>
                    </CardContent>
                </Card>
            </article>

            <nav className="flex justify-between items-center mt-8 gap-4">
                <div>
                    {prevPost && (
                         <Button asChild variant="outline">
                            <Link href={`/blog/${prevPost.id}`} title={prevPost.title}>
                                <ArrowRight className="ml-2 h-4 w-4" />
                                المقالة السابقة
                            </Link>
                        </Button>
                    )}
                </div>
                 <div>
                    {nextPost && (
                         <Button asChild>
                            <Link href={`/blog/${nextPost.id}`} title={nextPost.title}>
                                المقالة التالية
                                <ChevronLeft className="mr-2 h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                </div>
            </nav>
        </div>
    );
}
