
'use client';

import React, { useState } from 'react';
import { useFirestore, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import type { Notification } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function SendNotificationDialog({ userId, children }: { userId: string, children: React.ReactNode }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState<Notification['type']>('info');

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !message.trim()) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء كتابة رسالة الإشعار.' });
            return;
        }

        setIsSending(true);

        const userDocRef = doc(firestore, 'users', userId);
        const newNotification: Notification = {
            id: `admin-msg-${Date.now()}`,
            message,
            type,
            read: false,
            createdAt: new Date().toISOString(),
        };

        try {
            await updateDoc(userDocRef, {
                notifications: arrayUnion(newNotification)
            });
            toast({ title: 'نجاح', description: 'تم إرسال الإشعار إلى المستخدم.' });
            setOpen(false);
            setMessage('');
            setType('info');
        } catch (error) {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: { notifications: '...' }
            });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>إرسال إشعار للمستخدم</DialogTitle>
                    <DialogDescription>
                        سيظهر هذا الإشعار في قائمة إشعارات المستخدم داخل التطبيق.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSend} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="notification-message">نص الإشعار</Label>
                        <Textarea
                            id="notification-message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="مثال: تم تحديث بيانات حسابك بنجاح."
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notification-type">نوع الإشعار</Label>
                        <Select value={type} onValueChange={(v) => setType(v as Notification['type'])}>
                            <SelectTrigger id="notification-type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="info">معلومة (Info)</SelectItem>
                                <SelectItem value="success">نجاح (Success)</SelectItem>
                                <SelectItem value="warning">تحذير (Warning)</SelectItem>
                                <SelectItem value="error">خطأ (Error)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSending}>
                            {isSending ? <Loader2 className="animate-spin me-2" /> : <Send className="me-2 h-4 w-4" />}
                            إرسال الإشعار
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
