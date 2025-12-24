
'use client';

import React, { useState, useEffect } from 'react';
import type { Service } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export function ServiceDialog({ service, onSave, children, onOpenChange, open }: { service?: Service, onSave: (data: { price: number }) => void, children: React.ReactNode, open: boolean, onOpenChange: (open: boolean) => void }) {
    
    const [price, setPrice] = useState(service?.price || 0);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (open && service) {
            setPrice(service.price);
        }
    }, [service, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        onSave({ price: price });
        // The parent component will handle closing the dialog and resetting state
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>تعديل سعر الخدمة</DialogTitle>
                    <DialogDescription>
                        تعديل سعر الخدمة: {service?.category} ({service?.id})
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>السعر/1000</Label>
                        <Input type="number" step="any" value={price} onChange={e => setPrice(parseFloat(e.target.value) || 0)} required />
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-sm space-y-2">
                        <h4 className="font-semibold">تفاصيل الخدمة (للقراءة فقط)</h4>
                        <p><strong>المنصة:</strong> {service?.platform}</p>
                        <p><strong>الوصف:</strong> {service?.description}</p>
                        <p><strong>الحدود:</strong> {service?.min} / {service?.max}</p>
                    </div>
                     <DialogFooter>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="animate-spin" /> : 'حفظ السعر'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

