
'use client';

import React, { useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, AlertTriangle } from 'lucide-react';
import { SMM_SERVICES } from '@/lib/smm-services';
import { FirestorePermissionError, errorEmitter } from '@/firebase';

interface ImportDialogProps {
    children: React.ReactNode;
    onImportComplete: () => void;
}

export function ImportDialog({ children, onImportComplete }: ImportDialogProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const handleImport = async () => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'Firestore غير متاح.' });
            return;
        }

        setIsImporting(true);
        toast({ title: 'جاري الاستيراد...', description: `جاري مزامنة أسعار ${SMM_SERVICES.length} خدمة. قد يستغرق الأمر بعض الوقت.` });

        const batch = writeBatch(firestore);
        const pricesColRef = collection(firestore, 'servicePrices');
        let errorOccurred = false;

        SMM_SERVICES.forEach(service => {
            const priceDocRef = doc(pricesColRef, service.id.toString());
            // Only write the price to Firestore
            batch.set(priceDocRef, { price: service.price });
        });

        try {
            await batch.commit();
            toast({ title: 'نجاح!', description: `تم مزامنة أسعار ${SMM_SERVICES.length} خدمة بنجاح.` });
            onImportComplete();
            setOpen(false);
        } catch (error) {
            console.error("Import Error:", error);
            errorOccurred = true;
            const permissionError = new FirestorePermissionError({
                path: 'servicePrices/[multiple]',
                operation: 'write'
            });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setIsImporting(false);
            if (errorOccurred) {
                toast({ variant: 'destructive', title: 'فشل المزامنة', description: 'لم تتم مزامنة الأسعار بسبب خطأ في الصلاحيات. تحقق من console.' });
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/>تأكيد عملية المزامنة</DialogTitle>
                    <DialogDescription>
                        أنت على وشك مزامنة أسعار {SMM_SERVICES.length} خدمة مع قاعدة البيانات. سيؤدي هذا إلى الكتابة فوق أي أسعار موجودة. هل أنت متأكد أنك تريد المتابعة؟
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => setOpen(false)}>إلغاء</Button>
                    <Button onClick={handleImport} disabled={isImporting} variant="destructive">
                        {isImporting ? <Loader2 className="animate-spin" /> : <Upload className="ml-2"/>}
                        نعم، قم بالمزامنة
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

