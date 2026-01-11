import { initializeFirebaseServer } from '@/firebase/init-server';
import { collection, query, getDocs } from 'firebase/firestore';
import type { Metadata, ResolvingMetadata } from 'next';
import type { BlogPost } from '@/lib/types';
import BlogPostPageClient from '@/app/(public)/_components/blog-post-page';

type Props = {
  params: { slug: string }
}

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

async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) return undefined;
    
    try {
        const postsQuery = query(collection(firestore, 'blogPosts'));
        const querySnapshot = await getDocs(postsQuery);
        const allPosts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
        return allPosts.find(p => titleToSlug(p.title) === slug);
    } catch (error) {
        console.error("Error fetching post for metadata:", error);
        return undefined;
    }
}

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    return {
      title: 'المقالة غير موجودة',
    }
  }

  const description = post.content.substring(0, 160).replace(/#/g, '').trim() + '...';

  return {
    title: post.title,
    description: description,
    openGraph: {
      title: post.title,
      description: description,
      type: 'article',
      publishedTime: post.publishDate,
      authors: ['Hagaaty Team'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: description,
    },
  }
}

export async function generateStaticParams() {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) return [];

    try {
        const postsQuery = query(collection(firestore, 'blogPosts'));
        const querySnapshot = await getDocs(postsQuery);
        const posts = querySnapshot.docs.map(doc => doc.data() as BlogPost);
    
        return posts.map((post) => ({
            slug: titleToSlug(post.title),
        }));
    } catch (error) {
        console.error("Failed to generate static params for blog posts:", error);
        return [];
    }
}

export default function BlogPostPage({ params }: Props) {
    // This is now a server component, it will pass the slug to the client component
    return <BlogPostPageClient slug={params.slug} />;
}
