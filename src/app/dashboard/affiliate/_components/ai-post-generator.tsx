
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, Sparkles, Copy, Check } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateAffiliatePost } from '@/ai/flows/generate-affiliate-post-flow';
import { isAiConfigured } from '@/ai/client';
import ReactMarkdown from 'react-markdown';

type Platform = 'Facebook' | 'Twitter' | 'Blog';

export function AiPostGenerator({ referralLink }: { referralLink: string }) {
    const { toast } = useToast();
    const [platform, setPlatform] = useState<Platform>('Facebook');
    const [generatedPost, setGeneratedPost] = useState<{ title: string; content: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    if (!isAiConfigured()) {
        return null; // Do not render if AI is not configured
    }

    const handleGenerate = async () => {
        setIsLoading(true);
        setGeneratedPost(null);
        toast({ title: 'جاري إنشاء المحتوى التسويقي...', description: 'قد تستغرق العملية بضع لحظات.' });
        try {
            const result = await generateAffiliatePost({ referralLink, platform });
            setGeneratedPost(result);
        } catch (error: any) {
            console.error("AI Post Generation Error:", error);
            toast({ variant: 'destructive', title: 'فشل التوليد', description: error.message || 'حدث خطأ أثناء إنشاء المنشور.' });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = () => {
        if (!generatedPost) return;
        const textToCopy = `${generatedPost.title}\n\n${generatedPost.content}`;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        toast({ title: 'تم نسخ محتوى المنشور!' });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="glassmorphism-card border-primary/20">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-full">
                        <Wand2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="font-headline text-xl">مساعد التسويق الذكي</CardTitle>
                        <CardDescription>
                            دع الذكاء الاصطناعي يكتب لك منشورات تسويقية جذابة لاستخدامها في الترويج لرابط الإحالة الخاص بك.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                        <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر المنصة" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Facebook">منشور فيسبوك</SelectItem>
                                <SelectItem value="Twitter">تغريدة تويتر (X)</SelectItem>
                                <SelectItem value="Blog">مقالة مدونة قصيرة</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleGenerate} disabled={isLoading} className="w-full sm:col-span-1">
                        {isLoading ? <Loader2 className="animate-spin me-2" /> : <Sparkles className="me-2 h-4 w-4" />}
                        {isLoading ? 'جاري التوليد...' : 'أنشئ المحتوى'}
                    </Button>
                </div>

                {generatedPost && (
                    <div className="mt-4 p-4 border rounded-lg bg-background/50 relative">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleCopy}
                            className="absolute top-2 left-2 rtl:right-2 rtl:left-auto"
                        >
                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <article className="prose prose-sm dark:prose-invert max-w-none">
                            <h3 className="font-headline">{generatedPost.title}</h3>
                            <ReactMarkdown>{generatedPost.content}</ReactMarkdown>
                        </article>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

    