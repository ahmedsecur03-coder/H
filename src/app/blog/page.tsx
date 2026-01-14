'use server';
import BlogPageClient from "@/app/(public)/_components/blog-page";
import type { Metadata } from 'next';
import { initializeFirebaseServer } from '@/firebase/init-server';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import type { BlogPost } from '@/lib/types';


export const metadata: Metadata = {
  title: 'المدونة',
  description: 'تابع آخر التحديثات والإعلانات والنصائح من فريق حاجاتي لتعزيز نموك الرقمي.',
}

async function getBlogPosts(): Promise<BlogPost[]> {
    try {
        const { firestore } = initializeFirebaseServer();
        if (!firestore) return [];

        const postsQuery = query(collection(firestore, 'blogPosts'), orderBy('publishDate', 'desc'));
        const querySnapshot = await getDocs(postsQuery);
        // Ensure data is serializable for the client component
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
    } catch (error) {
        console.error("Failed to fetch blog posts for server component:", error);
        return [];
    }
}


export default async function BlogPage() {
    const posts = await getBlogPosts();
    return <BlogPageClient serverPosts={posts} />;
}
