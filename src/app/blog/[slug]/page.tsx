
'use client';

import { notFound, useParams } from 'next/navigation';
import type { BlogPost } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, Loader2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { titleToSlug } from '@/lib/firebase/server-data';
import Head from 'next/head';


function BlogPostSkeleton() {
    return (
        <div className="max-w-4xl mx-auto py-8">
            <Skeleton className="h-8 w-32 mb-4" />
             <Card>
                <CardHeader>
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-5 w-1/4 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-5/6" />
                    <Skeleton className="h-5 w-full mt-4" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-2/3" />
                </CardContent>
            </Card>
             <div className="flex justify-between items-center mt-8">
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-28" />
            </div>
        </div>
    );
}

export default function BlogPostPage() {
    const params = useParams();
    const slug = params.slug as string;
    const firestore = useFirestore();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [adjacentPosts, setAdjacentPosts] = useState<{ prevPost: BlogPost | null, nextPost: BlogPost | null }>({ prevPost: null, nextPost: null });

    const postsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'blogPosts'), orderBy('publishDate', 'desc')) : null, [firestore]);
    const { data: allPosts, isLoading } = useCollection<BlogPost>(postsQuery);

    useEffect(() => {
        if (allPosts) {
            const currentPost = allPosts.find(p => titleToSlug(p.title) === slug);
            if (currentPost) {
                setPost(currentPost);
                const currentIndex = allPosts.findIndex(p => p.id === currentPost.id);
                const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
                const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
                setAdjacentPosts({ prevPost, nextPost });
            } else {
                 // If post not found after loading, trigger notFound
                 notFound();
            }
        }
    }, [allPosts, slug]);

    if (isLoading || !post) {
        return <BlogPostSkeleton />;
    }
    
    const { prevPost, nextPost } = adjacentPosts;
    const description = post.content.substring(0, 160).replace(/#/g, '').trim() + '...';
    
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        'headline': post.title,
        'description': description,
        'datePublished': post.publishDate,
        'author': {
            '@type': 'Organization',
            'name': 'فريق حاجاتي'
        },
        'publisher': {
            '@type': 'Organization',
            'name': 'منصة حاجاتي',
            'logo': {
                '@type': 'ImageObject',
                'url': `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`
            }
        },
        'mainEntityOfPage': {
            '@type': 'WebPage',
            '@id': `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${slug}`
        }
    };


    return (
        <>
             <Head>
                <title>{`${post.title} | مدونة حاجاتي`}</title>
                <meta name="description" content={description} />
                <link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL}/blog/${slug}`} />
                <meta property="og:title" content={post.title} />
                <meta property="og:description" content={description} />
                <meta property="og:url" content={`${process.env.NEXT_PUBLIC_SITE_URL}/blog/${slug}`} />
                <meta property="og:type" content="article" />
                <meta property="og:published_time" content={post.publishDate} />
                <meta property="og:image" content={`${process.env.NEXT_PUBLIC_SITE_URL}/og-image.png`} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={post.title} />
                <meta name="twitter:description" content={description} />
                <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_SITE_URL}/og-image.png`} />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            </Head>
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
                                <Link href={`/blog/${titleToSlug(prevPost.title)}`} title={prevPost.title}>
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                    المقالة السابقة
                                </Link>
                            </Button>
                        )}
                    </div>
                    <div>
                        {nextPost && (
                            <Button asChild>
                                <Link href={`/blog/${titleToSlug(nextPost.title)}`} title={nextPost.title}>
                                    المقالة التالية
                                    <ChevronLeft className="mr-2 h-4 w-4" />
                                </Link>
                            </Button>
                        )}
                    </div>
                </nav>
            </div>
        </>
    );
}

