'use client';

import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Loader2 } from 'lucide-react';
import { claimDailyReward } from '@/lib/actions';
import type { User as UserType } from '@/lib/types';


export function DailyRewardCard({ user }: { user: UserType }) {
    const { toast } = useToast();
    const router = useRouter();
    const [isClaiming, setIsClaiming] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');

    const canClaim = useMemo(() => {
        if (!user.lastRewardClaimedAt) return true;
        const lastClaimedTime = new Date(user.lastRewardClaimedAt).getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        return Date.now() - lastClaimedTime > twentyFourHours;
    }, [user.lastRewardClaimedAt]);

    useEffect(() => {
        if (canClaim || !user.lastRewardClaimedAt) return;

        const intervalId = setInterval(() => {
            const lastClaimedTime = new Date(user.lastRewardClaimedAt!).getTime();
            const twentyFourHours = 24 * 60 * 60 * 1000;
            const nextClaimTime = lastClaimedTime + twentyFourHours;
            const now = Date.now();
            const remaining = nextClaimTime - now;

            if (remaining <= 0) {
                setTimeLeft('');
                clearInterval(intervalId);
            } else {
                const hours = Math.floor(remaining / (1000 * 60 * 60));
                const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
                setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, [canClaim, user.lastRewardClaimedAt]);

    const handleClaim = async () => {
        setIsClaiming(true);
        try {
            await claimDailyReward(user.id);
            toast({ title: '🎉 تم بنجاح!', description: 'تمت إضافة 1$ لرصيد إعلاناتك!' });
            router.refresh(); // Refresh server components
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'خطأ', description: error.message });
        } finally {
            setIsClaiming(false);
        }
    };

    return (
        <Card className="bg-gradient-to-br from-secondary/30 to-background">
            <CardHeader>
                <CardTitle className="flex items-center justify-between font-headline">
                    <span>المكافأة الكونية اليومية</span>
                    <Gift className="text-primary"/>
                </CardTitle>
                <CardDescription>
                    اطلب مكافأتك اليومية واحصل على 1$ في رصيد الإعلانات.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button className="w-full text-lg" onClick={handleClaim} disabled={!canClaim || isClaiming}>
                    {isClaiming ? <Loader2 className="animate-spin" /> : canClaim ? 'اطلب مكافأتك الآن!' : `عد بعد: ${timeLeft}`}
                </Button>
            </CardContent>
        </Card>
    );
}
