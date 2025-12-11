
'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { runTransaction, collection, query, doc, addDoc, orderBy } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Rocket, Loader2, Code, Facebook, Search, BarChart, Eye, MousePointerClick, Target } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Campaign, User as UserType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { PLATFORM_ICONS } from '@/lib/icon-data';

type Platform = keyof typeof PLATFORM_ICONS;
type Goal = Campaign['goal'];


const platforms: { name: Platform; title: string; description: string; }[] = [
    { name: 'TikTok', title: 'TikTok Ads', description: 'حقق الانتشار الفيروسي بالإعلانات القصيرة.' },
    { name: 'Facebook', title: 'Facebook & Instagram', description: 'استهداف دقيق لجمهور واسع ومتفاعل.' },
    { name: 'Google', title: 'Google Ads', description: 'الوصول للعملاء أثناء بحثهم عنك.' },
    { name: 'Snapchat', title: 'Snapchat Ads', description: 'تواصل مع جيل الشباب بإعلانات إبداعية.' },
];

const goals: { name: Goal; title: string }[] = [
    { name: 'زيادة الوعي', title: 'زيادة الوعي' },
    { name: 'زيارات للموقع', title: 'زيارات للموقع' },
    { name: 'تفاعل مع المنشور', title: 'تفاعل مع المنشور' },
    { name: 'مشاهدات فيديو', title: 'مشاهدات فيديو' },
    { name: 'تحويلات', title: 'تحويلات' },
];


