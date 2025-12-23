'use client';

import { useState } from 'react';
import type { User as UserType } from '@/lib/types';
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
import { createCampaignAction } from '../actions';

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
}: {
  userData: UserType;
  children: React.ReactNode;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const budgetAmount = parseFloat(formData.get('budget') as string);
    const duration = parseInt(formData.get('durationDays') as string, 10);

    if (!budgetAmount || budgetAmount <= 0) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء إدخال ميزانية صالحة.' });
      setLoading(false);
      return;
    }
    
    if ((userData.adBalance ?? 0) < budgetAmount) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'رصيدك الإعلاني غير كافٍ لهذه الميزانية.' });
      setLoading(false);
      return;
    }

    try {
      const result = await createCampaignAction(formData);
      if (result.success) {
        toast({ title: 'نجاح!', description: 'تم إنشاء حملتك وهي الآن قيد المراجعة.' });
        setOpen(false);
        // Form will reset because dialog is closing
      } else {
        toast({ variant: 'destructive', title: 'فشل إنشاء الحملة', description: result.error });
      }
    } catch (error) {
       toast({ variant: 'destructive', title: 'فشل إنشاء الحملة', description: 'حدث خطأ غير متوقع.' });
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
            اختر المنصة وحدد ميزانية حملتك ومدتها للبدء. سيتم خصم الميزانية من رصيد الإعلانات.
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
              {loading ? <Loader2 className="animate-spin" /> : 'إنشاء وتفعيل'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
