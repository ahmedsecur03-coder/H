
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  Package,
  ShoppingCart,
  Gem,
  Percent,
  Loader2,
  Users,
  Trophy,
  Rocket,
  Shield,
  Star,
  Sparkles,
  Diamond,
  Megaphone,
  BookOpen,
  ArrowLeft,
  Check,
  Zap,
  Palette,
  Briefcase,
  Gamepad2,
  MapPin,
  Clapperboard,
  Bot
} from 'lucide-react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, limit, runTransaction, where, addDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import type { User as UserType, Order, Service, BlogPost } from '@/lib/types';
import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';

const PLATFORM_ICONS: { [key: string]: React.ElementType } = {
  Instagram: () => <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Instagram</title><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.123 1.382S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.382 2.123.665.665 1.336 1.076 2.123 1.382.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.717 2.123-1.382.665-.665 1.076-1.336 1.382-2.123.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.148-.558-2.913-.306-.789-.717-1.459-1.382-2.123C21.314.935 20.643.524 19.86.22c-.765-.296-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.854 0-3.195.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.165 1.051-.36 2.225-.413C8.414 2.18 8.79 2.16 12 2.16zm0 3.24c-3.35,0-6.06,2.71-6.06,6.06s2.71,6.06,6.06,6.06,6.06-2.71,6.06-6.06-2.71-6.06-6.06-6.06zm0 9.99c-2.187,0-3.937-1.75-3.937-3.937s1.75-3.937,3.937-3.937,3.937,1.75,3.937,3.937-1.75,3.937-3.937,3.937zm4.838-9.42c-.78,0-1.418-.638-1.418-1.418s.638-1.418,1.418-1.418,1.418.638,1.418,1.418-.638,1.418-1.418,1.418z"/></svg>,
  TikTok: () => <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>TikTok</title><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71v-2.12c.81.07 1.65.16 2.48.21.02-1.58.02-3.16 0-4.75-.01-1.19-.42-2.37-1.12-3.32-1.3-1.83-3.54-2.79-5.73-2.52v-4.14c1.44.02 2.89.33 4.2.91.56.25 1.09.57 1.6.91.02-2.92-.01-5.84.02-8.75Z"/></svg>,
  Facebook: () => <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Facebook</title><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  YouTube: () => <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>YouTube</title><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
  Telegram: () => <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Telegram</title><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.17.9-.502 1.203-1.03 1.23-.914.05-1.58-.59-2.454-1.192-.34-.23-.656-.47-.93-.728-.532-.49-1.07-1.002-1.594-1.504l-.014-.01zM18.82 5.98a.936.936 0 0 1 .373.237.466.466 0 0 1 .116.426c-.01.093-.053.315-.084.471l-1.99 9.4c-.23.94-.685 1.15-1.21.738-1.504-1.18-2.903-2.28-4.14-3.266-.37-.306-1.15-1.01-1.12-1.623.04-1.04 1.58-1.5 2.1-1.78 3.8-1.9 4.3-2.1.32-.21zM9.13 13.928l.013.013c.21.18.42.36.64.54.34.28.68.56 1.02.84zm-2.12 1.04l.325.26s.013.01.026.02c.026.01.053.03.08.04l.025.013s.013.01.026.013a.475.475 0 0 1 .052.026c.013.004.026.01.04.013.092.03.184.04.276.04.106 0 .2-.02.293-.05.013-.004.026-.01.04-.013l.025-.013c.013 0 .026-.004.04-.013a.496.496 0 0 1 .13-.052l.013-.004c.013 0 .026-.004.04-.013l.275-.12c.013-.01.026-.01.04-.02.09-.05.17-.11.26-.18.013-.01.026-.01.04-.02l.143-.1c.013-.01.026-.01.04-.02a.84.84 0 0 1 .235-.18c.013-.01.026-.01.04-.02l.09-.08a.939.939 0 0 1 .066-.06l.013-.013.026-.026.013-.013c.013 0 .013-.01.026-.013l.013-.013c.013-.01.026-.01.026-.026.013-.01.026-.02.026-.026a.58.58 0 0 1 .013-.026c.013-.01.013-.01.013-.026v-.013c.013-.01.013-.02.013-.026v-.013c.013-.01.013-.02.013-.026v-.013c.013-.01.013-.02.013-.026l.013-.013v-.013c.013-.01.013-.02.013-.026v-.013c.013-.01.013-.02.013-.026l.013-.013c.013-.01.013-.02.013-.026l.013-.013c.013-.01.013-.02.013-.026l.013-.013c.013-.01.013-.02.013-.026l.013-.013c.013-.01.013-.02.013-.026l.013-.013c.013-.01.013-.02.013-.026l.013-.013c.013-.01.013-.02.013-.026l.013-.013c.013-.01.013-.02.013-.026l.013-.013c.013-.01.013-.02.013-.026l.013-.013c.013-.01.013-.02.013-.026l.013-.013c.013-.01.013-.02.013-.026l.013-.013c.013-.01.013-.02.013-.026l.013-.013c.013-.01.013-.02.013-.026l.013-.013c.013-.01.013-.02.013-.026l.-2.484c-.013-.01-.013-.026-.026-.04l-.013-.013s-.013-.013-.013-.026l-.013-.013s-.013-.013-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.276.276 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.343.343 0 0 1-.052-.052l-.013-.013c-.013-.013-.026-.026-.04-.04a.295.295 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.328.328 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.295.295 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.328.328 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.295.295 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.328.328 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.295.295 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.328.328 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.295.295 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.328.328 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.295.295 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.328.328 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.295.295 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.328.328 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.295.295 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.328.328 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.295.295 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.328.328 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.295.295 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.328.328 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.295.295 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.328.328 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.295.295 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.328.328 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.295.295 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.328.328 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.295.295 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.328.328 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.295.295 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.328.328 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.295.295 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.328.328 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.295.295 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.328.328 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.295.295 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.328.328 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.295.295 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.328.328 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.295.295 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.328.328 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.295.295 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.328.328 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.295.295 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.328.328 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.295.295 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.328.328 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.295.295 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.328.328 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.295.295 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.328.328 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.295.295 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.328.328 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.295.295 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.328.328 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.295.295 0 0 1-.026-.026l-.013-.013c-.013-.013-.026-.026-.04-.04a.328.328 ..."/></svg>,
};

