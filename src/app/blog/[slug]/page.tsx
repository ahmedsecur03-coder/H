
'use server';

import { notFound } from 'next/navigation';
import BlogPostPageClient from '@/app/(public)/_components/blog-post-page';
import { getFirestoreServer } from '@/firebase/init-server';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import type { BlogPost } from '@/lib/types';
import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';

/**
 * Fetches a blog post from Firestore by its generated slug.
 * @param slug The URL-friendly slug of the post to fetch.
 * @returns A promise that resolves to the BlogPost object or null if not found.
 */
async function getPost(slug: string): Promise<BlogPost | null> {
    if (!slug || slug === 'undefined') {
        console.error(`getPost was called with an invalid slug: '${slug}'`);
        return null;
    }

    const firestore = getFirestoreServer();
    const decodedSlug = decodeURIComponent(slug);

    try {
        const q = query(collection(firestore, 'blogPosts'), where("slug", "==", decodedSlug), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.error(`Post with slug "${decodedSlug}" was not found.`);
            return null;
        }
        
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as BlogPost;

    } catch (error) {
        console.error(`Error fetching post with slug ${decodedSlug}:`, error);
        return null;
    }
}


// Generate metadata dynamically
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug);

  if (!post) {
    return {
      title: 'المقالة غير موجودة',
    };
  }

  let finalImageUrl: string | undefined;

  if (post.imageUrl) {
    if (post.imageUrl.startsWith('http')) {
        finalImageUrl = post.imageUrl;
    } else {
        try {
            const jsonPath = path.join(process.cwd(), 'src', 'lib', 'placeholder-images.json');
            const jsonData = fs.readFileSync(jsonPath, 'utf-8');
            const placeholderData = JSON.parse(jsonData);
            const image = placeholderData.placeholderImages.find((img: any) => img.id === post.imageUrl);
            if (image) {
                finalImageUrl = image.imageUrl;
            }
        } catch (error) {
            console.error("Could not read placeholder images for metadata:", error);
        }
    }
  }

  return {
    title: post.title,
    description: post.description || post.content.substring(0, 160).replace(/#/g, '').trim() + '...',
    openGraph: {
      title: post.title,
      description: post.description || post.content.substring(0, 160).replace(/#/g, '').trim() + '...',
      type: 'article',
      publishedTime: post.publishDate,
      images: finalImageUrl ? [finalImageUrl] : undefined,
    },
     twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description || post.content.substring(0, 160).replace(/#/g, '').trim() + '...',
      images: finalImageUrl ? [finalImageUrl] : undefined,
    },
  };
}

// Generate static paths for all blog posts
export async function generateStaticParams() {
    try {
        const firestore = getFirestoreServer();
        const postsQuery = query(collection(firestore, 'blogPosts'));
        const snapshot = await getDocs(postsQuery);
        
        const slugs = snapshot.docs
            .map(doc => doc.data()?.slug)
            .filter(slug => typeof slug === 'string' && slug.length > 0)
            .map(slug => ({ slug }));

        return slugs;
    } catch (error) {
        console.error("Failed to generate static params for blog posts:", error);
        return [];
    }
}


export default async function BlogPostPage({ params }: { params: { slug: string } }) {
    if (!params || !params.slug || params.slug === 'undefined') {
        console.error("BlogPostPage rendered without a valid slug in params.");
        notFound();
    }
    
    const post = await getPost(params.slug);

    if (!post) {
        notFound();
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002';
    const postUrl = `${baseUrl}/blog/${params.slug}`;

    let finalImageUrl: string | undefined;
     if (post.imageUrl) {
        if (post.imageUrl.startsWith('http')) {
            finalImageUrl = post.imageUrl;
        } else {
             try {
                const jsonPath = path.join(process.cwd(), 'src', 'lib', 'placeholder-images.json');
                const jsonData = fs.readFileSync(jsonPath, 'utf-8');
                const placeholderData = JSON.parse(jsonData);
                const image = placeholderData.placeholderImages.find((img: any) => img.id === post.imageUrl);
                if (image) {
                    finalImageUrl = image.imageUrl;
                }
            } catch (error) {
                console.error("Could not read placeholder images for json-ld:", error);
            }
        }
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': postUrl,
        },
        headline: post.title,
        description: post.description || post.content.substring(0, 250).replace(/#/g, '').trim(),
        image: finalImageUrl,
        author: {
            '@type': 'Organization',
            name: 'فريق حاجاتي',
        },
        publisher: {
            '@type': 'Organization',
            name: 'حاجاتي',
            logo: {
            '@type': 'ImageObject',
            url: `${baseUrl}/logo.png`,
            },
        },
        datePublished: post.publishDate,
        dateModified: post.publishDate,
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <BlogPostPageClient serverPost={post} />
        </>
    );
}
