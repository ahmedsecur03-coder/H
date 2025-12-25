
'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, RotateCw, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateAvatar } from '@/ai/flows/generate-avatar-flow';
import Image from 'next/image';

interface GenerateAvatarDialogProps {
    children: React.ReactNode;
    onAvatarGenerated: (dataUri: string) => void;
}

export function GenerateAvatarDialog({ children, onAvatarGenerated }: GenerateAvatarDialogProps) {
    const [open, setOpen] = useState(false);
    const [prompt, setPrompt] = useState('An astronaut in a futuristic suit, cosmic background, vibrant colors');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'الرجاء إدخال وصف للصورة.' });
            return;
        }

        setIsGenerating(true);
        setGeneratedImage(null);
        toast({ title: 'جاري توليد الصورة الرمزية...' });

        try {
            const result = await generateAvatar({ prompt });
            if (result.imageDataUri) {
                setGeneratedImage(result.imageDataUri);
            } else {
                throw new Error('لم يتم إرجاع أي صورة.');
            }
        } catch (error: any) {
            console.error("AI Avatar Generation Error:", error);
            toast({ variant: 'destructive', title: 'فشل توليد الصورة', description: error.message || 'An unknown error occurred.' });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleUseImage = () => {
        if (generatedImage) {
            onAvatarGenerated(generatedImage);
            setOpen(false);
            setGeneratedImage(null);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>توليد صورة رمزية بالذكاء الاصطناعي</DialogTitle>
                    <DialogDescription>
                        صف الصورة الرمزية التي تريدها، وسيقوم الذكاء الاصطناعي بإنشائها لك.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <div className="relative aspect-square w-full rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                        {isGenerating && <Loader2 className="h-10 w-10 animate-spin text-primary" />}
                        {generatedImage && !isGenerating && (
                            <Image src={generatedImage} alt="Generated Avatar" layout="fill" objectFit="cover" />
                        )}
                        {!generatedImage && !isGenerating && (
                             <div className="text-center text-muted-foreground p-4">
                                <Palette className="h-10 w-10 mx-auto" />
                                <p className="mt-2 text-sm">ستظهر الصورة المولدة هنا.</p>
                             </div>
                        )}
                    </div>

                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="prompt">وصف الصورة</Label>
                        <Input 
                            id="prompt" 
                            value={prompt} 
                            onChange={(e) => setPrompt(e.target.value)} 
                            placeholder="مثال: رائد فضاء في حلة مستقبلية..."
                            required 
                            disabled={isGenerating}
                        />
                    </div>
                     <DialogFooter className="gap-2 sm:justify-between">
                       {generatedImage ? (
                            <>
                                 <Button type="submit" variant="outline" disabled={isGenerating}>
                                    <RotateCw className="ml-2 h-4 w-4" />
                                     إعادة المحاولة
                                </Button>
                                <Button type="button" onClick={handleUseImage}>
                                    استخدام هذه الصورة
                                </Button>
                            </>
                       ) : (
                            <Button type="submit" disabled={isGenerating} className="w-full">
                                {isGenerating ? <Loader2 className="animate-spin" /> : 'توليد الصورة'}
                            </Button>
                       )}

                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
