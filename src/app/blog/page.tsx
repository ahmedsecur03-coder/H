
import BlogPageClient from '@/app/(public)/_components/blog-page';
import { initializeFirebaseServer } from '@/firebase/init-server';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import type { BlogPost } from '@/lib/types';

// This is the server-side function to fetch all blog posts
async function getBlogPosts() {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) {
        console.error("Firestore is not initialized on the server.");
        return [];
    }
    try {
        const postsQuery = query(collection(firestore, 'blogPosts'), orderBy('publishDate', 'desc'));
        const querySnapshot = await getDocs(postsQuery);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
    } catch (error) {
        console.error("Failed to fetch blog posts on server:", error);
        return [];
    }
}

// This is the main page component, which is a Server Component.
export default async function BlogPage() {
    // We fetch the data on the server
    const posts = await getBlogPosts();
    // We pass the server-fetched posts to the client component for display
    return <BlogPageClient serverPosts={posts} />;
}
