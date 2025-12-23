
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
} from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import type { Service } from '@/lib/types';
import { PLATFORM_ICONS } from '@/lib/icon-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { GoogleIcon, MetaIcon, TikTokIcon, SnapchatIcon } from '@/components/ui/icons';

function FeaturedServices() {
    const firestore = useFirestore();
    const servicesQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'services'), limit(8)) : null,
        [firestore]
    );
    const { data: featuredServices, isLoading } = useCollection<Service>(servicesQuery);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-64" />
                ))}
            </div>
        );
    }

    if (!featuredServices || featuredServices.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredServices.map(service => {
                const Icon = PLATFORM_ICONS[service.platform as keyof typeof PLATFORM_ICONS] || PLATFORM_ICONS.Default;
                return (
                    <Card key={service.id} className="flex flex-col bg-card/50 hover:bg-card hover:border-primary/50 transition-all duration-300 group">
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
                                <Link href="/login">
                                    <ChevronLeft className="h-4 w-4 ml-2" />
                                    اطلب الآن
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
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
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
                <Card key={i} className="bg-card/50 border-border/50">
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
                {partners.map(partner => (
                     <partner.icon key={partner.name} className="h-8 text-foreground/80" />
                ))}
            </div>
        </div>
    )
}

export default function HomePage() {
  return (
    <div className="space-y-24 pb-8">
        <section className="relative text-center py-20 overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-grid-pattern [mask-image:radial-gradient(ellipse_at_center,transparent_10%,black)]"></div>
            <div className="absolute inset-0 -z-20 bg-gradient-to-b from-background to-primary/10"></div>
            
            <h1 className="text-5xl lg:text-7xl font-bold font-headline tracking-tighter animated-gradient-text bg-gradient-to-br from-primary via-fuchsia-500 to-cyan-400">
                شريكك المعتمد للنمو الرقمي
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-3xl mx-auto">
                منصة حاجاتي هي مركزك المتكامل للخدمات الرقمية. نقدم خدمات SMM، إدارة حملات إعلانية، ونظام إحالة فريد لنمو أعمالك بسرعة الصاروخ.
            </p>
            <div className="mt-10 flex justify-center gap-4">
                <Button size="lg" asChild className="text-lg py-7">
                    <Link href="/signup">
                        <Rocket className="ml-2" />
                        انطلق الآن
                    </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg py-7">
                    <Link href="/services">
                        <ShoppingCart className="ml-2" />
                        استكشف الخدمات
                    </Link>
                </Button>
            </div>
        </section>
        
        <Partners />

        <section>
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold font-headline">لماذا تختار حاجاتي؟</h2>
                <p className="text-muted-foreground mt-2">نحن نقدم أكثر من مجرد خدمات، نحن شريكك في النجاح.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="text-center bg-card/50 hover:bg-card transition-colors">
                    <CardHeader className="items-center">
                        <div className="p-4 bg-primary/10 border border-primary/20 rounded-full mb-4">
                            <DollarSign className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle>أسعار تنافسية</CardTitle>
                        <CardDescription>أفضل الأسعار في السوق مع الحفاظ على أعلى جودة للخدمات.</CardDescription>
                    </CardHeader>
                </Card>
                <Card className="text-center bg-card/50 hover:bg-card transition-colors">
                    <CardHeader className="items-center">
                        <div className="p-4 bg-primary/10 border border-primary/20 rounded-full mb-4">
                            <Shield className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle>دعم فني فوري</CardTitle>
                        <CardDescription>فريق دعم متخصص جاهز لمساعدتك على مدار الساعة لحل أي مشكلة تواجهك.</CardDescription>
                    </CardHeader>
                </Card>
                <Card className="text-center bg-card/50 hover:bg-card transition-colors">
                    <CardHeader className="items-center">
                        <div className="p-4 bg-primary/10 border border-primary/20 rounded-full mb-4">
                            <Sparkles className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle>نظام متكامل</CardTitle>
                        <CardDescription>كل ما تحتاجه في مكان واحد، من خدمات SMM إلى إدارة الحملات ونظام الإحالة.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </section>

        <section>
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold font-headline">نظرة على خدماتنا الكونية</h2>
                <p className="text-muted-foreground mt-2">عينة من الخدمات الأكثر طلبًا التي نقدمها لرواد الفضاء الرقمي.</p>
            </div>
            <FeaturedServices />
        </section>

         <section>
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold font-headline">ماذا يقول رواد الفضاء عنا؟</h2>
                <p className="text-muted-foreground mt-2">آراء عملائنا هي النجوم التي نهتدي بها.</p>
            </div>
            <Testimonials />
        </section>
    </div>
  );
}
