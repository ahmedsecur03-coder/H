import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Rocket, ShieldCheck, Zap, Users } from 'lucide-react';
import Image from 'next/image';
import Logo from '@/components/logo';
import { placeholderImages } from '@/lib/placeholder-images';

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Logo />
        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">تسجيل الدخول</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">إنشاء حساب</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

export default function Home() {
  const heroImage = placeholderImages.find(p => p.id === 'hero');

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <section className="relative w-full pt-24 pb-12 md:pt-40 md:pb-24 lg:pt-48 lg:pb-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
              <div className="flex flex-col justify-center space-y-6">
                <div className="space-y-4">
                  <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                    منصة <span className="text-primary">حاجاتي</span>
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    مركزك المتكامل للخدمات الرقمية. من التسويق عبر الشبكات الاجتماعية إلى الحملات الإعلانية المتقدمة، كل ما تحتاجه لنمو أعمالك في مكان واحد.
                  </p>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Button size="lg" asChild>
                    <Link href="/signup">ابدأ الآن مجاناً</Link>
                  </Button>
                  <Button size="lg" variant="secondary" asChild>
                    <Link href="/services">استكشف الخدمات</Link>
                  </Button>
                </div>
              </div>
              <div className="relative flex items-center justify-center">
                {heroImage && (
                  <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    width={600}
                    height={400}
                    className="rounded-xl object-cover shadow-2xl"
                    data-ai-hint={heroImage.imageHint}
                  />
                )}
                 <div className="absolute -top-8 -left-8 w-32 h-32 bg-primary/20 rounded-full blur-3xl -z-10"></div>
                 <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-accent/20 rounded-full blur-3xl -z-10"></div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
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
              <div className="grid gap-2 text-center">
                 <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Zap className="h-8 w-8" />
                 </div>
                <h3 className="text-xl font-bold font-headline">خدمات فورية</h3>
                <p className="text-muted-foreground">
                  تنفيذ سريع لخدمات SMM لتعزيز تواجدك على وسائل التواصل الاجتماعي.
                </p>
              </div>
              <div className="grid gap-2 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Rocket className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold font-headline">حملات إعلانية قوية</h3>
                <p className="text-muted-foreground">
                  إدارة حملاتك الإعلانية على Google, Facebook, TikTok, و Snapchat من مكان واحد.
                </p>
              </div>
              <div className="grid gap-2 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Users className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold font-headline">نظام إحالة مربح</h3>
                <p className="text-muted-foreground">
                  اكسب عمولات من خلال دعوة الآخرين للانضمام إلى شبكتك التسويقية.
                </p>
              </div>
              <div className="grid gap-2 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ShieldCheck className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold font-headline">دعم فني موثوق</h3>
                <p className="text-muted-foreground">
                  فريق دعم متخصص ومساعد ذكي لمساعدتك في كل خطوة.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-background border-t">
        <div className="container mx-auto py-6 px-4 md:px-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">&copy; 2024 حاجاتي. جميع الحقوق محفوظة.</p>
            <nav className="flex gap-4 sm:gap-6">
                <Link href="#" className="text-sm hover:underline underline-offset-4">شروط الخدمة</Link>
                <Link href="#" className="text-sm hover:underline underline-offset-4">سياسة الخصوصية</Link>
            </nav>
        </div>
      </footer>
    </div>
  );
}
