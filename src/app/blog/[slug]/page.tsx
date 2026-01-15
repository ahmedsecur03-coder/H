
import { notFound } from 'next/navigation';
import BlogPostPageClient from '@/app/(public)/_components/blog-post-page';
import { initializeFirebase } from '@/firebase/init';
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
  const { firestore } = initializeFirebase();
  if (!firestore) return null;
  
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
    const { firestore } = initializeFirebase();
    if (!firestore) return [];

    try {
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

    // Pass the fetched post data to the client component for rendering
    return <BlogPostPageClient serverPost={post} />;
}
