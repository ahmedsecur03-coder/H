
'use server';

import BlogPageClient from "@/app/(public)/_components/blog-page";
import type { Metadata } from 'next';
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { initializeFirebaseServer } from "@/firebase/init-server";
import { BlogPost } from "@/lib/types";


export const metadata: Metadata = {
  title: 'المدونة',
  description: 'تابع آخر التحديثات والإعلانات والنصائح من فريق حاجاتي لتعزيز نموك الرقمي.',
}

// This function will fetch the data on the server
async function getBlogPosts(): Promise<BlogPost[]> {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) {
        console.error("Firestore not available on server.");
        return [];
    };
    try {
        const postsQuery = query(collection(firestore, 'blogPosts'), orderBy('publishDate', 'desc'));
        const snapshot = await getDocs(postsQuery);
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
        return posts;
    } catch (error) {
        console.error("Failed to fetch blog posts:", error);
        return [];
    }
}


export default async function BlogPage() {
    const posts = await getBlogPosts();
    // We pass the server-fetched posts to the client component
    return <BlogPageClient serverPosts={posts} />;
}
