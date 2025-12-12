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
} from 'lucide-react';
import Link from 'next/link';
import { initializeFirebaseServer } from '@/firebase/server';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import type { Service } from '@/lib/types';
import { PLATFORM_ICONS } from '@/lib/icon-data';
import PublicLayout from './public-layout';


async function getFeaturedServices(): Promise<Service[]> {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) return [];

    try {
        const servicesRef = collection(firestore, 'services');
        // Fetch a limited number of services to feature on the home page
        const q = query(servicesRef, limit(8));
        const querySnapshot = await getDocs(q);

        const services: Service[] = [];
        querySnapshot.forEach(doc => {
            services.push({ id: doc.id, ...doc.data() } as Service);
        });
        
        return services;

    } catch (error) {
        console.error("Error fetching featured services: ", error);
        return [];
    }
}


export default async function HomePage() {
  const featuredServices = await getFeaturedServices();

  return (
    <PublicLayout>
        <div className="space-y-16 pb-8">
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

            {featuredServices.length > 0 && (
                <section>
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold font-headline">نظرة على خدماتنا الكونية</h2>
                        <p className="text-muted-foreground">عينة من الخدمات الأكثر طلبًا التي نقدمها لرواد الفضاء الرقمي.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {featuredServices.map(service => {
                            const Icon = PLATFORM_ICONS[service.platform as keyof typeof PLATFORM_ICONS] || PLATFORM_ICONS.Default;
                            return (
                                <Card key={service.id} className="flex flex-col hover:border-primary/50 transition-colors duration-300">
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
                                        <Button asChild variant="outline" className="mt-4 w-full">
                                            <Link href="/services">
                                                <ChevronLeft className="h-4 w-4 ml-2" />
                                                عرض التفاصيل
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </section>
            )}
        </div>
    </PublicLayout>
  );
}
