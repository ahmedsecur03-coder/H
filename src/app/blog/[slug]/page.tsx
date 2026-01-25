
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

async function getPost(slug: string): Promise<BlogPost | null> {
    // Add a guard clause for invalid slugs right at the beginning.
    if (!slug || slug === 'undefined') {
        console.error(`getPost was called with an invalid slug: '${slug}'`);
        return null;
    }

    const firestore = getFirestoreServer();
    const postsRef = collection(firestore, 'blogPosts');
    
    // 1. Try the direct, efficient query first.
    const q = query(postsRef, where("slug", "==", slug), limit(1));
    const directSnapshot = await getDocs(q);

    if (!directSnapshot.empty) {
        const doc = directSnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as BlogPost;
    }

    // 2. If the direct query fails, fall back to a manual search.
    // This is less efficient but more robust against indexing issues.
    console.warn(`Direct query for slug "${slug}" failed. Falling back to manual search.`);
    const allPostsSnapshot = await getDocs(postsRef);
    
    for (const doc of allPostsSnapshot.docs) {
        const postData = doc.data();
        // Check against the stored slug and a dynamically generated one for legacy data.
        if (postData.slug === slug || titleToSlug(postData.title) === slug) {
            console.warn(`Found post with slug "${slug}" via manual search.`);
            return { id: doc.id, ...postData } as BlogPost;
        }
    }
    
    // If no match was found after checking all posts
    console.warn(`Post with slug "${slug}" could not be found via direct query or manual search.`);
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
            // A post must have a slug to be a static page.
            return { slug: data.slug };
        }).filter(item => !!item.slug); // Filter out any posts that might have a null/undefined slug

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
