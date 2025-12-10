"use client";

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

export default function SignupPage() {
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
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="full-name">الاسم الكامل</Label>
              <Input id="full-name" placeholder="John Doe" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input id="password" type="password" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="referral-code">رمز الإحالة (اختياري)</Label>
              <Input id="referral-code" placeholder="REF123" />
            </div>
            <Button type="submit" className="w-full">
              إنشاء الحساب
            </Button>
          </div>
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
