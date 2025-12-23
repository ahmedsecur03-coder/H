
'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const STATUS_OPTIONS: Order['status'][] = ['قيد التنفيذ', 'مكتمل', 'جزئي', 'ملغي'];

export function OrderActions({ order, onOrderUpdate }: { order: Order; onOrderUpdate: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState(order.status);

    useEffect(() => {
        if (open) {
            setStatus(order.status);
        }
    }, [order, open]);


    const handleSave = async () => {
        if (!firestore) return;
        setIsSaving(true);
        const orderDocRef = doc(firestore, `users/${order.userId}/orders`, order.id);

        const updateData = {
            status: status,
        };

        try {
            await updateDoc(orderDocRef, updateData);
            toast({ title: 'نجاح', description: 'تم تحديث حالة الطلب.' });
            onOrderUpdate();
            setOpen(false);
        } catch (error) {
            const permissionError = new FirestorePermissionError({
                path: orderDocRef.path,
                operation: 'update',
                requestResourceData: updateData,
            });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">تعديل</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>تعديل الطلب رقم: {order.id.substring(0,8)}</DialogTitle>
                    <DialogDescription>تغيير حالة الطلب للمستخدم: {order.userId}</DialogDescription>
                </DialogHeader>
                 <div className="space-y-4 py-4">
                     <p><strong>الخدمة:</strong> {order.serviceName}</p>
                     <p><strong>الرابط:</strong> <a href={order.link} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">{order.link}</a></p>
                     <p><strong>الكمية:</strong> {order.quantity}</p>
                    <div className="space-y-2">
                        <Label htmlFor="status">حالة الطلب</Label>
                        <Select value={status} onValueChange={(value) => setStatus(value as Order['status'])}>
                            <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="animate-spin" /> : 'حفظ التغييرات'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
