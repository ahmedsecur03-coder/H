
'use client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Rocket, ShieldCheck, Zap, Users, LogIn, UserPlus, Star, Package } from 'lucide-react';
import Logo from '@/components/logo';
import { useUser } from '@/firebase';
import { UserNav } from './(dashboard)/_components/user-nav';
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import CosmicBackground from '@/components/cosmic-background';

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
                <Link href="/dashboard">لوحة التحكم</Link>
              </Button>
               {appUser && <UserNav user={appUser} isAdmin={user.email === 'hagaaty@gmail.com'}/>}
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
                  ابدأ الآن
                </Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

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
                 <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl bg-clip-text text-transparent bg-gradient-to-br from-primary-foreground to-muted-foreground">
                  بوابتك إلى الكون الرقمي
                </h1>
                <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl">
                  منصة حاجتي هي مركز قيادة لإطلاق إمكانياتك الكاملة في عالم التسويق الرقمي. من الحملات الإعلانية الذكية إلى تعزيز وجودك على وسائل التواصل الاجتماعي، نحن هنا لنجعل المستحيل ممكناً.
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button size="lg" asChild className="shadow-lg shadow-primary/20 hover:brightness-125 transition-all duration-300">
                  <Link href="/signup">استكشف الكون</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-background/50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl">لماذا تختار حاجاتي؟</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  نظام يجمع بين القوة والحداثة والسرعة
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-3">
              {[
                { icon: ShieldCheck, title: "أمان وموثوقية", description: "استمتع بخدمات عالية الجودة مع ضمان أمان حسابك. نحن نستخدم أحدث التقنيات لتوفير بيئة آمنة وموثوقة لجميع عملياتك." },
                { icon: Star, title: "جودة استثنائية", description: "نحن نقدم خدمات عالية الجودة من موردين موثوقين لضمان أفضل النتائج. لدينا فريق من الخبراء لمراقبة جودة الخدمات بشكل دوري." },
                { icon: Zap, title: "تنفيذ فائق السرعة", description: "ابدأ حملاتك واحصل على نتائج فورية. أنظمتنا المتطورة تضمن تنفيذ طلباتك بسرعة قياسية مع الحفاظ على الجودة." },
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
        
        <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container mx-auto px-4 md:px-6">
                 <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl">خدماتنا الرئيسية</h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                      أدوات قوية مصممة لمساعدتك على النمو
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <div className="bg-card p-8 rounded-lg">
                        <Package className="h-8 w-8 text-primary mb-4" />
                        <h3 className="text-2xl font-bold font-headline mb-2">الخدمات الكونية (SMM)</h3>
                        <p className="text-muted-foreground mb-4">
                            عزز تواجدك على وسائل التواصل الاجتماعي مع باقات المتابعين، الإعجابات، والمشاهدات لجميع المنصات. أسعار تنافسية وجودة لا تضاهى.
                        </p>
                        <Button variant="link" asChild><Link href="/dashboard/services">اعرف المزيد</Link></Button>
                    </div>
                     <div className="bg-card p-8 rounded-lg">
                        <Zap className="h-8 w-8 text-primary mb-4" />
                        <h3 className="text-2xl font-bold font-headline mb-2">محرك الإعلانات</h3>
                        <p className="text-muted-foreground mb-4">
                            أدر حملاتك الإعلانية المدفوعة على جوجل، فيسبوك، وتيك توك من مكان واحد. أدوات تحليلية قوية وبوابة دفع مرنة لإطلاق حملات ناجحة.
                        </p>
                        <Button variant="link" asChild><Link href="/dashboard/campaigns">اعرف المزيد</Link></Button>
                    </div>
                </div>
            </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-background/50">
            <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl">أسئلة شائعة</h2>
                  </div>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>ما هي طرق الدفع المقدمة؟</AccordionTrigger>
                    <AccordionContent>
                      نحن نقدم طرق دفع متعددة ومرنة تشمل فودافون كاش، Binance Pay، والتحويلات البنكية. يمكنك شحن رصيدك بسهولة والبدء في استخدام خدماتنا.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>ما هي مدة تنفيذ الطلبات؟</AccordionTrigger>
                    <AccordionContent>
                      تختلف مدة التنفيذ باختلاف الخدمة المطلوبة. معظم خدمات SMM تبدأ في التنفيذ خلال دقائق من الطلب، بينما قد تتطلب الحملات الإعلانية بعض الوقت للمراجعة والإعداد.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>هل استخدام خدماتكم آمن على حسابي؟</AccordionTrigger>
                    <AccordionContent>
                     نعم، نحن نضمن أمان حسابك. جميع خدماتنا تتوافق مع سياسات المنصات الاجتماعية. نحن لا نطلب كلمة المرور الخاصة بحسابك أبدًا.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
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
