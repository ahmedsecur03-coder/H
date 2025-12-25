import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import type { BlogPost } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { initializeFirebaseServer } from '@/firebase/server';


async function getBlogPosts(): Promise<BlogPost[]> {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) {
        // In a real-world scenario, you might want to log this error.
        // For the user, we'll just show an empty blog.
        console.error("Firestore is not initialized on the server.");
        return [];
    }
    
    try {
        const postsQuery = query(collection(firestore, 'blogPosts'), orderBy('publishDate', 'desc'));
        const querySnapshot = await getDocs(postsQuery);
        const fetchedPosts: BlogPost[] = [];
        querySnapshot.forEach(doc => {
            fetchedPosts.push({ id: doc.id, ...doc.data() } as BlogPost);
        });
        return fetchedPosts;
    } catch (e) {
        console.error("Could not fetch blog posts from server:", e);
        return []; // Return empty on error
    }
}


export default async function BlogPage() {
    const posts = await getBlogPosts();

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">المدونة والأخبار</h1>
        <p className="text-muted-foreground">
          تابع آخر التحديثات والإعلانات والنصائح من فريق حاجاتي.
        </p>
      </div>

      {posts && posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map(post => (
            <Card key={post.id}>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">{post.title}</CardTitle>
                <CardDescription>
                  نُشر في: {new Date(post.publishDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert prose-p:text-muted-foreground max-w-none">
                  <ReactMarkdown>{post.content}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          ))}
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
