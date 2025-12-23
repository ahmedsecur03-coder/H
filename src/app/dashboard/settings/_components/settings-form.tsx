
'use client';
import { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { updateNotificationPreferences } from '../actions';
import { useRouter } from 'next/navigation';

type Preferences = {
  newsletter?: boolean;
  orderUpdates?: boolean;
}

export function SettingsForm({ preferences }: { preferences: Preferences }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [newsletter, setNewsletter] = useState(preferences.newsletter ?? false);
  const [orderUpdates, setOrderUpdates] = useState(preferences.orderUpdates ?? true);

  const handleSaveChanges = () => {
    startTransition(async () => {
      try {
        await updateNotificationPreferences({ newsletter, orderUpdates });
        toast({ title: 'نجاح', description: 'تم حفظ تفضيلاتك بنجاح.' });
        router.refresh();
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطأ', description: error.message || 'فشل حفظ التغييرات.' });
      }
    });
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle>إشعارات البريد الإلكتروني</CardTitle>
            <CardDescription>
                تحكم في رسائل البريد الإلكتروني التي تصلك من المنصة.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label htmlFor="newsletter-emails" className="text-base">النشرة البريدية الأسبوعية</Label>
                    <p className="text-sm text-muted-foreground">
                        احصل على ملخص بأهم الخدمات الجديدة والعروض الخاصة.
                    </p>
                </div>
                <Switch 
                    id="newsletter-emails" 
                    checked={newsletter}
                    onCheckedChange={setNewsletter}
                />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label htmlFor="order-updates" className="text-base">تحديثات الطلبات</Label>
                    <p className="text-sm text-muted-foreground">
                        استقبل بريداً إلكترونياً عند اكتمال أو تغيير حالة أحد طلباتك.
                    </p>
                </div>
                <Switch 
                    id="order-updates" 
                    checked={orderUpdates}
                    onCheckedChange={setOrderUpdates}
                />
            </div>
        </CardContent>
        <CardFooter>
            <Button onClick={handleSaveChanges} disabled={isPending}>
                {isPending && <Loader2 className="ml-2 animate-spin" />}
                حفظ التغييرات
            </Button>
        </CardFooter>
    </Card>
  );
}
