

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CheckCircle, Zap } from "lucide-react";
import Link from "next/link";
import React from 'react';
import { GoogleIcon, MetaIcon, TikTokIcon, SnapchatIcon } from '@/components/ui/icons';

const features = [
    "حسابات إعلانية قوية وموثوقة مصممة للإنفاق العالي.",
    "تجنب مشاكل الإغلاق والتقييد المتكررة التي تعيق أعمالك.",
    "وصول مباشر إلى دعم فني متخصص من المنصات الشريكة.",
    "مثالية للوكالات والمسوقين المحترفين الذين يديرون ميزانيات كبيرة.",
    "إمكانية الوصول لميزات إعلانية متقدمة وبيانات حصرية.",
    "استقرار وأمان لا مثيل لهما لضمان استمرارية حملاتك."
];

const partners = [
    { name: "Meta", icon: MetaIcon },
    { name: "Google", icon: GoogleIcon },
    { name: "TikTok", icon: TikTokIcon },
    { name: "Snapchat", icon: SnapchatIcon },
];

export default function AgencyAccountsPage() {
    return (
        <div className="space-y-12 pb-8">
            <div className="text-center py-10">
                 <div className="inline-block p-4 bg-primary/10 border border-primary/20 rounded-full mb-4">
                    <Zap className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold font-headline tracking-tighter">
                    حسابات إعلانية للوكالات (Agency Accounts)
                </h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                    بصفتنا شريكًا معتمدًا، نوفر لك حسابات إعلانية قوية ومستقرة للإنفاق العالي على منصات Meta, Google, TikTok, و Snapchat. تخلص من مشاكل الإغلاق المتكرر وركز على نمو أعمالك.
                </p>
            </div>

            <div className="bg-muted/50 rounded-xl border border-border/50 py-8 px-4">
                <h3 className="text-center text-lg font-semibold text-muted-foreground mb-6">متوفرة للمنصات التالية</h3>
                <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
                    {partners.map(partner => (
                        <div key={partner.name} className="flex items-center gap-3 text-foreground/80">
                            <partner.icon className="h-7" />
                            <span className="text-xl font-medium">{partner.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>لماذا تحتاج حساب وكالة من شريك معتمد؟</CardTitle>
                    <CardDescription>
                        تم تصميم حسابات الوكالات لتوفير استقرار وقوة تحمل لا توفرهما الحسابات العادية، مما يجعلها الخيار الأمثل للمحترفين.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-4">
                        {features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-green-500 mt-1 shrink-0" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
                <CardFooter>
                    <Button asChild className="w-full text-lg">
                        <Link href="/dashboard/support">
                            تواصل مع الدعم لطلب حسابك الآن
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
