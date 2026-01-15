'use client';

import BlogPageClient from "@/app/(public)/_components/blog-page";
import type { BlogPost } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";

export default function BlogPage() {
    const firestore = useFirestore();
    const postsQuery = useMemoFirebase(
      () => (firestore ? query(collection(firestore, 'blogPosts'), orderBy('publishDate', 'desc')) : null),
      [firestore]
    );
    const { data: posts, isLoading } = useCollection<BlogPost>(postsQuery);

    return <BlogPageClient serverPosts={isLoading ? null : posts} />;
}
