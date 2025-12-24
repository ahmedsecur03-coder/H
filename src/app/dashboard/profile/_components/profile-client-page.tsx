
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
import { useAuth, useFirestore, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { GenerateAvatarDialog } from './generate-avatar-dialog';
import { isAiConfigured } from '@/ai/client';

const profileSchema = z.object({
  name: z.string().min(2, { message: "الاسم يجب أن يكون حرفين على الأقل." }),
  avatarUrl: z.string().url({ message: "الرجاء إدخال رابط صورة صالح." }).optional().or(z.literal('')),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة."),
  newPassword: z.string().min(6, "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل."),
});


export function ProfileClientPage({ userData, onUpdate }: { userData: UserType, onUpdate: () => void }) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user: authUser } = useUser();
    const firestore = useFirestore();

    const [isProxying, setIsProxying] = useState(false);

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
        
        profileForm.formState.isSubmitting = true;
        toast({ title: t('profile.update.toast.pending') });

        let finalAvatarUrl = values.avatarUrl || '';

        // If the URL is not a data URI and not empty, proxy it to convert to a data URI
        if (finalAvatarUrl && !finalAvatarUrl.startsWith('data:')) {
            setIsProxying(true);
            try {
                const response = await fetch('/api/image-proxy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageUrl: finalAvatarUrl })
                });
                const { dataUri, error } = await response.json();
                if (!response.ok) throw new Error(error || 'Failed to proxy image.');
                finalAvatarUrl = dataUri;
            } catch (e: any) {
                toast({ variant: 'destructive', title: t('profile.update.toast.proxyErrorTitle'), description: e.message });
                setIsProxying(false);
                profileForm.formState.isSubmitting = false;
                return;
            }
            setIsProxying(false);
        }
        
        updateProfile(authUser, { displayName: values.name, photoURL: finalAvatarUrl });

        const userDocRef = doc(firestore, 'users', authUser.uid);
        const updateData = { name: values.name, avatarUrl: finalAvatarUrl };
        updateDoc(userDocRef, updateData)
            .then(() => {
                onUpdate(); 
                toast({ title: t('success'), description: t('profile.update.toast.success') });
            })
            .catch(error => {
                const permissionError = new FirestorePermissionError({
                    path: userDocRef.path,
                    operation: 'update',
                    requestResourceData: updateData
                });
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => {
                 profileForm.formState.isSubmitting = false;
            });
    };
    
    const handlePasswordUpdate = async (values: z.infer<typeof passwordSchema>) => {
        if (!authUser || !authUser.email) return;

        const credential = EmailAuthProvider.credential(authUser.email, values.currentPassword);

        try {
            await reauthenticateWithCredential(authUser, credential);
            await updatePassword(authUser, values.newPassword);
            passwordForm.reset();
            toast({ title: t('success'), description: t('profile.password.toast.success') });
        } catch (error: any) {
             let message = t('profile.password.toast.fail');
             if(error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                 message = t('profile.password.toast.wrongPassword');
             } else if (error.code === 'auth/too-many-requests') {
                message = t('profile.password.toast.tooManyRequests');
             }
             toast({ variant: 'destructive', title: t('error'), description: message });
        }
    };
    
    const handleAvatarGenerated = (dataUri: string) => {
        profileForm.setValue('avatarUrl', dataUri);
        // Automatically submit the form to save the new avatar
        handleProfileUpdate({ name: profileForm.getValues('name'), avatarUrl: dataUri });
    };

    const infoBadges = [
        { label: t('profile.rank'), value: t(`ranks.${userData.rank}`) },
        { label: t('profile.referralCode'), value: userData.referralCode },
        { label: t('profile.userId'), value: userData.id, isMono: true },
    ]

    return (
        <div className="space-y-8 pb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">{t('profile.title')}</h1>
                <p className="text-muted-foreground">
                    {t('profile.description')}
                </p>
            </div>

            <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-primary/10 via-background to-background p-6 flex flex-col md:flex-row items-center gap-6">
                    <div className="relative">
                        <Avatar className="h-28 w-28 border-4 border-primary/50 shadow-lg">
                            <AvatarImage src={currentAvatarUrl || undefined} alt={userData.name} />
                            <AvatarFallback className="text-4xl"><UserIcon /></AvatarFallback>
                        </Avatar>
                        {(profileForm.formState.isSubmitting || isProxying) && <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center"><Loader2 className="animate-spin text-primary"/></div>}
                        
                         {isAiConfigured() && (
                            <GenerateAvatarDialog onAvatarGenerated={handleAvatarGenerated}>
                                <Button size="icon" className="absolute -bottom-2 -end-2 h-8 w-8 rounded-full border-2 border-background">
                                    <Wand2 className="h-4 w-4"/>
                                </Button>
                            </GenerateAvatarDialog>
                        )}
                    </div>
                    <div className="flex-1 text-center md:text-right">
                        
                        <h2 className="text-3xl font-bold font-headline">{profileForm.watch('name')}</h2>
                        <p className="text-muted-foreground">{userData.email}</p>
                         <div className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
                           {infoBadges.map(badge => (
                                <Badge key={badge.label} variant="secondary" className={badge.isMono ? 'font-mono' : ''}>
                                   <span className="font-normal opacity-75 ml-1">{badge.label}:</span> {badge.value}
                                </Badge>
                           ))}
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('profile.personalInfo.title')}</CardTitle>
                    </CardHeader>
                    <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)}>
                            <CardContent className="space-y-4">
                                    <FormField
                                    control={profileForm.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>{t('profile.personalInfo.name')}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t('profile.personalInfo.namePlaceholder')} {...field} />
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
                                        <FormLabel>{t('profile.personalInfo.avatarUrl')}</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://example.com/image.png" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={profileForm.formState.isSubmitting || isProxying}>
                                    {(profileForm.formState.isSubmitting || isProxying) && <Loader2 className="ml-2 animate-spin" />}
                                    {t('saveChanges')}
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('profile.password.title')}</CardTitle>
                    </CardHeader>
                        <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)}>
                            <CardContent className="space-y-4">
                                    <FormField
                                    control={passwordForm.control}
                                    name="currentPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>{t('profile.password.current')}</FormLabel>
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
                                        <FormLabel>{t('profile.password.new')}</FormLabel>
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
                                    {t('profile.password.submitButton')}
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                </Card>
            </div>
        </div>
    );
}
