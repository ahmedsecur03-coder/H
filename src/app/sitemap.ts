
import { MetadataRoute } from 'next';

// This sitemap is now static to avoid build-time errors with database fetching.
// For a dynamic sitemap with a large number of pages, consider a serverless function approach post-build.
 
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

  // The dynamic fetching of blog posts is removed to prevent build failures.
  // When the number of blog posts is large, this should be re-implemented
  // using a more robust method that doesn't rely on build-time database access.

  return [
    ...publicUrls,
  ];
}
