
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
import { useTranslation } from 'react-i18next';

type Platform = 'Google' | 'Facebook' | 'TikTok' | 'Snapchat';
type Goal = 'زيارات للموقع' | 'مشاهدات فيديو' | 'تفاعل مع المنشور' | 'زيادة الوعي' | 'تحويلات';


const platforms: { name: Platform; title: string }[] = [
    { name: 'Google', title: 'Google Ads' },
    { name: 'Facebook', title: 'Meta (Facebook & Instagram)' },
    { name: 'TikTok', title: 'TikTok Ads' },
    { name: 'Snapchat', title: 'Snapchat Ads' },
];

const goals: { name: Goal; title: string, translationKey: string }[] = [
  { name: 'زيادة الوعي', title: 'زيادة الوعي', translationKey: 'campaignGoals.awareness' },
  { name: 'زيارات للموقع', title: 'زيارات للموقع', translationKey: 'campaignGoals.visits' },
  { name: 'تفاعل مع المنشور', title: 'تفاعل مع المنشور', translationKey: 'campaignGoals.engagement' },
  { name: 'مشاهدات فيديو', title: 'مشاهدات فيديو', translationKey: 'campaignGoals.videoViews' },
  { name: 'تحويلات', title: 'تحويلات', translationKey: 'campaignGoals.conversions' },
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
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [budget, setBudget] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!firestore || !user) {
        toast({ variant: 'destructive', title: t('error'), description: t('campaigns.new.loginError') });
        return;
    }

    const formData = new FormData(event.currentTarget);
    const campaignBudget = parseFloat(budget);

    if (!campaignBudget || campaignBudget <= 0) {
        toast({ variant: 'destructive', title: t('error'), description: t('campaigns.new.invalidBudgetError') });
        return;
    }

    if (campaignBudget > userData.adBalance) {
        toast({ variant: 'destructive', title: t('campaigns.new.insufficientAdBalanceTitle'), description: t('campaigns.new.insufficientAdBalanceDesc', { budget: campaignBudget.toFixed(2), adBalance: userData.adBalance.toFixed(2) }) });
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

        toast({ title: t('success'), description: t('campaigns.new.submitSuccess') });
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
          <DialogTitle>{t('campaigns.new.title')}</DialogTitle>
          <DialogDescription>
            {t('campaigns.new.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
           <div className="space-y-2">
            <Label htmlFor="name">{t('campaigns.campaignName')}</Label>
            <Input id="name" name="name" required placeholder={t('campaigns.new.namePlaceholder')} />
          </div>

           <div className="space-y-2">
            <Label htmlFor="platform">{t('campaigns.platform')}</Label>
             <Select name="platform" required>
              <SelectTrigger id="platform">
                <SelectValue placeholder={t('campaigns.new.platformPlaceholder')} />
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
            <Label htmlFor="goal">{t('campaigns.goal')}</Label>
            <Select name="goal" required>
              <SelectTrigger id="goal">
                <SelectValue placeholder={t('campaigns.new.goalPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {goals.map((g) => (
                  <SelectItem key={g.name} value={g.name}>
                    {t(g.translationKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetAudience">{t('campaigns.targetAudience')}</Label>
            <Textarea
              id="targetAudience"
              name="targetAudience"
              required
              placeholder={t('campaigns.new.audiencePlaceholder')}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">{t('campaigns.budget')}</Label>
              <Input id="budget" name="budget" type="number" required min="5" value={budget} onChange={e => setBudget(e.target.value)} max={userData.adBalance}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationDays">{t('campaigns.duration')}</Label>
              <Input id="durationDays" name="durationDays" type="number" required min="1" />
            </div>
          </div>
           <p className="text-xs text-muted-foreground">{t('campaigns.new.adBalanceNote', { adBalance: userData.adBalance.toFixed(2) })}</p>

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="animate-spin" /> : t('campaigns.new.submitButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
