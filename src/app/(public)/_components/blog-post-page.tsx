
'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import type { BlogPost } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
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

function BlogPostPageSkeleton() {
    return (
        <div className="max-w-4xl mx-auto py-8">
            <Skeleton className="h-8 w-32 mb-4" />
             <Card>
                <CardHeader>
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-5 w-1/4 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <br/>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </CardContent>
            </Card>
        </div>
    )
}

export default function BlogPostPageClient({ slug, serverPost }: { slug: string, serverPost: BlogPost | undefined }) {
    const firestore = useFirestore();

    const [post, setPost] = useState<BlogPost | null | undefined>(serverPost);
    const [relatedPosts, setRelatedPosts] = useState<{prevPost: BlogPost | null, nextPost: BlogPost | null}>({ prevPost: null, nextPost: null });
    const [isLoading, setIsLoading] = useState(!serverPost);

    useEffect(() => {
        if (serverPost) return; // Data is already provided by the server

        const fetchPostData = async () => {
            if (!firestore || !slug) return;
            setIsLoading(true);
            try {
                const postsQuery = query(collection(firestore, 'blogPosts'), orderBy('publishDate', 'desc'));
                const querySnapshot = await getDocs(postsQuery);
                const allPosts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));

                const currentPost = allPosts.find(p => titleToSlug(p.title) === slug);
                setPost(currentPost);
                
                if (currentPost) {
                    const currentIndex = allPosts.findIndex(p => p.id === currentPost.id);
                    setRelatedPosts({
                        prevPost: currentIndex > 0 ? allPosts[currentIndex - 1] : null,
                        nextPost: currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null
                    });
                } else {
                    notFound();
                }
            } catch (error) {
                console.error("Error fetching post data on client:", error);
                notFound();
            } finally {
                setIsLoading(false);
            }
        };

        fetchPostData();
    }, [firestore, slug, serverPost]);
    

    if (isLoading) {
        return <BlogPostPageSkeleton />;
    }

    if (!post) {
        return notFound();
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
                        {relatedPosts.prevPost && (
                            <Button asChild variant="outline">
                                <Link href={`/blog/${titleToSlug(relatedPosts.prevPost.title)}`} title={relatedPosts.prevPost.title}>
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                    المقالة السابقة
                                </Link>
                            </Button>
                        )}
                    </div>
                    <div>
                        {relatedPosts.nextPost && (
                            <Button asChild>
                                <Link href={`/blog/${titleToSlug(relatedPosts.nextPost.title)}`} title={relatedPosts.nextPost.title}>
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
