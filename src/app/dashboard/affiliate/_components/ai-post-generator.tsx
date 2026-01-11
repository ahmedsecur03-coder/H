'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from './copy-button';
import { Wand2 } from 'lucide-react';
import { recommendedAffiliatePosts } from './recommended-affiliate-posts';
import { Label } from '@/components/ui/label';

export function AiPostGenerator({ referralLink }: { referralLink: string }) {
    const [generatedPost, setGeneratedPost] = useState('');

    const handleGeneratePost = () => {
        const randomPostData = recommendedAffiliatePosts[Math.floor(Math.random() * recommendedAffiliatePosts.length)];
        const postWithLink = randomPostData.text.replace('{{referralLink}}', referralLink);
        setGeneratedPost(postWithLink);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                    <Wand2 className="text-primary h-6 w-6" />
                    مولّد المنشورات التسويقية
                </CardTitle>
                <CardDescription>
                    بضغطة زر، احصل على منشور تسويقي احترافي جاهز للنسخ للترويج لرابط الإحالة الخاص بك.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Button onClick={handleGeneratePost} className="w-full text-base py-6">
                    <Wand2 className="ml-2 h-5 w-5" />
                    ولّد لي منشورًا جديدًا
                </Button>
                {generatedPost && (
                    <div className="space-y-2 pt-4 border-t">
                        <Label className="text-base">المنشور المقترح:</Label>
                        <div className="relative">
                            <Textarea
                                readOnly
                                value={generatedPost}
                                className="min-h-[150px] resize-none"
                            />
                            <div className="absolute top-2 left-2 rtl:left-auto rtl:right-2">
                                <CopyButton textToCopy={generatedPost} />
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
