
'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Link as LinkIcon, ChevronsUpDown, Copy, RefreshCw } from 'lucide-react';
import type { BlogPost } from '@/lib/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { titleToSlug } from '@/lib/slugify';

interface PostDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    post?: Partial<BlogPost>;
    onSave: (data: Partial<Omit<BlogPost, 'id' | 'authorId' | 'publishDate'>>) => Promise<void>;
    isSaving: boolean;
    allPosts: BlogPost[]; 
}

export function PostDialog({ open, onOpenChange, post, onSave, isSaving, allPosts }: PostDialogProps) {
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [content, setContent] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imageHint, setImageHint] = useState('');
    const { toast } = useToast();
    
    useEffect(() => {
        if (open) {
            setTitle(post?.title || '');
            setSlug(post?.slug || '');
            setContent(post?.content || '');
            setDescription(post?.description || '');
            setImageUrl(post?.imageUrl || '');
            setImageHint(post?.imageHint || '');
        }
    }, [open, post]);

    const handleCopyLink = (postToLink: BlogPost) => {
        const markdownLink = `[${postToLink.title}](/blog/${postToLink.slug})`;
        navigator.clipboard.writeText(markdownLink);
        toast({
            title: 'تم نسخ الرابط',
            description: `تم نسخ رابط Markdown للمقال "${postToLink.title}".`,
        });
    };
    
    const generateSlugFromTitle = () => {
        if (title) {
            setSlug(titleToSlug(title));
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let finalSlug = slug.trim();
        if (!finalSlug) {
            finalSlug = titleToSlug(title);
        }
        await onSave({ title, slug: finalSlug, content, description, imageUrl, imageHint });
    };

    const availablePostsForLinking = allPosts.filter(p => p.id !== post?.id);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl grid-cols-1 md:grid-cols-2">
                <div className="md:col-span-1">
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
                            <Label htmlFor="slug">الرابط الثابت (Slug)</Label>
                            <div className="flex gap-2">
                                <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="يتم إنشاؤه تلقائيا من العنوان" />
                                <Button type="button" variant="ghost" size="icon" onClick={generateSlugFromTitle}><RefreshCw className="h-4 w-4" /></Button>
                            </div>
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
                </div>
                <div className="hidden md:block border-r pr-4 rtl:border-r-0 rtl:border-l rtl:pr-0 rtl:pl-4">
                     <Collapsible defaultOpen={true}>
                        <CollapsibleTrigger className="w-full">
                            <div className="flex justify-between items-center py-2">
                                <h4 className="font-semibold flex items-center gap-2"><LinkIcon className="h-4 w-4"/>أداة الربط الداخلي</h4>
                                <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <p className="text-xs text-muted-foreground mb-2">انسخ الروابط وألصقها في محتوى مقالك لبناء روابط خلفية داخلية (Backlinks).</p>
                             <ScrollArea className="h-[60vh] border rounded-md p-2">
                                <div className="space-y-2">
                                    {availablePostsForLinking.length > 0 ? availablePostsForLinking.map(p => (
                                        <div key={p.id} className="flex justify-between items-center gap-2 p-2 rounded-md hover:bg-muted">
                                            <span className="text-sm truncate flex-1">{p.title}</span>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopyLink(p)}>
                                                <Copy className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-center text-muted-foreground p-4">لا توجد مقالات أخرى لربطها.</p>
                                    )}
                                </div>
                             </ScrollArea>
                        </CollapsibleContent>
                    </Collapsible>
                </div>
            </DialogContent>
        </Dialog>
    );
}
