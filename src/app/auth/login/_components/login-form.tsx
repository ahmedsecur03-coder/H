
'use client';
import { useState } from 'react';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import AuthLogo from '../../_components/auth-logo';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        if (!auth) {
            throw new Error("Auth service is not available.");
        }
        await signInWithEmailAndPassword(auth, email, password);
        toast({
            title: 'أهلاً بعودتك!',
            description: 'تم تسجيل دخولك بنجاح.',
        });
        router.push(redirectUrl);
    } catch (error: any) {
        console.error("Login Error:", error);
        let description = 'فشل تسجيل الدخول. يرجى التحقق من بريدك الإلكتروني وكلمة المرور.';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            description = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
        } else if (error.code === 'auth/too-many-requests') {
             description = 'لقد حاولت تسجيل الدخول عدة مرات. يرجى المحاولة مرة أخرى لاحقًا.';
        }
        toast({
            variant: 'destructive',
            title: 'خطأ في تسجيل الدخول',
            description,
        });
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
                 <h1 className="text-2xl font-headline font-bold">مرحباً بعودتك</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    سجل دخولك إلى حسابك للوصول إلى لوحة التحكم.
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
                    disabled={loading}
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">كلمة المرور</Label>
                        <Link
                            href="/auth/forgot-password"
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            نسيت كلمة المرور؟
                        </Link>
                    </div>
                    <Input id="password" type="password" required  value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    />
                </div>
                <div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-primary to-primary/70 text-primary-foreground hover:brightness-110 transition-all duration-300" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : 'تسجيل الدخول'}
                    </Button>
                </div>
            </form>
             <p className="text-center text-sm text-muted-foreground">
                ليس لديك حساب؟{' '}
                <Link href="/auth/signup" className="font-semibold text-primary underline-offset-4 hover:underline">
                    إنشاء حساب
                </Link>
            </p>
        </div>
    </div>
  );
}
