
'use server';

import { notFound } from 'next/navigation';
import BlogPostPageClient from '@/app/(public)/_components/blog-post-page';
import { getFirestoreServer } from '@/firebase/init-server';
import { collection, getDocs, query, where, limit, doc, getDoc } from 'firebase/firestore';
import type { BlogPost } from '@/lib/types';
import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';

/**
 * Fetches a blog post from Firestore by its slug or ID.
 * It first tries to query by the 'slug' field. If that fails, it falls back
 * to getting the document directly by its ID, ensuring backward compatibility with old links.
 * @param slugOrId The URL-friendly slug or the Firestore document ID of the post.
 * @returns A promise that resolves to the BlogPost object or null if not found.
 */
async function getPost(slugOrId: string): Promise<BlogPost | null> {
    if (!slugOrId || slugOrId === 'undefined') {
        console.error(`getPost was called with an invalid slug/id: '${slugOrId}'`);
        return null;
    }

    const firestore = getFirestoreServer();
    const postsColRef = collection(firestore, 'blogPosts');
    const decodedSlug = decodeURIComponent(slugOrId);

    try {
        // 1. First, try to find the post by slug. This is the preferred method.
        const slugQuery = query(postsColRef, where("slug", "==", decodedSlug), limit(1));
        const slugSnapshot = await getDocs(slugQuery);

        if (!slugSnapshot.empty) {
            const postDoc = slugSnapshot.docs[0];
            return { id: postDoc.id, ...postDoc.data() } as BlogPost;
        }

        // 2. If not found by slug, assume the parameter is a document ID (fallback for old links).
        console.warn(`Post with slug "${decodedSlug}" not found. Falling back to search by ID.`);
        const docRef = doc(firestore, 'blogPosts', decodedSlug);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as BlogPost;
        }
       
        // If not found by either method, log and return null.
        console.error(`Post with slug or ID "${decodedSlug}" could not be found.`);
        return null;

    } catch (error) {
        console.error(`Error fetching post with slug/ID ${decodedSlug}:`, error);
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
