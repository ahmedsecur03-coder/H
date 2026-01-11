
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { generateBlogPost } from '@/ai/flows/generate-blog-post-flow';
import { generateAffiliatePost } from '@/ai/flows/generate-affiliate-post-flow';
import { isAiConfigured } from '@/ai/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ReactMarkdown from 'react-markdown';

export default function AiPlaygroundPage() {
    const { toast } = useToast();

    // State for Blog Post Generator
    const [blogTopic, setBlogTopic] = useState('');
    const [isGeneratingBlog, setIsGeneratingBlog] = useState(false);
    const [blogResult, setBlogResult] = useState<{ title: string; content: string } | null>(null);

    // State for Affiliate Post Generator
    const [affiliateTopic, setAffiliateTopic] = useState('');
    const [isGeneratingAffiliate, setIsGeneratingAffiliate] = useState(false);
    const [affiliateResult, setAffiliateResult] = useState<string | null>(null);

    if (!isAiConfigured()) {
        return (
             <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2"><Wand2 className="h-8 w-8"/> AI Playground</h1>
                    <p className="text-muted-foreground">اختبار وتجربة نماذج الذكاء الاصطناعي.</p>
                </div>
                <Alert variant="destructive">
                    <Sparkles className="h-4 w-4" />
                    <AlertTitle>خدمات الذكاء الاصطناعي غير مفعّلة</AlertTitle>
                    <AlertDescription>
                        يرجى التأكد من إضافة مفتاح Gemini API في متغيرات البيئة (environment variables) لتفعيل هذه الميزات.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    const handleGenerateBlog = async () => {
        if (!blogTopic.trim()) {
            toast({ variant: 'destructive', title: 'الرجاء إدخال موضوع للمقالة.' });
            return;
        }
        setIsGeneratingBlog(true);
        setBlogResult(null);
        toast({ title: 'جاري توليد المقالة...' });
        try {
            const result = await generateBlogPost({ topic: blogTopic });
            setBlogResult(result);
            toast({ title: 'نجاح', description: 'تم توليد المقالة بنجاح.' });
        } catch (error: any) {
            console.error("Blog Generation Error:", error);
            toast({ variant: 'destructive', title: 'فشل التوليد', description: error.message });
        } finally {
            setIsGeneratingBlog(false);
        }
    };

    const handleGenerateAffiliate = async () => {
        if (!affiliateTopic.trim()) {
            toast({ variant: 'destructive', title: 'الرجاء إدخال موضوع للمنشور.' });
            return;
        }
        setIsGeneratingAffiliate(true);
        setAffiliateResult(null);
        toast({ title: 'جاري توليد المنشور...' });
        try {
            const result = await generateAffiliatePost({ topic: affiliateTopic, referralLink: '{{referralLink}}' });
            setAffiliateResult(result.postContent);
            toast({ title: 'نجاح', description: 'تم توليد المنشور بنجاح.' });
        } catch (error: any) {
            console.error("Affiliate Post Generation Error:", error);
            toast({ variant: 'destructive', title: 'فشل التوليد', description: error.message });
        } finally {
            setIsGeneratingAffiliate(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2"><Wand2 className="h-8 w-8"/> AI Playground</h1>
                <p className="text-muted-foreground">اختبار وتجربة نماذج الذكاء الاصطناعي.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Blog Post Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>مولّد مقالات المدونة</CardTitle>
                        <CardDescription>اختبار تدفق `generateBlogPost`.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="blog-topic">موضوع المقالة</Label>
                            <Input id="blog-topic" value={blogTopic} onChange={(e) => setBlogTopic(e.target.value)} placeholder="مثال: كيف تزيد أرباحك من التسويق بالعمولة؟" />
                        </div>
                        <Button onClick={handleGenerateBlog} disabled={isGeneratingBlog} className="w-full">
                            {isGeneratingBlog ? <Loader2 className="animate-spin me-2" /> : <Sparkles className="me-2 h-4 w-4" />}
                            توليد مقالة
                        </Button>
                    </CardContent>
                    {blogResult && (
                        <CardFooter className="flex-col items-start gap-4 pt-4 border-t">
                            <h3 className="font-semibold text-lg">{blogResult.title}</h3>
                            <div className="prose dark:prose-invert max-w-none text-sm">
                                <ReactMarkdown>{blogResult.content}</ReactMarkdown>
                            </div>
                        </CardFooter>
                    )}
                </Card>

                {/* Affiliate Post Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>مولّد المنشورات التسويقية</CardTitle>
                        <CardDescription>اختبار تدفق `generateAffiliatePost`.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="affiliate-topic">موضوع المنشور</Label>
                            <Input id="affiliate-topic" value={affiliateTopic} onChange={(e) => setAffiliateTopic(e.target.value)} placeholder="مثال: أسرع خدمات SMM" />
                        </div>
                        <Button onClick={handleGenerateAffiliate} disabled={isGeneratingAffiliate} className="w-full">
                             {isGeneratingAffiliate ? <Loader2 className="animate-spin me-2" /> : <Sparkles className="me-2 h-4 w-4" />}
                            توليد منشور تسويقي
                        </Button>
                    </CardContent>
                    {affiliateResult && (
                         <CardFooter className="flex-col items-start gap-2 pt-4 border-t">
                            <Label>المنشور المُولَّد:</Label>
                            <Textarea value={affiliateResult} readOnly rows={6} />
                        </CardFooter>
                    )}
                </Card>
            </div>
        </div>
    );
}
