
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Rocket,
  Shield,
  Sparkles,
  ShoppingCart,
  ChevronLeft,
  Star,
  Zap,
  LayoutDashboard,
  Loader2,
  Megaphone,
  Briefcase,
} from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import type { Service } from '@/lib/types';
import { PLATFORM_ICONS } from '@/lib/icon-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { GoogleIcon, MetaIcon, TikTokIcon, SnapchatIcon } from '@/components/ui/icons';
import { SMM_SERVICES } from '@/lib/smm-services';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';


function FeaturedServices() {
    const firestore = useFirestore();
    // We can just take the first 8 services from the static list for the homepage.
    const featuredServices = SMM_SERVICES.slice(0, 8);

    if (featuredServices.length === 0) {
        // This case is unlikely with static data but good for robustness
        return (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-64" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredServices.map((service, i) => {
                const Icon = PLATFORM_ICONS[service.platform as keyof typeof PLATFORM_ICONS] || PLATFORM_ICONS.Default;
                return (
                     <motion.div
                        key={service.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.05 }}
                        viewport={{ once: true }}
                    >
                        <Card className="flex flex-col h-full group transition-all duration-300 hover:scale-105 hover:shadow-primary/20">
                            <CardHeader className="flex-row items-center gap-4">
                                <div className="p-3 bg-muted rounded-full">
                                    <Icon className="w-6 h-6 text-foreground" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg leading-tight">{service.category}</CardTitle>
                                    <CardDescription>{service.platform}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow flex flex-col justify-end">
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-primary">${service.price.toFixed(3)}</p>
                                    <p className="text-xs text-muted-foreground">/ لكل 1000</p>
                                </div>
                                <Button asChild variant="secondary" className="mt-4 w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    <Link href="/services">
                                        <ChevronLeft className="h-4 w-4 ml-2" />
                                        اطلب الآن
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                )
            })}
        </div>
    );
}

