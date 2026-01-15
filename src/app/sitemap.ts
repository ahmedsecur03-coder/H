import { MetadataRoute } from 'next';

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
  
  // Temporarily removing dynamic blog post URLs to fix build error.
  // This can be re-enabled once server-side data fetching is stable.
  const blogPostUrls: MetadataRoute.Sitemap = [];

  return [...staticUrls, ...blogPostUrls];
}
