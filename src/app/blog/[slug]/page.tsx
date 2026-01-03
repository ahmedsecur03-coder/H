
import { notFound } from 'next/navigation';
import type { BlogPost } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import Head from 'next/head';
import { getBlogPostBySlug, getAdjacentPosts, getBlogPosts, titleToSlug } from '@/lib/firebase/server-data';
import type { Metadata, ResolvingMetadata } from 'next'

type Props = {
  params: { slug: string }
}

// Generate metadata for the page
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);
 
  if (!post) {
    return {
      title: 'المقالة غير موجودة',
    }
  }
 
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hajaty.com';
  const description = post.content.substring(0, 160).replace(/#/g, '').trim() + '...';
  const ogImage = `${siteUrl}/og-image.png`;

  return {
    title: `${post.title} | مدونة حاجاتي`,
    description: description,
    alternates: {
      canonical: `/blog/${params.slug}`,
    },
    openGraph: {
        title: post.title,
        description: description,
        url: `${siteUrl}/blog/${params.slug}`,
        siteName: 'مدونة حاجاتي',
        images: [
            {
                url: ogImage,
                width: 1200,
                height: 630,
            },
        ],
        locale: 'ar_EG',
        type: 'article',
        publishedTime: post.publishDate,
        authors: ['فريق حاجاتي'],
    },
     twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: description,
      images: [ogImage],
    },
  }
}

// Generate static pages for all blog posts at build time
export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map(post => ({
    slug: titleToSlug(post.title),
  }));
}


export default async function BlogPostPage({ params }: { params: { slug: string } }) {
    const slug = params.slug;
    const post = await getBlogPostBySlug(slug);

    if (!post) {
        notFound();
    }
    
    const { prevPost, nextPost } = await getAdjacentPosts(post.publishDate);

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        'headline': post.title,
        'description': post.content.substring(0, 200).replace(/#/g, '').trim() + '...',
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
            {/* Inject JSON-LD into the head of the document */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
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