function Testimonials() {
    const testimonials = [
        { name: "أحمد المصري", role: "مسوق رقمي", text: "منصة حاجاتي غيرت طريقة عملي بالكامل. السرعة والدعم الفني لا يعلى عليهما. أنصح بها بشدة!", avatar: PlaceHolderImages.find(p => p.id === 'avatar1')?.imageUrl },
        { name: "فاطمة الزهراء", role: "صاحبة متجر إلكتروني", text: "كنت أعاني من ضعف التفاعل على صفحتي، لكن بعد استخدام خدمات حاجاتي، تضاعفت المبيعات والأرباح. شكراً لكم!", avatar: PlaceHolderImages.find(p => p.id === 'avatar2')?.imageUrl },
        { name: "خالد عبد الرحمن", role: "مدير وكالة إعلانية", text: "نظام الإحالة هنا هو الأقوى. تمكنت من بناء مصدر دخل إضافي ومستمر بفضل الشبكة التي كونتها عبر المنصة.", avatar: PlaceHolderImages.find(p => p.id === 'avatar3')?.imageUrl },
        { name: "سارة العبدالله", role: "مؤثرة على انستغرام", text: "أفضل ما في حاجاتي هو تنوع الخدمات وجودتها. كل ما أحتاجه لنمو حسابي أجده في مكان واحد وبأسعار ممتازة.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
        { name: "يوسف المغربي", role: "صانع محتوى يوتيوب", text: "خدمة ساعات المشاهدة ساعدتني في تحقيق شروط يوتيوب بسرعة لم أكن أتوقعها. فريق الدعم كان متعاونًا جدًا.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    ];

    const duplicatedTestimonials = [...testimonials, ...testimonials];

    const carouselVariants = {
        animate: {
            x: [0, -100 * testimonials.length],
            transition: {
                x: {
                    repeat: Infinity,
                    repeatType: "loop",
                    duration: testimonials.length * 5, 
                    ease: "linear",
                },
            },
        },
    };

    return (
        <div className="w-full overflow-hidden relative">
            <motion.div
                className="flex gap-8"
                variants={carouselVariants}
                animate="animate"
            >
                {duplicatedTestimonials.map((t, i) => (
                    <Card key={i} className="flex-shrink-0 w-[350px]">
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
                ))}
            </motion.div>
             <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent"></div>
             <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent"></div>
        </div>
    );
}

function Partners() {
    const partners = [
        { name: "Meta", icon: MetaIcon },
        { name: "Google", icon: GoogleIcon },
        { name: "TikTok", icon: TikTokIcon },
        { name: "Snapchat", icon: SnapchatIcon },
    ];

    return (
        <div className="bg-muted/50 rounded-xl border border-border/50 py-8 px-4">
            <h3 className="text-center text-lg font-semibold text-muted-foreground mb-6">شريك معتمد لدى أكبر المنصات العالمية</h3>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
                {partners.map((partner, i) => (
                     <motion.div
                        key={partner.name}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        viewport={{ once: true }}
                     >
                        <partner.icon className="h-8 text-foreground/80 transition-colors hover:text-foreground" />
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

export default function HomePage() {
  const { user, isUserLoading } = useUser();

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
    {
        icon: DollarSign,
        title: "أسعار تنافسية",
        description: "أفضل الأسعار في السوق مع الحفاظ على أعلى جودة للخدمات."
    },
    {
        icon: Shield,
        title: "دعم فني فوري",
        description: "فريق دعم متخصص جاهز لمساعدتك على مدار الساعة لحل أي مشكلة تواجهك."
    },
    {
        icon: Sparkles,
        title: "نظام متكامل",
        description: "كل ما تحتاجه في مكان واحد، من خدمات SMM إلى إدارة الحملات ونظام الإحالة."
    }
  ];

  const campaignsImage = PlaceHolderImages.find(p => p.id === 'campaigns-placeholder');
  const agencyAccountsImage = PlaceHolderImages.find(p => p.id === 'agency-accounts-placeholder');


  return (
    <div className="space-y-24 pb-8">
        <section className="relative text-center py-20 overflow-hidden">
            <div className="absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,transparent_10%,black)]"></div>
            <div className="absolute inset-0 -z-20 bg-gradient-to-b from-background to-primary/5"></div>
            
             <motion.h1 
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="text-5xl lg:text-7xl font-bold font-headline tracking-tighter animated-gradient-text bg-gradient-to-br from-primary via-fuchsia-500 to-cyan-400"
            >
                شريكك المعتمد للنمو الرقمي
            </motion.h1>
             <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
                className="mt-6 text-xl text-muted-foreground max-w-3xl mx-auto"
            >
                منصة حاجاتي هي مركزك المتكامل للخدمات الرقمية. نقدم خدمات SMM، إدارة حملات إعلانية، ونظام إحالة فريد لنمو أعمالك بسرعة الصاروخ.
            </motion.p>
             <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
                className="mt-10 flex justify-center gap-4"
            >
                <Button size="lg" asChild className="text-lg py-7" disabled={isUserLoading}>
                    <Link href={primaryAction.href}>
                         <primaryAction.icon className={`ml-2 ${isUserLoading ? 'animate-spin' : ''}`} />
                        {primaryAction.label}
                    </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg py-7">
                    <Link href={secondaryAction.href}>
                        <ShoppingCart className="ml-2" />
                        {secondaryAction.label}
                    </Link>
                </Button>
            </motion.div>
        </section>
        
        <Partners />

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {featureCards.map((feature, i) => {
                    const Icon = feature.icon;
                    return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: i * 0.1 }}
                          viewport={{ once: true }}
                        >
                            <Card className="text-center h-full transition-all duration-300 hover:scale-105 hover:shadow-primary/20">
                                <CardHeader className="items-center">
                                    <div className="p-4 bg-primary/10 border border-primary/20 rounded-full mb-4 group-hover:scale-110 group-hover:animate-pulse transition-transform">
                                        <Icon className="h-8 w-8 text-primary" />
                                    </div>
                                    <CardTitle>{feature.title}</CardTitle>
                                    <CardDescription>{feature.description}</CardDescription>
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
                    className="text-4xl font-bold font-headline">نظرة على خدماتنا الكونية</motion.h2>
                 <motion.p 
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.5, delay: 0.1 }}
                     viewport={{ once: true }}
                    className="text-muted-foreground mt-2">عينة من الخدمات الأكثر طلبًا التي نقدمها لرواد الفضاء الرقمي.</motion.p>
            </div>
            <FeaturedServices />
        </section>

        <section>
            <div className="text-center mb-12">
                 <motion.h2 
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.5 }}
                     viewport={{ once: true }}
                    className="text-4xl font-bold font-headline">أطلق حملاتك الإعلانية نحو النجاح</motion.h2>
                 <motion.p 
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.5, delay: 0.1 }}
                     viewport={{ once: true }}
                    className="text-muted-foreground mt-2">أنشئ وراقب حملاتك الإعلانية على مختلف المنصات من مكان واحد.</motion.p>
            </div>
            <Card>
                 <CardContent className="p-10 flex flex-col lg:flex-row items-center gap-8">
                    <div className="flex-1">
                        <Megaphone className="h-16 w-16 text-primary mb-4" />
                        <h3 className="text-2xl font-semibold mb-2">إدارة احترافية لحملاتك</h3>
                        <p className="text-muted-foreground">
                           سواء كنت تستهدف زيادة الوعي بعلامتك التجارية، جلب زيارات لموقعك، أو تحقيق مبيعات مباشرة، فإن فريقنا المختص جاهز لإدارة حملاتك على منصات مثل جوجل وميتا وتيك توك لضمان تحقيق أفضل النتائج بأقل تكلفة.
                        </p>
                         <Button asChild size="lg" className="mt-6">
                            <Link href="/dashboard/campaigns">أطلق حملتك الآن</Link>
                        </Button>
                    </div>
                     <div className="flex-1 w-full flex items-center justify-center">
                         {campaignsImage && (
                            <Image
                                src={campaignsImage.imageUrl}
                                alt={campaignsImage.description}
                                width={500}
                                height={333}
                                className="rounded-lg shadow-lg"
                                data-ai-hint={campaignsImage.imageHint}
                            />
                         )}
                    </div>
                 </CardContent>
            </Card>
        </section>

        <section>
            <div className="text-center mb-12">
                 <motion.h2 
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.5 }}
                     viewport={{ once: true }}
                    className="text-4xl font-bold font-headline">حسابات إعلانية جاهزة وموثوقة</motion.h2>
                 <motion.p 
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.5, delay: 0.1 }}
                     viewport={{ once: true }}
                    className="text-muted-foreground mt-2">تجاوز قيود الحسابات الجديدة واحصل على حسابات وكالة إعلانية قوية.</motion.p>
            </div>
            <Card>
                 <CardContent className="p-10 flex flex-col lg:flex-row-reverse items-center gap-8">
                    <div className="flex-1">
                        <Briefcase className="h-16 w-16 text-primary mb-4" />
                        <h3 className="text-2xl font-semibold mb-2">حسابات ايجنسي (وكالة)</h3>
                        <p className="text-muted-foreground">
                          نوفر لك حسابات إعلانية (ايجنسي) على منصات مثل فيسبوك وجوجل، تتميز بحدود إنفاق أعلى وموثوقية أكبر. اشترِ حسابك، اشحن رصيدك، وأطلق حملاتك دون القلق من الإغلاق المفاجئ.
                        </p>
                         <Button asChild size="lg" className="mt-6">
                            <Link href="/dashboard/agency-accounts">تصفح حسابات الوكالة</Link>
                        </Button>
                    </div>
                     <div className="flex-1 w-full flex items-center justify-center">
                        {agencyAccountsImage && (
                             <Image
                                src={agencyAccountsImage.imageUrl}
                                alt={agencyAccountsImage.description}
                                width={500}
                                height={333}
                                className="rounded-lg shadow-lg"
                                data-ai-hint={agencyAccountsImage.imageHint}
                            />
                        )}
                    </div>
                 </CardContent>
            </Card>
        </section>

         <section className="overflow-x-hidden">
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
    </div>
  );
}
