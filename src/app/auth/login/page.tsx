'use client';

import { useState } from 'react';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import AuthLogo from '../_components/auth-logo';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!auth) {
        throw new Error("Authentication service is not available.");
      }
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'أهلاً بعودتك!', description: 'تم تسجيل دخولك بنجاح.' });
      router.push('/dashboard');
    } catch (error: any) {
      console.error(error);
      let description = 'حدث خطأ ما. يرجى المحاولة مرة أخرى.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          description = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
      }
      toast({
        variant: 'destructive',
        title: 'فشل تسجيل الدخول',
        description,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[14px_24px]"></div>
        <div className="absolute left-0 top-1/3 h-32 w-32 bg-primary/50 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute right-0 bottom-1/3 h-32 w-32 bg-fuchsia-500/50 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>

        <div className="w-full max-w-sm space-y-8 z-10">
            <div className="flex justify-center">
                <AuthLogo />
            </div>
            <div className="text-center">
                 <h1 className="text-2xl font-headline font-bold">تسجيل الدخول</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    أدخل بريدك الإلكتروني وكلمة المرور للوصول إلى حسابك
                </p>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
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
                 <div className="flex items-center justify-between">
                    <Label htmlFor="password">كلمة المرور</Label>
                    <Link href="/forgot-password" className="text-xs text-primary/80 hover:text-primary">نسيت كلمة المرور؟</Link>
                 </div>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
               <div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-primary to-fuchsia-500 text-primary-foreground hover:brightness-110 transition-all duration-300" disabled={loading}>
                     {loading ? <Loader2 className="animate-spin" /> : 'تسجيل الدخول'}
                  </Button>
               </div>
            </form>
             <p className="text-center text-sm text-muted-foreground">
                ليس لديك حساب؟{' '}
                <Link href="/signup" className="font-semibold text-primary underline-offset-4 hover:underline">
                    إنشاء حساب جديد
                </Link>
            </p>
        </div>
    </div>
  );
}

