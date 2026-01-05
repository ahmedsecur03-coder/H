import type { BlogPost } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { BookOpen, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { initializeFirebaseServer } from '@/firebase/init-server';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

function titleToSlug(title: string): string {
    if (!title) return '';
    return title.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u0621-\u064A-]+/g, '') // Allow Arabic characters
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

async function getPosts(): Promise<BlogPost[]> {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) {
        console.error("Failed to connect to the database on the server.");
        return [];
    }

    try {
        const postsQuery = query(collection(firestore, 'blogPosts'), orderBy('publishDate', 'desc'));
        const querySnapshot = await getDocs(postsQuery);
        
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                content: data.content,
                authorId: data.authorId,
                publishDate: data.publishDate,
            };
        }) as BlogPost[];
    } catch (error) {
        console.error("Error fetching blog posts from Firestore:", error);
        return [];
    }
}

export default async function BlogPage() {
    const posts = await getPosts();

    return (
        <div className="space-y-6 pb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">المدونة والأخبار</h1>
                <p className="text-muted-foreground">
                    تابع آخر التحديثات والإعلانات والنصائح من فريق حاجاتي.
                </p>
            </div>

            {posts && posts.length > 0 ? (
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
