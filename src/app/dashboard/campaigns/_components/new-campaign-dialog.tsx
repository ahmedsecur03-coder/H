
'use client';

import { useState, useEffect } from 'react';
import type { Campaign, User as UserType, AgencyAccount } from '@/lib/types';
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
import { useUser, useFirestore, errorEmitter, FirestorePermissionError, useCollection, useMemoFirebase } from '@/firebase';
import { addDoc, collection, query } from 'firebase/firestore';
import { PLATFORM_ICONS } from '@/lib/icon-data';

type Platform = 'Google' | 'Facebook' | 'TikTok' | 'Snapchat';
type Goal = 'زيارات للموقع' | 'مشاهدات فيديو' | 'تفاعل مع المنشور' | 'زيادة الوعي' | 'تحويلات';


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
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [budget, setBudget] = useState('');

  const accountsQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, `users/${user.uid}/agencyAccounts`)) : null),
    [firestore, user]
  );
  const { data: agencyAccounts } = useCollection<AgencyAccount>(accountsQuery);

  const selectedAccount = agencyAccounts?.find(acc => acc.id === selectedAccountId);
  
  const platforms = useMemo(() => {
    if (!agencyAccounts) return [];
    const uniquePlatforms = [...new Set(agencyAccounts.map(acc => acc.platform))];
    return uniquePlatforms.map(p => ({ name: p, title: p === 'Meta' ? 'Facebook & Instagram' : `${p} Ads`}));
  }, [agencyAccounts]);


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!firestore || !user || !selectedAccount) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء اختيار حساب إعلاني صالح.' });
        return;
    }

    const campaignBudget = parseFloat(budget);
    if (!campaignBudget || campaignBudget <= 0) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء إدخال ميزانية صالحة.' });
        return;
    }

    if (campaignBudget > selectedAccount.balance) {
        toast({ variant: 'destructive', title: 'ميزانية تتجاوز الرصيد', description: `ميزانية الحملة لا يمكن أن تتجاوز رصيد الحساب المختار (${selectedAccount.balance.toFixed(2)}$).` });
        return;
    }


    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const campaignData = {
      name: formData.get('name') as string,
      goal: formData.get('goal') as Goal,
      targetAudience: formData.get('targetAudience') as string,
      durationDays: parseInt(formData.get('durationDays') as string, 10),
    };
    
    const newCampaignData: Omit<Campaign, 'id'> = {
        userId: user.uid,
        agencyAccountId: selectedAccount.id, // Link campaign to agency account
        name: campaignData.name,
        platform: selectedAccount.platform, // Platform is derived from the selected account
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

        toast({ title: 'نجاح!', description: 'تم إرسال حملتك للمراجعة بنجاح.' });
        onCampaignCreated();
        setOpen(false);
        (event.target as HTMLFormElement).reset();
        setSelectedAccountId('');
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
          <DialogTitle>حملة إعلانية جديدة</DialogTitle>
          <DialogDescription>
            اختر الحساب، حدد ميزانية حملتك ومدتها للبدء. ستُرسل الحملة للمراجعة من قبل المسؤول.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="agencyAccount">الحساب الإعلاني</Label>
            <Select name="agencyAccount" required onValueChange={setSelectedAccountId} value={selectedAccountId}>
              <SelectTrigger id="agencyAccount">
                <SelectValue placeholder="اختر حسابًا لتشغيل الحملة منه" />
              </SelectTrigger>
              <SelectContent>
                {agencyAccounts && agencyAccounts.length > 0 ? (
                  agencyAccounts.map((acc) => {
                    const Icon = PLATFORM_ICONS[acc.platform] || PLATFORM_ICONS.Default;
                    return (
                      <SelectItem key={acc.id} value={acc.id}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span>{acc.accountName} (الرصيد: ${acc.balance.toFixed(2)})</span>
                        </div>
                      </SelectItem>
                    )
                  })
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    يجب عليك شراء حساب إعلاني أولاً.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          
           <div className="space-y-2">
            <Label htmlFor="name">اسم الحملة</Label>
            <Input id="name" name="name" required disabled={!selectedAccount} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">الهدف من الحملة</Label>
            <Select name="goal" required disabled={!selectedAccount}>
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
              disabled={!selectedAccount}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">الميزانية ($)</Label>
              <Input id="budget" name="budget" type="number" required min="5" value={budget} onChange={e => setBudget(e.target.value)} disabled={!selectedAccount} max={selectedAccount?.balance}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationDays">المدة (أيام)</Label>
              <Input id="durationDays" name="durationDays" type="number" required min="1" disabled={!selectedAccount}/>
            </div>
          </div>
           {selectedAccount && <p className="text-xs text-muted-foreground">سيتم خصم الميزانية من رصيد حساب {selectedAccount.accountName}.</p>}

          <DialogFooter>
            <Button type="submit" disabled={loading || !selectedAccount} className="w-full">
              {loading ? <Loader2 className="animate-spin" /> : 'إرسال للمراجعة'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
