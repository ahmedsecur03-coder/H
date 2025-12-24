'use client';

import { useState, useEffect } from 'react';
import type { Campaign, User as UserType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { addDoc, collection } from 'firebase/firestore';

type Platform = 'Google' | 'Facebook' | 'TikTok' | 'Snapchat';
type Goal = 'زيارات للموقع' | 'مشاهدات فيديو' | 'تفاعل مع المنشور' | 'زيادة الوعي' | 'تحويلات';


const platforms: { name: Platform; title: string }[] = [
    { name: 'Google', title: 'Google Ads' },
    { name: 'Facebook', title: 'Meta (Facebook & Instagram)' },
    { name: 'TikTok', title: 'TikTok Ads' },
    { name: 'Snapchat', title: 'Snapchat Ads' },
];

const goals: { name: Goal; title: string }[] = [
  { name: 'زيادة الوعي', title: 'زيادة الوعي' },
  { name: 'زيارات للموقع', title: 'زيارات للموقع' },
  { name: 'تفاعل مع المنشور', title: 'تفاعل مع المنشور' },
  { name: 'مشاهدات فيديو', title: 'مشاهدات فيديو' },
  { name: 'تحويلات', title: 'تحويلات' },
];

export function NewCampaignDialog({
  userData,
  children,
  onCampaignCreated
}: {
  userData: UserType;
  children: React.ReactNode;
  onCampaignCreated: () => void;
}) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [budget, setBudget] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!firestore || !user) {
        toast({ variant: 'destructive', title: "خطأ", description: "يجب تسجيل الدخول أولاً." });
        return;
    }

    const formData = new FormData(event.currentTarget);
    const campaignBudget = parseFloat(budget);

    if (!campaignBudget || campaignBudget <= 0) {
        toast({ variant: 'destructive', title: "خطأ", description: "الرجاء إدخال ميزانية صالحة." });
        return;
    }

    if (campaignBudget > userData.adBalance) {
        toast({ variant: 'destructive', title: "رصيد الإعلانات غير كافٍ", description: `الميزانية المطلوبة ${campaignBudget.toFixed(2)}$، بينما رصيدك الحالي ${userData.adBalance.toFixed(2)}$ فقط.` });
        return;
    }

    setLoading(true);

    const campaignData = {
      name: formData.get('name') as string,
      platform: formData.get('platform') as Platform,
      goal: formData.get('goal') as Goal,
      targetAudience: formData.get('targetAudience') as string,
      durationDays: parseInt(formData.get('durationDays') as string, 10),
    };
    
    const newCampaignData: Omit<Campaign, 'id' | 'agencyAccountId'> = {
        userId: user.uid,
        name: campaignData.name,
        platform: campaignData.platform,
        goal: campaignData.goal,
        targetAudience: campaignData.targetAudience,
        budget: campaignBudget,
        durationDays: campaignData.durationDays,
        startDate: new Date().toISOString(),
        spend: 0,
        status: 'بانتظار المراجعة',
        impressions: 0,
        clicks: 0,
        results: 0,
        ctr: 0,
        cpc: 0,
    };

    try {
        const campaignsColRef = collection(firestore, `users/${user.uid}/campaigns`);
        await addDoc(campaignsColRef, newCampaignData);

        toast({ title: "نجاح!", description: "تم استلام حملتك وستتم مراجعتها من قبل الإدارة." });
        onCampaignCreated();
        setOpen(false);
        (event.target as HTMLFormElement).reset();
        setBudget('');
    } catch (error: any) {
       const permissionError = new FirestorePermissionError({ 
          path: `users/${user.uid}/campaigns`, 
          operation: 'create',
          requestResourceData: newCampaignData
       });
       errorEmitter.emit('permission-error', permissionError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إنشاء حملة إعلانية جديدة</DialogTitle>
          <DialogDescription>
            املأ التفاصيل أدناه وسيقوم فريقنا بإطلاق حملتك.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
           <div className="space-y-2">
            <Label htmlFor="name">اسم الحملة</Label>
            <Input id="name" name="name" required placeholder="مثال: حملة إطلاق المنتج الجديد" />
          </div>

           <div className="space-y-2">
            <Label htmlFor="platform">المنصة الإعلانية</Label>
             <Select name="platform" required>
              <SelectTrigger id="platform">
                <SelectValue placeholder="اختر منصة إعلانية" />
              </SelectTrigger>
              <SelectContent>
                {platforms.map((p) => (
                  <SelectItem key={p.name} value={p.name}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">الهدف من الحملة</Label>
            <Select name="goal" required>
              <SelectTrigger id="goal">
                <SelectValue placeholder="اختر هدف الحملة" />
              </SelectTrigger>
              <SelectContent>
                {goals.map((g) => (
                  <SelectItem key={g.name} value={g.name}>
                    {g.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetAudience">الجمهور المستهدف</Label>
            <Textarea
              id="targetAudience"
              name="targetAudience"
              required
              placeholder="صف جمهورك المستهدف بالتفصيل (العمر، الاهتمامات، الموقع...)"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">الميزانية ($)</Label>
              <Input id="budget" name="budget" type="number" required min="5" value={budget} onChange={e => setBudget(e.target.value)} max={userData.adBalance}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationDays">مدة الحملة (أيام)</Label>
              <Input id="durationDays" name="durationDays" type="number" required min="1" />
            </div>
          </div>
           <p className="text-xs text-muted-foreground">ملاحظة: سيتم خصم الميزانية من "رصيد الإعلانات" الخاص بك (المتاح: ${userData.adBalance.toFixed(2)}) عند موافقة الإدارة.</p>

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="animate-spin" /> : 'إرسال الحملة للمراجعة'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
