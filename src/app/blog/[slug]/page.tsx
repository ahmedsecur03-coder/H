import { notFound } from 'next/navigation';
import type { BlogPost } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import Head from 'next/head';
import { initializeFirebaseServer } from '@/firebase/init-server';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

function titleToSlug(title: string): string {
    if (!title) return '';
    return title.toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w\u0621-\u064A-]/g, '') // Keep Arabic letters, numbers, and hyphens
}

async function getPostData(slug: string) {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) {
        console.error("Failed to connect to the database on the server.");
        return { post: null, prevPost: null, nextPost: null };
    }

    let posts: BlogPost[] = [];
    try {
        const postsQuery = query(collection(firestore, 'blogPosts'), orderBy('publishDate', 'desc'));
        const querySnapshot = await getDocs(postsQuery, { cache: 'no-store' });
        posts = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                content: data.content,
                authorId: data.authorId,
                publishDate: data.publishDate,
            };
        }) as BlogPost[];
    } catch (error) {
        console.error("Error fetching blog posts from Firestore:", error);
        return { post: null, prevPost: null, nextPost: null };
    }
    
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
