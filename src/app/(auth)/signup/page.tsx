
'use client';
import { useState, useEffect } from 'react';
import { useAuth, useFirestore, useMemoFirebase } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, runTransaction, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import AuthLogo from '../_components/auth-logo';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import CosmicBackground from '@/components/cosmic-background';
import { FirestorePermissionError, errorEmitter } from '@/firebase';

export default function SignupPage() {
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
      // Create user in Auth first to get the UID
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      const avatarUrl = `https://i.pravatar.cc/150?u=${newUser.uid}`;

      // Now, handle the creation of the user document and referral logic in a transaction
      await runTransaction(firestore, async (transaction) => {
        let referrerId: string | null = null;
        
        // 1. Find the referrer if a referral code is present
        if (referralCode) {
            const usersRef = collection(firestore, 'users');
            const q = query(usersRef, where('referralCode', '==', referralCode), limit(1));
            const querySnapshot = await getDocs(q); // Use getDocs for transactions, not from transaction object
            if (!querySnapshot.empty) {
                const referrerDoc = querySnapshot.docs[0];
                referrerId = referrerDoc.id;
                
                // 2. Update the referrer's referralsCount
                const newReferralsCount = (referrerDoc.data().referralsCount || 0) + 1;
                transaction.update(referrerDoc.ref, { referralsCount: newReferralsCount });
            }
        }
        
        // 3. Create the new user's document
        const newUserProfile: Omit<User, 'id'> = {
            name: name,
            email: newUser.email || 'N/A',
            avatarUrl: avatarUrl,
            rank: 'مستكشف نجمي',
            balance: 0,
            adBalance: 0,
            totalSpent: 0,
            apiKey: `hy_${crypto.randomUUID()}`,
            referralCode: newUser.uid.substring(0, 8).toUpperCase(),
            referrerId: referrerId, // Set the referrerId here
            createdAt: new Date().toISOString(),
            affiliateEarnings: 0,
            referralsCount: 0,
            affiliateLevel: 'برونزي',
            notificationPreferences: {
                newsletter: false,
                orderUpdates: true
            }
        };
        
        const newUserDocRef = doc(firestore, 'users', newUser.uid);
        transaction.set(newUserDocRef, newUserProfile);
      }).catch(serverError => {
          // This will catch transaction-specific errors (e.g., contention)
          // or permission errors if the rules are violated during the transaction.
          const permissionError = new FirestorePermissionError({
            path: `users/${newUser.uid}`,
            operation: 'create',
          });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError; // Re-throw to be caught by outer catch
      });

      // 4. Update the user's auth profile (displayName, photoURL) - can be done outside transaction
      await updateProfile(newUser, { displayName: name, photoURL: avatarUrl });
      
      toast({ title: 'أهلاً بك في حاجاتي!', description: 'تم إنشاء حسابك بنجاح. سيتم توجيهك الآن.' });
      router.push('/dashboard');

    } catch (error: any) {
      // Don't show toast if it's our custom permission error, as it will be handled by the listener
      if (error instanceof FirestorePermissionError) {
        setLoading(false);
        return;
      }

      console.error("Signup Error:", error);
      let description = 'حدث خطأ ما. يرجى المحاولة مرة أخرى.';
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
        description,
      });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4 overflow-hidden">
      <CosmicBackground />
      <div className="w-full max-w-sm space-y-8 z-10">
            <div className="flex justify-center">
                <AuthLogo />
            </div>
            <div className="text-center">
                 <h1 className="text-2xl font-headline font-bold text-primary-foreground">إنشاء حساب جديد</h1>
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
                <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                    تسجيل الدخول
                </Link>
            </p>
        </div>
    </div>
  );
}
