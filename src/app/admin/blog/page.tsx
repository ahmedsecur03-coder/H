
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { BlogPost } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil, Trash2, Loader2, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import React from 'react';

function PostDialog({ post, onSave, children }: { post?: BlogPost; onSave: (data: Omit<BlogPost, 'id' | 'authorId' | 'publishDate'>) => Promise<void>; children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState(post?.title || '');
    const [content, setContent] = useState(post?.content || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave({ title, content });
            setOpen(false);
        } finally {
            setIsSaving(false);
        }
    };

    React.useEffect(() => {
        if (open) {
            setTitle(post?.title || '');
            setContent(post?.content || '');
        }
    }, [open, post]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{post ? 'تعديل المنشور' : 'إضافة منشور جديد'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">العنوان</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="content">المحتوى</Label>
                        <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} required rows={10} />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="animate-spin" /> : 'حفظ'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function AdminBlogPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    const postsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'blogPosts')) : null, [firestore]);
    const { data: posts, isLoading } = useCollection<BlogPost>(postsQuery);

    const handleAddPost = async (data: { title: string; content: string }) => {
        if (!firestore || !user) return;
        
        const newPostData = {
            ...data,
            authorId: user.uid,
            publishDate: new Date().toISOString(),
        };

        const postsColRef = collection(firestore, 'blogPosts');
        addDoc(postsColRef, newPostData)
            .then(() => {
                toast({ title: 'نجاح', description: 'تم نشر المنشور بنجاح.' });
            })
            .catch(serverError => {
                const permissionError = new FirestorePermissionError({
                    path: postsColRef.path,
                    operation: 'create',
                    requestResourceData: newPostData
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    };

    const handleEditPost = async (id: string, data: { title: string; content: string }) => {
        if (!firestore) return;
        const postDocRef = doc(firestore, 'blogPosts', id);
        updateDoc(postDocRef, data)
            .then(() => {
                toast({ title: 'نجاح', description: 'تم تحديث المنشور بنجاح.' });
            })
            .catch(serverError => {
                 const permissionError = new FirestorePermissionError({
                    path: postDocRef.path,
                    operation: 'update',
                    requestResourceData: data
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    };

    const handleDeletePost = async (id: string) => {
        if (!firestore) return;
        const postDocRef = doc(firestore, 'blogPosts', id);
        deleteDoc(postDocRef)
            .then(() => {
                toast({ title: 'نجاح', description: 'تم حذف المنشور بنجاح.' });
            })
            .catch(serverError => {
                 const permissionError = new FirestorePermissionError({
                    path: postDocRef.path,
                    operation: 'delete',
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    };

    const renderContent = () => {
        if (isLoading) {
            return Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                    {Array.from({ length: 4 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                </TableRow>
            ));
        }
        if (!posts || posts.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 font-headline text-2xl">لا توجد منشورات بعد</h3>
                            <p className="mt-2 text-sm text-muted-foreground">ابدأ بكتابة أول منشور لإعلام المستخدمين بآخر الأخبار.</p>
                        </div>
                    </TableCell>
                </TableRow>
            );
        }
        return posts.map(post => (
            <TableRow key={post.id}>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell>{new Date(post.publishDate).toLocaleDateString('ar-EG')}</TableCell>
                <TableCell className="font-mono text-xs">{post.authorId}</TableCell>
                <TableCell className="text-right">
                    <PostDialog post={post} onSave={(data) => handleEditPost(post.id, data)}>
                        <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                    </PostDialog>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                <AlertDialogDescription>هذا الإجراء سيحذف المنشور نهائياً.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeletePost(post.id)}>متابعة</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </TableCell>
            </TableRow>
        ));
    };

    return (
        <div className="space-y-6 pb-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">إدارة المدونة</h1>
                    <p className="text-muted-foreground">إنشاء وتعديل وحذف منشورات الأخبار والإعلانات.</p>
                </div>
                <PostDialog onSave={handleAddPost}>
                    <Button><PlusCircle className="ml-2 h-4 w-4" />إضافة منشور جديد</Button>
                </PostDialog>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>جميع المنشورات</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>العنوان</TableHead>
                                <TableHead>تاريخ النشر</TableHead>
                                <TableHead>الكاتب</TableHead>
                                <TableHead className="text-right">إجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>{renderContent()}</TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
