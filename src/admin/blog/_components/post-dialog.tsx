
'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import type { BlogPost } from '@/lib/types';

interface PostDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    post?: Partial<BlogPost>;
    onSave: (data: Partial<Omit<BlogPost, 'id' | 'authorId' | 'publishDate'>>) => Promise<void>;
    isSaving: boolean;
}

export function PostDialog({ open, onOpenChange, post, onSave, isSaving }: PostDialogProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imageHint, setImageHint] = useState('');
    
    useEffect(() => {
        if (open) {
            setTitle(post?.title || '');
            setContent(post?.content || '');
            setDescription(post?.description || '');
            setImageUrl(post?.imageUrl || '');
            setImageHint(post?.imageHint || '');
        }
    }, [open, post]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave({ title, content, description, imageUrl, imageHint });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle>{post?.id ? 'تعديل المنشور' : 'إضافة منشور جديد'}</DialogTitle>
                            <DialogDescription>
                                قم بملء تفاصيل المنشور هنا. سيتم عرضه في صفحة المدونة.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                    <div className="space-y-2">
                        <Label htmlFor="title">العنوان</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="description">الوصف (للسيو - 160 حرفًا)</Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={160} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="imageUrl">رابط الصورة الرئيسية</Label>
                            <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.png" />
                             <p className="text-xs text-muted-foreground">يمكنك استخدام رابط صورة خارجي أو معرف صورة من مكتبة الصور.</p>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="imageHint">كلمات دلالية للصورة (AI)</Label>
                            <Input id="imageHint" value={imageHint} onChange={(e) => setImageHint(e.target.value)} placeholder="مثال: seo analytics" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="content">المحتوى (Markdown)</Label>
                        <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} required rows={15} />
                    </div>
                    <DialogFooter className="sticky bottom-0 bg-background/80 backdrop-blur-sm pt-4">
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="animate-spin" /> : 'حفظ'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
