
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Rocket,
  Shield,
  Sparkles,
  ShoppingCart,
  ChevronLeft,
  Zap,
  LayoutDashboard,
  Loader2,
  Megaphone,
  UserPlus,
  LogIn,
  Briefcase,
  Target,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { PLATFORM_ICONS } from '@/lib/icon-data';
import { SMM_SERVICES } from '@/lib/smm-services';
import { motion } from 'framer-motion';
import React, { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';


const serviceCategories = [
    { platform: "Instagram", icon: PLATFORM_ICONS.Instagram },
    { platform: "TikTok", icon: PLATFORM_ICONS.TikTok },
    { platform: "Facebook", icon: PLATFORM_ICONS.Facebook },
    { platform: "YouTube", icon: PLATFORM_ICONS.YouTube },
]

function FeaturedServicesTabs() {
    const getFeaturedServices = (platform: string) => {
        return SMM_SERVICES.filter(s => s.platform === platform).slice(0, 4);
    }

    return (
        <Tabs defaultValue="Instagram" className="w-full">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
            >
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
                    {serviceCategories.map(category => {
                         const Icon = category.icon;
                         return (
                            <TabsTrigger key={category.platform} value={category.platform} className="py-3 text-base gap-2">
                                <Icon className="h-5 w-5" />
                                {category.platform}
                            </TabsTrigger>
                         )
                    })}
                </TabsList>
            </motion.div>

            {serviceCategories.map((category, i) => (
                 <TabsContent key={category.platform} value={category.platform}>
                     <motion.div
                         initial={{ opacity: 0, y: 20 }}
                         whileInView={{ opacity: 1, y: 0 }}
                         transition={{ duration: 0.5, delay: i * 0.1 }}
                         viewport={{ once: true }}
                         className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6"
                    >
                        {getFeaturedServices(category.platform).map(service => {
                             const Icon = PLATFORM_ICONS[service.platform as keyof typeof PLATFORM_ICONS] || PLATFORM_ICONS.Default;
                             return (
                                <Card key={service.id} className="flex flex-col h-full group transition-all duration-300 hover:scale-105 hover:shadow-primary/20 glassmorphism-card">
                                    <CardHeader>
                                         <div className="flex items-center gap-4">
                                            <div className="p-3 bg-muted rounded-full">
                                                <Icon className="w-6 h-6 text-foreground" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base leading-tight">{service.category}</CardTitle>
                                                <CardDescription>{service.platform}</CardDescription>
                                            </div>
                                         </div>
                                    </CardHeader>
                                    <CardContent className="flex-grow flex flex-col justify-end">
                                        <div className="text-center">
                                            <p className="text-3xl font-bold text-primary">${(service.price * 1.50).toFixed(3)}</p>
                                            <p className="text-xs text-muted-foreground">/ لكل 1000</p>
                                        </div>
                                    </CardContent>
                                     <CardFooter>
                                        <Button asChild variant="secondary" className="mt-4 w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                            <Link href={`/services?platform=${service.platform}&category=${encodeURIComponent(service.category)}`}>
                                                <ChevronLeft className="h-4 w-4 me-2" />
                                                اطلب الآن
                                            </Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )
                        })}
                    </motion.div>
                 </TabsContent>
            ))}
        </Tabs>
    );
}

function Testimonials() {
    const testimonials = [
        { name: "أحمد المصري", role: "مسوق رقمي", text: "منصة حاجاتي غيرت طريقة عملي بالكامل. السرعة والدعم الفني لا يعلى عليهما. أنصح بها بشدة!", avatar: "https://images.unsplash.com/photo-1521119989659-a83eee488004?q=80&w=400" },
        { name: "فاطمة الزهراء", role: "صاحبة متجر إلكتروني", text: "كنت أعاني من ضعف التفاعل على صفحتي، لكن بعد استخدام خدمات حاجاتي، تضاعفت المبيعات والأرباح. شكراً لكم!", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400" },
        { name: "خالد عبد الرحمن", role: "مدير وكالة إعلانية", text: "نظام الإحالة هنا هو الأقوى. تمكنت من بناء مصدر دخل إضافي ومستمر بفضل الشبكة التي كونتها عبر المنصة.", avatar: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?q=80&w=400" },
        { name: "سارة العبدالله", role: "مؤثرة على انستغرام", text: "أفضل ما في حاجاتي هو تنوع الخدمات وجودتها. كل ما أحتاجه لنمو حسابي أجده في مكان واحد وبأسعار ممتازة.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400" },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((t, i) => (
                 <motion.div
                    key={`${t.name}-${i}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.15 }}
                    viewport={{ once: true }}
                >
                    <Card className="h-full glassmorphism-card">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <Avatar>
                                    <AvatarImage src={t.avatar} alt={t.name} />
                                    <AvatarFallback>{t.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-base">{t.name}</CardTitle>
                                    <CardDescription>{t.role}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground italic">"{t.text}"</p>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}


export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const primaryAction = {
    href: isUserLoading ? "#" : user ? "/dashboard" : "/auth/signup",
    label: isUserLoading ? "..." : user ? "الذهاب للوحة التحكم" : "انطلق الآن",
    icon: isUserLoading ? Loader2 : user ? LayoutDashboard : Rocket
  }

  const secondaryAction = {
      href: "/services",
      label: "استكشف الخدمات"
  }

 const featureCards = [
    { key: "feature-1", icon: Megaphone, title: "حملات إعلانية ذكية", description: "أطلق حملاتك على جوجل وميتا وتيك توك بأسعار تبدأ من 5$ فقط.", href: "/dashboard/campaigns/new" },
    { key: "feature-2", icon: Briefcase, title: "حسابات إعلانية وكالة", description: "تجاوز قيود الحسابات الجديدة بحسابات موثوقة ذات حدود إنفاق عالية.", href: "/dashboard/agency-accounts" },
    { key: "feature-3", icon: Users, title: "نظام إحالة هجين", description: "اكسب عمولات مباشرة وشبكية من دعواتك حتى 5 مستويات.", href: "/dashboard/affiliate" },
    { key: "feature-4", icon: Zap, title: "خدمات SMM فورية", description: "آلاف الخدمات لجميع المنصات بأسعار تنافسية وسرعة فائقة.", href: "/dashboard/services" },
    { key: "feature-5", icon: Shield, title: "دعم فني فوري", description: "فريق دعم متخصص جاهز لمساعدتك على مدار الساعة لحل أي مشكلة.", href: "/dashboard/support" },
    { key: "feature-6", icon: Target, title: "استهداف دقيق", description: "نقدم خدمات مستهدفة جغرافيًا لضمان وصولك للجمهور الصحيح.", href: "/services" }
];

  const howItWorksSteps = [
    { key: "step-1", icon: UserPlus, title: "أنشئ حسابك", description: "انضم إلى منصتنا في أقل من دقيقة وابدأ رحلتك." },
    { key: "step-2", icon: DollarSign, title: "اشحن رصيدك", description: "اختر من بين طرق الدفع المتعددة والآمنة." },
    { key: "step-3", icon: Rocket, title: "أطلق خدماتك", description: "اختر الخدمة التي تناسبك وانطلق نحو النجاح." }
  ];


  return (
    <>
      <PublicHeader />
      <main className="container flex-1 py-8 space-y-24">
        <section className="relative text-center py-20 overflow-hidden">
            <div
                className="absolute -top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] md:w-[120%] md:h-[120%] lg:w-[100%] lg:h-[100%]
                bg-[radial-gradient(ellipse_50%_40%_at_50%_50%,hsl(var(--primary)/0.15),transparent)] 
                pointer-events-none -z-10"
            />
            
             <motion.h1 
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="text-4xl md:text-5xl lg:text-7xl font-bold font-headline tracking-tighter animated-gradient-text bg-gradient-to-br from-primary via-secondary to-primary/80"
            >
                بوابتك الكونية للخدمات الرقمية
            </motion.h1>
             <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
                className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
            >
                مركزك المتكامل لخدمات SMM، إدارة الحملات الإعلانية، ونظام إحالة فريد لنمو أعمالك بسرعة الصاروخ.
            </motion.p>
             <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
                className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4"
            >
                <Button size="lg" asChild className="text-lg py-7 px-8 w-full sm:w-auto" disabled={isUserLoading}>
                    <Link href={primaryAction.href}>
                         <primaryAction.icon className={`me-2 ${isUserLoading ? 'animate-spin' : ''}`} />
                        {primaryAction.label}
                    </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg py-7 px-8 w-full sm:w-auto">
                    <Link href={secondaryAction.href}>
                        <ShoppingCart className="me-2" />
                        {secondaryAction.label}
                    </Link>
                </Button>
            </motion.div>
        </section>
        
        <section>
            <div className="text-center mb-12">
                <motion.h2 
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.5 }}
                     viewport={{ once: true }}
                    className="text-4xl font-bold font-headline">لماذا تختار حاجاتي؟</motion.h2>
                <motion.p 
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.5, delay: 0.1 }}
                     viewport={{ once: true }}
                    className="text-muted-foreground mt-2">نحن نقدم أكثر من مجرد خدمات، نحن شريكك في النجاح.</motion.p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {featureCards.map((feature, i) => {
                    const Icon = feature.icon;
                    return (
                        <motion.div
                          key={feature.key}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: i * 0.1 }}
                          viewport={{ once: true }}
                           className="h-full"
                        >
                             <Link href={feature.href} className="h-full block">
                                <Card className="text-center h-full transition-all duration-300 hover:scale-105 hover:shadow-primary/20 glassmorphism-card p-2">
                                    <CardHeader className="items-center">
                                        <div className="p-4 bg-primary/10 border border-primary/20 rounded-full mb-4 transition-transform group-hover:scale-110">
                                            <Icon className="h-8 w-8 text-primary" />
                                        </div>
                                        <CardTitle>{feature.title}</CardTitle>
                                        <CardDescription className="pt-2">{feature.description}</CardDescription>
                                    </CardHeader>
                                </Card>
                            </Link>
                        </motion.div>
                    )
                })}
            </div>
        </section>

        <section>
            <div className="text-center mb-12">
                 <motion.h2 
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.5 }}
                     viewport={{ once: true }}
                    className="text-4xl font-bold font-headline">نظرة على خدماتنا الكونية</motion.h2>
                 <motion.p 
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.5, delay: 0.1 }}
                     viewport={{ once: true }}
                    className="text-muted-foreground mt-2">عينة من الخدمات الأكثر طلبًا التي نقدمها لرواد الفضاء الرقمي.</motion.p>
            </div>
            <FeaturedServicesTabs />
        </section>

         <section>
            <div className="text-center mb-12">
                 <motion.h2 
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.5 }}
                     viewport={{ once: true }}
                    className="text-4xl font-bold font-headline">كيف نعمل؟</motion.h2>
                 <motion.p
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.5, delay: 0.1 }}
                     viewport={{ once: true }}
                    className="text-muted-foreground mt-2">ثلاث خطوات بسيطة تفصلك عن الانطلاق.</motion.p>
            </div>
             <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 bg-border hidden md:block border-t-2 border-dashed border-primary/20"></div>
                {howItWorksSteps.map((step, i) => {
                    const Icon = step.icon;
                    return (
                       <motion.div
                            key={step.key}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: i * 0.2 }}
                            viewport={{ once: true }}
                            className="text-center z-10"
                        >
                            <div className="relative inline-block">
                                <div className="p-6 bg-background border-4 border-primary rounded-full mb-4">
                                    <Icon className="h-10 w-10 text-primary" />
                                </div>
                                <div className="absolute -top-2 -right-2 h-10 w-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-lg font-bold border-4 border-background">{i+1}</div>
                            </div>
                            <h3 className="text-xl font-semibold mt-4">{step.title}</h3>
                            <p className="text-muted-foreground mt-1">{step.description}</p>
                       </motion.div>
                    )
                })}
            </div>
        </section>
        

         <section>
            <div className="text-center mb-12">
                 <motion.h2 
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.5 }}
                     viewport={{ once: true }}
                    className="text-4xl font-bold font-headline">ماذا يقول رواد الفضاء عنا؟</motion.h2>
                 <motion.p
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.5, delay: 0.1 }}
                     viewport={{ once: true }}
                    className="text-muted-foreground mt-2">آراء عملائنا هي النجوم التي نهتدي بها.</motion.p>
            </div>
            <Testimonials />
        </section>

         <section>
            <Card className="bg-gradient-to-tr from-primary/10 via-background to-secondary/10 text-center glassmorphism-card">
                 <CardContent className="p-10">
                    <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h2 className="text-3xl font-bold font-headline mb-4">هل أنت جاهز للانطلاق؟</h2>
                    <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                        انضم إلى مئات المستخدمين الذين يثقون في حاجاتي لتنمية أعمالهم وحضورهم الرقمي. حسابك الجديد على بعد نقرة واحدة.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                         <Button size="lg" asChild className="text-lg py-7 px-8 w-full sm:w-auto" disabled={isUserLoading}>
                            <Link href={primaryAction.href}>
                                <primaryAction.icon className={`me-2 ${isUserLoading ? 'animate-spin' : ''}`} />
                                {primaryAction.label}
                            </Link>
                        </Button>
                        {!user && !isUserLoading && (
                            <Button size="lg" variant="ghost" asChild className="text-lg py-7 px-8 w-full sm:w-auto">
                                <Link href="/auth/login">
                                    <LogIn className="me-2" />
                                    لدي حساب بالفعل
                                </Link>
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
