
'use client';

import { useState } from 'react';
import { useUser, useAuth } from '@/firebase';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    const { toast } = useToast();

    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [email, setEmail] = useState(user?.email || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isProfileSaving, setIsProfileSaving] = useState(false);
    const [isPasswordSaving, setIsPasswordSaving] = useState(false);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsProfileSaving(true);
        try {
            await updateProfile(user, { displayName });
            // Note: Updating email requires re-authentication and is a more complex flow.
            // We are focusing on display name for now.
            toast({ title: 'نجاح', description: 'تم تحديث اسمك بنجاح.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'خطأ', description: error.message });
        } finally {
            setIsProfileSaving(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !auth.currentUser || !currentPassword || !newPassword) {
             toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى ملء جميع حقول كلمة المرور.' });
            return;
        };

        setIsPasswordSaving(true);
        try {
            const credential = EmailAuthProvider.credential(user.email!, currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, newPassword);

            toast({ title: 'نجاح', description: 'تم تغيير كلمة المرور بنجاح.' });
            setCurrentPassword('');
            setNewPassword('');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تغيير كلمة المرور. تأكد من صحة كلمة المرور الحالية.' });
            console.error(error);
        } finally {
            setIsPasswordSaving(false);
        }
    };

    if (isUserLoading) {
        return (
            <div className="space-y-6 pb-8">
                 <Skeleton className="h-8 w-1/4" />
                 <Skeleton className="h-6 w-1/2" />
                 <div className="grid grid-cols-1 gap-8">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                 </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">الملف الشخصي</h1>
                <p className="text-muted-foreground">
                    إدارة معلومات حسابك الشخصي وتفضيلات الأمان.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>المعلومات الأساسية</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="displayName">الاسم الكامل</Label>
                                <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">البريد الإلكتروني</Label>
                                <Input id="email" value={email} disabled readOnly />
                                <p className="text-xs text-muted-foreground">لا يمكن تغيير البريد الإلكتروني حالياً.</p>
                            </div>
                            <Button type="submit" disabled={isProfileSaving}>
                                {isProfileSaving ? <Loader2 className="animate-spin" /> : 'حفظ التغييرات'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>تغيير كلمة المرور</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordUpdate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">كلمة المرور الحالية</Label>
                                <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                                <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                            </div>
                            <Button type="submit" variant="secondary" disabled={isPasswordSaving}>
                               {isPasswordSaving ? <Loader2 className="animate-spin" /> : 'تحديث كلمة المرور'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
