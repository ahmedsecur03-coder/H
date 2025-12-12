
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, TrendingUp, XCircle, Briefcase } from "lucide-react";
import { PLATFORM_ICONS } from '@/lib/icon-data';
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";

const agencyAccounts = [
    {
        platform: "Facebook",
        title: "حساب إعلاني فيسبوك (وكالة)",
        description: "حساب أعمال (Business Manager) قوي وموثوق لفيسبوك، مصمم خصيصًا للتعامل مع الميزانيات الكبيرة والحملات المعقدة.",
        tags: ["موثوق", "وكالة", "Business Manager"],
        price: 100,
        discountedPrice: 90,
    },
    {
        platform: "Google",
        title: "حساب إعلاني جوجل (وكالة)",
        description: "حساب جوجل آمن ومستقر من وكالة معتمدة، يقلل بشكل كبير من خطر الإغلاق المفاجئ والمشاكل التقنية.",
        tags: ["آمن", "مستقر", "وكالة"],
        price: 75,
        discountedPrice: 67.5,
    },
    {
        platform: "TikTok",
        title: "حساب إعلاني تيك توك (وكالة)",
        description: "حساب إعلاني رسمي من وكالة تيك توك، يتميز بالاستقرار العالي وحدود الإنفاق المرتفعة. مثالي للحملات الكبيرة.",
        tags: ["إنفاق عالي", "موثوق", "وكالة"],
        price: 50,
        discountedPrice: 45,
    }
];

const features = [
    {
        Icon: XCircle,
        title: "تجنب مشاكل الحساب العادي",
        description: "وداعًا لمشاكل تقييد الحسابات ورفض الإعلانات المتكرر الذي يواجه الحسابات الشخصية.",
        color: "destructive",
    },
    {
        Icon: TrendingUp,
        title: "حدود إنفاق عالية",
        description: "لا تنتظر أسابيع لزيادة حد الإنفاق. ابدأ بميزانيات كبيرة من اليوم الأول.",
        color: "primary",
    },
    {
        Icon: CheckCircle,
        title: "أمان واستقرار",
        description: "حسابات موثوقة من شركاء رسميين، أقل عرضة للإغلاق المفاجئ بنسبة 99%.",
        color: "primary",
    },
];


export default function AgencyAccountsPage() {
    const { user } = useUser();
    const router = useRouter();

    const handlePurchase = () => {
        if (user) {
            router.push('/dashboard/add-funds');
        } else {
            router.push('/login');
        }
    };

    return (
        <div className="space-y-8 pb-8">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <Briefcase className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight font-headline">حسابات إعلانية وكالة</h1>
                </div>
                <p className="text-muted-foreground max-w-3xl">
                    تصفح وشراء حسابات إعلانية موثوقة من وكالاتنا مباشرة. هذه الحسابات تمنحك استقرارًا وإنفاقًا أعلى لحملاتك الاحترافية.
                </p>
            </div>
            
            <Card className="bg-card/50">
                 <CardHeader>
                    <CardTitle className="text-center font-headline text-2xl">لماذا تختار حساب وكالة؟</CardTitle>
                    <CardDescription className="text-center max-w-2xl mx-auto">
                        الحسابات الإعلانية العادية معرضة للإغلاق والتقييد المستمر، مما يدمر حملاتك. حسابات الوكالة هي الحل.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {features.map((feature) => (
                       <div key={feature.title} className="flex items-start gap-4">
                            <feature.Icon className={`w-12 h-12 mt-1 ${feature.color === 'primary' ? 'text-primary' : 'text-destructive'}`} />
                            <div>
                                <h3 className="font-semibold">{feature.title}</h3>
                                <p className="text-sm text-muted-foreground">{feature.description}</p>
                            </div>
                       </div>
                   ))}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agencyAccounts.map((account) => {
                    const Icon = PLATFORM_ICONS[account.platform as keyof typeof PLATFORM_ICONS] || PLATFORM_ICONS.Default;
                    return (
                        <Card key={account.platform} className="flex flex-col">
                            <CardHeader className="text-center items-center">
                                <div className="bg-muted rounded-full p-4 mb-4">
                                    <Icon className="w-10 h-10 text-foreground" />
                                </div>
                                <CardTitle className="font-headline text-2xl">{account.title}</CardTitle>
                                <CardDescription className="text-xs px-4">{account.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-4">
                                 <div className="flex justify-center gap-2">
                                    {account.tags.map((tag) => (
                                        <Badge key={tag} variant="secondary">{tag}</Badge>
                                    ))}
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-2xl text-muted-foreground line-through">${account.price}</p>
                                    <p className="text-5xl font-bold text-primary">${account.discountedPrice}</p>
                                    <p className="text-sm text-muted-foreground">دفع لمرة واحدة</p>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handlePurchase} className="w-full text-lg py-6 bg-gradient-to-r from-primary to-primary/80 hover:brightness-110">اشتر الآن</Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
