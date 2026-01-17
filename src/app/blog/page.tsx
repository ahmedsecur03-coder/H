
import BlogPageClient from "@/app/(public)/_components/blog-page";
import type { BlogPost } from '@/lib/types';
import { getFirestoreServer } from "@/firebase/init-server";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

export const revalidate = 60; // Revalidate every 60 seconds

async function getPosts(): Promise<BlogPost[]> {
    const firestore = getFirestoreServer();
    try {
        const postsQuery = query(collection(firestore, 'blogPosts'), orderBy('publishDate', 'desc'));
        const snapshot = await getDocs(postsQuery);
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
    } catch (error) {
        console.error("Failed to fetch blog posts for page:", error);
        return [];
    }
}


export default async function BlogPage() {
    const posts = await getPosts();
    return <BlogPageClient serverPosts={posts} />;
}
