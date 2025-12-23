'use client';

import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import type { Campaign, User as UserType } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createCampaign } from '../actions';

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

export function NewCampaignDialog({ userData, children, onCampaignCreated }: { userData: UserType, children: React.ReactNode, onCampaignCreated: () => void }) {
    const { user } = useUser();
    const { toast } = useToast();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [platform, setPlatform] = useState<Platform | undefined>();
    const [goal, setGoal] = useState<Goal | undefined>();
    const [targetAudience, setTargetAudience] = useState('');
    const [budget, setBudget] = useState('');
    const [durationDays, setDurationDays] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const budgetAmount = parseFloat(budget);
        const duration = parseInt(durationDays, 10);

        if (!user || !name || !platform || !goal || !targetAudience || !budgetAmount || budgetAmount <= 0 || !duration || duration <= 0) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء ملء جميع الحقول بشكل صحيح.' });
            return;
        }

        if ((userData.adBalance ?? 0) < budgetAmount) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'رصيدك الإعلاني غير كافٍ لهذه الميزانية.' });
            return;
        }

        setLoading(true);
        
        try {
            const result = await createCampaign({
                name,
                platform,
                goal,
                targetAudience,
                budgetAmount,
                duration,
            });

            if (result.success) {
                 toast({ title: 'نجاح!', description: result.message });
                 setOpen(false);
                 setName(''); setPlatform(undefined); setGoal(undefined); setTargetAudience(''); setBudget(''); setDurationDays('');
                 // onCampaignCreated is implicitly handled by revalidatePath in the server action
            }

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
                        اختر المنصة وحدد ميزانية حملتك ومدتها للبدء. سيتم خصم الميزانية من رصيد الإعلانات.
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
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="budget">الميزانية ($)</Label>
                            <Input id="budget" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} required min="5" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="duration">المدة (أيام)</Label>
                            <Input id="duration" type="number" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} required min="1" />
                        </div>
                    </div>
                     <p className="text-xs text-muted-foreground">رصيدك الإعلاني الحالي: ${userData.adBalance?.toFixed(2) ?? '0.00'}</p>
                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? <Loader2 className="animate-spin" /> : 'إنشاء وتفعيل'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
