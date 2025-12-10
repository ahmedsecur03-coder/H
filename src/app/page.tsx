
'use client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Rocket, ShieldCheck, Zap, Users, LogIn, UserPlus } from 'lucide-react';
import Logo from '@/components/logo';
import { useUser } from '@/firebase';
import { UserNav } from './(dashboard)/_components/user-nav';
import { cn } from '@/lib/utils';
import React from 'react';

function Header() {
  const { user, isUserLoading } = useUser();

   const appUser = user ? {
      name: user.displayName || `مستخدم #${user.uid.substring(0, 6)}`,
      email: user.email || "مستخدم مسجل",
      avatarUrl: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
  } : null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Logo />
        <nav className="flex items-center gap-4">
          {isUserLoading ? (
            <div className="h-10 w-24 bg-muted rounded-md animate-pulse" />
          ) : user ? (
            <>
              <Button asChild>
                <Link href="/dashboard">الذهاب إلى لوحة التحكم</Link>
              </Button>
               {appUser && <UserNav user={appUser} />}
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">
                  <LogIn className="ml-2" />
                  تسجيل الدخول
                </Link>
              </Button>
              <Button asChild>
                <Link href="/signup">
                  <UserPlus className="ml-2" />
                  إنشاء حساب
                </Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

const CosmicBackground = () => (
    <div className="absolute inset-0 -z-10 h-full w-full bg-background">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb36,#000)]"></div>
    </div>
);


export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <section className="relative w-full pt-24 pb-12 md:pt-40 md:pb-24 lg:pt-48 lg:pb-32 overflow-hidden">
          <CosmicBackground />
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="flex flex-col justify-center items-center space-y-6">
              <div className="space-y-4">
                 <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl bg-clip-text text-transparent bg-gradient-to-br from-primary-foreground to-primary">
                  منصة <span className="text-primary brightness-125">حاجاتي</span>
                </h1>
                <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl">
                  مركزك المتكامل للخدمات الرقمية. من التسويق عبر الشبكات الاجتماعية إلى الحملات الإعلانية المتقدمة، كل ما تحتاجه لنمو أعمالك في مكان واحد.
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button size="lg" asChild className="shadow-lg shadow-primary/20 hover:brightness-125 transition-all duration-300">
                  <Link href="/dashboard">ابدأ الآن</Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/dashboard/services">استكشف الخدمات</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-background/50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl">لماذا تختار منصة حاجاتي؟</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  نحن نقدم مجموعة شاملة من الأدوات والخدمات المصممة لمساعدتك على تحقيق أهدافك الرقمية بكفاءة وفعالية.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-4">
              {[
                { icon: Zap, title: "خدمات فورية", description: "تنفيذ سريع لخدمات SMM لتعزيز تواجدك على وسائل التواصل الاجتماعي." },
                { icon: Rocket, title: "حملات إعلانية قوية", description: "إدارة حملاتك الإعلانية على Google, Facebook, TikTok, و Snapchat من مكان واحد." },
                { icon: Users, title: "نظام إحالة مربح", description: "اكسب عمولات من خلال دعوة الآخرين للانضمام إلى شبكتك التسويقية." },
                { icon: ShieldCheck, title: "دعم فني موثوق", description: "فريق دعم متخصص ومساعد ذكي لمساعدتك في كل خطوة." }
              ].map((feature, i) => (
                  <div key={i} className="group grid gap-2 text-center p-4 rounded-lg hover:bg-card transition-colors duration-300">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20">
                        <feature.icon className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold font-headline">{feature.title}</h3>
                    <p className="text-muted-foreground">
                        {feature.description}
                    </p>
                  </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-card border-t border-border">
        <div className="container mx-auto py-6 px-4 md:px-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">&copy; 2024 حاجاتي. جميع الحقوق محفوظة.</p>
            <nav className="flex gap-4 sm:gap-6">
                <Link href="#" className="text-sm hover:text-primary underline-offset-4">شروط الخدمة</Link>
                <Link href="#" className="text-sm hover:text-primary underline-offset-4">سياسة الخصوصية</Link>
            </nav>
        </div>
      </footer>
    </div>
  );
}
