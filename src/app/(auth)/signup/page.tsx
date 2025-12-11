
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
import CosmicBackground from '@/components/cosmic-background';

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

      // This will trigger the user document creation in the FirebaseClientProvider
      await updateProfile(user, { displayName: name });
      
      toast({ title: 'أهلاً بك في حاجاتي!', description: 'تم إنشاء حسابك بنجاح. سيتم توجيهك الآن.' });
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
