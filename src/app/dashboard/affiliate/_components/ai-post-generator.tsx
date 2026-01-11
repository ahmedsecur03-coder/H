
'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from './copy-button';
import { Wand2 } from 'lucide-react';
import { recommendedAffiliatePosts } from './recommended-affiliate-posts';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AiPostGenerator({ referralLink }: { referralLink: string }) {
    const [generatedPost, setGeneratedPost] = useState('');

    const handleGeneratePost = () => {
        // This is a simplified, non-AI version as requested.
        // It picks a random post from the predefined list.
        const randomPostTemplate = recommendedAffiliatePosts[Math.floor(Math.random() * recommendedAffiliatePosts.length)];
        const postWithLink = randomPostTemplate.replace('{{referralLink}}', referralLink);
        setGeneratedPost(postWithLink);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Wand2 className="text-primary" />
                    مولّد المنشورات التسويقية
                </CardTitle>
                <CardDescription>
                    اضغط على الزر لتوليد منشور تسويقي جاهز للنسخ والنشر.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button onClick={handleGeneratePost} className="w-full">
                    <Wand2 className="ml-2 h-4 w-4" />
                    ولّد لي منشورًا
                </Button>
                {generatedPost && (
                    <div className="space-y-2 pt-4">
                        <Label>المنشور المقترح:</Label>
                         <div className="relative">
                            <Textarea
                                readOnly
                                value={generatedPost}
                                className="min-h-[120px] pr-12"
                            />
                             <div className="absolute top-2 right-2">
                                <CopyButton textToCopy={generatedPost} />
                             </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
