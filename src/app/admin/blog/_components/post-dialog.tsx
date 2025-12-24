
'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import type { BlogPost } from '@/lib/types';

interface PostDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    post?: Partial<BlogPost>; // Changed to Partial<BlogPost>
    onSave: (data: { title: string; content: string }) => void;
}

export function PostDialog({ open, onOpenChange, post, onSave }: PostDialogProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setTitle(post?.title || '');
            setContent(post?.content || '');
        }
    }, [open, post]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        onSave({ title, content });
        // The parent component is responsible for closing the dialog
        // and handling the async logic.
        setIsSaving(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{post?.id ? 'تعديل المنشور' : 'إضافة منشور جديد'}</DialogTitle>
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
