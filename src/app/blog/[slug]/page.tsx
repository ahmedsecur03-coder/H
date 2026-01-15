import { notFound } from 'next/navigation';
import BlogPostPageClient from '@/app/(public)/_components/blog-post-page';
import { firestoreAdmin } from '@/firebase/firebase-admin';
import type { BlogPost } from '@/lib/types';
import type { Metadata, ResolvingMetadata } from 'next';

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

// This function tells Next.js which pages to build at build time
export async function generateStaticParams() {
  try {
    const snapshot = await firestoreAdmin.collection('blogPosts').get();
    if (snapshot.empty) {
      return [];
    }
    const posts = snapshot.docs.map(doc => doc.data() as BlogPost);
    return posts.map(post => ({
      slug: titleToSlug(post.title),
    }));
  } catch (error) {
    console.error("Failed to generate static params for blog posts:", error);
    return []; // Return empty array on error to avoid build failure
  }
}

// This function fetches the data for a specific post
async function getPost(slug: string): Promise<BlogPost | null> {
   try {
    const snapshot = await firestoreAdmin.collection('blogPosts').get();
     if (snapshot.empty) {
      return null;
    }
    const allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
    const foundPost = allPosts.find(p => titleToSlug(p.title) === slug);
    return foundPost || null;
  } catch (error) {
    console.error(`Failed to fetch post with slug ${slug}:`, error);
    return null;
  }
}

// Generate dynamic metadata for each blog post
export async function generateMetadata(
  { params }: { params: { slug: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const post = await getPost(params.slug);
 
  if (!post) {
    return {
      title: 'المقالة غير موجودة',
    }
  }
 
  return {
    title: post.title,
    description: post.content.substring(0, 160).replace(/#/g, '').trim() + '...',
  }
}


export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  return <BlogPostPageClient serverPost={post} />;
}
