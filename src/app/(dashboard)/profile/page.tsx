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
import { Loader2, User as UserIcon, Wand2, Stars, Bot } from 'lucide-react';
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
import { ai } from '@/ai/genkit';
import { cn } from '@/lib/utils';


const profileSchema = z.object({
  name: z.string().min(2, { message: "الاسم يجب أن يكون حرفين على الأقل." }),
  avatarUrl: z.string().url({ message: "الرجاء إدخال رابط صورة صالح." }).optional().or(z.literal('')),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة."),
  newPassword: z.string().min(6, "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل."),
});

// Helper function to convert image URL to data URI
async function toDataUri(url: string) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            // Attempt to use a CORS proxy for external images
            const proxyResponse = await fetch(`https://cors-anywhere.herokuapp.com/${url}`);
            if (!proxyResponse.ok) throw new Error(`Failed to fetch image from proxy`);
            const blob = await proxyResponse.blob();
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }
        const blob = await response.blob();
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch(e) {
        console.error("Failed to convert image to data URI:", e);
        throw new Error("Could not load image data. It may be due to CORS policy.");
    }
}


export default function ProfilePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);

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
    
    const currentAvatarUrl = profileForm.watch('avatarUrl') || user?.photoURL;

    useEffect(() => {
        if (user && userData) {
            profileForm.setValue('name', user.displayName || userData.name);
            profileForm.setValue('avatarUrl', user.photoURL || userData.avatarUrl || '');
        }
    }, [user, userData, profileForm]);

    const handleAvatarGeneration = async () => {
        if (!currentAvatarUrl) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى تحديد صورة رمزية أولاً.' });
            return;
        }
        setIsGenerating(true);
        toast({ title: 'جاري استحضار الإبداع الكوني...', description: 'قد تستغرق العملية بضع لحظات.' });
        try {
            const dataUri = await toDataUri(currentAvatarUrl);
            const { media } = await ai.generate({
                model: 'googleai/gemini-pro-vision',
                prompt: [
                    { text: 'Give this avatar a cosmic, artistic flair. Maybe add nebula-reflecting sunglasses or starry patterns on the clothes. Be creative. Do not change the person. Return only the edited image.' },
                    { media: { url: dataUri } }
                ],
            });

            if (media?.url) {
                profileForm.setValue('avatarUrl', media.url);
                toast({ title: '✨ تم!', description: 'تم إنشاء صورة رمزية جديدة!' });
            } else {
                throw new Error('لم يتم إرجاع أي صورة من النموذج.');
            }
        } catch (error: any) {
            console.error("AI Avatar Generation Error:", error);
            toast({ variant: 'destructive', title: 'فشل التوليد', description: error.message || 'حدث خطأ أثناء إنشاء الصورة.' });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleProfileUpdate = async (values: z.infer<typeof profileSchema>) => {
        if (!user || !userDocRef) return;
        
        const updateData:Partial<UserType> = { name: values.name, avatarUrl: values.avatarUrl };
        
        updateProfile(user, { displayName: values.name, photoURL: values.avatarUrl }).catch(error => {
            console.error("Error updating Auth profile:", error);
        });

        updateDoc(userDocRef, updateData)
            .then(() => {
                toast({ title: 'نجاح', description: 'تم تحديث ملفك الشخصي.' });
            })
            .catch(serverError => {
                const permissionError = new FirestorePermissionError({
                    path: userDocRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
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
                <div className="space-y-8">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        )
    }

    if(!user || !userData) {
        return <p>لا يمكن تحميل بيانات المستخدم.</p>
    }

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
                                            <Button type="button" variant="outline" size="icon" onClick={handleAvatarGeneration} disabled={isGenerating} title="توليد صورة بالذكاء الاصطناعي">
                                                {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
                                            </Button>
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