function CampaignDetailsDialog({ campaign }: { campaign: Campaign }) {
    const statusVariant = {
        'نشط': 'default',
        'متوقف': 'secondary',
        'مكتمل': 'outline',
        'بانتظار المراجعة': 'destructive',
    } as const;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">عرض التفاصيل</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>تفاصيل الحملة: {campaign.name}</DialogTitle>
                    <DialogDescription>نظرة شاملة على أداء حملتك حتى الآن.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 py-4">
                     <div className="flex items-center justify-between col-span-2">
                        <span className="text-muted-foreground">الحالة:</span>
                        <Badge variant={statusVariant[campaign.status] || 'secondary'}>{campaign.status}</Badge>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <Eye className="w-8 h-8 text-primary" />
                        <div>
                            <p className="text-xs text-muted-foreground">مرات الظهور</p>
                            <p className="text-xl font-bold">{(campaign.impressions || 0).toLocaleString()}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <MousePointerClick className="w-8 h-8 text-primary" />
                        <div>
                            <p className="text-xs text-muted-foreground">النقرات</p>
                            <p className="text-xl font-bold">{(campaign.clicks || 0).toLocaleString()}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <Target className="w-8 h-8 text-primary" />
                        <div>
                            <p className="text-xs text-muted-foreground">النتائج ({campaign.goal})</p>
                            <p className="text-xl font-bold">{(campaign.results || 0).toLocaleString()}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <BarChart className="w-8 h-8 text-primary" />
                        <div>
                            <p className="text-xs text-muted-foreground">نسبة النقر (CTR)</p>
                            <p className="text-xl font-bold">{(campaign.ctr || 0).toFixed(2)}%</p>
                        </div>
                    </div>
                     <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">تكلفة النقرة (CPC):</span>
                        <span className="font-mono font-bold">${(campaign.cpc || 0).toFixed(3)}</span>
                    </div>
                     <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">الإنفاق / الميزانية:</span>
                        <span className="font-mono font-bold">${(campaign.spend || 0).toFixed(2)} / ${campaign.budget.toFixed(2)}</span>
                    </div>
                </div>
                 <div className="w-full bg-muted rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{width: `${(campaign.spend / (campaign.budget || 1)) * 100}%`}}></div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function NewCampaignDialog({ userData, user, onCampaignCreated, children }: { userData: UserType, user: any, onCampaignCreated: () => void, children: React.ReactNode }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [platform, setPlatform] = useState<Platform | undefined>();
    const [goal, setGoal] = useState<Goal | undefined>();
    const [targetAudience, setTargetAudience] = useState('');
    const [budget, setBudget] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const budgetAmount = parseFloat(budget);

        if (!firestore || !user || !name || !platform || !goal || !targetAudience || !budgetAmount || budgetAmount <= 0) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء ملء جميع الحقول بشكل صحيح.' });
            return;
        }

        if ((userData.adBalance ?? 0) < budgetAmount) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'رصيدك الإعلاني غير كافٍ لهذه الميزانية.' });
            return;
        }

        setLoading(true);

        try {
            const userDocRef = doc(firestore, 'users', user.uid);
            await runTransaction(firestore, async (transaction) => {
                const userDoc = await transaction.get(userDocRef);
                if (!userDoc.exists()) throw new Error("المستخدم غير موجود.");

                const currentAdBalance = userDoc.data().adBalance ?? 0;
                if (currentAdBalance < budgetAmount) throw new Error("رصيد الإعلانات غير كاف.");

                transaction.update(userDocRef, { adBalance: currentAdBalance - budgetAmount });
                
                const campaignColRef = collection(firestore, `users/${user.uid}/campaigns`);
                const newCampaignData: Omit<Campaign, 'id'> = {
                    userId: user.uid,
                    name,
                    platform: platform as Campaign['platform'],
                    goal,
                    targetAudience,
                    startDate: new Date().toISOString(),
                    budget: budgetAmount,
                    spend: 0,
                    status: 'بانتظار المراجعة',
                    impressions: 0,
                    clicks: 0,
                    results: 0,
                    ctr: 0,
                    cpc: 0,
                };
                // Firestore automatically generates an ID when using addDoc in a transaction context
                const newCampaignDoc = doc(campaignColRef); 
                transaction.set(newCampaignDoc, newCampaignData);
            });

            toast({ title: 'نجاح!', description: 'تم إنشاء حملتك وهي الآن قيد المراجعة.' });
            onCampaignCreated();
            setOpen(false);
            // Reset form
            setName(''); setPlatform(undefined); setGoal(undefined); setTargetAudience(''); setBudget('');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'فشل إنشاء الحملة', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>حملة إعلانية جديدة</DialogTitle>
                    <DialogDescription>
                        اختر المنصة وحدد ميزانية حملتك للبدء. سيتم خصم الميزانية من رصيد الإعلانات.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                     <div className="space-y-2">
                        <Label htmlFor="campaign-name">اسم الحملة</Label>
                        <Input id="campaign-name" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="platform">المنصة</Label>
                         <Select onValueChange={(value) => setPlatform(value as Platform)} value={platform}>
                            <SelectTrigger id="platform"><SelectValue placeholder="اختر منصة إعلانية" /></SelectTrigger>
                            <SelectContent>
                                {platforms.map(p => <SelectItem key={p.name} value={p.name}>{p.title}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="goal">الهدف من الحملة</Label>
                         <Select onValueChange={(value) => setGoal(value as Goal)} value={goal}>
                            <SelectTrigger id="goal"><SelectValue placeholder="اختر هدف الحملة" /></SelectTrigger>
                            <SelectContent>
                                {goals.map(g => <SelectItem key={g.name} value={g.name}>{g.title}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="target-audience">وصف الجمهور المستهدف</Label>
                        <Textarea id="target-audience" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} required placeholder="مثال: شباب في مصر مهتمون بكرة القدم والألعاب الإلكترونية" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="budget">الميزانية ($)</Label>
                        <Input id="budget" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} required min="5" />
                         <p className="text-xs text-muted-foreground">رصيدك الإعلاني الحالي: ${userData.adBalance?.toFixed(2) ?? '0.00'}</p>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? <Loader2 className="animate-spin" /> : 'إنشاء ومراجعة'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}


function CampaignsSkeleton() {
    return (
        <div className="space-y-6 pb-8">
            <div>
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-5 w-2/3 mt-2" />
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Skeleton className="h-28" />
                 <Skeleton className="h-28" />
                 <Skeleton className="h-28" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-40 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}

export default function CampaignsPage() {
    const { user: authUser, isUserLoading } = useUser();
    const firestore = useFirestore();

    const campaignsQuery = useMemoFirebase(
        () => (firestore && authUser ? query(collection(firestore, `users/${authUser.uid}/campaigns`), orderBy('startDate', 'desc')) : null),
        [firestore, authUser]
    );
    const { data: campaigns, isLoading: campaignsLoading, forceCollectionUpdate } = useCollection<Campaign>(campaignsQuery);
    
    const userDocRef = useMemoFirebase(
        () => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null),
        [firestore, authUser]
    );
    const { data: userData, isLoading: userLoading } = useDoc<UserType>(userDocRef);


    const isLoading = isUserLoading || campaignsLoading || userLoading;

    if (isLoading || !userData || !authUser) {
        return <CampaignsSkeleton />;
    }
    

    const statusVariant = {
        'نشط': 'default',
        'متوقف': 'secondary',
        'مكتمل': 'outline',
        'بانتظار المراجعة': 'destructive',
    } as const;


  return (
     <div className="space-y-6 pb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">مركز الحملات الإعلانية</h1>
            <p className="text-muted-foreground">
             أنشئ، حلل، وحسّن حملاتك التسويقية على جميع المنصات الكبرى من مكان واحد.
            </p>
        </div>

        <NewCampaignDialog userData={userData} user={authUser} onCampaignCreated={forceCollectionUpdate}>
            <Button className="w-full text-lg py-6">
                <PlusCircle className="ml-2 h-5 w-5" />
                إنشاء حملة إعلانية جديدة
            </Button>
        </NewCampaignDialog>
        
        <Card>
            <CardHeader>
                <CardTitle>سجل الحملات الأخيرة</CardTitle>
                <CardDescription>قائمة بجميع حملاتك الإعلانية في النظام. يمكنك تتبع أدائها وتفاصيلها من هنا.</CardDescription>
            </CardHeader>
            <CardContent>
                {campaigns && campaigns.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>اسم الحملة</TableHead>
                                <TableHead>الحالة</TableHead>
                                <TableHead>الإنفاق / الميزانية</TableHead>
                                <TableHead className="text-right">الإجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {campaigns.map((campaign) => (
                                <TableRow key={campaign.id}>
                                    <TableCell className="font-medium">{campaign.name}</TableCell>
                                    <TableCell><Badge variant={statusVariant[campaign.status] || 'secondary'}>{campaign.status}</Badge></TableCell>
                                    <TableCell>
                                        <div className='flex flex-col gap-1'>
                                            <span className='font-mono'>${(campaign.spend ?? 0).toFixed(2)} / ${campaign.budget.toFixed(2)}</span>
                                            <div className="w-full bg-muted rounded-full h-1.5">
                                                <div className="bg-primary h-1.5 rounded-full" style={{width: `${(campaign.spend / (campaign.budget || 1)) * 100}%`}}></div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <CampaignDetailsDialog campaign={campaign} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-10">
                        <Rocket className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">ابدأ حملتك الإعلانية الأولى</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            ليس لديك أي حملات إعلانية حتى الآن. أنشئ حملة جديدة لتبدأ.
                        </p>
                         <NewCampaignDialog userData={userData} user={authUser} onCampaignCreated={forceCollectionUpdate}>
                           <Button className="mt-4">
                                <PlusCircle className="ml-2 h-4 w-4" />
                                إنشاء حملة جديدة
                            </Button>
                        </NewCampaignDialog>
                    </div>
                )}
            </CardContent>
        </Card>

    </div>
  );
}
