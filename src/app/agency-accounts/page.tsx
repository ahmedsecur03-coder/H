
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CheckCircle, Zap } from "lucide-react";
import Link from "next/link";
import React from 'react';

const features = [
    "حسابات قوية وموثوقة للإنفاق العالي.",
    "تجنب مشاكل الإغلاق والتقييد المتكررة.",
    "دعم فني متخصص لمساعدتك في أي وقت.",
    "مناسبة للوكالات والمسوقين المحترفين.",
    "إمكانية الوصول لميزات إعلانية متقدمة."
];

export default function AgencyAccountsPage() {
    return (
        <div className="space-y-8 pb-8">
            <div className="text-center py-10">
                 <div className="inline-block p-4 bg-primary/10 border border-primary/20 rounded-full mb-4">
                    <Zap className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold font-headline tracking-tighter">
                    حسابات إعلانية للوكالات
                </h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                    احصل على حسابات إعلانية قوية ومستقرة للإنفاق العالي على منصات مثل فيسبوك، جوجل، وتيك توك. تخلص من مشاكل الإغلاق المتكرر وركز على نمو أعمالك.
                </p>
            </div>

            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>لماذا تحتاج حساب وكالة؟</CardTitle>
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

    