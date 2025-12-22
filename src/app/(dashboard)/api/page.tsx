
'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Code2, RefreshCw } from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import type { User as UserType } from '@/lib/types';
import { doc } from "firebase/firestore";
import { ApiKeyCard } from "./_components/api-key-card";
import { CodeExample } from "./_components/code-example";
import { Skeleton } from "@/components/ui/skeleton";

function ApiPageSkeleton() {
    return (
        <div className="space-y-6 pb-8">
            <div>
                <Skeleton className="h-9 w-1/3" />
                <Skeleton className="h-5 w-2/3 mt-2" />
            </div>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
    );
}

export default function ApiPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(() => (firestore && user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
    const { data: userData, isLoading } = useDoc<UserType>(userDocRef);

    if (isLoading || !userData) {
        return <ApiPageSkeleton />;
    }

    const apiKey = userData?.apiKey || 'YOUR_API_KEY';

    const addOrderExample = `{
  "key": "${apiKey}",
  "action": "add",
  "service": 1,
  "link": "https://www.instagram.com/p/C0_Zg3yI3bJ/",
  "quantity": 1000
}`;

    const orderStatusExample = `{
  "key": "${apiKey}",
  "action": "status",
  "order": 12345
}`;

    const servicesListExample = `{
  "key": "${apiKey}",
  "action": "services"
}`;

    return (
        <div className="space-y-6 pb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
                    <Code2 className="h-8 w-8 text-primary" />
                    <span>واجهة برمجة التطبيقات (API)</span>
                </h1>
                <p className="text-muted-foreground">
                    أتمتة طلباتك وادمج خدمات حاجاتي في تطبيقاتك الخاصة.
                </p>
            </div>
            
            <ApiKeyCard apiKey={apiKey} />

            <Card>
                <CardHeader>
                    <CardTitle>نقاط النهاية (Endpoints)</CardTitle>
                     <CardDescription>
                        جميع الطلبات يتم إرسالها إلى نقطة النهاية التالية عبر طريقة POST:
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CodeExample code="https://hajaty.com/api/v2" language="bash" />
                    <h3 className="font-semibold text-lg mb-2 mt-6">الإجراءات المتاحة</h3>

                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium">إضافة طلب جديد (`add`)</h4>
                            <p className="text-sm text-muted-foreground mb-2">استخدم هذا الإجراء لوضع طلب جديد في النظام.</p>
                            <CodeExample code={addOrderExample} language="json" />
                        </div>
                         <div>
                            <h4 className="font-medium">الاستعلام عن حالة طلب (`status`)</h4>
                            <p className="text-sm text-muted-foreground mb-2">استخدم هذا الإجراء للحصول على حالة طلب معين.</p>
                             <CodeExample code={orderStatusExample} language="json" />
                        </div>
                         <div>
                            <h4 className="font-medium">الحصول على قائمة الخدمات (`services`)</h4>
                            <p className="text-sm text-muted-foreground mb-2">استخدم هذا الإجراء للحصول على قائمة بجميع الخدمات المتاحة.</p>
                            <CodeExample code={servicesListExample} language="json" />
                        </div>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}

    