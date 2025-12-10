
'use client';
import { useState } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import AuthLogo from '../_components/auth-logo';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const CosmicBackground = () => (
    <div className="absolute inset-0 -z-10 h-full w-full bg-background">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb1a,transparent)] opacity-50"></div>
    </div>
);

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;
    setLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });
      
      const newUser: Omit<User, 'id'> = {
        name: name,
        email: user.email!,
        rank: 'مستكشف نجمي',
        balance: 0,
        adBalance: 0,
        totalSpent: 0,
        referralCode: user.uid.substring(0, 8),
        referrerId: null,
        createdAt: new Date().toISOString(),
        affiliateEarnings: 0,
        referralsCount: 0,
        affiliateLevel: 'برونزي',
      };

      await setDoc(doc(firestore, 'users', user.uid), newUser);

      toast({ title: 'أهلاً بك في حاجاتي!', description: 'تم إنشاء حسابك بنجاح.' });
      router.push('/dashboard');

    } catch (error: any) {
      console.error(error);
      let description = 'حدث خطأ ما. يرجى المحاولة مرة أخرى.';
      if (error.code === 'auth/email-already-in-use') {
          description = 'هذا البريد الإلكتروني مستخدم بالفعل.';
      } else if (error.code === 'auth/weak-password') {
          description = 'كلمة المرور ضعيفة جداً. يجب أن تكون 6 أحرف على الأقل.';
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
                    انضم إلى منصة حاجاتي وابدأ في تنمية أعمالك
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
