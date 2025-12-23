'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateBlogPost } from '@/ai/flows/generate-blog-post-flow';
import { isAiConfigured } from '@/ai/client';

interface AiPostDialogProps {
    onArticleGenerated: (article: { title: string; content: string }) => void;
}

export function AiPostDialog({ onArticleGenerated }: AiPostDialogProps) {
    const [open, setOpen] = useState(false);
    const [topic, setTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();

    if (!isAiConfigured()) {
        return null; // Don't render the button if AI is not configured
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
            const article = await generateBlogPost({ topic });
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
                <Button variant="outline"><Wand2 className="ml-2 h-4 w-4" />إنشاء بالذكاء الاصطناعي</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>توليد منشور بالذكاء الاصطناعي</DialogTitle>
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
}