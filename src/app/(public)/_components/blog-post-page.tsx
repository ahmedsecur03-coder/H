'use client';

import { notFound } from 'next/navigation';
import type { BlogPost } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, ChevronLeft } from 'lucide-react';
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

// This component now receives the post data directly from its parent server component
export default function BlogPostPageClient({ serverPost }: { serverPost: BlogPost }) {
    
    // No more client-side fetching
    const post = serverPost;
    
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
            {/* Note: The prev/next post logic is removed for simplicity with static generation.
                A more advanced implementation could pass this data as well. */}
        </div>
    );
}
