'use client';

import { useState, useEffect, useReducer } from 'react';
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { runTransaction, collection, doc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import type { Campaign, User as UserType } from '@/lib/types';
import { Loader2, Wand2, CheckCircle, Hourglass } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type Platform = Campaign['platform'];
type Goal = Campaign['goal'];

const platforms: { name: Platform; title: string; }[] = [
    { name: 'TikTok', title: 'TikTok Ads' },
    { name: 'Facebook', title: 'Facebook & Instagram' },
    { name: 'Google', title: 'Google Ads' },
    { name: 'Snapchat', title: 'Snapchat Ads' },
];

const goals: { name: Goal; title: string }[] = [
    { name: 'زيادة الوعي', title: 'زيادة الوعي' },
    { name: 'زيارات للموقع', title: 'زيارات للموقع' },
    { name: 'تفاعل مع المنشور', title: 'تفاعل مع المنشور' },
    { name: 'مشاهدات فيديو', title: 'مشاهدات فيديو' },
    { name: 'تحويلات', title: 'تحويلات' },
];

const simulationSteps = [
  { duration: 15, text: "جاري تحليل الجمهور المستهدف..." },
  { duration: 10, text: "ربط الحساب الإعلاني..." },
  { duration: 20, text: "تطبيق استراتيجية الحملة..." },
  { duration: 15, text: "إعداد تقارير الأداء الأولية..." },
];

const totalSimulationTime = 60;

function SimulationView({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [currentStepText, setCurrentStepText] = useState(simulationSteps[0].text);
  const [timeLeft, setTimeLeft] = useState(totalSimulationTime);

  useEffect(() => {
    let elapsed = 0;
    let stepIndex = 0;

    const interval = setInterval(() => {
      elapsed++;
      
      const currentProgress = (elapsed / totalSimulationTime) * 100;
      setProgress(currentProgress);
      setTimeLeft(totalSimulationTime - elapsed);

      // Update step text
      let cumulativeDuration = 0;
      for (let i = 0; i < simulationSteps.length; i++) {
        cumulativeDuration += simulationSteps[i].duration;
        if (elapsed <= cumulativeDuration) {
          setCurrentStepText(simulationSteps[i].text);
          break;
        }
      }

      if (elapsed >= totalSimulationTime) {
        clearInterval(interval);
        setTimeout(onComplete, 1000); // Give a moment before calling complete
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 py-8">
       {progress < 100 ? (
          <Hourglass className="h-16 w-16 text-primary animate-spin" />
       ) : (
          <CheckCircle className="h-16 w-16 text-green-500" />
       )}
      <DialogTitle className="text-2xl font-headline">
          {progress < 100 ? "جاري مراجعة وتفعيل الحملة" : "تم تفعيل الحملة بنجاح!"}
      </DialogTitle>
      <div className="w-full space-y-2">
        <Progress value={progress} />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{currentStepText}</span>
          <span>{`الوقت المتبقي: ${timeLeft} ثانية`}</span>
        </div>
      </div>
      <p className="text-muted-foreground text-sm">
        يقوم نظامنا الذكي الآن بإعداد حملتك لضمان أفضل النتائج. لا تغلق هذه النافذة.
      </p>
    </div>
  );
}


export function NewCampaignDialog({ userData, user, onCampaignCreated, children }: { userData: UserType, user: any, onCampaignCreated: () => void, children: React.ReactNode }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [view, setView] = useState<'form' | 'simulation'>('form');
    const [name, setName] = useState('');
    const [platform, setPlatform] = useState<Platform | undefined>();
    const [goal, setGoal] = useState<Goal | undefined>();
    const [targetAudience, setTargetAudience] = useState('');
    const [budget, setBudget] = useState('');
    const [loading, setLoading] = useState(false);

    const resetForm = () => {
        setName('');
        setPlatform(undefined);
        setGoal(undefined);
        setTargetAudience('');
        setBudget('');
        setView('form');
        setLoading(false);
    }
    
    useEffect(() => {
      // Reset form when dialog is closed
      if(!open) {
        setTimeout(resetForm, 300);
      }
    }, [open]);

    const handleSimulationComplete = async () => {
        if (!firestore || !user) return;
        setLoading(true);
        
        const budgetAmount = parseFloat(budget);
        const userDocRef = doc(firestore, 'users', user.uid);
        const campaignsColRef = collection(firestore, `users/${user.uid}/campaigns`);

        try {
             await runTransaction(firestore, async (transaction) => {
                const userDoc = await transaction.get(userDocRef);
                if (!userDoc.exists()) throw new Error("المستخدم غير موجود.");

                const currentAdBalance = userDoc.data().adBalance ?? 0;
                if (currentAdBalance < budgetAmount) throw new Error("رصيد الإعلانات غير كاف.");

                transaction.update(userDocRef, { adBalance: currentAdBalance - budgetAmount });
                
                const newCampaignData: Omit<Campaign, 'id'> = {
                    userId: user.uid,
                    name,
                    platform: platform as Campaign['platform'],
                    goal: goal as Goal,
                    targetAudience,
                    startDate: new Date().toISOString(),
                    endDate: undefined,
                    budget: budgetAmount,
                    spend: 0,
                    status: 'نشط',
                    impressions: 0,
                    clicks: 0,
                    results: 0,
                    ctr: 0,
                    cpc: 0,
                };
                
                const newCampaignDoc = doc(campaignsColRef); 
                transaction.set(newCampaignDoc, newCampaignData);
            });
            
            toast({ title: 'نجاح!', description: 'تم إنشاء حملتك وتفعيلها تلقائياً.' });
            onCampaignCreated();
            setOpen(false);

        } catch (error: any) {
             if(error.message.includes('رصيد')) {
                 toast({ variant: 'destructive', title: 'فشل تفعيل الحملة', description: error.message });
            } else {
                const permissionError = new FirestorePermissionError({ path: userDocRef.path, operation: 'update' });
                errorEmitter.emit('permission-error', permissionError);
            }
        } finally {
            setLoading(false);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const budgetAmount = parseFloat(budget);

        if (!user || !name || !platform || !goal || !targetAudience || !budgetAmount || budgetAmount <= 0) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء ملء جميع الحقول بشكل صحيح.' });
            return;
        }

        if ((userData.adBalance ?? 0) < budgetAmount) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'رصيدك الإعلاني غير كافٍ لهذه الميزانية.' });
            return;
        }
        
        // Don't set loading here, just switch the view
        setView('simulation');
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className={cn(view === 'simulation' && 'max-w-md')}>
                {view === 'form' ? (
                <>
                    <DialogHeader>
                        <DialogTitle>حملة إعلانية جديدة</DialogTitle>
                        <DialogDescription>
                            اختر المنصة وحدد ميزانية حملتك للبدء. سيتم خصم الميزانية من رصيد الإعلانات بعد المراجعة.
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
                                {loading ? <Loader2 className="animate-spin" /> : 'بدء المراجعة والتفعيل'}
                            </Button>
                        </DialogFooter>
                    </form>
                </>
                ) : (
                    <SimulationView onComplete={handleSimulationComplete} />
                )}
            </DialogContent>
        </Dialog>
    )
}
