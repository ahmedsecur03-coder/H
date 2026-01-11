
'use client';

import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, Copy, Check } from 'lucide-react';
import { isAiConfigured } from '@/ai/client';
import { generateAffiliatePost } from '@/ai/flows/generate-affiliate-post-flow';
import { AnimatePresence, motion } from 'framer-motion';

// Predefined topics for random generation
const PROMOTIONAL_TOPICS = [
    "أسرع خدمات SMM في السوق",
    "طريقة مضمونة لزيادة متابعين انستغرام",
    "كيف تصبح مشهوراً على تيك توك",
    "أفضل أسعار لخدمات التسويق الرقمي",
    "اجعل حسابك ينمو بسرعة الصاروخ",
    "الوصول إلى آلاف المشاهدات بسهولة",
    "لماذا تعتبر خدماتنا الأفضل لنموك؟",
    "حقق أهدافك على السوشيال ميديا اليوم",
];

export function AiPostGenerator({ referralLink }: { referralLink: string }) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPost, setGeneratedPost] = useState('');
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    if (!isAiConfigured()) {
        return null; // Don't render if AI is not configured
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Select a random topic
        const randomTopic = PROMOTIONAL_TOPICS[Math.floor(Math.random() * PROMOTIONAL_TOPICS.length)];

        setIsGenerating(true);
        setGeneratedPost('');
        toast({ title: 'جاري توليد منشور جديد...', description: `باستخدام فكرة: "${randomTopic}"` });

        try {
            const result = await generateAffiliatePost({ topic: randomTopic, referralLink });
            setGeneratedPost(result.postContent);
        } catch (error: any) {
            console.error("AI Post Generation Error:", error);
            toast({ variant: 'destructive', title: 'فشل التوليد', description: error.message || 'حدث خطأ أثناء إنشاء المنشور.' });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleCopy = () => {
        if (!generatedPost) return;
        navigator.clipboard.writeText(generatedPost);
        setCopied(true);
        toast({ title: 'تم نسخ المنشور!' });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleSubmit}>
                <Button type="submit" disabled={isGenerating} className="w-full">
                    {isGenerating ? <Loader2 className="animate-spin me-2" /> : <Sparkles className="me-2 h-4 w-4" />}
                    توليد منشور تسويقي جديد
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
                                className="pr-12"
                            />
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleCopy}
                                className="absolute top-2 left-2 rtl:right-2 rtl:left-auto"
                            >
                                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
