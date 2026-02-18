
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Rocket,
  Zap,
  LayoutDashboard,
  Loader2,
  UserPlus,
  LogIn,
  Users,
  CheckCircle2,
  Globe,
  Timer,
  ChevronLeft,
  ShoppingCart
} from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { PLATFORM_ICONS } from '@/lib/icon-data';
import { SMM_SERVICES } from '@/lib/smm-services';
import { motion } from 'framer-motion';
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PROFIT_MARGIN } from '@/lib/constants';

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
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto bg-muted/50">
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
                                            <p className="text-3xl font-bold text-primary">${(service.price * PROFIT_MARGIN).toFixed(3)}</p>
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
        { name: "خالد عبد الرحمن", role: "مدير وكالة تسويق", text: "نظام الإحالة هنا هو الأقوى. تمكنت من بناء مصدر دخل إضافي ومستمر بفضل الشبكة التي كونتها عبر المنصة.", avatar: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?q=80&w=400" },
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
                    <Card className="h-full glassmorphism-card border-primary/10">
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


export default function HomePageClient() {
  const { user, isUserLoading } = useUser();

  const primaryAction = {
    href: isUserLoading ? "#" : user ? "/dashboard" : "/auth/signup",
    label: isUserLoading ? "..." : user ? "لوحة التحكم" : "انطلق الآن",
    icon: isUserLoading ? Loader2 : user ? LayoutDashboard : Rocket
  }

  const coreFeatures = [
    { key: "feat-1", icon: Zap, title: "تنفيذ فوري", description: "معظم خدماتنا تبدأ فور تأكيد الطلب، لضمان وصولك إلى القمة في أسرع وقت." },
    { key: "feat-2", icon: Globe, title: "تغطية شاملة", description: "ندعم جميع منصات التواصل الاجتماعي الرئيسية: انستغرام، تيك توك، فيسبوك، والمزيد." },
    { key: "feat-3", icon: CheckCircle2, title: "جودة مضمونة", description: "نوفر خدمات عالية الجودة مع ضمانات حقيقية لإعادة التعبئة في حال حدوث أي نقص." },
];

  return (
    <div className="space-y-24">
        <section className="relative text-center py-24 overflow-hidden">
            <div
                className="absolute -top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] md:w-[120%] md:h-[120%] lg:w-[100%] lg:h-[100%]
                bg-[radial-gradient(ellipse_50%_40%_at_50%_50%,hsl(var(--primary)/0.15),transparent)] 
                pointer-events-none -z-10"
            />
            
             <motion.h1 
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="text-4xl md:text-6xl lg:text-8xl font-bold font-headline tracking-tighter animated-gradient-text bg-gradient-to-br from-foreground via-primary to-foreground"
            >
                سيطرة كاملة على تفاعلك
            </motion.h1>
             <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
                className="mt-6 text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            >
                المنصة العربية الأسرع والأكثر موثوقية لخدمات الـ SMM. متابعون، مشاهدات، وتفاعل حقيقي لجميع حساباتك الرقمية بضغطة زر واحدة.
            </motion.p>
             <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
                className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4"
            >
                <Button size="lg" asChild className="text-lg py-8 px-10 w-full sm:w-auto rounded-full font-bold" disabled={isUserLoading}>
                    <Link href={primaryAction.href}>
                         <primaryAction.icon className={`me-2 ${isUserLoading ? 'animate-spin' : ''}`} />
                        {primaryAction.label}
                    </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg py-8 px-10 w-full sm:w-auto rounded-full">
                    <Link href="/services">
                        <ShoppingCart className="me-2" />
                        استكشف الخدمات
                    </Link>
                </Button>
            </motion.div>
        </section>
        
        <section>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {coreFeatures.map((feature, i) => {
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
                            <Card className="text-center h-full glassmorphism-card p-6 flex flex-col border-primary/5">
                                <CardHeader className="items-center">
                                    <div className="p-4 bg-primary/10 rounded-2xl mb-4">
                                        <Icon className="h-8 w-8 text-primary" />
                                    </div>
                                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                                    <CardDescription className="pt-2 text-base">{feature.description}</CardDescription>
                                </CardHeader>
                            </Card>
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
                    className="text-4xl font-bold font-headline">أقوى خدماتنا</motion.h2>
                 <motion.p 
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.5, delay: 0.1 }}
                     viewport={{ once: true }}
                    className="text-muted-foreground mt-2 text-lg">اختر المنصة التي تريد السيطرة عليها اليوم.</motion.p>
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
                    className="text-4xl font-bold font-headline">كيف تبدأ رحلة الشهرة؟</motion.h2>
            </div>
             <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12">
                {[
                    { icon: UserPlus, title: "سجل حسابك", text: "خلال 30 ثانية فقط ستكون فرداً من عائلة حاجاتي." },
                    { icon: DollarSign, title: "اشحن رصيدك", text: "استخدم طرق دفع آمنة وسهلة مثل فودافون كاش." },
                    { icon: Rocket, title: "اطلب خدماتك", text: "اختر ما يناسبك وشاهد أرقامك تتضاعف فوراً." }
                ].map((step, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.2 }} viewport={{ once: true }} className="text-center">
                        <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto text-3xl font-black mb-6">
                            <step.icon className="h-10 w-10" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                        <p className="text-muted-foreground">{step.text}</p>
                    </motion.div>
                ))}
            </div>
        </section>
        
         <section>
            <div className="text-center mb-12">
                 <motion.h2 
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.5 }}
                     viewport={{ once: true }}
                    className="text-4xl font-bold font-headline">آراء المبدعين</motion.h2>
            </div>
            <Testimonials />
        </section>

         <section>
            <Card className="bg-gradient-to-tr from-primary/20 via-background to-secondary/20 text-center glassmorphism-card border-primary/20">
                 <CardContent className="p-16">
                    <h2 className="text-4xl md:text-5xl font-bold font-headline mb-6">هل أنت جاهز لتغيير اللعبة؟</h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                        انضم إلى آلاف المسوقين والمؤثرين الذين يثقون في حاجاتي كشريكهم الاستراتيجي الأول للنمو الرقمي.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                         <Button size="lg" asChild className="text-xl py-8 px-12 w-full sm:w-auto rounded-full font-bold shadow-2xl" disabled={isUserLoading}>
                            <Link href={primaryAction.href}>
                                <primaryAction.icon className={`me-2 ${isUserLoading ? 'animate-spin' : ''}`} />
                                {primaryAction.label}
                            </Link>
                        </Button>
                        {!user && !isUserLoading && (
                            <Button size="lg" variant="ghost" asChild className="text-xl py-8 px-12 w-full sm:w-auto rounded-full">
                                <Link href="/auth/login">
                                    <LogIn className="me-2" />
                                    تسجيل الدخول
                                </Link>
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </section>
    </div>
  );
}
