
'use client';

import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { CopyButton } from './copy-button';
import { recommendedAffiliatePosts } from './recommended-affiliate-posts';

export function AiPostGenerator({ referralLink }: { referralLink: string }) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPost, setGeneratedPost] = useState('');
    const { toast } = useToast();

    const getSimulatedPost = () => {
        const randomPostTemplate = recommendedAffiliatePosts[Math.floor(Math.random() * recommendedAffiliatePosts.length)];
        return randomPostTemplate.replace('{{referralLink}}', referralLink);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        setIsGenerating(true);
        setGeneratedPost('');
        toast({ title: 'جاري توليد منشور جديد...' });

        // Simulate a short delay to mimic AI generation
        setTimeout(() => {
            const post = getSimulatedPost();
            setGeneratedPost(post);
            setIsGenerating(false);
        }, 500);
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
