import BlogPageClient from '@/app/(public)/_components/blog-page';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { initializeFirebaseServer } from '@/firebase/init-server';
import type { BlogPost } from '@/lib/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'المدونة والأخبار',
  description: 'تابع آخر التحديثات والإعلانات والنصائح من فريق حاجاتي.',
}

// This function fetches ALL posts on the server.
async function getBlogPosts(): Promise<BlogPost[]> {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) {
        console.warn("Firestore is not initialized on the server. Cannot fetch blog posts.");
        return [];
    }

    try {
        const postsRef = collection(firestore, 'blogPosts');
        const postsQuery = query(postsRef, orderBy('publishDate', 'desc'));
        const snapshot = await getDocs(postsQuery);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
    } catch (error) {
        console.error("Failed to fetch blog posts:", error);
        return [];
    }
}


export default async function BlogPage() {
    // This is now a Server Component.
    // It fetches the data on the server and passes it to the client component.
    const posts = await getBlogPosts();
    return <BlogPageClient serverPosts={posts} />;
}