const RANKS: { name: UserType['rank']; spend: number; discount: number, reward: number }[] = [
  { name: 'مستكشف نجمي', spend: 0, discount: 0, reward: 0 },
  { name: 'قائد صاروخي', spend: 500, discount: 2, reward: 5 },
  { name: 'سيد المجرة', spend: 2500, discount: 5, reward: 20 },
  { name: 'سيد كوني', spend: 10000, discount: 10, reward: 50 },
];

const AFFILIATE_LEVELS = {
    'برونزي': { commission: 10 },
    'فضي': { commission: 12 },
    'ذهبي': { commission: 15 },
    'ماسي': { commission: 20 },
};


function getRankForSpend(spend: number) {
  let currentRank = RANKS[0];
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (spend >= RANKS[i].spend) {
      currentRank = RANKS[i];
      break;
    }
  }
  return currentRank;
}


function QuickOrderForm({ user, userData }: { user: any, userData: UserType }) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedPlatform, setSelectedPlatform] = useState<string | undefined>();
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>();
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState('');
  const [cost, setCost] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries for services
  const servicesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'services') : null, [firestore]);
  const { data: allServices, isLoading: servicesLoading } = useCollection<Service>(servicesQuery);
  
  const platforms = useMemo(() => {
      if (!allServices) return [];
      const platformSet = new Set(allServices.map(s => s.platform));
      return Array.from(platformSet);
  }, [allServices]);

  const servicesForPlatform = useMemo(() => {
      if (!selectedPlatform || !allServices) return [];
      return allServices.filter(s => s.platform === selectedPlatform);
  }, [selectedPlatform, allServices]);

  const selectedService = useMemo(() => {
    return selectedServiceId ? allServices?.find(s => s.id === selectedServiceId) : null;
  }, [allServices, selectedServiceId]);
  
  const rank = getRankForSpend(userData?.totalSpent ?? 0);
  const discountPercentage = rank.discount / 100;

  // Calculate cost
  useEffect(() => {
    if (selectedService && quantity) {
      const numQuantity = parseInt(quantity, 10);
      if (!isNaN(numQuantity)) {
        const baseCost = (numQuantity / 1000) * selectedService.price;
        const discount = baseCost * discountPercentage;
        setCost(baseCost - discount);
      }
    } else {
      setCost(0);
    }
  }, [selectedService, quantity, discountPercentage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !selectedService || !link || !quantity) {
      toast({ variant: "destructive", title: "خطأ", description: "يرجى ملء جميع الحقول." });
      return;
    }
    
    const numQuantity = parseInt(quantity, 10);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      toast({ variant: "destructive", title: "خطأ", description: "الكمية يجب أن تكون رقماً صحيحاً." });
      return;
    }

    if (numQuantity < selectedService.min || numQuantity > selectedService.max) {
       toast({ variant: "destructive", title: "خطأ", description: `الكمية خارج الحدود المسموحة (${selectedService.min} - ${selectedService.max}).` });
      return;
    }

    if (userData.balance < cost) {
      toast({ variant: "destructive", title: "خطأ", description: "رصيدك غير كافٍ لإتمام هذا الطلب." });
      return;
    }

    setIsSubmitting(true);

    try {
        let promotionToast: { title: string; description: string } | null = null;
        await runTransaction(firestore, async (transaction) => {
            const userDocRef = doc(firestore, "users", user.uid);
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) throw new Error("المستخدم غير موجود.");
            
            const currentData = userDoc.data() as UserType;
            const currentBalance = currentData.balance;

            if (currentBalance < cost) throw new Error("رصيدك غير كافٍ.");

            const newBalance = currentBalance - cost;
            const newTotalSpent = currentData.totalSpent + cost;
            const oldRank = getRankForSpend(currentData.totalSpent);
            const newRank = getRankForSpend(newTotalSpent);
            
            const updates: Partial<UserType> = {
                balance: newBalance,
                totalSpent: newTotalSpent,
            };

            if (newRank.name !== oldRank.name) {
                updates.rank = newRank.name;
                if (newRank.reward > 0) {
                    updates.adBalance = (currentData.adBalance || 0) + newRank.reward;
                    promotionToast = {
                        title: `🎉 ترقية! أهلاً بك في رتبة ${newRank.name}`,
                        description: `لقد حصلت على مكافأة ${newRank.reward}$ في رصيد إعلاناتك!`,
                    };
                }
            }

            transaction.update(userDocRef, updates);

            const newOrderRef = doc(collection(firestore, `users/${user.uid}/orders`));
            const newOrder: Omit<Order, 'id'> = {
                userId: user.uid,
                serviceId: selectedService.id,
                serviceName: `${selectedService.platform} - ${selectedService.category}`,
                link: link,
                quantity: numQuantity,
                charge: cost,
                orderDate: new Date().toISOString(),
                status: 'قيد التنفيذ',
            };
            transaction.set(newOrderRef, newOrder);

             // Affiliate Commission Logic
            if (currentData.referrerId) {
                const referrerRef = doc(firestore, 'users', currentData.referrerId);
                const referrerDoc = await transaction.get(referrerRef);
                if (referrerDoc.exists()) {
                    const referrerData = referrerDoc.data() as UserType;
                    const affiliateLevel = referrerData.affiliateLevel || 'برونزي';
                    const commissionRate = (AFFILIATE_LEVELS[affiliateLevel as keyof typeof AFFILIATE_LEVELS]?.commission || 10) / 100;
                    const commissionAmount = cost * commissionRate;

                    transaction.update(referrerRef, {
                        affiliateEarnings: (referrerData.affiliateEarnings || 0) + commissionAmount
                    });

                    const newTransactionRef = doc(collection(firestore, `users/${referrerData.id}/affiliateTransactions`));
                    transaction.set(newTransactionRef, {
                        userId: referrerData.id,
                        referralId: user.uid,
                        orderId: newOrderRef.id,
                        amount: commissionAmount,
                        transactionDate: new Date().toISOString(),
                        level: 1 // Assuming direct referral for now
                    });
                }
            }
        });

        toast({ title: "تم إرسال الطلب بنجاح!", description: `التكلفة: $${cost.toFixed(2)}` });
        if(promotionToast) {
            setTimeout(() => toast(promotionToast), 1000);
        }

        // Reset form
        setSelectedPlatform(undefined);
        setSelectedServiceId(undefined);
        setLink('');
        setQuantity('');
        setCost(0);
    } catch (error: any) {
        console.error("Order submission error:", error);
        toast({ variant: "destructive", title: "فشل إرسال الطلب", description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">تقديم طلب جديد</CardTitle>
        <CardDescription>اختر المنصة، ثم الفئة، ثم الخدمة لبدء طلبك.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
            <div className='flex items-center gap-2 overflow-x-auto pb-2'>
                 {platforms.map(p => {
                    const Icon = PLATFORM_ICONS[p] || Package;
                    return (
                        <Button key={p} variant={selectedPlatform === p ? 'default' : 'outline'} onClick={() => setSelectedPlatform(p)} className="flex items-center gap-2 shrink-0">
                           <Icon className="h-4 w-4" />
                           <span>{p}</span>
                        </Button>
                    )
                 })}
            </div>

            {selectedPlatform && (
                <div className="grid gap-2">
                    <Label htmlFor="service">الخدمة</Label>
                    <Select onValueChange={setSelectedServiceId} value={selectedServiceId}>
                    <SelectTrigger id="service">
                        <SelectValue placeholder="اختر الخدمة المطلوبة" />
                    </SelectTrigger>
                    <SelectContent>
                        {servicesForPlatform.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                            {s.category} - ${s.price}/1k
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
            )}
              
              {selectedServiceId && (
                <>
                    <div className="grid gap-2">
                        <Label htmlFor="link">الرابط</Label>
                        <Input id="link" placeholder="https://..." value={link} onChange={(e) => setLink(e.target.value)} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="quantity">الكمية</Label>
                        <Input id="quantity" type="number" placeholder="1000" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                        {selectedService && <p className="text-xs text-muted-foreground">الحدود: {selectedService.min} - {selectedService.max}</p>}
                    </div>
                    <div className="text-sm font-medium text-center p-2 bg-muted rounded-md">
                        التكلفة التقديرية: <span className="text-primary">${cost.toFixed(2)}</span> (خصم {discountPercentage}%)
                    </div>
                    <Button type="submit" className="w-full bg-primary/90 hover:bg-primary text-primary-foreground" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'شراء الخدمة'}
                    </Button>
                </>
              )}
        </form>
      </CardContent>
    </Card>
  );
}


function QuickOrderFormSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    <div className='flex items-center gap-2'>
                        {Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-10 w-24" />)}
                    </div>
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
        </Card>
    );
}

