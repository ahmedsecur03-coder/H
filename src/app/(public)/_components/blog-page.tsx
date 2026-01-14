'use client';

import { useState, useEffect } from 'react';
import type { BlogPost } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { BookOpen, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

function titleToSlug(title: string): string {
  if (!title) return '';
  // This version is safer for URLs and handles more edge cases.
  return title
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\u0621-\u064A\u0660-\u0669a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}


function BlogPageSkeleton() {
    return (
        <div className="space-y-6 pb-8">
             <div>
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-5 w-2/3 mt-2" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="flex flex-col">
                        <CardHeader>
                            <Skeleton className="h-6 w-full" />
                             <Skeleton className="h-4 w-1/3 mt-2" />
                        </CardHeader>
                        <CardContent className="flex-grow space-y-2">
                             <Skeleton className="h-4 w-full" />
                             <Skeleton className="h-4 w-5/6" />
                        </CardContent>
                        <CardFooter>
                            <Skeleton className="h-10 w-28" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}

export default function BlogPageClient({ serverPosts }: { serverPosts: BlogPost[] }) {
    const [posts, setPosts] = useState<BlogPost[]>(serverPosts);
    const [isLoading, setIsLoading] = useState(serverPosts.length === 0);
    const firestore = useFirestore();

    useEffect(() => {
        // Only fetch on client if server data is missing
        if (serverPosts.length > 0) return;

        const fetchPosts = async () => {
            if (!firestore) return;
            setIsLoading(true);
            try {
                const postsQuery = query(collection(firestore, 'blogPosts'), orderBy('publishDate', 'desc'));
                const querySnapshot = await getDocs(postsQuery);
                const fetchedPosts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
                setPosts(fetchedPosts);
            } catch (error) {
                console.error("Error fetching blog posts:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPosts();
    }, [firestore, serverPosts]);


    if (isLoading) {
        return <BlogPageSkeleton />;
    }

    return (
        <div className="space-y-6 pb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">المدونة والأخبار</h1>
                <p className="text-muted-foreground">
                    تابع آخر التحديثات والإعلانات والنصائح من فريق حاجاتي.
                </p>
            </div>

            {posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map(post => {
                        const slug = titleToSlug(post.title);
                        return (
                            <Card key={post.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle className="font-headline text-xl leading-tight">{post.title}</CardTitle>
                                    <CardDescription>
                                        {new Date(post.publishDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-sm text-muted-foreground line-clamp-3">
                                    {post.content.substring(0, 150).replace(/#/g, '').trim()}...
                                    </p>
                                </CardContent>
                                <CardFooter>
                                    <Button asChild variant="secondary">
                                        <Link href={`/blog/${slug}`}>
                                            اقرأ المزيد
                                            <ChevronLeft className="h-4 w-4 ms-2" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-20 bg-card border rounded-lg">
                    <BookOpen className="mx-auto h-16 w-16 text-muted-foreground" />
                    <h2 className="mt-4 text-2xl font-bold">لا توجد منشورات بعد</h2>
                    <p className="mt-2 text-muted-foreground">
                        لم نقم بنشر أي أخبار أو إعلانات حتى الآن. تحقق مرة أخرى قريبًا!
                    </p>
                </div>
            )}
        </div>
    );
}
