'use client';

import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles } from 'lucide-react';
import { isAiConfigured } from '@/ai/client';
import { generateAffiliatePost } from '@/ai/flows/generate-affiliate-post-flow';
import { AnimatePresence, motion } from 'framer-motion';
import { CopyButton } from './copy-button';

// Expanded and more diverse promotional topics
const PROMOTIONAL_TOPICS = [
    "أسرع خدمات SMM في السوق",
    "طريقة مضمونة لزيادة متابعين انستغرام",
    "كيف تصبح مشهوراً على تيك توك",
    "أفضل أسعار لخدمات التسويق الرقمي",
    "اجعل حسابك ينمو بسرعة الصاروخ",
    "الوصول إلى آلاف المشاهدات بسهولة",
    "لماذا تعتبر خدماتنا الأفضل لنموك؟",
    "حقق أهدافك على السوشيال ميديا اليوم",
    "سر الحصول على العلامة الزرقاء",
    "كيفية إدارة حملات إعلانية ناجحة على جوجل",
    "أسرار التسويق بالعمولة الناجح",
    "شحن عملات تيك توك بأفضل الأسعار",
    "استراتيجيات مضمونة لزيادة متابعين فيسبوك",
    "احصل على حسابات إعلانية وكالة بدون قيود",
    "تحليل أداء حملاتك الإعلانية كالمحترفين",
];

export function AiPostGenerator({ referralLink }: { referralLink: string }) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPost, setGeneratedPost] = useState('');
    const { toast } = useToast();

    if (!isAiConfigured()) {
        return null; 
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
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
