
import { notFound } from 'next/navigation';
import BlogPostPageClient from '@/app/(public)/_components/blog-post-page';
import { getFirestoreServer } from '@/firebase/init-server';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import type { BlogPost } from '@/lib/types';
import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import { titleToSlug } from '@/lib/slugify';

export const revalidate = 60; // Revalidate every 60 seconds

// Function to fetch a single post by its slug
async function getPost(slug: string): Promise<BlogPost | null> {
    const firestore = getFirestoreServer();
    const postsRef = collection(firestore, 'blogPosts');
    
    // First, try to find by slug field, which is the most efficient.
    const qBySlug = query(postsRef, where("slug", "==", slug), limit(1));
    const snapshotBySlug = await getDocs(qBySlug);

    if (!snapshotBySlug.empty) {
        const doc = snapshotBySlug.docs[0];
        return { id: doc.id, ...doc.data() } as BlogPost;
    }
    
    // Fallback for old/mismatched data: if not found, iterate and check generated slugs from titles.
    // This is inefficient but provides resilience against data inconsistencies.
    try {
        const allPostsSnapshot = await getDocs(postsRef);
        for (const doc of allPostsSnapshot.docs) {
            const data = doc.data();
            // If a post has a title, generate a slug from it and check for a match.
            if (data.title && titleToSlug(data.title) === slug) {
                return { id: doc.id, ...data } as BlogPost;
            }
        }
    } catch (e) {
        console.error("Fallback search for post failed:", e);
    }

    return null;
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
        
        const slugs = snapshot.docs.map(doc => {
            const data = doc.data();
            // A post must have a title to generate a slug if slug doesn't exist
            const slugValue = data.slug || (data.title ? titleToSlug(data.title) : null);
            if (!slugValue) {
                return null;
            }
            return { slug: slugValue };
        }).filter((item): item is { slug: string } => item !== null && !!item.slug);

        return slugs;
    } catch (error) {
        console.error("Failed to generate static params for blog posts:", error);
        return [];
    }
}


export default async function BlogPostPage({ params }: { params: { slug: string } }) {
    const post = await getPost(params.slug);

    if (!post) {
        notFound();
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hajaty.com';
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
            url: `${baseUrl}/icon-192x192.png`,
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
