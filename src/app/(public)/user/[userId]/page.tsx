'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, Users, BarChart, Copy, Check, Eye, Share2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AFFILIATE_LEVELS } from '@/lib/service';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { WhatsAppIcon } from '@/components/ui/icons';
import { Facebook, Twitter } from 'lucide-react';
import { CopyButton } from '@/app/dashboard/affiliate/_components/copy-button';

function ProfileSkeleton() {
    return (
        <div className="container max-w-2xl mx-auto py-12">
            <Skeleton className="h-96 w-full" />
        </div>
    );
}


function ShareButtons({ referralLink }: { referralLink: string }) {
    const shareText = encodeURIComponent(`انضم إلى منصة حاجاتي عبر رابطي الخاص بي واحصل على بداية قوية لرحلتك الرقمية!`);
    const encodedLink = encodeURIComponent(referralLink);

    const shareTargets = [
        { name: 'WhatsApp', icon: WhatsAppIcon, url: `https://api.whatsapp.com/send?text=${shareText}%20${encodedLink}` },
        { name: 'X', icon: Twitter, url: `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedLink}` },
        { name: 'Facebook', icon: Facebook, url: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}` },
    ];
    
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button size="icon" variant="outline"><Share2 className="h-4 w-4"/></Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
                <div className="flex gap-2">
                    {shareTargets.map(target => {
                        const Icon = target.icon;
                        return (
                            <Button key={target.name} size="icon" variant="ghost" asChild>
                                <a href={target.url} target="_blank" rel="noopener noreferrer">
                                    <Icon className="h-5 w-5" />
                                </a>
                            </Button>
                        )
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
}


export default function PublicUserProfilePage() {
    const params = useParams();
    const userId = params.userId as string;
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(() => (firestore && userId ? doc(firestore, 'users', userId) : null), [firestore, userId]);
    const { data: userData, isLoading } = useDoc<User>(userDocRef);

    if (isLoading) {
      return <ProfileSkeleton />;
    }

    if (!userData) {
      notFound();
    }
    
    const currentLevelKey = userData.affiliateLevel || 'برونزي';
    const currentLevel = AFFILIATE_LEVELS[currentLevelKey];
    const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002'}/auth/signup?ref=${userData.referralCode}`;

    const stats = [
        { label: 'المستوى التسويقي', value: currentLevelKey, icon: Crown },
        { label: 'إجمالي المدعوين', value: (userData.referralsCount || 0).toLocaleString(), icon: Users },
        { label: 'عمولة مباشرة', value: `${currentLevel.commission}%`, icon: BarChart },
    ];

    return (
        <div className="container max-w-2xl mx-auto py-12">
            <Card className="overflow-hidden shadow-2xl shadow-primary/10">
                <CardHeader className="items-center text-center p-8 bg-gradient-to-br from-primary/10 via-background to-background">
                    <Avatar className="h-24 w-24 border-4 border-primary/50">
                        <AvatarImage src={userData.avatarUrl} alt={userData.name} />
                        <AvatarFallback className="text-3xl">{userData.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-3xl font-headline mt-4">{userData.name}</CardTitle>
                    <CardDescription>مسوق في منصة حاجاتي</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        {stats.map(stat => {
                            const Icon = stat.icon;
                            return (
                                <div key={stat.label} className="p-4 bg-muted rounded-lg">
                                    <Icon className="h-8 w-8 text-primary mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                                    <p className="text-xl font-bold">{stat.value}</p>
                                </div>
                            )
                        })}
                    </div>
                     <div>
                        <Label htmlFor="referral-link" className="text-center block mb-2">انضم من خلالي واحصل على بداية قوية!</Label>
                        <div className="flex items-center gap-2">
                             <Input id="referral-link" readOnly value={referralLink} className="text-center font-mono" />
                             <CopyButton textToCopy={referralLink} />
                             <ShareButtons referralLink={referralLink} />
                        </div>
                     </div>
                      <Button asChild size="lg" className="w-full">
                        <Link href={referralLink}>
                           إنشاء حساب عبر {userData.name}
                        </Link>
                      </Button>
                </CardContent>
            </Card>
        </div>
    );
}
