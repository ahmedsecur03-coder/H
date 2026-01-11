'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, MessageSquare } from 'lucide-react';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { Separator } from '@/components/ui/separator';
import { SendNotificationDialog } from './send-notification-dialog';
import Link from 'next/link';

const RANKS: User['rank'][] = ['مستكشف نجمي', 'قائد صاروخي', 'سيد المجرة', 'سيد كوني'];
const ROLES: Exclude<User['role'], undefined>[] = ['user', 'admin'];

export function EditUserDialog({ user, children, onUserUpdate }: { user: User, children: React.ReactNode, onUserUpdate: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [balance, setBalance] = useState(String(user.balance ?? 0));
    const [adBalance, setAdBalance] = useState(String(user.adBalance ?? 0));
    const [rank, setRank] = useState(user.rank);
    const [role, setRole] = useState(user.role || 'user');

    useEffect(() => {
        if (open) {
            setBalance(String(user.balance ?? 0));
            setAdBalance(String(user.adBalance ?? 0));
            setRank(user.rank);
            setRole(user.role || 'user');
        }
    }, [user, open]);


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
            role: role,
        };

        updateDoc(userDocRef, updateData)
            .then(() => {
                toast({ title: 'نجاح', description: 'تم تحديث بيانات المستخدم.' });
                onUserUpdate();
                setOpen(false);
            })
            .catch(error => {
                const permissionError = new FirestorePermissionError({
                    path: userDocRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                });
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => {
                setIsSaving(false);
            });
    };
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>إدارة المستخدم: {user.name}</DialogTitle>
                    <DialogDescription>
                        {user.email}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    {/* Column 1: Edit Data */}
                    <div className="space-y-4">
                         <h4 className="font-semibold text-lg border-b pb-2">تعديل البيانات</h4>
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
                        <div className="space-y-2">
                            <Label htmlFor="role">الدور</Label>
                            <Select value={role} onValueChange={(value) => setRole(value as Exclude<User['role'], undefined>)}>
                                <SelectTrigger id="role"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <Button onClick={handleSave} disabled={isSaving} className="w-full">
                            {isSaving ? <Loader2 className="animate-spin" /> : 'حفظ التغييرات'}
                        </Button>
                    </div>

                    {/* Column 2: Actions */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-lg border-b pb-2">إجراءات سريعة</h4>
                        <SendNotificationDialog userId={user.id}>
                            <Button variant="outline" className="w-full justify-start gap-2">
                                إرسال إشعار
                            </Button>
                        </SendNotificationDialog>
                         <Button variant="outline" asChild className="w-full justify-start gap-2">
                           <Link href={`/admin/support?userId=${user.id}`}>
                               <MessageSquare className="h-4 w-4" />
                               عرض تذاكر الدعم
                           </Link>
                        </Button>
                         <div className="p-4 bg-muted/50 rounded-lg text-sm space-y-2">
                            <p><strong>تاريخ الانضمام:</strong> {new Date(user.createdAt).toLocaleDateString('ar-EG')}</p>
                            <p><strong>إجمالي الإنفاق:</strong> ${(user.totalSpent || 0).toFixed(2)}</p>
                            <p><strong>كود الإحالة:</strong> {user.referralCode}</p>
                         </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="secondary" onClick={() => setOpen(false)}>إغلاق</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
