
import { initializeFirebaseServer } from '@/firebase/init-server';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

// Helper function to create a URL-friendly slug from a title
function titleToSlug(title) {
  if (!title) return '';
  return title.toLowerCase()
    .replace(/\s+/g, '-')      // Replace spaces with -
    .replace(/[^\w\u0621-\u064A-]+/g, '') // Allow Arabic characters in slug
    .replace(/--+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')        // Trim - from start of text
    .replace(/-+$/, '');       // Trim - from end of text
}

export default async function handler(req, res) {
  const { firestore } = initializeFirebaseServer();
  if (!firestore) {
    return res.status(500).json({ error: "Failed to connect to the database." });
  }

  try {
    const postsQuery = query(collection(firestore, 'blogPosts'), orderBy('publishDate', 'desc'));
    const querySnapshot = await getDocs(postsQuery);
    
    const posts = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        content: data.content,
        author: data.authorId, // Or fetch author name if needed
        date: data.publishDate, // Keep 'date' for compatibility with front-end
        slug: titleToSlug(data.title),
      };
    });

    // Set CORS headers to allow requests from any origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(posts);

  } catch (error) {
    console.error("Error fetching blog posts from Firestore:", error);
    res.status(500).json({ error: "An error occurred while fetching blog posts." });
  }
}
