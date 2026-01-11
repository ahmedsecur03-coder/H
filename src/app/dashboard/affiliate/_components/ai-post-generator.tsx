'use client';

import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { CopyButton } from './copy-button';
import { generateAffiliatePost } from '@/ai/flows/generate-affiliate-post-flow';
import { Input } from '@/components/ui/input';
import { isAiConfigured } from '@/ai/client';

export function AiPostGenerator({ referralLink }: { referralLink: string }) {
    const [topic, setTopic] = useState('أسرع خدمات SMM في العالم');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPost, setGeneratedPost] = useState('');
    const { toast } = useToast();

    if (!isAiConfigured()) {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!topic.trim()) {
            toast({ variant: 'destructive', title: 'الرجاء إدخال موضوع للمنشور.' });
            return;
        }

        setIsGenerating(true);
        setGeneratedPost('');
        toast({ title: 'جاري توليد منشور تسويقي...' });

        try {
            const result = await generateAffiliatePost({ topic, referralLink });
            setGeneratedPost(result.postContent);
        } catch (error: any) {
            console.error("AI Post Generation Error:", error);
            toast({ variant: 'destructive', title: 'فشل التوليد', description: error.message || 'حدث خطأ أثناء إنشاء المنشور.' });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="post-topic">موضوع المنشور</Label>
                    <Input 
                        id="post-topic"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="مثال: أفضل الأسعار لزيادة المتابعين"
                        disabled={isGenerating}
                    />
                </div>
                <Button type="submit" disabled={isGenerating} className="w-full">
                    {isGenerating ? <Loader2 className="animate-spin me-2" /> : <Sparkles className="me-2 h-4 w-4" />}
                    توليد منشور تسويقي بالـ AI
                </Button>
            </form>

            <AnimatePresence>
                {generatedPost && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                    >
                        <Label htmlFor="generated-post">المنشور المقترح</Label>
                        <div className="relative">
                            <Textarea
                                id="generated-post"
                                value={generatedPost}
                                readOnly
                                rows={6}
                                className="pe-12"
                            />
                            <div className="absolute top-2 left-2 rtl:right-2 rtl:left-auto">
                                <CopyButton textToCopy={generatedPost} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
