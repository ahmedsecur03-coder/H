'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Megaphone, Briefcase, AppWindow, Users } from "lucide-react";
import { PLATFORM_ICONS } from '@/lib/icon-data';
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from 'react';

const serviceCategories = [
    {
        title: "الحملات الإعلانية",
        description: "أنشئ، حلل، وحسّن حملاتك التسويقية.",
        icon: Megaphone,
        href: "/dashboard/campaigns",
        color: "text-purple-400"
    },
    {
        title: "خدمات الوكالة",
        description: "حسابات إعلانية قوية للإنفاق العالي.",
        icon: Briefcase,
        href: "/agency-accounts",
        color: "text-amber-400"
    },
    {
        title: "تصميم المواقع",
        description: "اطلب تصميم موقع ويب احترافي.",
        icon: AppWindow,
        href: "/dashboard/support",
        color: "text-green-400"
    },
];

const smmPlatforms = [
    { platform: "Instagram", description: "كل ما تحتاجه للنمو على انستغرام" },
    { platform: "TikTok", description: "خدمات تيك توك للانتشار السريع" },
    { platform: "Facebook", description: "خدمات الفيسبوك المتكاملة" },
    { platform: "YouTube", description: "لصناع المحتوى والطامحين للنجاح" },
    { platform: "Telegram", description: "خدمات لتنمية قنوات ومجموعات تليجرام" },
    { platform: "X (Twitter)", description: "عزز وجودك على منصة إكس" },
    { platform: "Snapchat", description: "خدمات لزيادة التفاعل والمشاهدات" },
    { platform: "Kwai", description: "خدمات لتطبيق كواي" },
    { platform: "VK", description: "خدمات لمنصة VK" },
    { platform: "WhatsApp", description: "خدمات لتنمية قنوات واتساب" },
    { platform: "خدمات الألعاب", description: "شحن شدات وجواهر لأشهر الألعاب" },
    { platform: "خرائط جوجل", description: "تقييمات لتعزيز ظهور نشاطك التجاري" },
    { platform: "Threads", description: "خدمات لمنصة ثريدز الجديدة" },
    { platform: "Kick", description: "خدمات لمنصة البث المباشر Kick" },
    { platform: "Clubhouse", description: "خدمات لمنصة كلوب هاوس" },
    { platform: "زيارات مواقع", description: "زيارات لموقعك من مصادر مختلفة" },
];


export default function ServicesPage() {
    const router = useRouter();

    const handleExploreSMM = (platform: string) => {
        router.push(`/dashboard?platform=${encodeURIComponent(platform)}`);
    };

    return (
        <div className="space-y-12 pb-8">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <Users className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight font-headline">
                        استكشف خدماتنا الكونية
                    </h1>
                </div>
                <p className="text-muted-foreground max-w-3xl">
                    تصفح مجموعتنا الواسعة من خدمات التسويق الرقمي المصممة لمساعدتك على تحقيق أهدافك، من نمو وسائل التواصل الاجتماعي إلى الحملات الإعلانية المتقدمة.
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {serviceCategories.map((service) => {
                    const Icon = service.icon;
                    return (
                        <Card key={service.title} className="bg-card/70 hover:bg-card/100 hover:border-primary/30 transition-all">
                             <CardHeader>
                                <Icon className={`w-8 h-8 mb-2 ${service.color}`} />
                                <CardTitle>{service.title}</CardTitle>
                                <CardDescription>{service.description}</CardDescription>
                            </CardHeader>
                            <CardFooter>
                                 <Button variant="outline" asChild className="w-full">
                                    <Link href={service.href}>
                                        استكشف الآن
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
            
            <div className="space-y-6">
                 <div>
                    <h2 className="text-2xl font-bold font-headline">خدمات التسويق الرقمي (SMM)</h2>
                    <p className="text-muted-foreground">
                        اختر المنصة التي تريد تعزيز وجودك عليها.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {smmPlatforms.map((item) => {
                        const Icon = PLATFORM_ICONS[item.platform] || PLATFORM_ICONS.Default;
                        return (
                            <Card key={item.platform} className="flex flex-col justify-between hover:border-primary/50 transition-colors duration-300">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                         <div className="p-3 bg-muted rounded-full">
                                            <Icon className="w-6 h-6 text-foreground" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{item.platform}</CardTitle>
                                            <CardDescription>{item.description}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardFooter>
                                    <Button onClick={() => handleExploreSMM(item.platform)} className="w-full">
                                        استكشف الآن
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}
