import { MetadataRoute } from 'next';

// NOTE: This sitemap is now static because fetching data from Firestore on the server
// caused build issues. To include dynamic blog posts, this would need to be revisited
// once the server-side Firebase initialization is stable.

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
  
  return publicUrls;
}
