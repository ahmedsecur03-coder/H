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
                <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                    <Wand2 className="text-primary h-6 w-6" />
                    مولّد المنشورات التسويقية
                </CardTitle>
                <CardDescription>
                    بضغطة زر، احصل على منشور تسويقي احترافي مع صورة جاهزة للنسخ والتحميل للترويج لرابط الإحالة الخاص بك.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Button onClick={handleGeneratePost} className="w-full text-base py-6">
                    <Wand2 className="ml-2 h-5 w-5" />
                    ولّد لي منشورًا جديدًا
                </Button>
                {generatedPost && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                        {generatedImage && (
                            <div className="space-y-2">
                                <Label className="text-base">الصورة المقترحة:</Label>
                                <div className="relative aspect-square">
                                    <Image 
                                        src={generatedImage.url} 
                                        alt={generatedImage.hint} 
                                        fill 
                                        className="rounded-lg object-cover border"
                                        data-ai-hint={generatedImage.hint}
                                    />
                                    <Button asChild size="icon" className="absolute bottom-2 left-2">
                                        <a href={generatedImage.url} download target="_blank" rel="noopener noreferrer">
                                            <Download className="h-4 w-4" />
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        )}
                        <div className="space-y-2 flex flex-col">
                             <Label className="text-base">المنشور المقترح:</Label>
                            <div className="relative flex-grow">
                                <Textarea
                                    readOnly
                                    value={generatedPost}
                                    className="min-h-[220px] h-full resize-none"
                                />
                                <div className="absolute top-2 left-2 rtl:left-auto rtl:right-2">
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
