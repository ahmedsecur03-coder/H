'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Wand2, Stars } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateAvatar } from '@/ai/flows/generate-avatar-flow';
import Image from 'next/image';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GenerateAvatarDialogProps {
    onAvatarGenerated: (dataUri: string) => void;
    children: React.ReactNode;
}

export function GenerateAvatarDialog({ onAvatarGenerated, children }: GenerateAvatarDialogProps) {
    const [open, setOpen] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء إدخال وصف للصورة.' });
            return;
        }

        setIsGenerating(true);
        setGeneratedImage(null);
        toast({ title: 'جاري إنشاء الصورة الرمزية...', description: 'قد تستغرق هذه العملية بضع ثوانٍ.' });

        try {
            const result = await generateAvatar({ prompt });
            setGeneratedImage(result.dataUri);
        } catch (error: any) {
            console.error("AI Avatar Generation Error:", error);
            toast({ variant: 'destructive', title: 'فشل الإنشاء', description: error.message || 'حدث خطأ أثناء إنشاء الصورة.' });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleUseImage = () => {
        if(generatedImage) {
            onAvatarGenerated(generatedImage);
            handleClose();
        }
    }
    
    const handleClose = () => {
        setOpen(false);
        setPrompt('');
        setGeneratedImage(null);
        setIsGenerating(false);
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>إنشاء صورة رمزية بالذكاء الاصطناعي</DialogTitle>
                    <DialogDescription>
                        اكتب وصفًا للصورة التي تريدها، وسيقوم الذكاء الاصطناعي بإنشائها لك.
                    </DialogDescription>
                </DialogHeader>
                
                {generatedImage ? (
                    <div className="space-y-4 py-4 text-center">
                        <div className="relative aspect-square w-64 mx-auto rounded-lg overflow-hidden border">
                           <Image src={generatedImage} alt="Generated Avatar" layout="fill" objectFit="cover" />
                        </div>
                        <Alert>
                            <Stars className="h-4 w-4" />
                            <AlertDescription>
                                هل أعجبتك النتيجة؟ يمكنك استخدامها أو المحاولة مرة أخرى.
                            </AlertDescription>
                        </Alert>
                         <DialogFooter className="gap-2 sm:justify-center">
                             <Button onClick={handleUseImage}>
                                استخدام هذه الصورة
                             </Button>
                             <Button variant="outline" onClick={() => setGeneratedImage(null)}>
                                المحاولة مرة أخرى
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                     <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="prompt">الوصف</Label>
                            <Input 
                                id="prompt" 
                                value={prompt} 
                                onChange={(e) => setPrompt(e.target.value)} 
                                placeholder="مثال: رائد فضاء بخوذة زجاجية، مجرة في الخلفية"
                                required 
                                disabled={isGenerating}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isGenerating} className="w-full">
                                {isGenerating ? <Loader2 className="animate-spin ml-2" /> : <Wand2 className="ml-2" />}
                                {isGenerating ? 'جاري الإنشاء...' : 'إنشاء الصورة'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
