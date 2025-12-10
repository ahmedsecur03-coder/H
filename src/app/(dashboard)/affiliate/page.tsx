
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, DollarSign, Users, Crown, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { User as UserType } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";

const topMarketers = [
    { rank: 1, name: "محمد علي", earnings: 2500.50 },
    { rank: 2, name: "فاطمة الزهراء", earnings: 2210.75 },
    { rank: 3, name: "أحمد خالد", earnings: 1980.00 },
    { rank: 4, name: "يوسف محمود", earnings: 1850.25 },
    { rank: 5, name: "سارة إبراهيم", earnings: 1700.00 },
];

const AFFILIATE_LEVELS = {
    'برونزي': { commission: 10, nextLevel: 'فضي', requirement: 10 },
    'فضي': { commission: 12, nextLevel: 'ذهبي', requirement: 50 },
    'ذهبي': { commission: 15, nextLevel: 'ماسي', requirement: 200 },
    'ماسي': { commission: 20, nextLevel: null, requirement: Infinity },
};


export default function AffiliatePage() {
    const { user: authUser, isUserLoading: isAuthLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [referralLink, setReferralLink] = useState('');

    const userDocRef = useMemoFirebase(
        () => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null),
        [firestore, authUser]
    );
    const { data: userData, isLoading: isUserDocLoading } = useDoc<UserType>(userDocRef);

    useEffect(() => {
        if (typeof window !== 'undefined' && userData?.referralCode) {
            setReferralLink(`${window.location.origin}/signup?ref=${userData.referralCode}`);
        }
    }, [userData?.referralCode]);

    const isLoading = isAuthLoading || isUserDocLoading;

    const copyToClipboard = () => {
        if (!referralLink) return;
        navigator.clipboard.writeText(referralLink);
        toast({
            title: "تم النسخ!",
            description: "تم نسخ رابط الإحالة الخاص بك إلى الحافظة.",
        });
    };
    
    const currentLevelKey = userData?.affiliateLevel || 'برونزي';
    const currentLevel = AFFILIATE_LEVELS[currentLevelKey];
    const nextLevel = currentLevel.nextLevel ? AFFILIATE_LEVELS[currentLevel.nextLevel as keyof typeof AFFILIATE_LEVELS] : null;
    
    const referralsCount = userData?.referralsCount ?? 0;
    const progressToNextLevel = nextLevel ? (referralsCount / nextLevel.requirement) * 100 : 100;
    

    if (isLoading) {
        return (
             <div className="space-y-6 pb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">نظام الإحالة</h1>
                    <p className="text-muted-foreground">
                      اكسب المال عن طريق دعوة أصدقائك للانضمام إلى منصة حاجاتي.
                    </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                   {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-48" />)}
                </div>
                 <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-40" />
                    <Skeleton className="h-64" />
                </div>
             </div>
        );
    }


  return (
    <div className="space-y-6 pb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">نظام الإحالة</h1>
            <p className="text-muted-foreground">
              اكسب المال عن طريق دعوة أصدقائك للانضمام إلى منصة حاجاتي.
            </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">أرباحك القابلة للسحب</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${(userData?.affiliateEarnings ?? 0).toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">الحد الأدنى للسحب: $10.00</p>
                </CardContent>
                 <CardFooter>
                    <Button className="w-full" disabled={(userData?.affiliateEarnings ?? 0) < 10}>طلب سحب الأرباح</Button>
                </CardFooter>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إجمالي المدعوين</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{userData?.referralsCount ?? 0}</div>
                    <p className="text-xs text-muted-foreground">في جميع مستويات شبكتك</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">مستواك التسويقي</CardTitle>
                    <Crown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{userData?.affiliateLevel ?? 'برونزي'}</div>
                    <p className="text-xs text-muted-foreground">نسبة العمولة: {currentLevel.commission}%</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">الترقية التالية</CardTitle>
                    <CardDescription>
                         {nextLevel ? `الوصول إلى ${nextLevel.requirement} دعوة للترقية إلى ${currentLevel.nextLevel}` : 'لقد وصلت إلى أعلى مستوى!'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     {nextLevel ? (
                        <>
                            <Progress value={progressToNextLevel} className="h-2 my-2" />
                            <p className="text-xs text-muted-foreground text-center">{referralsCount} / {nextLevel.requirement}</p>
                        </>
                     ) : (
                         <p className="text-sm font-medium text-center text-primary">🎉 أنت في القمة 🎉</p>
                     )}
                </CardContent>
            </Card>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>رابط الإحالة الخاص بك</CardTitle>
                    <CardDescription>شاركه مع أصدقائك لتبدأ في كسب العمولات.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-2">
                    <Input readOnly value={referralLink} placeholder="جاري تحميل الرابط..." />
                    <Button size="icon" variant="outline" onClick={copyToClipboard} disabled={!referralLink}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </CardContent>
            </Card>
            <Card>
                 <CardHeader>
                    <CardTitle>أفضل 10 مسوقين</CardTitle>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>الترتيب</TableHead>
                                <TableHead>الاسم</TableHead>
                                <TableHead className="text-right">الأرباح</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topMarketers.map((m) => (
                                <TableRow key={m.rank}>
                                    <TableCell>{m.rank}</TableCell>
                                    <TableCell>{m.name}</TableCell>
                                    <TableCell className="text-right">${m.earnings.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
