'use client';

import { useState } from 'react';
import type { Campaign, User as UserType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { useUser, useFirestore, errorEmitter, FirestorePermissionError, useDoc, useMemoFirebase } from '@/firebase';
import { addDoc, collection, doc } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';
import { PLATFORM_ICONS } from '@/lib/icon-data';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';


type Platform = 'Google' | 'Facebook' | 'TikTok' | 'Snapchat';
type Goal = string; // Goal is now a generic string

// --- Platform-specific configurations ---
const platformConfig = {
  Facebook: {
    title: 'Meta (Facebook & Instagram)',
    enabled: true,
    goals: [
      'زيادة الوعي', 
      'زيارات للموقع', 
      'تفاعل مع المنشور', 
      'مشاهدات فيديو', 
      'تحويلات',
      'رسائل'
    ],
    linkField: {
        label: "رابط المنشور أو الموقع",
        placeholder: "https://instagram.com/p/..."
    }
  },
  Google: {
    title: 'Google Ads',
    enabled: true,
    goals: [
      'حملة بحث',
      'حملة أداء أقصى (Performance Max)',
      'حملة فيديو (YouTube)',
      'حملة تسوق',
      'حملة تطبيقات',
      'مكالمات هاتفية',
    ],
     linkField: {
        label: "رابط الموقع الإلكتروني",
        placeholder: "https://your-business.com"
    }
  },
  TikTok: {
    title: 'TikTok Ads',
    enabled: true,
    goals: [
      'الوصول', 
      'زيارات للموقع', 
      'مشاهدات فيديو', 
      'تفاعل المجتمع', 
      'الترويج للتطبيق',
      'تحويلات'
    ],
    linkField: {
        label: "رابط فيديو تيك توك أو الموقع",
        placeholder: "https://tiktok.com/@user/video/..."
    }
  },
  Snapchat: {
    title: 'Snapchat Ads',
    enabled: true,
    goals: [
      'زيادة الوعي', 
      'زيارات للموقع', 
      'مشاهدات فيديو', 
      'تثبيت التطبيق', 
      'الفلاتر والعدسات'
    ],
     linkField: {
        label: "رابط الموقع أو العدسة",
        placeholder: "https://snapchat.com/unlock/..."
    }
  },
};
// --- ---

const ageRanges = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
const genders = ["الكل", "رجال", "نساء"];

function NewCampaignPageSkeleton() {
    return (
        <div className="space-y-6 pb-8">
            <Skeleton className="h-9 w-1/3" />
            <Skeleton className="h-64 w-full" />
        </div>
    )
}

export default function NewCampaignPage() {
    const { toast } = useToast();
    const { user: authUser, isUserLoading } = useUser();
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(() => (authUser ? doc(firestore, 'users', authUser.uid) : null), [authUser, firestore]);
    const { data: userData, isLoading: isUserDataLoading } = useDoc<UserType>(userDocRef);

    const [step, setStep] = useState(1);
    const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
    const [loading, setLoading] = useState(false);
    
    const currentConfig = selectedPlatform ? platformConfig[selectedPlatform] : null;

    const handlePlatformSelect = (platform: Platform) => {
        setSelectedPlatform(platform);
        setStep(2);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!firestore || !authUser || !selectedPlatform) {
            toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ غير متوقع." });
            return;
        }

        const formData = new FormData(event.currentTarget);
        const budget = parseFloat(formData.get('budget') as string);
        const durationDays = parseInt(formData.get('durationDays') as string, 10);
        
        if (!userData || userData.adBalance < budget) {
            toast({ variant: "destructive", title: "رصيد الإعلانات غير كافٍ", description: `الميزانية المطلوبة ${budget.toFixed(2)}$، بينما رصيدك الحالي ${userData?.adBalance.toFixed(2)}$ فقط.` });
            return;
        }

        setLoading(true);

        const campaignData: Partial<Campaign> = {
            userId: authUser.uid,
            name: formData.get('name') as string,
            platform: selectedPlatform,
            goal: formData.get('goal') as Goal,
            budget,
            durationDays,
            adLink: formData.get('adLink') as string,
            targetCountry: formData.get('targetCountry') as string,
            targetAge: formData.get('targetAge') as string,
            targetGender: formData.get('targetGender') as 'الكل' | 'رجال' | 'نساء',
            targetInterests: formData.get('targetInterests') as string,
            startDate: new Date().toISOString(),
            spend: 0,
            status: 'بانتظار المراجعة',
            impressions: 0, clicks: 0, results: 0, ctr: 0, cpc: 0, targetAudience: ''
        };
        
        try {
            const campaignsColRef = collection(firestore, `users/${authUser.uid}/campaigns`);
            await addDoc(campaignsColRef, campaignData);
            toast({ title: "نجاح!", description: "تم استلام حملتك وستتم مراجعتها من قبل الإدارة." });
            setStep(3); // Go to success step
        } catch (error) {
            const permissionError = new FirestorePermissionError({ path: `users/${authUser.uid}/campaigns`, operation: 'create', requestResourceData: campaignData });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setLoading(false);
        }
    };

    const isLoading = isUserLoading || isUserDataLoading;
    if (isLoading) {
        return <NewCampaignPageSkeleton />;
    }

    return (
        <div className="space-y-6 pb-8 max-w-4xl mx-auto">
             <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">إنشاء حملة إعلانية جديدة</h1>
                <p className="text-muted-foreground">
                 ابدأ باختيار المنصة التي تريد الإعلان عليها.
                </p>
            </div>

            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                         <Card>
                            <CardHeader><CardTitle>الخطوة 1: اختر منصة الإعلان</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {(Object.keys(platformConfig) as Platform[]).map((p) => {
                                    const config = platformConfig[p];
                                    const Icon = PLATFORM_ICONS[p];
                                    return (
                                        <button
                                            key={p}
                                            onClick={() => config.enabled && handlePlatformSelect(p)}
                                            disabled={!config.enabled}
                                            className={cn(
                                                "p-6 border rounded-lg text-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed",
                                                config.enabled ? "hover:border-primary hover:bg-primary/10 hover:scale-105" : "bg-muted/50"
                                            )}
                                        >
                                            <Icon className="h-12 w-12 mx-auto mb-2" />
                                            <p className="font-semibold">{config.title}</p>
                                            {!config.enabled && <p className="text-xs text-muted-foreground">(قريباً)</p>}
                                        </button>
                                    );
                                })}
                            </CardContent>
                         </Card>
                    </motion.div>
                )}

                {step === 2 && selectedPlatform && currentConfig && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
                        <form onSubmit={handleSubmit}>
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                         <button type="button" onClick={() => setStep(1)} className="text-muted-foreground hover:text-foreground"><ArrowRight className="h-5 w-5" /></button>
                                        <div>
                                            <CardTitle>الخطوة 2: تفاصيل حملة {currentConfig.title}</CardTitle>
                                            <CardDescription>املأ بيانات حملتك. سيتم حجز الميزانية من رصيد إعلاناتك (${userData?.adBalance.toFixed(2)}) عند موافقة الإدارة.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* General Fields */}
                                    <div className="space-y-2"><Label htmlFor="name">اسم الحملة</Label><Input id="name" name="name" required placeholder="مثال: حملة تخفيضات الصيف" /></div>
                                    <div className="space-y-2"><Label htmlFor="goal">الهدف من الحملة</Label><Select name="goal" required><SelectTrigger id="goal"><SelectValue placeholder="اختر هدف" /></SelectTrigger><SelectContent>{currentConfig.goals.map((g) => (<SelectItem key={g} value={g}>{g}</SelectItem>))}</SelectContent></Select></div>
                                    <div className="space-y-2"><Label htmlFor="adLink">{currentConfig.linkField.label}</Label><Input id="adLink" name="adLink" required placeholder={currentConfig.linkField.placeholder} /></div>
                                    
                                    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                                        <h4 className="font-semibold">إعدادات الاستهداف</h4>
                                        <div className="space-y-2"><Label htmlFor="targetCountry">الدولة</Label><Input id="targetCountry" name="targetCountry" required placeholder="مثال: مصر, السعودية" /></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2"><Label htmlFor="targetAge">الفئة العمرية</Label><Select name="targetAge" required><SelectTrigger id="targetAge"><SelectValue placeholder="اختر الأعمار" /></SelectTrigger><SelectContent>{ageRanges.map(age => <SelectItem key={age} value={age}>{age}</SelectItem>)}</SelectContent></Select></div>
                                            <div className="space-y-2"><Label htmlFor="targetGender">الجنس</Label><Select name="targetGender" required defaultValue="الكل"><SelectTrigger id="targetGender"><SelectValue /></SelectTrigger><SelectContent>{genders.map(gender => <SelectItem key={gender} value={gender}>{gender}</SelectItem>)}</SelectContent></Select></div>
                                        </div>
                                        <div className="space-y-2"><Label htmlFor="targetInterests">الاهتمامات (اختياري)</Label><Textarea id="targetInterests" name="targetInterests" placeholder="اكتب الاهتمامات مفصولة بفاصلة (مثال: كرة القدم, التسويق)" /></div>
                                    </div>
                                   

                                    <Separator />

                                    {/* Budget Fields */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label htmlFor="budget">الميزانية ($)</Label><Input id="budget" name="budget" type="number" required min="5" max={userData?.adBalance} /></div>
                                        <div className="space-y-2"><Label htmlFor="durationDays">مدة الحملة (أيام)</Label><Input id="durationDays" name="durationDays" type="number" required min="1" defaultValue="7" /></div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" disabled={loading} className="w-full">
                                        {loading ? <Loader2 className="animate-spin" /> : 'إرسال الحملة للمراجعة'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </form>
                    </motion.div>
                )}

                 {step === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                        <Card>
                            <CardContent className="p-10">
                                 <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto">
                                     <Rocket className="h-8 w-8" />
                                 </div>
                                <h2 className="text-2xl font-bold mt-4">تم استلام حملتك بنجاح!</h2>
                                <p className="text-muted-foreground mt-2">
                                    قام فريقنا باستلام طلب حملتك الإعلانية، وستتم مراجعتها وتفعيلها في أقرب وقت ممكن. يمكنك متابعة حالتها من صفحة إدارة الحملات.
                                </p>
                                <div className="flex gap-4 justify-center mt-6">
                                    <Button asChild><Link href="/dashboard/campaigns">العودة إلى الحملات</Link></Button>
                                    <Button variant="outline" onClick={() => { setSelectedPlatform(null); setStep(1); }}>إنشاء حملة أخرى</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
