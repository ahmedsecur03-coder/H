'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useFirestore } from '@/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, CheckCircle } from 'lucide-react';
import type { BlogPost } from '@/lib/types';
import { recommendedPosts } from './recommended-posts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { errorEmitter, FirestorePermissionError } from '@/firebase';

interface ImportPostsDialogProps {
    children: React.ReactNode;
    onImportComplete: () => void;
}


export function ImportPostsDialog({ children, onImportComplete }: ImportPostsDialogProps) {
    const [open, setOpen] = useState(false);
    const [existingTitles, setExistingTitles] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [importingPostId, setImportingPostId] = useState<string | null>(null);

    const firestore = useFirestore();
    const { toast } = useToast();

    const fetchExisting = useCallback(async () => {
        if (!firestore || !open) return;
        setIsLoading(true);
        try {
            const postsColRef = collection(firestore, 'blogPosts');
            const snapshot = await getDocs(postsColRef);
            const titles = new Set(snapshot.docs.map(doc => (doc.data() as BlogPost).title));
            setExistingTitles(titles);
        } catch (error) {
            console.error("Error fetching existing posts:", error);
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب قائمة المقالات الحالية.' });
        } finally {
            setIsLoading(false);
        }
    }, [firestore, open, toast]);

    useEffect(() => {
        fetchExisting();
    }, [fetchExisting]);
    

    const handleImportPost = async (post: Omit<BlogPost, 'id' | 'authorId' | 'publishDate'>) => {
        if (!firestore) return;

        setImportingPostId(post.title);

        try {
            const postsColRef = collection(firestore, 'blogPosts');
            const newPost = {
                ...post,
                authorId: 'ai-generated',
                publishDate: new Date().toISOString(),
            };
            await addDoc(postsColRef, newPost);
            
            setExistingTitles(prev => new Set(prev).add(post.title));
            toast({ title: 'نجاح!', description: `تم استيراد مقال "${post.title}" بنجاح.` });
            onImportComplete();

        } catch (error) {
             const permissionError = new FirestorePermissionError({
                path: 'blogPosts',
                operation: 'create'
            });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setImportingPostId(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => {setOpen(o); if(o) fetchExisting(); }}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>استيراد مقالات مقترحة</DialogTitle>
                    <DialogDescription>
                        اختر المقالات التي تريد إضافتها إلى مدونتك. سيتم تجاهل المقالات الموجودة بالفعل.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] p-1">
                    <div className="space-y-2 py-4">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-32">
                                <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
                            </div>
                        ) : recommendedPosts.map((post) => {
                            const isImported = existingTitles.has(post.title);
                            const isThisOneImporting = importingPostId === post.title;
                            return (
                                <div key={post.title} className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                                    <span className="font-medium">{post.title}</span>
                                    <Button
                                        size="sm"
                                        onClick={() => handleImportPost(post)}
                                        disabled={isImported || !!importingPostId}
                                    >
                                        {isThisOneImporting ? (
                                             <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : isImported ? (
                                            <>
                                                <CheckCircle className="ml-2 h-4 w-4" />
                                                تم الاستيراد
                                            </>
                                        ) : (
                                             'استيراد'
                                        )}
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
