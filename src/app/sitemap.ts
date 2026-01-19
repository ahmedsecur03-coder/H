
import { MetadataRoute } from 'next';
import { getFirestoreServer } from '@/firebase/init-server';
import { collection, getDocs, query } from 'firebase/firestore';
import type { BlogPost } from '@/lib/types';
import { titleToSlug } from '@/lib/slugify';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:9002');

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

    let blogPostUrls: MetadataRoute.Sitemap = [];
    try {
        const firestore = getFirestoreServer();
        const postsQuery = query(collection(firestore, 'blogPosts'));
        const snapshot = await getDocs(postsQuery);
        blogPostUrls = snapshot.docs.map(doc => {
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

    return [...staticUrls, ...blogPostUrls];
}
