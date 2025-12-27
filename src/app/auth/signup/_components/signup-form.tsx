'use client';
import { useState } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, runTransaction, collection, query, where, getDocs, limit, updateDoc, increment } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import AuthLogo from '../../_components/auth-logo';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

export default function SignupForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const referralCode = searchParams.get('ref');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !auth) return;
    setLoading(true);
    
    try {
      // Step 1: Create user in Auth to get the UID
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      const avatarUrl = `https://i.pravatar.cc/150?u=${newUser.uid}`;

      // Step 2: Update the user's auth profile (displayName, photoURL)
      // This is important for the UserInitializer to pick up the correct name.
      await updateProfile(newUser, { displayName: name, photoURL: avatarUrl });
      
      // Step 3 (Server-side handled by Cloud Function or a separate API call if needed for referral)
      // For now, the client-side UserInitializer will handle creating the user doc.
      // We can trigger a cloud function here if we need immediate server-side logic like updating referrer counts.
      // For simplicity in this context, we rely on the client provider.
      
      // If a referral code exists, we can still try a "best-effort" client-side update.
      if (referralCode) {
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('referralCode', '==', referralCode), limit(1));
        getDocs(q).then(querySnapshot => {
          if (!querySnapshot.empty) {
            const referrerDoc = querySnapshot.docs[0];
            updateDoc(referrerDoc.ref, { referralsCount: increment(1) }).catch(err => {
              // Silently fail if this update fails, as it's not critical for the signup flow.
              console.warn("Could not update referrer count:", err);
            });
          }
        });
      }

      toast({ title: 'أهلاً بك في حاجاتي!', description: 'تم إنشاء حسابك بنجاح. سيتم توجيهك الآن.' });
      router.push('/dashboard');

    } catch (error: any) {
        let description = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
        if (error.code === 'auth/email-already-in-use') {
            description = 'هذا البريد الإلكتروني مستخدم بالفعل.';
        } else if (error.code === 'auth/weak-password') {
            description = 'كلمة المرور ضعيفة جداً. يجب أن تكون 6 أحرف على الأقل.';
        } else if (error.code === 'auth/invalid-email') {
            description = 'البريد الإلكتروني الذي أدخلته غير صالح.';
        }
        
        toast({
            variant: 'destructive',
            title: 'فشل إنشاء الحساب',
            description: description,
        });

        console.error("Signup Error:", error);
        // We still emit the error for logging purposes
        const permissionError = new FirestorePermissionError({
            path: `users/${auth.currentUser?.uid || 'unknown_on_error'}`,
            operation: 'create',
        });
        errorEmitter.emit('permission-error', permissionError);

    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8 z-10">
            <div className="flex justify-center">
                <AuthLogo />
            </div>
            <div className="text-center">
                 <h1 className="text-2xl font-headline font-bold">إنشاء حساب جديد</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    {referralCode ? `أنت على وشك الانضمام عبر دعوة. أكمل التسجيل!` : 'انضم إلى منصة حاجاتي وابدأ في تنمية أعمالك'}
                </p>
            </div>
            <form onSubmit={handleSignup} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="name">الاسم</Label>
                    <Input 
                        id="name" 
                        required 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">كلمة المرور</Label>
                    <Input 
                        id="password" 
                        type="password" 
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        />
                </div>
                 <div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-primary to-primary/70 text-primary-foreground hover:brightness-110 transition-all duration-300" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : 'إنشاء الحساب'}
                    </Button>
                </div>
            </form>
             <p className="text-center text-sm text-muted-foreground">
                لديك حساب بالفعل؟{' '}
                <Link href="/auth/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                    تسجيل الدخول
                </Link>
            </p>
        </div>
    </div>
  );
}
