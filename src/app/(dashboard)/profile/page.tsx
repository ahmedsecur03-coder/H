
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User as UserType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from '@/components/ui/badge';

const profileSchema = z.object({
  name: z.string().min(2, { message: "الاسم يجب أن يكون حرفين على الأقل." }),
  avatarUrl: z.string().url({ message: "الرجاء إدخال رابط صورة صالح." }).optional().or(z.literal('')),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة."),
  newPassword: z.string().min(6, "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل."),
});

export default function ProfilePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const userDocRef = useMemoFirebase(() => (firestore && user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
    const { data: userData, isLoading: isUserDataLoading } = useDoc<UserType>(userDocRef);

    const profileForm = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: { name: '', avatarUrl: '' },
    });

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { currentPassword: '', newPassword: '' },
    });

    useEffect(() => {
        if (user && userData) {
            profileForm.setValue('name', user.displayName || userData.name);
            profileForm.setValue('avatarUrl', user.photoURL || userData.avatarUrl || '');
        }
    }, [user, userData, profileForm]);

    const handleProfileUpdate = async (values: z.infer<typeof profileSchema>) => {
        if (!user || !firestore || !userDocRef) return;
        
        const updateData = { name: values.name, avatarUrl: values.avatarUrl };

        try {
            await updateProfile(user, { displayName: values.name, photoURL: values.avatarUrl });
            await updateDoc(userDocRef, updateData);
            toast({ title: 'نجاح', description: 'تم تحديث ملفك الشخصي.' });
        } catch(serverError: any) {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: updateData
            });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
             profileForm.formState.isSubmitting = false;
        }
    };
    
    const handlePasswordUpdate = async (values: z.infer<typeof passwordSchema>) => {
        if (!user || !user.email) return;

        try {
            const credential = EmailAuthProvider.credential(user.email, values.currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, values.newPassword);
            passwordForm.reset();
            toast({ title: 'نجاح', description: 'تم تغيير كلمة المرور بنجاح.' });
        } catch (error: any)
        {
             let description = 'حدث خطأ ما. يرجى المحاولة مرة أخرى.';
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                description = 'كلمة المرور الحالية غير صحيحة.';
            }
             toast({ variant: 'destructive', title: 'فشل تغيير كلمة المرور', description });
        }
    };
    
    const isLoading = isUserLoading || isUserDataLoading;

    if(isLoading) {
        return (
             <div className="space-y-6 pb-8">
                 <div>
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-5 w-1/2 mt-2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
                        <Skeleton className="h-48 w-full" />
                    </div>
                    <div className="md:col-span-2 space-y-6">
                         <Skeleton className="h-64 w-full" />
                         <Skeleton className="h-48 w-full" />
                    </div>
                </div>
            </div>
        )
    }

    if(!user || !userData) {
        return <p>لا يمكن تحميل بيانات المستخدم.</p>
    }

    return (
        <div className="space-y-6 pb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">الملف الشخصي</h1>
                <p className="text-muted-foreground">
                    عرض وتعديل معلومات حسابك.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="md:col-span-1">
                    <CardContent className="pt-6 flex flex-col items-center text-center">
                        <Avatar className="h-24 w-24 mb-4 border-2 border-primary">
                            <AvatarImage src={profileForm.watch('avatarUrl') || user.photoURL || undefined} alt={userData.name} />
                            <AvatarFallback><UserIcon size={40} /></AvatarFallback>
                        </Avatar>
                        <h2 className="text-xl font-bold">{profileForm.watch('name')}</h2>
                        <p className="text-muted-foreground">{userData.email}</p>
                        <Badge variant="secondary" className="mt-2">{userData.rank}</Badge>
                    </CardContent>
                </Card>

                 <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>تعديل المعلومات الشخصية</CardTitle>
                        </CardHeader>
                        <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)}>
                                <CardContent className="space-y-4">
                                     <FormField
                                        control={profileForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>الاسم</FormLabel>
                                            <FormControl>
                                                <Input placeholder="اسمك الكامل" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                    <FormField
                                        control={profileForm.control}
                                        name="avatarUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>رابط الصورة الشخصية</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://example.com/image.png" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                                        {profileForm.formState.isSubmitting && <Loader2 className="ml-2 animate-spin" />}
                                        حفظ التغييرات
                                    </Button>
                                </CardFooter>
                            </form>
                        </Form>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>تغيير كلمة المرور</CardTitle>
                        </CardHeader>
                         <Form {...passwordForm}>
                            <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)}>
                                <CardContent className="space-y-4">
                                     <FormField
                                        control={passwordForm.control}
                                        name="currentPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>كلمة المرور الحالية</FormLabel>
                                            <FormControl>
                                                <Input type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                    <FormField
                                        control={passwordForm.control}
                                        name="newPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>كلمة المرور الجديدة</FormLabel>
                                            <FormControl>
                                                <Input type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                                         {passwordForm.formState.isSubmitting && <Loader2 className="ml-2 animate-spin" />}
                                        تغيير كلمة المرور
                                    </Button>
                                </CardFooter>
                            </form>
                        </Form>
                    </Card>
                </div>

            </div>
        </div>
    );
}
