
'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, writeBatch, doc, getDocs, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, AlertTriangle } from 'lucide-react';
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

    const handleImport = async () => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'Firestore is not available.' });
            return;
        }

        setIsImporting(true);
        toast({ title: 'جاري التحقق من المقالات الحالية...' });

        try {
            const postsColRef = collection(firestore, 'blogPosts');
            const snapshot = await getDocs(postsColRef);
            const existingTitles = new Set(snapshot.docs.map(doc => doc.data().title));
            
            const postsToImport = recommendedPosts.filter(post => !existingTitles.has(post.title));

            if (postsToImport.length === 0) {
                 toast({ title: 'لا توجد مقالات جديدة', description: 'جميع المقالات المقترحة موجودة بالفعل في مدونتك.' });
                 setIsImporting(false);
                 return;
            }

            toast({ title: 'جاري استيراد المقالات الجديدة...', description: `سيتم إضافة ${postsToImport.length} مقالات إلى مدونتك.` });

            const batch = writeBatch(firestore);
            
            postsToImport.forEach(post => {
                const postDocRef = doc(postsColRef);
                const newPost: Omit<BlogPost, 'id'> = {
                    ...post,
                    authorId: 'system-generated', // Changed authorId for clarity
                    publishDate: new Date().toISOString(),
                };
                batch.set(postDocRef, newPost);
            });
            
            await batch.commit();

            toast({ title: 'نجاح!', description: `تم استيراد ${postsToImport.length} مقالات بنجاح.` });
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
         <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline">
                     <Upload className="ml-2 h-4 w-4" />
                    استيراد المقالات المقترحة
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="text-destructive"/>
                        تأكيد عملية الاستيراد
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        أنت على وشك استيراد جميع المقالات المقترحة غير الموجودة حالياً في مدونتك دفعة واحدة. هل تريد المتابعة؟
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                     <AlertDialogAction onClick={handleImport} disabled={isImporting}>
                        {isImporting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                        نعم، قم بالاستيراد
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
