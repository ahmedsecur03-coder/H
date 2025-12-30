
'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
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
        toast({ title: 'جاري استيراد المقالات...', description: `سيتم إضافة ${recommendedPosts.length} مقالات إلى مدونتك.` });

        try {
            const batch = writeBatch(firestore);
            const postsColRef = collection(firestore, 'blogPosts');
            
            recommendedPosts.forEach(post => {
                const postDocRef = doc(postsColRef);
                const newPost: Omit<BlogPost, 'id'> = {
                    ...post,
                    authorId: 'ai-generated', 
                    publishDate: new Date().toISOString(),
                };
                batch.set(postDocRef, newPost);
            });
            
            await batch.commit();

            toast({ title: 'نجاح!', description: 'تم استيراد المقالات بنجاح.' });
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
