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
import { useFirestore, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import type { Ticket } from '@/lib/types';


export function NewTicketDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message || !firestore || !user) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء ملء جميع الحقول.' });
        return;
    }

    setIsSubmitting(true);
    
    const newTicketData: Omit<Ticket, 'id'> = {
        userId: user.uid,
        subject: subject,
        message: message,
        status: 'مفتوحة',
        createdDate: new Date().toISOString(),
        messages: [{
            sender: 'user',
            text: message,
            timestamp: new Date().toISOString()
        }]
    };

    const ticketsColRef = collection(firestore, `users/${user.uid}/tickets`);

    addDoc(ticketsColRef, newTicketData).then(docRef => {
        toast({
            title: 'تم فتح التذكرة بنجاح',
            description: 'سيقوم فريق الدعم بالرد عليك في أقرب وقت ممكن.',
        });
        setSubject('');
        setMessage('');
        setOpen(false);
        router.push(`/dashboard/support/${docRef.id}`);
    }).catch(error => {
        const permissionError = new FirestorePermissionError({
            path: ticketsColRef.path,
            operation: 'create',
            requestResourceData: newTicketData
        });
        errorEmitter.emit('permission-error', permissionError);
    }).finally(() => {
        setIsSubmitting(false);
    });
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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
