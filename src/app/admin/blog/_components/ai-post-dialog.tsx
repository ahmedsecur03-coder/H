'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateBlogPost } from '@/ai/flows/generate-blog-post-flow';

interface AiPostDialogProps {
  children: React.ReactNode;
  onArticleGenerated: (article: { title: string; content: string }) => void;
}

export function AiPostDialog({ children, onArticleGenerated }: AiPostDialogProps) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        variant: 'destructive',
        title: 'موضوع فارغ',
        description: 'الرجاء إدخال موضوع أو فكرة للمقال.',
      });
      return;
    }
    setIsGenerating(true);
    toast({ title: 'جاري توليد المقال...', description: 'قد يستغرق الأمر لحظات.' });

    try {
      const result = await generateBlogPost(topic);
      if (result && result.title && result.content) {
        onArticleGenerated(result);
        toast({ title: 'نجاح!', description: 'تم توليد المقال. يمكنك مراجعته الآن.' });
        setOpen(false);
        setTopic('');
      } else {
        throw new Error('لم يتم إرجاع محتوى صالح من النموذج.');
      }
    } catch (error) {
      console.error('Failed to generate article:', error);
      toast({
        variant: 'destructive',
        title: 'فشل التوليد',
        description: 'حدث خطأ أثناء توليد المقال. يرجى المحاولة مرة أخرى.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 />
            توليد مقال بالذكاء الاصطناعي
          </DialogTitle>
          <DialogDescription>
            اكتب فكرة أو موضوعًا للمقال، وسيقوم الذكاء الاصطناعي بكتابة مسودة أولية احترافية لك بتنسيق Markdown.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="topic">موضوع المقال</Label>
          <Textarea
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="مثال: أفضل 5 استراتيجيات لزيادة التفاعل على انستغرام في 2024"
            rows={3}
            disabled={isGenerating}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="animate-spin ml-2" /> : <Wand2 className="ml-2 h-4 w-4" />}
            {isGenerating ? 'جاري التوليد...' : 'ولّد المقال'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
