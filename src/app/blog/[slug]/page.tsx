
import { notFound } from 'next/navigation';
import BlogPostPageClient from '@/app/(public)/_components/blog-post-page';
import { getFirestoreServer } from '@/firebase/init-server';
import { collection, getDocs, query } from 'firebase/firestore';
import type { BlogPost } from '@/lib/types';
import type { Metadata } from 'next';

export const revalidate = 60; // Revalidate every 60 seconds

// Utility to convert title to a URL-friendly slug
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

// Function to fetch a single post by its slug
async function getPost(slug: string): Promise<BlogPost | null> {
  const firestore = getFirestoreServer();
  
  const postsQuery = query(collection(firestore, 'blogPosts'));
  const snapshot = await getDocs(postsQuery);

  if (snapshot.empty) {
    return null;
  }

  // Find the post by comparing slugs. This is necessary because slugs are derived.
  const allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
  const post = allPosts.find(p => titleToSlug(p.title) === slug);
  
  return post || null;
}

// Generate metadata dynamically
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug);

  if (!post) {
    return {
      title: 'المقالة غير موجودة',
    };
  }

  return {
    title: post.title,
    description: post.content.substring(0, 160).replace(/#/g, '').trim() + '...',
    openGraph: {
      title: post.title,
      description: post.content.substring(0, 160).replace(/#/g, '').trim() + '...',
      type: 'article',
      publishedTime: post.publishDate,
    },
  };
}

// Generate static paths for all blog posts
export async function generateStaticParams() {
    try {
        const firestore = getFirestoreServer();
        const postsQuery = query(collection(firestore, 'blogPosts'));
        const snapshot = await getDocs(postsQuery);
        return snapshot.docs.map(doc => ({
            slug: titleToSlug(doc.data().title),
        }));
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

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': postUrl,
        },
        headline: post.title,
        description: post.content.substring(0, 250).replace(/#/g, '').trim(),
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
