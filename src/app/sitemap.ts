import { MetadataRoute } from 'next';
import { initializeFirebaseServer } from '@/firebase/init-server';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { BlogPost } from '@/lib/types';

// Helper function to convert titles to URL-friendly slugs
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

  // Static public routes
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

  const publicUrls = publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '/' ? 1.0 : 0.8,
  }));

  // Dynamic blog post routes
  let blogUrls: MetadataRoute.Sitemap = [];
  try {
    const { firestore } = initializeFirebaseServer();
    if (firestore) {
      const postsQuery = query(collection(firestore, 'blogPosts'), orderBy('publishDate', 'desc'));
      const querySnapshot = await getDocs(postsQuery);
      const posts = querySnapshot.docs.map(doc => doc.data() as BlogPost);

      blogUrls = posts.map(post => ({
        url: `${baseUrl}/blog/${titleToSlug(post.title)}`,
        lastModified: new Date(post.publishDate),
        changeFrequency: 'monthly',
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error("Failed to fetch blog posts for sitemap:", error);
    // Proceed with only static URLs if Firestore fails
  }


  return [
    ...publicUrls,
    ...blogUrls,
  ];
}
