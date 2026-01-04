import { notFound } from 'next/navigation';
import type { BlogPost } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import Head from 'next/head';

// This slug function must be available on the server.
function titleToSlug(title: string): string {
    if (!title) return '';
    return title.toLowerCase()
        .replace(/\s+/g, '-')      // Replace spaces with -
        .replace(/[^\w-]+/g, '')   // Remove all non-word chars except -
        .replace(/--+/g, '-')      // Replace multiple - with single -
        .replace(/^-+/, '')        // Trim - from start of text
        .replace(/-+$/, '');       // Trim - from end of text
}

async function getPosts(): Promise<BlogPost[]> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
        if (!baseUrl) {
            throw new Error("Site URL is not configured.");
        }
        const res = await fetch(`${baseUrl}/api/blog`, {
             next: { revalidate: 60 } // Revalidate every 60 seconds
        });
        if (!res.ok) {
             console.error("Failed to fetch blog posts, status:", res.status);
            return [];
        }
        const posts = await res.json();
        return posts.map((post: any) => ({ ...post, publishDate: post.date })) as BlogPost[];
    } catch (error) {
        console.error("Failed to fetch blog posts:",error);
        return [];
    }
}

async function getPostData(slug: string) {
    const posts = await getPosts();
    const currentPost = posts.find(p => titleToSlug(p.title) === slug);

    if (!currentPost) {
        return { post: null, prevPost: null, nextPost: null };
    }

    const currentIndex = posts.findIndex(p => p.id === currentPost.id);
    const prevPost = currentIndex > 0 ? posts[currentIndex - 1] : null;
    const nextPost = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;

    return { post: currentPost, prevPost, nextPost };
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
    const { post } = await getPostData(params.slug);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';

    if (!post) {
        return {
            title: 'المنشور غير موجود',
        };
    }

    const description = post.content.substring(0, 160).replace(/#/g, '').trim() + '...';

    return {
        title: `${post.title} | مدونة حاجاتي`,
        description: description,
        alternates: {
            canonical: `${baseUrl}/blog/${params.slug}`,
        },
        openGraph: {
            title: post.title,
            description: description,
            url: `${baseUrl}/blog/${params.slug}`,
            type: 'article',
            publishedTime: post.publishDate,
            images: [`${baseUrl}/og-image.png`],
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: description,
            images: [`${baseUrl}/og-image.png`],
        },
    };
}


export default async function BlogPostPage({ params }: { params: { slug: string } }) {
    const { post, prevPost, nextPost } = await getPostData(params.slug);

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
    );
}
