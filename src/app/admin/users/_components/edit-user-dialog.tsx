
'use client';

import React, { useState } from 'react';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

const RANKS: User['rank'][] = ['مستكشف نجمي', 'قائد صاروخي', 'سيد المجرة', 'سيد كوني'];

export function EditUserDialog({ user, children, onUserUpdate }: { user: User, children: React.ReactNode, onUserUpdate: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [balance, setBalance] = useState(String(user.balance ?? 0));
    const [adBalance, setAdBalance] = useState(String(user.adBalance ?? 0));
    const [rank, setRank] = useState(user.rank);

    const handleSave = async () => {
        if (!firestore) return;
        setIsSaving(true);
        const userDocRef = doc(firestore, 'users', user.id);
        const balanceValue = parseFloat(balance);
        const adBalanceValue = parseFloat(adBalance);

        if (isNaN(balanceValue) || isNaN(adBalanceValue)) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء إدخال قيم رصيد صالحة.' });
            setIsSaving(false);
            return;
        }

        const updateData = {
            balance: balanceValue,
            adBalance: adBalanceValue,
            rank: rank,
        };

        try {
            await updateDoc(userDocRef, updateData);
            toast({ title: 'نجاح', description: 'تم تحديث بيانات المستخدم.' });
            onUserUpdate();
            setOpen(false);
        } catch (error) {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
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
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>تعديل المستخدم: {user.name}</DialogTitle>
                    <DialogDescription>{user.email}</DialogDescription>
                </DialogHeader>
                 <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="balance">الرصيد</Label>
                        <Input id="balance" type="number" value={balance} onChange={(e) => setBalance(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="adBalance">رصيد الإعلانات</Label>
                        <Input id="adBalance" type="number" value={adBalance} onChange={(e) => setAdBalance(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="rank">الرتبة</Label>
                        <Select value={rank} onValueChange={(value) => setRank(value as User['rank'])}>
                            <SelectTrigger id="rank"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {RANKS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
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
