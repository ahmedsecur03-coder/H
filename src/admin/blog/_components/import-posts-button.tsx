'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, writeBatch, doc, getDocs, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, RefreshCw } from 'lucide-react';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import type { BlogPost } from '@/lib/types';
import { recommendedPosts } from './recommended-posts';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ImportPostsButton({ onImportComplete }: { onImportComplete: () => void }) {
    const [isImporting, setIsImporting] = useState(false);
    const { toast } = useToast();
    const firestore = useFirestore();

    const handleResetAndImport = async () => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'Firestore is not available.' });
            return;
        }

        setIsImporting(true);
        toast({ title: 'جاري إعادة تعيين واستيراد المقالات...', description: 'سيتم حذف المقالات القديمة أولاً.' });

        try {
            const postsColRef = collection(firestore, 'blogPosts');
            
            // 1. Delete all existing documents in the collection
            const existingPostsSnapshot = await getDocs(postsColRef);
            const deleteBatch = writeBatch(firestore);
            existingPostsSnapshot.forEach(doc => {
                deleteBatch.delete(doc.ref);
            });
            await deleteBatch.commit();
            
            // 2. Write the new recommended posts
            const importBatch = writeBatch(firestore);
            recommendedPosts.forEach(post => {
                const postDocRef = doc(postsColRef); // Create a new doc ref for each post
                const newPost: Omit<BlogPost, 'id' | 'publishDate' | 'authorId'> = {
                    title: post.title,
                    content: post.content,
                };
                importBatch.set(postDocRef, {
                    ...newPost,
                    authorId: 'ai-generated', 
                    publishDate: new Date().toISOString(),
                });
            });
            
            await importBatch.commit();

            toast({ title: 'نجاح!', description: `تم إعادة تعيين واستيراد ${recommendedPosts.length} مقالات بنجاح.` });
            onImportComplete();
        } catch (error) {
            console.error("Error resetting and importing posts:", error);
            const permissionError = new FirestorePermissionError({
                path: 'blogPosts',
                operation: 'write'
            });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setIsImporting(false);
        }
    };

    return (
         <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={isImporting}>
                    {isImporting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <RefreshCw className="ml-2 h-4 w-4" />}
                    إعادة تعيين واستيراد المقالات
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                    <AlertDialogDescription>
                        هذا الإجراء سيقوم بحذف **جميع** المقالات الحالية في مدونتك، ثم سيقوم باستيراد قائمة المقالات المقترحة من جديد. هل تريد المتابعة؟
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetAndImport} disabled={isImporting}>
                         {isImporting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                        نعم، قم بإعادة التعيين
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
