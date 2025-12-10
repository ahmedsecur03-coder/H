
'use client';
import { useState } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import Logo from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { Loader2 } from 'lucide-react';

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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
            <Logo />
        </div>
        <Card>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-headline">إنشاء حساب جديد</CardTitle>
            <CardDescription>
              انضم إلى منصة حاجاتي وابدأ في تنمية أعمالك
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSignup}>
            <CardContent className="space-y-4">
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
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'إنشاء الحساب'}
              </Button>
               <p className="text-center text-sm text-muted-foreground">
                لديك حساب بالفعل؟{' '}
                <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                    تسجيل الدخول
                </Link>
            </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
