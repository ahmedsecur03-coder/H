
import { doc, getDoc, collection, getDocs, orderBy, limit, where, query } from 'firebase/firestore';
import { initializeFirebaseServer } from '@/firebase/init-server'; // Using server-side init
import { notFound } from 'next/navigation';
import type { BlogPost } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import type { Metadata, ResolvingMetadata } from 'next';

type Props = {
    params: { slug: string }
}

async function getPost(slug: string): Promise<{ post: BlogPost; prevPost: { id: string, title: string } | null; nextPost: { id: string, title: string } | null } | null> {
    const { firestore } = initializeFirebaseServer();

    try {
        const postRef = doc(firestore, 'blogPosts', slug);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) {
            return null;
        }

        const post = { id: postSnap.id, ...postSnap.data() } as BlogPost;
        
        const postsRef = collection(firestore, 'blogPosts');
        
        const nextQuery = query(postsRef, where('publishDate', '>', post.publishDate), orderBy('publishDate', 'asc'), limit(1));
        const nextSnap = await getDocs(nextQuery);
        const nextPostData = nextSnap.docs[0]?.data();
        const nextPost = nextSnap.empty ? null : { id: nextSnap.docs[0].id, title: nextPostData?.title };

        const prevQuery = query(postsRef, where('publishDate', '<', post.publishDate), orderBy('publishDate', 'desc'), limit(1));
        const prevSnap = await getDocs(prevQuery);
        const prevPostData = prevSnap.docs[0]?.data();
        const prevPost = prevSnap.empty ? null : { id: prevSnap.docs[0].id, title: prevPostData?.title };

        return { post, prevPost, nextPost };

    } catch (error) {
        console.error("Error fetching post or adjacent posts:", error);
        return null;
    }
}


export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const data = await getPost(params.slug);
 
  if (!data) {
     return {
        title: 'المنشور غير موجود',
        description: 'لم نتمكن من العثور على المقالة التي تبحث عنها.',
    }
  }
 
  const post = data.post;
 
  return {
    title: `${post.title} | مدونة حاجاتي`,
    description: post.content.substring(0, 160).replace(/#/g, '').trim(),
    openGraph: {
      title: post.title,
      description: post.content.substring(0, 160).replace(/#/g, '').trim(),
      url: `/blog/${params.slug}`,
      siteName: 'حاجاتي',
      locale: 'ar_EG',
      type: 'article',
      authors: ['فريق حاجاتي'],
    },
     twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.content.substring(0, 160).replace(/#/g, '').trim(),
    },
  }
}


export default async function BlogPostPage({ params }: Props) {
    
    const data = await getPost(params.slug);

    if (!data) {
        notFound();
    }
    
    const { post, prevPost, nextPost } = data;
    
    return (
        <div className="max-w-4xl mx-auto py-8">
            <Button variant="ghost" asChild className="mb-4">
                <Link href="/blog">
                    <ArrowRight className="ml-2 h-4 w-4" />
                    العودة إلى المدونة
                </Link>
            </Button>
            <article>
                <Card>
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

            <nav className="flex justify-between items-center mt-8 gap-4">
                <div>
                    {prevPost && (
                         <Button asChild variant="outline">
                            <Link href={`/blog/${prevPost.id}`} title={prevPost.title}>
                                <ArrowRight className="ml-2 h-4 w-4" />
                                المقالة السابقة
                            </Link>
                        </Button>
                    )}
                </div>
                 <div>
                    {nextPost && (
                         <Button asChild>
                            <Link href={`/blog/${nextPost.id}`} title={nextPost.title}>
                                المقالة التالية
                                <ChevronLeft className="mr-2 h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                </div>
            </nav>
        </div>
    );
}


export async function generateStaticParams() {
    const { firestore } = initializeFirebaseServer();
    try {
        const postsRef = collection(firestore, 'blogPosts');
        const snapshot = await getDocs(postsRef);
        return snapshot.docs.map(doc => ({
            slug: doc.id,
        }));
    } catch (error) {
        console.error("Could not generate static params for blog posts:", error);
        return [];
    }
}

    