'use client';

import { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, getDocs, query, where, limit, doc, getDoc } from 'firebase/firestore';
import type { BlogPost } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Skeleton } from '@/components/ui/skeleton';


function BlogPostPageSkeleton() {
    return (
        <div className="max-w-4xl mx-auto py-8">
            <Skeleton className="h-8 w-32 mb-4" />
            <Card>
                <Skeleton className="aspect-[16/9] w-full rounded-t-lg" />
                <CardHeader>
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-5 w-1/4 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-5/6" />
                </CardContent>
            </Card>
        </div>
    );
}


export default function BlogPostPage() {
    const params = useParams();
    const slug = params.slug as string;
    const firestore = useFirestore();

    const [post, setPost] = useState<BlogPost | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!firestore || !slug) {
            setIsLoading(false);
            return;
        };

        const fetchPost = async () => {
            setIsLoading(true);
            try {
                const postsColRef = collection(firestore, 'blogPosts');
                const decodedSlug = decodeURIComponent(slug);

                // 1. Query by slug
                const q = query(postsColRef, where("slug", "==", decodedSlug), limit(1));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const postDoc = querySnapshot.docs[0];
                    setPost({ id: postDoc.id, ...postDoc.data() } as BlogPost);
                } else {
                    // 2. Fallback to get by ID
                    const docRef = doc(firestore, 'blogPosts', decodedSlug);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setPost({ id: docSnap.id, ...docSnap.data() } as BlogPost);
                    } else {
                        setPost(null);
                    }
                }
            } catch (error) {
                console.error("Error fetching post client-side:", error);
                setPost(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPost();
    }, [firestore, slug]);


    if (isLoading) {
        return <BlogPostPageSkeleton />;
    }

    if (!post) {
        notFound();
    }
    
    const postImage = post.imageUrl ? PlaceHolderImages.find(img => img.id === post.imageUrl) : null;
    const finalImageUrl = postImage ? postImage.imageUrl : (post.imageUrl?.startsWith('http') ? post.imageUrl : null);

    return (
        <div className="max-w-4xl mx-auto py-8">
            <Button variant="ghost" asChild className="mb-4">
                <Link href="/blog">
                    <ArrowRight className="ml-2 h-4 w-4" />
                    العودة إلى المدونة
                </Link>
            </Button>
            <article>
                <Card className="overflow-hidden">
                    {finalImageUrl && (
                        <div className="relative aspect-[16/9] w-full">
                            <Image 
                                src={finalImageUrl}
                                alt={post.title}
                                fill
                                className="object-cover"
                                priority
                                data-ai-hint={post.imageHint}
                            />
                        </div>
                    )}
                    <CardHeader>
                        <CardTitle className="text-3xl md:text-4xl font-headline leading-tight">{post.title}</CardTitle>
                        <CardDescription>
                            نُشر في: {new Date(post.publishDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none">
                        <ReactMarkdown
                            components={{
                                h2: ({node, ...props}) => <h2 className="font-headline" {...props} />,
                                h3: ({node, ...props}) => <h3 className="font-headline" {...props} />,
                            }}
                        >
                            {post.content}
                        </ReactMarkdown>
                    </CardContent>
                </Card>
            </article>
        </div>
    );
}
