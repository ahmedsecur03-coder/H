
'use client';
import { useState } from 'react';
import { useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import AuthLogo from '../../_components/auth-logo';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const auth = useAuth();
  const { toast } = useToast();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
      toast({
        title: 'تم إرسال البريد الإلكتروني',
        description: 'تحقق من بريدك الإلكتروني لإعادة تعيين كلمة المرور.',
      });
    } catch (error: any) {
      console.error('Password Reset Error:', error);
      let description = 'حدث خطأ ما. يرجى المحاولة مرة أخرى.';
      if (error.code === 'auth/user-not-found') {
        description = 'لم يتم العثور على حساب مرتبط بهذا البريد الإلكتروني.';
      }
      toast({
        variant: 'destructive',
        title: 'فشل إرسال البريد الإلكتروني',
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
          <h1 className="text-2xl font-headline font-bold">
            {sent ? 'تحقق من بريدك الإلكتروني' : 'إعادة تعيين كلمة المرور'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {sent
              ? `لقد أرسلنا رابط إعادة تعيين كلمة المرور إلى ${email}.`
              : 'أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.'}
          </p>
        </div>
        {!sent && (
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
        )}
        <p className="text-center text-sm text-muted-foreground">
          تذكرت كلمة المرور؟{' '}
          <Link href="/auth/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