export default function DashboardPage() {
  const { user: authUser, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null),
    [firestore, authUser]
  );
  const { data: userData, isLoading: isUserLoading } = useDoc<UserType>(userDocRef);

  const ordersQuery = useMemoFirebase(
    () => (firestore && authUser ? query(collection(firestore, 'users', authUser.uid, 'orders'), orderBy('orderDate', 'desc'), limit(5)) : null),
    [firestore, authUser]
  );
  const { data: recentOrders, isLoading: isOrdersLoading } = useCollection<Order>(ordersQuery);

  const isLoading = isAuthLoading || isUserLoading || isOrdersLoading;
  
  if (isLoading || !userData || !authUser) {
    return (
      <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3 pb-4">
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
            <div className='mb-4'>
                <Skeleton className="h-8 w-1/4 mb-2" />
                <Skeleton className="h-5 w-1/2" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[120px]" />)}
            </div>
             <QuickOrderFormSkeleton />
        </div>
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-1">
          <Skeleton className="h-[150px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }
  
  const rank = getRankForSpend(userData?.totalSpent ?? 0);
  
  const achievements = [
    { icon: Rocket, title: "المنطلق الصاروخي", completed: (recentOrders?.length || 0) > 0 },
    { icon: Shield, title: "المستخدم الموثوق", completed: (recentOrders?.length || 0) >= 10 },
    { icon: ShoppingCart, title: "سيد الطلبات", completed: (recentOrders?.length || 0) >= 50 },
    { icon: Star, title: "النجم الصاعد", completed: (userData.totalSpent || 0) >= 100 },
    { icon: DollarSign, title: "ملك الإنفاق", completed: (userData.totalSpent || 0) >= 1000 },
    { icon: Sparkles, title: "العميل المميز", completed: (userData.rank) === 'سيد المجرة' },
    { icon: Diamond, title: "الأسطورة الكونية", completed: (userData.rank) === 'سيد كوني' },
    { icon: Users, title: "المسوق الشبكي", completed: (userData.referralsCount || 0) >= 5 },
  ];
  
  const statusVariant = {
    'مكتمل': 'default',
    'قيد التنفيذ': 'secondary',
    'ملغي': 'destructive',
    'جزئي': 'outline',
  } as const;


  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3 pb-4">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
            <div className='mb-4'>
                <h1 className='text-3xl font-bold'>أهلاً بك، {userData?.name || 'Hagaaty'}!</h1>
                <p className='text-muted-foreground'>هنا ملخص سريع لحسابك. انطلق واستكشف خدماتنا.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>الرصيد الأساسي</CardDescription>
                        <CardTitle className="text-3xl">${(userData?.balance ?? 0).toFixed(2)}</CardTitle>
                    </CardHeader>
                </Card>
                 <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>الرصيد الإعلاني</CardDescription>
                        <CardTitle className="text-3xl">${(userData?.adBalance ?? 0).toFixed(2)}</CardTitle>
                    </CardHeader>
                </Card>
                 <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>إجمالي الإنفاق</CardDescription>
                        <CardTitle className="text-3xl">${(userData?.totalSpent ?? 0).toFixed(2)}</CardTitle>
                    </CardHeader>
                </Card>
                 <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>رتبتك الكونية</CardDescription>
                        <CardTitle className="text-3xl text-primary">{rank.name}</CardTitle>
                    </CardHeader>
                </Card>
            </div>
        
        <QuickOrderForm user={authUser} userData={userData} />

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">آخر 5 طلبات</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الخدمة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left">التكلفة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders && recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.serviceName}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[order.status] || 'default'}>{order.status}</Badge>
                      </TableCell>
                      <TableCell className="text-left">${order.charge.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center h-24">
                      لا توجد طلبات لعرضها.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-1">
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>الإنجازات الكونية</span>
                    <Trophy className="text-primary"/>
                </CardTitle>
                 <CardDescription>أكملت {achievements.filter(a => a.completed).length} من {achievements.length} إنجازات</CardDescription>
            </CardHeader>
            <CardContent className='grid grid-cols-4 gap-4'>
                 {achievements.map((ach, i) => (
                    <TooltipProvider key={i}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className={cn(
                                    'flex flex-col items-center justify-center gap-1 p-2 rounded-lg aspect-square border-2 transition-all',
                                    ach.completed ? 'border-primary/50 bg-primary/20 text-primary' : 'border-transparent bg-muted text-muted-foreground'
                                )}>
                                    <ach.icon className="h-6 w-6" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{ach.title}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

