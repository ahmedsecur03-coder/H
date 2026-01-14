
import { MetadataRoute } from 'next';
import { initializeFirebaseServer } from '@/firebase/init-server';
import { collection, getDocs } from 'firebase/firestore';
import type { BlogPost } from '@/lib/types';

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hajaty.com';

  const publicRoutes = [
    '/',
    '/about',
    '/services',
    '/blog',
    '/terms',
    '/privacy',
    '/auth/login',
    '/auth/signup',
  ];

  const staticUrls = publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '/' ? 1.0 : 0.8,
  }));
  
  // Fetch blog posts from Firestore on the server
  const { firestore } = initializeFirebaseServer();
  let blogPostUrls: MetadataRoute.Sitemap = [];

  if (firestore) {
    try {
        const postsSnapshot = await getDocs(collection(firestore, 'blogPosts'));
        blogPostUrls = postsSnapshot.docs.map(doc => {
            const post = doc.data() as BlogPost;
            return {
                url: `${baseUrl}/blog/${titleToSlug(post.title)}`,
                lastModified: new Date(post.publishDate),
                changeFrequency: 'monthly',
                priority: 0.7,
            };
        });
    } catch (error) {
        console.error("Failed to fetch blog posts for sitemap:", error);
    }
  }

  return [...staticUrls, ...blogPostUrls];
}
