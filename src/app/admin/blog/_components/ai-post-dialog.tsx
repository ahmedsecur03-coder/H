'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateSeoArticle, SeoArticleOutputSchema } from '@/ai/flows/seo-article-flow';
import type { z } from 'zod';

type SeoArticleOutput = z.infer<typeof SeoArticleOutputSchema>;

interface AiPostDialogProps {
    onArticleGenerated: (article: SeoArticleOutput) => void;
}

export function AiPostDialog({ onArticleGenerated }: AiPostDialogProps) {
    const [open, setOpen] = useState(false);
    const [topic, setTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى إدخال فكرة للموضوع.' });
            return;
        }

        setIsGenerating(true);
        toast({ title: 'جاري التوليد...', description: 'يقوم الذكاء الاصطناعي بكتابة المقال. قد يستغرق الأمر لحظات.' });

        try {
            const result = await generateSeoArticle({ topicSuggestion: topic });
            onArticleGenerated(result);
            setOpen(false); // Close this dialog to open the other one
            setTopic('');
        } catch (error: any) {
            console.error("AI Article Generation Error:", error);
            toast({ variant: 'destructive', title: 'فشل التوليد', description: error.message || 'حدث خطأ أثناء إنشاء المقال.' });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Sparkles className="ml-2 h-4 w-4" />
                    توليد مقال بالذكاء الاصطناعي
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>توليد مقال جديد بالذكاء الاصطناعي</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleGenerate} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="topic">فكرة الموضوع</Label>
                        <Input
                            id="topic"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="مثال: استراتيجيات النمو على تيك توك"
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isGenerating}>
                            {isGenerating ? <Loader2 className="animate-spin" /> : 'توليد المقال'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
