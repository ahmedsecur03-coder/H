'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User as UserIcon, Wand2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User as UserType } from '@/lib/types';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from '@/components/ui/badge';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';


const profileSchema = z.object({
  name: z.string().min(2, { message: "الاسم يجب أن يكون حرفين على الأقل." }),
  avatarUrl: z.string().url({ message: "الرجاء إدخال رابط صورة صالح." }).optional().or(z.literal('')),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة."),
  newPassword: z.string().min(6, "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل."),
});


export function ProfileClientPage({ userData, onUpdate }: { userData: UserType, onUpdate: () => void }) {
    const { toast } = useToast();
    const { user: authUser } = useUser();
    const firestore = useFirestore();

    const [isGenerating, setIsGenerating] = useState(false);
    
    const aiConfigured = false;

    const profileForm = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: userData.name,
            avatarUrl: userData.avatarUrl || '',
        },
    });

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { currentPassword: '', newPassword: '' },
    });
    
    const currentAvatarUrl = profileForm.watch('avatarUrl');

    const handleProfileUpdate = async (values: z.infer<typeof profileSchema>) => {
        if (!authUser || !firestore) return;
        
        try {
            const userDocRef = doc(firestore, 'users', authUser.uid);
            // Update auth profile and firestore doc in parallel
            await Promise.all([
                updateProfile(authUser, { displayName: values.name, photoURL: values.avatarUrl }),
                updateDoc(userDocRef, { name: values.name, avatarUrl: values.avatarUrl })
            ]);
            
            toast({ title: 'نجاح', description: 'تم تحديث ملفك الشخصي.' });
            onUpdate(); // This will re-fetch the document via the parent component's hook
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'خطأ', description: error.message });
        }
    };
    
    const handlePasswordUpdate = async (values: z.infer<typeof passwordSchema>) => {
        if (!authUser || !authUser.email) return;

        const credential = EmailAuthProvider.credential(authUser.email, values.currentPassword);

        try {
            // Re-authenticate user before changing password
            await reauthenticateWithCredential(authUser, credential);
            // Now change the password
            await updatePassword(authUser, values.newPassword);
            passwordForm.reset();
            toast({ title: 'نجاح', description: 'تم تغيير كلمة المرور بنجاح.' });
        } catch (error: any) {
             let message = 'فشل تغيير كلمة المرور.';
             if(error.code === 'auth/wrong-password') {
                 message = 'كلمة المرور الحالية غير صحيحة.';
             } else if (error.code === 'auth/too-many-requests') {
                message = 'تم إجراء العديد من المحاولات. يرجى المحاولة مرة أخرى لاحقًا.';
             }
             toast({ variant: 'destructive', title: 'خطأ', description: message });
        }
    };

    return (
        <div className="space-y-8 pb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">بطاقتك الكونية</h1>
                <p className="text-muted-foreground">
                    هويتك في مجرة حاجاتي. عرض وتعديل معلومات حسابك.
                </p>
            </div>

            <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-primary/10 via-background to-background p-6 flex flex-col md:flex-row items-center gap-6">
                    <div className="relative">
                        <Avatar className="h-28 w-28 border-4 border-primary/50 shadow-lg">
                            <AvatarImage src={currentAvatarUrl || undefined} alt={userData.name} />
                            <AvatarFallback className="text-4xl"><UserIcon /></AvatarFallback>
                        </Avatar>
                        {isGenerating && <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center"><Loader2 className="animate-spin text-primary"/></div>}
                    </div>
                    <div className="flex-1 text-center md:text-right">
                        <Badge variant="secondary" className="mb-2">{userData.rank}</Badge>
                        <h2 className="text-3xl font-bold font-headline">{profileForm.watch('name')}</h2>
                        <p className="text-muted-foreground">{userData.email}</p>
                        <p className="text-muted-foreground font-mono text-sm mt-1">#{userData.id}</p>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                                        <FormLabel>رابط الصورة الرمزية</FormLabel>
                                        <div className="flex gap-2">
                                            <FormControl>
                                                <Input placeholder="https://example.com/image.png" {...field} />
                                            </FormControl>
                                            {aiConfigured && (
                                                <Button type="button" variant="outline" size="icon" disabled={true} title="توليد صورة بالذكاء الاصطناعي (معطل حالياً)">
                                                    {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
                                                </Button>
                                            )}
                                        </div>
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
    );
}
