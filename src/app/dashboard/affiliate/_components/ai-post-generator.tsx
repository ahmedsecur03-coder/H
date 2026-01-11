
'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from './copy-button';
import { Wand2, Download } from 'lucide-react';
import { recommendedAffiliatePosts } from './recommended-affiliate-posts';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function AiPostGenerator({ referralLink }: { referralLink: string }) {
    const [generatedPost, setGeneratedPost] = useState('');
    const [generatedImage, setGeneratedImage] = useState<{ url: string, hint: string } | null>(null);

    const handleGeneratePost = () => {
        // This is a simplified, non-AI version as requested.
        // It picks a random post from the predefined list.
        const randomPostData = recommendedAffiliatePosts[Math.floor(Math.random() * recommendedAffiliatePosts.length)];
        const postWithLink = randomPostData.text.replace('{{referralLink}}', referralLink);
        setGeneratedPost(postWithLink);

        const imagePlaceholder = PlaceHolderImages.find(img => img.id === randomPostData.imageId);
        if (imagePlaceholder) {
            setGeneratedImage({ url: imagePlaceholder.imageUrl, hint: imagePlaceholder.imageHint });
        } else {
            setGeneratedImage(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Wand2 className="text-primary" />
                    مولّد المنشورات التسويقية
                </CardTitle>
                <CardDescription>
                    اضغط على الزر لتوليد منشور تسويقي مع صورة جاهزة للنسخ والتحميل.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button onClick={handleGeneratePost} className="w-full">
                    <Wand2 className="ml-2 h-4 w-4" />
                    ولّد لي منشورًا مع صورة
                </Button>
                {generatedPost && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        {generatedImage && (
                            <div className="space-y-2">
                                <Label>الصورة المقترحة:</Label>
                                <div className="relative aspect-square">
                                    <Image 
                                        src={generatedImage.url} 
                                        alt={generatedImage.hint} 
                                        fill 
                                        className="rounded-lg object-cover"
                                        data-ai-hint={generatedImage.hint}
                                    />
                                    <Button asChild size="icon" className="absolute bottom-2 right-2">
                                        <a href={generatedImage.url} download target="_blank" rel="noopener noreferrer">
                                            <Download className="h-4 w-4" />
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>المنشور المقترح:</Label>
                            <div className="relative">
                                <Textarea
                                    readOnly
                                    value={generatedPost}
                                    className="min-h-[220px] pr-12"
                                />
                                <div className="absolute top-2 right-2">
                                    <CopyButton textToCopy={generatedPost} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
