
'use client';

import React, { useState } from 'react';
import { useFirestore, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, addDoc, collection } from 'firebase/firestore';
import type { AgencyAccount } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PLATFORM_ICONS } from '@/lib/icon-data';


type Platform = 'Meta' | 'Google' | 'TikTok' | 'Snapchat';
const platforms: Platform[] = ['Meta', 'Google', 'TikTok', 'Snapchat'];

export function NewAccountDialog({ children, onAccountCreated }: { children: React.ReactNode, onAccountCreated: () => void }) {
    const firestore = useFirestore();
    const { user: authUser } = useUser();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [accountName, setAccountName] = useState('');
    const [platform, setPlatform] = useState<Platform | undefined>();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !authUser || !platform || !accountName.trim()) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء ملء جميع الحقول المطلوبة.' });
            return;
        }

        setLoading(true);

        const newAccount: Omit<AgencyAccount, 'id'> = {
            userId: authUser.uid,
            platform,
            accountName,
            status: 'Active',
            createdAt: new Date().toISOString(),
            balance: 0,
        };
        
        const accountsColRef = collection(firestore, `users/${authUser.uid}/agencyAccounts`);
        
        try {
            await addDoc(accountsColRef, newAccount);
            toast({ title: 'نجاح', description: 'تم إنشاء حساب الوكالة بنجاح.' });
            onAccountCreated();
            setOpen(false);
            setAccountName('');
            setPlatform(undefined);
        } catch (error) {
            const permissionError = new FirestorePermissionError({
                path: accountsColRef.path,
                operation: 'create',
                requestResourceData: newAccount
            });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setLoading(false);
        }
    };


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>شراء حساب وكالة جديد</DialogTitle>
                    <DialogDescription>
                        اختر المنصة وأعطِ حسابك اسمًا مميزًا للبدء.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                     <div className="space-y-2">
                        <Label htmlFor="platform">المنصة</Label>
                        <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                            <SelectTrigger id="platform">
                                <SelectValue placeholder="اختر منصة الحساب الإعلاني..." />
                            </SelectTrigger>
                            <SelectContent>
                                {platforms.map(p => {
                                    const Icon = PLATFORM_ICONS[p];
                                    return (
                                        <SelectItem key={p} value={p}>
                                            <div className="flex items-center gap-2">
                                                <Icon className="h-4 w-4 text-muted-foreground"/>
                                                <span>{p}</span>
                                            </div>
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="accountName">اسم الحساب (للتمييز)</Label>
                        <Input id="accountName" value={accountName} onChange={e => setAccountName(e.target.value)} required placeholder="مثال: حسابي لمتجر الملابس"/>
                    </div>
                     <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? <Loader2 className="animate-spin" /> : <><PlusCircle className="ml-2 h-4 w-4"/>إنشاء الحساب</>}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
