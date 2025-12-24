
'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, doc, addDoc, updateDoc, deleteDoc, getDocs, orderBy, serverTimestamp } from 'firebase/firestore';
import type { BlogPost } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil, Trash2, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PostDialog } from './_components/post-dialog';
import { AiPostDialog } from './_components/ai-post-dialog';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { useTranslation } from 'react-i18next';

export default function AdminBlogPage() {
    const { t, i18n } = useTranslation();
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<Partial<BlogPost> | undefined>(undefined);
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPosts = async () => {
        if (!firestore) return;
        setIsLoading(true);
        try {
            const postsQuery = query(collection(firestore, 'blogPosts'), orderBy('publishDate', 'desc'));
            const querySnapshot = await getDocs(postsQuery);
            const fetchedPosts: BlogPost[] = [];
            querySnapshot.forEach(doc => {
                fetchedPosts.push({ id: doc.id, ...doc.data() } as BlogPost);
            });
            setPosts(fetchedPosts);
        } catch (error) {
            console.error("Error fetching blog posts:", error);
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب المنشورات.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [firestore]);

    const handleOpenPostDialog = (post?: Partial<BlogPost>) => {
        setSelectedPost(post);
        setIsPostDialogOpen(true);
    };

    const handleArticleGenerated = (article: { title: string; content: string }) => {
        const newPost: Partial<BlogPost> = {
            title: article.title,
            content: article.content,
        };
        handleOpenPostDialog(newPost);
    };


    const handleSavePost = (data: { title: string; content: string }) => {
        if (!firestore || !user) return;
        
        if (selectedPost && selectedPost.id) { // Editing
            const postDocRef = doc(firestore, 'blogPosts', selectedPost.id);
            updateDoc(postDocRef, data)
                .then(() => {
                    toast({ title: 'نجاح', description: 'تم تحديث المنشور بنجاح.' });
                    fetchPosts(); // Refresh data
                })
                .catch(serverError => {
                    const permissionError = new FirestorePermissionError({ path: postDocRef.path, operation: 'update', requestResourceData: data });
                    errorEmitter.emit('permission-error', permissionError);
                });
        } else { // Adding new post
            const newPostData = { ...data, authorId: user.uid, publishDate: new Date().toISOString() };
            const postsColRef = collection(firestore, 'blogPosts');
            addDoc(postsColRef, newPostData)
                .then(() => {
                    toast({ title: 'نجاح', description: 'تم نشر المنشور بنجاح.' });
                    fetchPosts(); // Refresh data
                })
                .catch(serverError => {
                    const permissionError = new FirestorePermissionError({ path: postsColRef.path, operation: 'create', requestResourceData: newPostData });
                    errorEmitter.emit('permission-error', permissionError);
                });
        }
    };


    const handleDeletePost = (id: string) => {
        if (!firestore) return;
        const postDocRef = doc(firestore, 'blogPosts', id);
        deleteDoc(postDocRef)
            .then(() => {
                toast({ title: 'نجاح', description: 'تم حذف المنشور بنجاح.' });
                fetchPosts(); // Refresh data
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
                    <TableCell colSpan={4}>
                         <div className="text-center py-10">
                            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 font-headline text-2xl">لا توجد منشورات بعد</h3>
                            <p className="mt-2 text-sm text-muted-foreground">ابدأ بكتابة أول منشور لإعلام المستخدمين بآخر الأخبار.</p>
                            <div className="mt-6 flex justify-center gap-2">
                                <AiPostDialog onArticleGenerated={handleArticleGenerated} />
                                <Button onClick={() => handleOpenPostDialog()}><PlusCircle className="ml-2 h-4 w-4" />إضافة منشور جديد</Button>
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            );
        }
        return posts.map(post => (
            <TableRow key={post.id}>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell>{post.publishDate ? new Date(post.publishDate).toLocaleDateString(i18n.language) : 'غير محدد'}</TableCell>
                <TableCell className="font-mono text-xs">{post.authorId}</TableCell>
                <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenPostDialog(post)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
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
                 <div className="flex gap-2">
                    <AiPostDialog onArticleGenerated={handleArticleGenerated} />
                    <Button onClick={() => handleOpenPostDialog()}><PlusCircle className="ml-2 h-4 w-4" />إضافة منشور جديد</Button>
                </div>
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
            <PostDialog 
                open={isPostDialogOpen}
                onOpenChange={setIsPostDialogOpen}
                post={selectedPost}
                onSave={handleSavePost}
            />
        </div>
    );
}
