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
} from 'lucide-react';
import Link from 'next/link';


export default function HomePage() {
    // This is a public landing page
  return (
    <div className="space-y-12 pb-8">
        <section className="text-center py-20">
            <h1 className="text-5xl lg:text-6xl font-bold font-headline tracking-tighter animated-gradient-text bg-gradient-to-r from-primary via-secondary to-primary">
                بوابتك إلى الكون الرقمي
            </h1>
            <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
                منصة حاجاتي هي مركزك المتكامل للخدمات الرقمية. نقدم خدمات SMM، إدارة حملات إعلانية، ونظام إحالة فريد لنمو أعمالك بسرعة الصاروخ.
            </p>
            <div className="mt-8 flex justify-center gap-4">
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

         <section>
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold font-headline">لماذا تختار حاجاتي؟</h2>
                <p className="text-muted-foreground">نحن نقدم أكثر من مجرد خدمات، نحن شريكك في النجاح.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card>
                    <CardHeader className="items-center text-center">
                        <div className="p-3 bg-primary/20 rounded-full mb-2">
                           <DollarSign className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle>أسعار تنافسية</CardTitle>
                        <CardDescription>أفضل الأسعار في السوق مع الحفاظ على أعلى جودة للخدمات.</CardDescription>
                    </CardHeader>
                </Card>
                 <Card>
                    <CardHeader className="items-center text-center">
                        <div className="p-3 bg-primary/20 rounded-full mb-2">
                           <Shield className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle>دعم فني فوري</CardTitle>
                        <CardDescription>فريق دعم متخصص جاهز لمساعدتك على مدار الساعة لحل أي مشكلة تواجهك.</CardDescription>
                    </CardHeader>
                </Card>
                 <Card>
                    <CardHeader className="items-center text-center">
                        <div className="p-3 bg-primary/20 rounded-full mb-2">
                           <Sparkles className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle>نظام متكامل</CardTitle>
                        <CardDescription>كل ما تحتاجه في مكان واحد، من خدمات SMM إلى إدارة الحملات ونظام الإحالة.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </section>
    </div>
  );
}
