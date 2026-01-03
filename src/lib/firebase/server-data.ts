
import { initializeFirebaseServer } from '@/firebase/init-server';
import type { BlogPost } from '@/lib/types';
import { collection, query, orderBy, getDocs, limit, where } from 'firebase/firestore';

// Helper function to convert a title to a URL-friendly slug
export function titleToSlug(title: string): string {
    if (!title) return '';
    return title.toLowerCase()
        .replace(/\s+/g, '-')      // Replace spaces with -
        .replace(/[^\w-]+/g, '')   // Remove all non-word chars except -
        .replace(/--+/g, '-')      // Replace multiple - with single -
        .replace(/^-+/, '')        // Trim - from start of text
        .replace(/-+$/, '');       // Trim - from end of text
}

// Fetches all blog posts from Firestore on the server.
export async function getBlogPosts(): Promise<BlogPost[]> {
    try {
        const { firestore } = initializeFirebaseServer();
        const postsQuery = query(collection(firestore, 'blogPosts'), orderBy('publishDate', 'desc'));
        const querySnapshot = await getDocs(postsQuery);
        
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
    } catch (error) {
        console.error("Error fetching blog posts on server:", error);
        return []; // Return an empty array in case of error
    }
}

// Fetches a single blog post by its slug on the server.
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
        const { firestore } = initializeFirebaseServer();
        const postsRef = collection(firestore, 'blogPosts');
        const querySnapshot = await getDocs(postsRef);
        
        // We have to filter client-side because we can't query based on a derived field (the slug).
        // This is acceptable for a small number of posts. For a large blog, a different strategy would be needed.
        let foundPost: BlogPost | null = null;
        querySnapshot.forEach((doc) => {
            const postData = { id: doc.id, ...doc.data() } as BlogPost;
            if (titleToSlug(postData.title) === slug) {
                foundPost = postData;
            }
        });

        return foundPost;
    } catch (error) {
        console.error(`Error fetching blog post by slug "${slug}":`, error);
        return null;
    }
}

// Fetches the next and previous posts relative to a given post's publish date.
export async function getAdjacentPosts(currentPostDate: string): Promise<{ prevPost: BlogPost | null, nextPost: BlogPost | null }> {
    try {
        const { firestore } = initializeFirebaseServer();
        const postsRef = collection(firestore, 'blogPosts');

        // Query for the next post (published after the current one)
        const nextQuery = query(
            postsRef, 
            where('publishDate', '>', currentPostDate), 
            orderBy('publishDate', 'asc'), 
            limit(1)
        );
        const nextSnap = await getDocs(nextQuery);
        const nextPost = nextSnap.empty ? null : { id: nextSnap.docs[0].id, ...nextSnap.docs[0].data() } as BlogPost;

        // Query for the previous post (published before the current one)
        const prevQuery = query(
            postsRef, 
            where('publishDate', '<', currentPostDate), 
            orderBy('publishDate', 'desc'), 
            limit(1)
        );
        const prevSnap = await getDocs(prevQuery);
        const prevPost = prevSnap.empty ? null : { id: prevSnap.docs[0].id, ...prevSnap.docs[0].data() } as BlogPost;

        return { prevPost, nextPost };

    } catch (error) {
        console.error("Error fetching adjacent posts:", error);
        return { prevPost: null, nextPost: null };
    }
}
