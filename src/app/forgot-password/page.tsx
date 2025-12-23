
'use client';

import { useState } from 'react';
import { useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import AuthLogo from '../auth/_components/auth-logo';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MailCheck } from 'lucide-react';
import CosmicBackground from '@/components/cosmic-background';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const auth = useAuth();
  const { toast } = useToast();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!auth) {
        throw new Error("Authentication service is not available.");
      }
      await sendPasswordResetEmail(auth, email);
      setSubmitted(true);
    } catch (error: any) {
      console.error(error);
      let description = 'حدث خطأ ما. يرجى المحاولة مرة أخرى.';
      // We don't want to reveal if an email exists or not for security reasons
      // So we show a generic success message even if the email is not found
      if (error.code === 'auth/user-not-found') {
        setSubmitted(true); // Pretend it was successful
      } else {
         toast({
            variant: 'destructive',
            title: 'فشل إرسال البريد',
            description,
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
    if (submitted) {
        return (
             <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4 overflow-hidden">
                <CosmicBackground />
                <div className="w-full max-w-sm space-y-8 z-10 text-center">
                    <div className="flex justify-center text-green-400">
                        <MailCheck className="h-16 w-16" />
                    </div>
                     <h1 className="text-2xl font-headline font-bold text-primary-foreground">تحقق من بريدك الإلكتروني</h1>
                    <p className="text-muted-foreground">
                        إذا كان هناك حساب مرتبط بـ <span className="font-bold text-primary">{email}</span>، فقد أرسلنا إليه رابطًا لإعادة تعيين كلمة المرور.
                    </p>
                    <Button asChild>
                        <Link href="/login">العودة إلى تسجيل الدخول</Link>
                    </Button>
                </div>
            </div>
        )
    }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4 overflow-hidden">
      <CosmicBackground />
      <div className="w-full max-w-sm space-y-8 z-10">
        <div className="flex justify-center">
          <AuthLogo />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-headline font-bold text-primary-foreground">هل نسيت كلمة المرور؟</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            لا تقلق. أدخل بريدك الإلكتروني أدناه وسنرسل لك رابطًا لإعادة تعيينها.
          </p>
        </div>
        <form onSubmit={handleResetPassword} className="space-y-6">
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
          <div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : 'إرسال رابط إعادة التعيين'}
            </Button>
          </div>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          تذكرت كلمة المرور؟{' '}
          <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
