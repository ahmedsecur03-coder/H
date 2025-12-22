'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

export default function SettingsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => (firestore && user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc<User & { notificationPreferences?: { newsletter?: boolean; orderUpdates?: boolean } }>(userDocRef);

  const [newsletter, setNewsletter] = useState(false);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userData?.notificationPreferences) {
      setNewsletter(userData.notificationPreferences.newsletter ?? false);
      setOrderUpdates(userData.notificationPreferences.orderUpdates ?? true);
    }
  }, [userData]);

  const handleSaveChanges = async () => {
    if (!userDocRef) return;
    setIsSaving(true);

    const updateData = {
        'notificationPreferences.newsletter': newsletter,
        'notificationPreferences.orderUpdates': orderUpdates,
    };

    updateDoc(userDocRef, updateData)
        .then(() => {
            toast({ title: 'نجاح', description: 'تم حفظ تفضيلاتك بنجاح.' });
        })
        .catch(serverError => {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: updateData
            });
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
            setIsSaving(false);
        });
  };
  
  const isLoading = isUserLoading || isUserDataLoading;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">الإعدادات</h1>
        <p className="text-muted-foreground">
          إدارة تفضيلات حسابك وإعدادات الإشعارات.
        </p>
      </div>

       {isLoading ? (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
       ) : (
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
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving && <Loader2 className="ml-2 animate-spin" />}
                        حفظ التغييرات
                    </Button>
                </CardFooter>
            </Card>
       )}
    </div>
  );
}
