'use client';

import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createTicket } from '../actions';

export function NewTicketDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;

    setIsSubmitting(true);
    
    try {
        const ticketId = await createTicket({ subject, message });
        toast({
            title: 'تم فتح التذكرة بنجاح',
            description: 'سيقوم فريق الدعم بالرد عليك في أقرب وقت ممكن.',
        });
        setSubject('');
        setMessage('');
        setOpen(false);
        router.push(`/dashboard/support/${ticketId}`);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>تذكرة دعم جديدة</DialogTitle>
          <DialogDescription>
            صف مشكلتك بالتفصيل وسيقوم فريقنا بالرد عليك.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subject">
              الموضوع
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">
              الرسالة
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
           <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'إرسال التذكرة'}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
