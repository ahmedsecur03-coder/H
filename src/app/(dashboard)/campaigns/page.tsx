
'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { runTransaction, collection, query, doc, addDoc, orderBy } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Rocket, Loader2, Code, Facebook, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Campaign, User as UserType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const platformIcons = {
    Google: <Search className="w-8 h-8 text-primary" />,
    Facebook: <Facebook className="w-8 h-8 text-primary" />,
    TikTok: (
      <svg
        className="w-8 h-8 text-primary"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71v-2.12c.81.07 1.65.16 2.48.21.02-1.58.02-3.16 0-4.75-.01-1.19-.42-2.37-1.12-3.32-1.3-1.83-3.54-2.79-5.73-2.52v-4.14c1.44.02 2.89.33 4.2.91.56.25 1.09.57 1.6.91.02-2.92-.01-5.84.02-8.75Z" />
      </svg>
    ),
    Snapchat: (
        <svg
            className="w-8 h-8 text-primary"
            fill="currentColor"
            viewBox="0 0 24 24"
        >
           <path d="M12.986 2.695c-.687 0-1.375.02-2.063.059-4.887.279-8.73 4.14-8.91 9.027-.037.986.138 1.954-.52 2.845-.52 1.205 1.408 2.214 2.564 2.883a8.91 8.91 0 003.543-1.066c.687 0 1.375-.02 2.063-.059 4.887-.279 8.73-4.14 8.91-9.027.037-.986-.138-1.954-.52-2.845-.52-1.205-1.408-2.214-2.564-2.883a8.91 8.91 0 00-3.543-1.066zM8.31 10.638c0-.687.558-1.244 1.243-1.244.685 0 1.244.557 1.244 1.244s-.559 1.244-1.244 1.244-1.243-.557-1.243-1.244zm6.136 0c0-.687.558-1.244 1.244-1.244.685 0 1.243.557 1.243 1.244s-.558 1.244-1.243 1.244-1.244-.557-1.244-1.244zm-3.068 5.759s-2.006-1.51-2.006-2.565c0-.628.52-1.085 1.085-1.085.298 0 .577.12.783.318.206.198.318.46.318.767 0 1.055-2.006 2.565-2.006 2.565h1.826s2.006-1.51 2.006-2.565c0-.628-.52-1.085-1.085-1.085-.298 0-.577.12-.783.318-.206.198-.318.46-.318.767 0 1.055 2.006 2.565 2.006 2.565H11.378z"/>
        </svg>
    ),
    API: <Code className="w-8 h-8 text-primary" />
};

type Platform = keyof typeof platformIcons;

const platforms: { name: Platform; title: string; description: string; }[] = [
    { name: 'TikTok', title: 'TikTok Ads', description: 'حقق الانتشار الفيروسي بالإعلانات القصيرة.' },
    { name: 'Facebook', title: 'Facebook & Instagram', description: 'استهداف دقيق لجمهور واسع ومتفاعل.' },
    { name: 'Google', title: 'Google Ads', description: 'الوصول للعملاء أثناء بحثهم عنك.' },
    { name: 'Snapchat', title: 'Snapchat Ads', description: 'تواصل مع جيل الشباب بإعلانات إبداعية.' },
    { name: 'API', title: 'API & Automation', description: 'أتمتة حملاتك برمجياً.' },
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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>تفاصيل الحملة: {campaign.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex justify-between"><span>الحالة:</span> <Badge variant={statusVariant[campaign.status] || 'secondary'}>{campaign.status}</Badge></div>
                    <div className="flex justify-between"><span>المنصة:</span> <span>{campaign.platform}</span></div>
                    <div className="flex justify-between"><span>الميزانية:</span> <span className="font-mono font-bold">${campaign.budget.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>الإنفاق:</span> <span className="font-mono font-bold">${campaign.spend.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>تاريخ البدء:</span> <span>{new Date(campaign.startDate).toLocaleDateString('ar-EG')}</span></div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function NewCampaignDialog({ userData, user, onCampaignCreated }: { userData: UserType, user: any, onCampaignCreated: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [platform, setPlatform] = useState<Platform | undefined>();
    const [budget, setBudget] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const budgetAmount = parseFloat(budget);

        if (!firestore || !user || !name || !platform || !budgetAmount || budgetAmount <= 0) {
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
                    platform,
                    startDate: new Date().toISOString(),
                    budget: budgetAmount,
                    spend: 0,
                    status: 'بانتظار المراجعة'
                };
                // Use transaction to set the new campaign doc
                const newCampaignDoc = doc(campaignColRef); // create a new doc ref with a random id.
                transaction.set(newCampaignDoc, newCampaignData);
            });

            toast({ title: 'نجاح!', description: 'تم إنشاء حملتك وهي الآن قيد المراجعة.' });
            onCampaignCreated();
            setOpen(false);
            setName('');
            setPlatform(undefined);
            setBudget('');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'فشل إنشاء الحملة', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full">
                    <PlusCircle className="ml-2 h-4 w-4" />
                    إنشاء حملة إعلانية جديدة
                </Button>
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
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Skeleton className="h-64" />
                </div>
                <div className="lg:col-span-1">
                    <Skeleton className="h-48" />
                </div>
            </div>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             {platforms.map(platform => (
                 <Card key={platform.name} className="hover:border-primary/50 transition-colors">
                     <CardHeader className="flex flex-row items-center justify-between">
                         <div className="space-y-1">
                            <CardTitle>{platform.title}</CardTitle>
                            <CardDescription>{platform.description}</CardDescription>
                         </div>
                         {platformIcons[platform.name]}
                     </CardHeader>
                 </Card>
             ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
             <div className="lg:col-span-2">
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
                            </div>
                        )}
                    </CardContent>
                </Card>
             </div>
             <div className="space-y-6">
                <NewCampaignDialog userData={userData} user={authUser} onCampaignCreated={forceCollectionUpdate}/>
             </div>
        </div>

    </div>
  );
}
