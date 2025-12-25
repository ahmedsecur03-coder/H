
'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import type { Campaign, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
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
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, RefreshCw, DollarSign, Clock, AlertTriangle, Link as LinkIcon, MapPin, Cake, Users, Bullseye } from 'lucide-react';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

const statusVariant = {
  'نشط': 'default',
  'متوقف': 'secondary',
  'مكتمل': 'outline',
  'بانتظار المراجعة': 'destructive',
} as const;

export function CampaignActions({ campaign, forceCollectionUpdate }: { campaign: Campaign, forceCollectionUpdate: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    // Fetch user data to check adBalance
    const userDocRef = useMemoFirebase(
      () => (firestore && campaign.userId ? doc(firestore, 'users', campaign.userId) : null),
      [firestore, campaign.userId]
    );
    const { data: userData, isLoading: isUserLoading } = useDoc<User>(userDocRef);

    const canAfford = userData ? (userData.adBalance ?? 0) >= campaign.budget : false;

    const handleApprove = async () => {
        if (!firestore) return;
        setLoading(true);

        const campaignDocRef = doc(firestore, `users/${campaign.userId}/campaigns`, campaign.id);
        
        if (!userDocRef) {
            toast({ variant: 'destructive', title: 'خطأ', description: "لا يمكن العثور على مرجع المستخدم."});
            setLoading(false);
            return;
        }

        try {
            await runTransaction(firestore, async (transaction) => {
                const userDoc = await transaction.get(userDocRef);
                if (!userDoc.exists()) {
                    throw new Error("المستخدم المرتبط بالحملة غير موجود.");
                }

                const currentAdBalance = userDoc.data()?.adBalance ?? 0;

                if (currentAdBalance < campaign.budget) {
                    throw new Error(`رصيد الإعلانات للمستخدم غير كافٍ. المطلوب: $${campaign.budget.toFixed(2)}, المتاح: $${currentAdBalance.toFixed(2)}`);
                }

                // 1. Deduct budget from user's adBalance
                const newAdBalance = currentAdBalance - campaign.budget;
                transaction.update(userDocRef, { adBalance: newAdBalance });

                // 2. Activate the campaign
                const updates = { 
                    status: 'نشط' as const,
                    startDate: new Date().toISOString(),
                };
                transaction.update(campaignDocRef, updates);
            });

            toast({ title: 'نجاح', description: 'تم تفعيل الحملة وخصم الميزانية من رصيد إعلانات المستخدم.' });
            forceCollectionUpdate();
            setOpen(false);

        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'فشل تفعيل الحملة',
                description: error.message,
            });
            const permissionError = new FirestorePermissionError({
              path: userDocRef.path, 
              operation: 'update',
            });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setLoading(false);
        }
    };
    
    const targetingDetails = [
      { label: "الدولة", value: campaign.targetCountry, icon: MapPin, hide: !campaign.targetCountry },
      { label: "العمر", value: campaign.targetAge, icon: Cake, hide: !campaign.targetAge },
      { label: "الجنس", value: campaign.targetGender, icon: Users, hide: !campaign.targetGender },
      { label: "الاهتمامات", value: campaign.targetInterests, icon: Bullseye, hide: !campaign.targetInterests },
    ].filter(detail => !detail.hide);


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">تفاصيل</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>إجراءات الحملة: {campaign.name}</DialogTitle>
                    <DialogDescription>
                        مراجعة تفاصيل الحملة واتخاذ الإجراء المناسب.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-2">
                    <p><strong>المستخدم:</strong> <span className="font-mono text-xs">{campaign.userId}</span></p>
                    <p className="flex items-center gap-2"><strong>رابط الإعلان:</strong> <Link href={campaign.adLink || '#'} target="_blank" className="text-primary hover:underline truncate max-w-xs"><LinkIcon className="inline-block w-4 h-4" /> {campaign.adLink || "غير محدد"}</Link></p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-sm"><DollarSign className="w-4 h-4 text-muted-foreground" /> <strong>الميزانية:</strong> ${campaign.budget.toFixed(2)}</div>
                        <div className="flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-muted-foreground" /> <strong>المدة:</strong> {campaign.durationDays} أيام</div>
                    </div>
                     {isUserLoading ? (
                        <Skeleton className="h-6 w-1/2" />
                     ) : (
                         <p><strong>رصيد إعلانات المستخدم:</strong> <span className={`font-bold ${canAfford ? 'text-green-500' : 'text-destructive'}`}>${(userData?.adBalance ?? 0).toFixed(2)}</span></p>
                     )}
                    <div className="flex items-center gap-2"><strong>الحالة الحالية:</strong> <Badge variant={statusVariant[campaign.status] || 'secondary'}>{campaign.status}</Badge></div>

                    {targetingDetails.length > 0 && (
                        <div className="space-y-3 pt-4 border-t">
                            <h4 className="font-semibold">تفاصيل الاستهداف</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                {targetingDetails.map(({ label, value, icon: Icon }) => (
                                    <div key={label} className="flex items-start gap-2">
                                        <Icon className="w-4 h-4 mt-1 text-muted-foreground shrink-0" />
                                        <div>
                                            <p className="font-medium text-muted-foreground">{label}</p>
                                            <p className="font-semibold">{value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}


                     {campaign.status === 'بانتظار المراجعة' && (
                         <div className="pt-4 border-t">
                             {isUserLoading ? (
                                <Skeleton className="h-10 w-full" />
                             ) : !canAfford ? (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                        رصيد إعلانات المستخدم غير كافٍ للموافقة على هذه الحملة.
                                    </AlertDescription>
                                </Alert>
                             ) : (
                                <Button onClick={handleApprove} disabled={loading || isUserLoading} className="w-full">
                                    {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'الموافقة على الحملة وتفعيلها'}
                                </Button>
                             )}
                         </div>
                    )}
                </div>
                
                 <DialogFooter className="gap-2 sm:justify-end">
                     {loading ? <Loader2 className="animate-spin" /> : (
                         <Button variant="secondary" onClick={() => setOpen(false)}>إغلاق</Button>
                     )}
                 </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
