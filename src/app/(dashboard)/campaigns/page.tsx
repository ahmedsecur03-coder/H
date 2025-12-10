'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, runTransaction } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Rocket, ListFilter, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Campaign, User as UserType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';


function NewCampaignDialog() {
    const { user: authUser } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [platform, setPlatform] = useState('');
    const [budget, setBudget] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const userDocRef = useMemoFirebase(
        () => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null),
        [firestore, authUser]
    );
    const { data: userData } = useDoc<UserType>(userDocRef);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !authUser || !name || !platform || !budget) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى ملء جميع الحقول.' });
            return;
        }

        setIsSubmitting(true);
        const budgetAmount = parseFloat(budget);

        if (isNaN(budgetAmount) || budgetAmount <= 0) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'الميزانية يجب أن تكون رقماً أكبر من صفر.' });
            setIsSubmitting(false);
            return;
        }

        try {
            await runTransaction(firestore, async (transaction) => {
                const userDoc = await transaction.get(userDocRef!);
                if (!userDoc.exists()) throw new Error("المستخدم غير موجود.");

                const currentAdBalance = userDoc.data().adBalance ?? 0;
                if (currentAdBalance < budgetAmount) {
                    throw new Error("رصيد الإعلانات غير كافٍ. يرجى تحويل الرصيد أولاً.");
                }

                const newAdBalance = currentAdBalance - budgetAmount;
                transaction.update(userDocRef!, { adBalance: newAdBalance });

                const newCampaignRef = doc(collection(firestore, `users/${authUser.uid}/campaigns`));
                const newCampaign: Omit<Campaign, 'id'> = {
                    userId: authUser.uid,
                    name,
                    platform: platform as any,
                    budget: budgetAmount,
                    spend: 0,
                    status: 'نشط',
                    startDate: new Date().toISOString(),
                };
                transaction.set(newCampaignRef, newCampaign);
            });

            toast({ title: 'نجاح!', description: 'تم إنشاء حملتك الإعلانية بنجاح.' });
            setName('');
            setPlatform('');
            setBudget('');
            setOpen(false);

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'فشل إنشاء الحملة', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    إنشاء حملة جديدة
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>حملة إعلانية جديدة</DialogTitle>
                    <DialogDescription>
                        أدخل تفاصيل حملتك الإعلانية الجديدة. سيتم خصم الميزانية من رصيد الإعلانات.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="campaign-name">اسم الحملة</Label>
                        <Input id="campaign-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: حملة تخفيضات الجمعة البيضاء" required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="platform">المنصة</Label>
                        <Select onValueChange={setPlatform} value={platform}>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر المنصة الإعلانية" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Google">Google Ads</SelectItem>
                                <SelectItem value="Facebook">Facebook & Instagram</SelectItem>
                                <SelectItem value="TikTok">TikTok Ads</SelectItem>
                                <SelectItem value="Snapchat">Snapchat Ads</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="budget">الميزانية (بالدولار)</Label>
                        <Input id="budget" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="100" required />
                    </div>
                     <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'إنشاء وتفعيل الحملة'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default function CampaignsPage() {
    const { user: authUser } = useUser();
    const firestore = useFirestore();

    const campaignsQuery = useMemoFirebase(
        () => (firestore && authUser ? query(collection(firestore, `users/${authUser.uid}/campaigns`)) : null),
        [firestore, authUser]
    );
    const { data: campaigns, isLoading } = useCollection<Campaign>(campaignsQuery);

    const statusVariant = {
        'نشط': 'default',
        'متوقف': 'secondary',
        'مكتمل': 'outline'
    } as const;


  return (
     <div className="space-y-6 pb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">مركز الحملات الإعلانية</h1>
                <p className="text-muted-foreground">
                أنشئ وأدر حملاتك الإعلانية عبر المنصات المختلفة من مكان واحد.
                </p>
            </div>
             <NewCampaignDialog />
        </div>

        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>حملاتك الإعلانية</CardTitle>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <ListFilter className="ml-2 h-4 w-4" />
                        فلترة
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Table>
                        <TableHeader>
                           <TableRow>
                                {Array.from({length: 7}).map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {Array.from({length: 3}).map((_, i) => (
                                 <TableRow key={i}>
                                     {Array.from({length: 7}).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                                 </TableRow>
                             ))}
                        </TableBody>
                    </Table>
                ) : campaigns && campaigns.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>الحملة</TableHead>
                                <TableHead>المنصة</TableHead>
                                <TableHead>الحالة</TableHead>
                                <TableHead>الإنفاق</TableHead>
                                <TableHead>الميزانية</TableHead>
                                <TableHead>تاريخ البدء</TableHead>
                                <TableHead className="text-right">إجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {campaigns.map((campaign) => (
                                <TableRow key={campaign.id}>
                                    <TableCell className="font-medium">{campaign.name}</TableCell>
                                    <TableCell>{campaign.platform}</TableCell>
                                    <TableCell><Badge variant={statusVariant[campaign.status] || 'secondary'}>{campaign.status}</Badge></TableCell>
                                    <TableCell>${(campaign.spend ?? 0).toFixed(2)}</TableCell>
                                    <TableCell>${(campaign.budget ?? 0).toFixed(2)}</TableCell>
                                    <TableCell>{new Date(campaign.startDate).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">تفاصيل</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-20">
                        <Rocket className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">ابدأ حملتك الإعلانية الأولى</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            ليس لديك أي حملات إعلانية حتى الآن. انقر لإنشاء حملة جديدة.
                        </p>
                        <div className="mt-4">
                           <NewCampaignDialog />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
