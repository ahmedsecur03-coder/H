import { MetadataRoute } from 'next';
 
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://hajaty.com'; // سيتم استبداله برابط موقعك الفعلي

  // قائمة الصفحات الرئيسية
  const staticRoutes = [
    '/',
    '/orders',
    '/mass-order',
    '/add-funds',
    '/affiliate',
    '/campaigns',
    '/support',
    '/profile',
    '/settings',
    '/login',
    '/signup'
  ];

  const staticUrls = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '/' ? 1.0 : 0.8,
  }));

  // يمكنك إضافة صفحات ديناميكية هنا في المستقبل (مثل صفحات الخدمات الفردية)

  return [
    ...staticUrls
  ];
}
