'use client';

import type { BlogPost } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { BookOpen, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

function titleToSlug(title: string): string {
  if (!title) return '';
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

export default function BlogPageClient({ serverPosts }: { serverPosts: BlogPost[] | null }) {

    const isLoading = !serverPosts;

    return (
        <div className="space-y-6 pb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">المدونة والأخبار</h1>
                <p className="text-muted-foreground">
                    تابع آخر التحديثات والإعلانات والنصائح من فريق حاجاتي.
                </p>
            </div>

            {isLoading ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/4 mt-2" /></CardHeader>
                            <CardContent><Skeleton className="h-12 w-full" /></CardContent>
                            <CardFooter><Skeleton className="h-10 w-28" /></CardFooter>
                        </Card>
                    ))}
                </div>
            ) : serverPosts && serverPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {serverPosts.map(post => {
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
