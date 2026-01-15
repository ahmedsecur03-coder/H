import BlogPageClient from "@/app/(public)/_components/blog-page";
import type { Metadata } from 'next';
import { firestoreAdmin } from '@/firebase/firebase-admin';
import type { BlogPost } from '@/lib/types';

export const metadata: Metadata = {
  title: 'المدونة | حاجاتي',
  description: 'تابع آخر التحديثات والإعلانات والنصائح من فريق حاجاتي.',
}

export const revalidate = 60; // Revalidate every 60 seconds

async function getPosts() {
    try {
        const snapshot = await firestoreAdmin.collection('blogPosts').orderBy('publishDate', 'desc').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
    } catch (error) {
        console.error("Failed to fetch posts for blog page:", error);
        return []; // Return empty array on error
    }
}

export default async function BlogPage() {
    const posts = await getPosts();
    return <BlogPageClient serverPosts={posts} />;
}
