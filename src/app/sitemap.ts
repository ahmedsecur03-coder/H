
import { MetadataRoute } from 'next';
import { initializeFirebaseServer } from '@/firebase/init-server';
import type { BlogPost } from '@/lib/types';

function titleToSlug(title: string) {
    return title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}
 
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://hajaty.com'; 

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
    const postsCollection = firestore.collection('blogPosts');
    const snapshot = await postsCollection.get();
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
    
    blogUrls = posts.map(post => ({
        url: `${baseUrl}/blog/${titleToSlug(post.title)}`,
        lastModified: new Date(post.publishDate),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }));

  } catch (error) {
      console.error("Failed to generate blog post sitemap URLs:", error);
      // Continue without blog URLs if Firestore fetch fails
  }


  return [
    ...publicUrls,
    ...blogUrls,
  ];
}
