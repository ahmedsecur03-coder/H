
import { MetadataRoute } from 'next';
 
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://hajaty.com'; // سيتم استبداله برابط موقعك الفعلي

  // الصفحات العامة
  const publicRoutes = [
    '/home',
    '/services',
    '/blog',
    '/agency-accounts',
    '/login',
    '/signup'
  ];

  const publicUrls = publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '/home' ? 1.0 : 0.8,
  }));
  
  // صفحات لوحة التحكم الرئيسية
  const dashboardRoutes = [
      '/dashboard',
      '/dashboard/orders',
      '/dashboard/mass-order',
      '/dashboard/add-funds',
      '/dashboard/affiliate',
      '/dashboard/campaigns',
      '/dashboard/support',
      '/dashboard/api',
      '/dashboard/system-status',
      '/dashboard/profile',
      '/dashboard/settings',
  ];

  const dashboardUrls = dashboardRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));


  // يمكنك إضافة صفحات ديناميكية هنا في المستقبل (مثل صفحات الخدمات الفردية)

  return [
    ...publicUrls,
    ...dashboardUrls,
  ];
}
