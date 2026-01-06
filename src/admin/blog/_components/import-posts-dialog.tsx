
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useFirestore } from '@/firebase';
import { collection, addDoc, getDocs, where, query, deleteDoc, getDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, CheckCircle, Trash2 } from 'lucide-react';
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
    const [existingPosts, setExistingPosts] = useState<Map<string, string[]>>(new Map()); // Map title to array of doc IDs
    const [isLoading, setIsLoading] = useState(false);
    const [actionPostId, setActionPostId] = useState<string | null>(null);

    const firestore = useFirestore();
    const { toast } = useToast();

    const fetchExisting = useCallback(async () => {
        if (!firestore) return;
        setIsLoading(true);
        try {
            const postsColRef = collection(firestore, 'blogPosts');
            const snapshot = await getDocs(postsColRef);
            const postsMap = new Map<string, string[]>();
            snapshot.docs.forEach(doc => {
                const post = doc.data() as BlogPost;
                const existing = postsMap.get(post.title) || [];
                postsMap.set(post.title, [...existing, doc.id]);
            });
            setExistingPosts(postsMap);
        } catch (error) {
            console.error("Error fetching existing posts:", error);
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب قائمة المقالات الحالية.' });
        } finally {
            setIsLoading(false);
        }
    }, [firestore, toast]);

    useEffect(() => {
        if (open) {
            fetchExisting();
        }
    }, [open, fetchExisting]);
    

    const handleImportPost = async (post: Omit<BlogPost, 'id' | 'authorId' | 'publishDate'>) => {
        if (!firestore) return;

        setActionPostId(post.title);

        try {
            const postsColRef = collection(firestore, 'blogPosts');
            const newPost = {
                ...post,
                authorId: 'ai-generated',
                publishDate: new Date().toISOString(),
            };
            const docRef = await addDoc(postsColRef, newPost);
            
            setExistingPosts(prev => {
                const newMap = new Map(prev);
                const existing = newMap.get(post.title) || [];
                newMap.set(post.title, [...existing, docRef.id]);
                return newMap;
            });

            toast({ title: 'نجاح!', description: `تم استيراد مقال "${post.title}" بنجاح.` });
            onImportComplete();

        } catch (error) {
             const permissionError = new FirestorePermissionError({
                path: 'blogPosts',
                operation: 'create'
            });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setActionPostId(null);
        }
    };
    
    const handleDeletePost = async (postId: string, title: string) => {
        if (!firestore) return;
        setActionPostId(postId);
        try {
            await deleteDoc(doc(firestore, 'blogPosts', postId));
            setExistingPosts(prev => {
                 const newMap = new Map(prev);
                 const ids = newMap.get(title)?.filter(id => id !== postId);
                 if (ids && ids.length > 0) {
                     newMap.set(title, ids);
                 } else {
                     newMap.delete(title);
                 }
                 return newMap;
            });
            toast({ title: 'تم الحذف', description: 'تم حذف المقال المكرر.' });
            onImportComplete();
        } catch (error) {
            const permissionError = new FirestorePermissionError({ path: `blogPosts/${postId}`, operation: 'delete' });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setActionPostId(null);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>مكتبة المقالات المقترحة</DialogTitle>
                    <DialogDescription>
                        أضف مقالات جاهزة لمدونتك أو قم بتنظيف المقالات المكررة.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] p-1">
                    <div className="space-y-2 py-4">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-32">
                                <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
                            </div>
                        ) : recommendedPosts.map((post) => {
                            const existingIds = existingPosts.get(post.title) || [];
                            const isImported = existingIds.length > 0;
                            const isActionInProgress = actionPostId === post.title || existingIds.includes(actionPostId || '');

                            return (
                                <div key={post.title} className="p-3 rounded-md border bg-muted/30">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{post.title}</span>
                                        <Button
                                            size="sm"
                                            onClick={() => handleImportPost(post)}
                                            disabled={isImported || !!actionPostId}
                                        >
                                            {actionPostId === post.title ? (
                                                 <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : isImported ? (
                                                <>
                                                    <CheckCircle className="ml-2 h-4 w-4" />
                                                    موجود بالفعل
                                                </>
                                            ) : (
                                                 'استيراد'
                                            )}
                                        </Button>
                                    </div>
                                    {existingIds.length > 1 && (
                                        <div className="mt-2 space-y-1 ps-4 border-s-2 border-destructive">
                                            <p className="text-xs text-destructive font-semibold">توجد نسخ مكررة من هذا المقال:</p>
                                            {existingIds.map(id => (
                                                <div key={id} className="flex items-center justify-between text-xs">
                                                     <span className="font-mono text-muted-foreground">{id}</span>
                                                     <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeletePost(id, post.title)} disabled={!!actionPostId}>
                                                         {actionPostId === id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4"/>}
                                                     </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
