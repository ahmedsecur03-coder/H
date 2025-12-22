
import { Suspense } from 'react';
import { getAuthenticatedUser } from '@/firebase/server-auth';
import { initializeFirebaseServer } from '@/firebase/server';
import { collection, query, orderBy, doc, getDocs, getDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Rocket } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Campaign, User as UserType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { PLATFORM_ICONS } from '@/lib/icon-data';
import { NewCampaignDialog } from './_components/new-campaign-dialog';
import { CampaignDetailsDialog } from './_components/campaign-details-dialog';

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

async function CampaignsTable({ userId, userData }: { userId: string, userData: UserType }) {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) return null;

    const campaignsQuery = query(collection(firestore, `users/${userId}/campaigns`), orderBy('startDate', 'desc'));
    const snapshot = await getDocs(campaignsQuery);
    const campaigns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Campaign);

    const statusVariant = {
        'نشط': 'default',
        'متوقف': 'secondary',
        'مكتمل': 'outline',
        'بانتظار المراجعة': 'destructive',
    } as const;

    if (campaigns && campaigns.length > 0) {
        return (
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
                    {campaigns.map((campaign) => {
                        const Icon = PLATFORM_ICONS[campaign.platform] || PLATFORM_ICONS.Default;
                        return (
                        <TableRow key={campaign.id}>
                            <TableCell className="font-medium flex items-center gap-2">
                                <Icon className="w-4 h-4 text-muted-foreground" />
                                <span>{campaign.name}</span>
                            </TableCell>
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
                        )
                    })}
                </TableBody>
            </Table>
        )
    }

    return (
        <div className="text-center py-10">
            <Rocket className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">ابدأ حملتك الإعلانية الأولى</h3>
            <p className="mt-2 text-sm text-muted-foreground">
                ليس لديك أي حملات إعلانية حتى الآن. أنشئ حملة جديدة لتبدأ.
            </p>
             <NewCampaignDialog userData={userData}>
               <Button className="mt-4">
                    <PlusCircle className="ml-2 h-4 w-4" />
                    إنشاء حملة جديدة
                </Button>
            </NewCampaignDialog>
        </div>
    )
}

async function getData(userId: string) {
    const { firestore } = initializeFirebaseServer();
    if(!firestore) return { userData: null };

    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    return {
        userData: userDoc.exists() ? userDoc.data() as UserType : null
    }
}


export default async function CampaignsPage() {
    const { user: authUser } = await getAuthenticatedUser();
    if (!authUser) return null;

    const { userData } = await getData(authUser.uid);
    if (!userData) return <p>User data not found</p>;

  return (
     <div className="space-y-6 pb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">مركز الحملات الإعلانية</h1>
            <p className="text-muted-foreground">
             أنشئ، حلل، وحسّن حملاتك التسويقية على جميع المنصات الكبرى من مكان واحد.
            </p>
        </div>

        <NewCampaignDialog userData={userData}>
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
                <Suspense fallback={<Skeleton className="h-40 w-full" />}>
                   <CampaignsTable userId={authUser.uid} userData={userData} />
                </Suspense>
            </CardContent>
        </Card>
    </div>
  );
}
