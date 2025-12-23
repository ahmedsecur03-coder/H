'use client';

import { useState } from 'react';
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!firestore || !user) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'يجب أن تكون مسجلاً للدخول لإنشاء حملة.' });
        return;
    }

    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const campaignData = {
      name: formData.get('name') as string,
      platform: formData.get('platform') as Platform,
      goal: formData.get('goal') as Goal,
      targetAudience: formData.get('targetAudience') as string,
      budget: parseFloat(formData.get('budget') as string),
      durationDays: parseInt(formData.get('durationDays') as string, 10),
    };
    
    const campaignsColRef = collection(firestore, `users/${user.uid}/campaigns`);
    const newCampaignData: Omit<Campaign, 'id'> = {
        userId: user.uid,
        name: campaignData.name,
        platform: campaignData.platform,
        goal: campaignData.goal,
        targetAudience: campaignData.targetAudience,
        budget: campaignData.budget,
        durationDays: campaignData.durationDays,
        startDate: new Date().toISOString(),
        endDate: undefined,
        spend: 0,
        status: 'بانتظار المراجعة',
        impressions: 0,
        clicks: 0,
        results: 0,
        ctr: 0,
        cpc: 0,
    };

    try {
      await addDoc(campaignsColRef, newCampaignData);
      
      toast({ title: 'نجاح!', description: 'تم إرسال حملتك للمراجعة بنجاح.' });
      onCampaignCreated();
      setOpen(false);
      (event.target as HTMLFormElement).reset();

    } catch (error: any) {
       // Catch potential errors from addDoc
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
          <DialogTitle>حملة إعلانية جديدة</DialogTitle>
          <DialogDescription>
            اختر المنصة وحدد ميزانية حملتك ومدتها للبدء. ستُرسل الحملة للمراجعة من قبل المسؤول.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم الحملة</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="platform">المنصة</Label>
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
            <Label htmlFor="targetAudience">وصف الجمهور المستهدف</Label>
            <Textarea
              id="targetAudience"
              name="targetAudience"
              required
              placeholder="مثال: شباب في مصر مهتمون بكرة القدم والألعاب الإلكترونية"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">الميزانية ($)</Label>
              <Input id="budget" name="budget" type="number" required min="5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationDays">المدة (أيام)</Label>
              <Input id="durationDays" name="durationDays" type="number" required min="1" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            رصيدك الإعلاني الحالي: ${userData.adBalance?.toFixed(2) ?? '0.00'}
          </p>
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="animate-spin" /> : 'إرسال للمراجعة'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
