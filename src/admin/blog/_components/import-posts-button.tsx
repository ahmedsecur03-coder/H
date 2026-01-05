'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, writeBatch, doc, getDocs, query } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2 } from 'lucide-react';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import type { BlogPost } from '@/lib/types';
import { recommendedPosts } from './recommended-posts';

export function ImportPostsButton({ onImportComplete }: { onImportComplete: () => void }) {
    const [isImporting, setIsImporting] = useState(false);
    const { toast } = useToast();
    const firestore = useFirestore();

    const handleImport = async () => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'Firestore is not available.' });
            return;
        }

        setIsImporting(true);
        toast({ title: 'جاري التحقق من المقالات الجديدة...', description: `سيتم مقارنة المقالات المقترحة مع الموجودة في مدونتك.` });

        try {
            // 1. Fetch all existing post titles
            const postsColRef = collection(firestore, 'blogPosts');
            const existingPostsSnapshot = await getDocs(postsColRef);
            const existingTitles = new Set(existingPostsSnapshot.docs.map(doc => (doc.data() as BlogPost).title));

            // 2. Filter out posts that already exist
            const newPostsToImport = recommendedPosts.filter(post => !existingTitles.has(post.title));

            if (newPostsToImport.length === 0) {
                toast({ title: 'المدونة محدّثة', description: 'لا توجد مقالات جديدة لاستيرادها.' });
                setIsImporting(false);
                return;
            }

            // 3. Write only the new posts in a batch
            const batch = writeBatch(firestore);
            
            newPostsToImport.forEach(post => {
                const postDocRef = doc(postsColRef);
                const newPost: Omit<BlogPost, 'id'> = {
                    ...post,
                    authorId: 'ai-generated', 
                    publishDate: new Date().toISOString(),
                };
                batch.set(postDocRef, newPost);
            });
            
            await batch.commit();

            toast({ title: 'نجاح!', description: `تم استيراد ${newPostsToImport.length} مقالات جديدة بنجاح.` });
            onImportComplete();
        } catch (error) {
            console.error("Error importing posts:", error);
            const permissionError = new FirestorePermissionError({
                path: 'blogPosts/[multiple]',
                operation: 'write'
            });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <Button variant="outline" onClick={handleImport} disabled={isImporting}>
            {isImporting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Upload className="ml-2 h-4 w-4" />}
            استيراد المقالات المقترحة
        </Button>
    );
}
