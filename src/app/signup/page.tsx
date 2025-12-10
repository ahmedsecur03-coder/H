"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Logo from "@/components/logo";
import { useAuth, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) return;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      toast({
        title: "تم إنشاء الحساب بنجاح!",
        description: "جاري إعداد حسابك...",
      });
      
      const ownReferralCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      // Create user document in Firestore
      const userDocRef = doc(firestore, "users", user.uid);
      const newUser = {
        id: user.uid,
        email: user.email,
        name: fullName,
        balance: 0,
        adBalance: 0,
        rank: 'مستكشف نجمي',
        referralCode: ownReferralCode,
        referrerId: referralCode || null, // The code they used to sign up
        createdAt: new Date().toISOString(),
      };

      setDocumentNonBlocking(userDocRef, newUser, { merge: true });

      router.push('/dashboard');

    } catch (error: any) {
      console.error("Signup Error:", error);
      toast({
        variant: "destructive",
        title: "حدث خطأ ما!",
        description: error.message || "لم نتمكن من إنشاء حسابك. يرجى المحاولة مرة أخرى.",
      });
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-muted py-12">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="space-y-4">
          <div className="mx-auto">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-headline text-center">إنشاء حساب جديد</CardTitle>
          <CardDescription className="text-center">
            أدخل معلوماتك لإنشاء حساب والبدء في استخدام المنصة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="full-name">الاسم الكامل</Label>
                <Input id="full-name" placeholder="John Doe" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="referral-code">رمز الإحالة (اختياري)</Label>
                <Input id="referral-code" placeholder="REF123" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} />
              </div>
              <Button type="submit" className="w-full">
                إنشاء الحساب
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            لديك حساب بالفعل؟{" "}
            <Link href="/login" className="underline">
              تسجيل الدخول
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
