
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from './copy-button';
import { Wand2, Download } from 'lucide-react';
import { recommendedAffiliatePosts } from './recommended-affiliate-posts';
import { Label } from '@/components/ui/label';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';

export function AiPostGenerator({ referralLink }: { referralLink: string }) {
    const [generatedPost, setGeneratedPost] = useState('');
    const [generatedImageId, setGeneratedImageId] = useState('');

    const handleGeneratePost = () => {
        const randomIndex = Math.floor(Math.random() * recommendedAffiliatePosts.length);
        const randomPostData = recommendedAffiliatePosts[randomIndex];
        const postWithLink = randomPostData.text.replace('{{referralLink}}', referralLink);
        setGeneratedPost(postWithLink);
        setGeneratedImageId(randomPostData.imageId);
    };

    const selectedImage = useMemo(() => {
        if (!generatedImageId) return null;
        return PlaceHolderImages.find(img => img.id === generatedImageId);
    }, [generatedImageId]);

    const handleDownloadImage = () => {
        if (!selectedImage) return;
        // Using a proxy to bypass CORS issues when downloading from a different origin
        fetch('/api/image-proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: selectedImage.imageUrl })
        })
        .then(res => res.json())
        .then(({ dataUri, error }) => {
            if (error) {
                console.error("Failed to download image:", error);
                return;
            }
            const link = document.createElement('a');
            link.href = dataUri;
            link.download = `${selectedImage.imageHint.replace(' ', '-')}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                    <Wand2 className="text-primary h-6 w-6" />
                    مولّد المنشورات التسويقية
                </CardTitle>
                <CardDescription>
                    بضغطة زر، احصل على منشور تسويقي احترافي مع صورة جاهزة للنسخ والنشر للترويج لرابط الإحالة الخاص بك.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Button onClick={handleGeneratePost} className="w-full text-base py-6">
                    <Wand2 className="ml-2 h-5 w-5" />
                    ولّد لي منشورًا جديدًا
                </Button>
                
                {generatedPost && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                        {/* Image Column */}
                        <div className="space-y-2">
                             <Label className="text-base">الصورة المقترحة:</Label>
                             {selectedImage && (
                                <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                                    <Image
                                        src={selectedImage.imageUrl}
                                        alt={selectedImage.description}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                    />
                                </div>
                             )}
                              <Button variant="outline" onClick={handleDownloadImage} className="w-full">
                                <Download className="ml-2 h-4 w-4" />
                                تحميل الصورة
                            </Button>
                        </div>
                        {/* Text Column */}
                        <div className="space-y-2">
                             <Label className="text-base">المنشور المقترح:</Label>
                            <div className="relative">
                                <Textarea
                                    readOnly
                                    value={generatedPost}
                                    className="min-h-[200px] resize-none"
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
