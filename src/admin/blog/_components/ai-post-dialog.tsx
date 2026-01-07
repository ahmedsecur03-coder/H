
'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// Although the AI flow is not used, we keep the import to avoid breaking changes if it's re-enabled.
// import { generateBlogPost } from '@/ai/flows/generate-blog-post-flow';
import { isAiConfigured } from '@/ai/client';

interface AiPostDialogProps {
    children: React.ReactNode;
    onArticleGenerated: (article: { title: string; content: string }) => void;
}

export function AiPostDialog({ children, onArticleGenerated }: AiPostDialogProps) {
    const [open, setOpen] = useState(false);
    const [topic, setTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();

    // The entire AI generation feature is disabled as per user request.
    // Returning null will prevent this component from rendering.
    return null;

    /*
    // Kept for historical reference - this was the previous implementation.

    if (!isAiConfigured()) {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء إدخال موضوع للمقالة.' });
            return;
        }

        setIsGenerating(true);
        toast({ title: 'جاري توليد المقالة...', description: 'قد تستغرق العملية بضع لحظات.' });

        try {
            // const article = await generateBlogPost({ topic });
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate AI delay
            const article = {
                title: `مقالة عن: ${topic}`,
                content: `هذا هو المحتوى الذي تم إنشاؤه بواسطة الذكاء الاصطناعي حول موضوع "${topic}". يمكنك توسيع هذا المحتوى وتعديله حسب الحاجة.`
            };

            onArticleGenerated(article);
            setOpen(false); // Close this dialog
            setTopic(''); // Reset topic
        } catch (error: any) {
            console.error("AI Post Generation Error:", error);
            toast({ variant: 'destructive', title: 'فشل التوليد', description: error.message || 'حدث خطأ أثناء إنشاء المقالة.' });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wand2 className="text-primary"/>
                        توليد منشور بالذكاء الاصطناعي
                    </DialogTitle>
                    <DialogDescription>
                        أدخل موضوعًا أو فكرة، وسيقوم الذكاء الاصطناعي بكتابة مسودة أولية للمقالة.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="topic">موضوع المقالة</Label>
                        <Input 
                            id="topic" 
                            value={topic} 
                            onChange={(e) => setTopic(e.target.value)} 
                            placeholder="مثال: أهمية التسويق الرقمي للشركات الناشئة"
                            required 
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isGenerating}>
                            {isGenerating ? <Loader2 className="animate-spin" /> : 'توليد المقالة'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
    */
}
