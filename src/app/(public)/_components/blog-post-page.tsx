
'use client';

import { notFound } from 'next/navigation';
import type { BlogPost } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, ChevronLeft } from 'lucide-react';

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

// This is now a pure client component that receives all its data via props
export default function BlogPostPageClient({ 
    post, 
    relatedPosts 
}: { 
    post?: BlogPost, 
    relatedPosts: { prevPost: BlogPost | null, nextPost: BlogPost | null } 
}) {

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
