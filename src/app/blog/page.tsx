
import BlogPageClient from "@/app/(public)/_components/blog-page";
import type { BlogPost } from '@/lib/types';
import { initializeFirebase } from "@/firebase/init";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

export const revalidate = 60; // Revalidate every 60 seconds

async function getPosts(): Promise<BlogPost[]> {
    // Initialize Firestore on the server
    const { firestore } = initializeFirebase();
    if (!firestore) {
        console.error("Firestore is not initialized on the server.");
        return [];
    }
    
    try {
        const postsQuery = query(collection(firestore, 'blogPosts'), orderBy('publishDate', 'desc'));
        const snapshot = await getDocs(postsQuery);
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
    } catch (error) {
        console.error("Failed to fetch blog posts for page:", error);
        // In case of error (e.g., permissions), return an empty array
        return [];
    }
}


export default async function BlogPage() {
    const posts = await getPosts();
    // The fetched data is passed as a prop to the Client Component.
    return <BlogPageClient serverPosts={posts} />;
}
