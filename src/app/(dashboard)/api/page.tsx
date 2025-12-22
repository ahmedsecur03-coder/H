
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Code2, RefreshCw } from "lucide-react";
import { getAuthenticatedUser } from "@/firebase/server-auth";
import type { User as UserType } from '@/lib/types';
import { initializeFirebaseServer } from "@/firebase/server";
import { doc, getDoc } from "firebase/firestore";
import { ApiKeyCard } from "./_components/api-key-card";
import { CodeExample } from "./_components/code-example";

async function getData(userId: string) {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) return { userData: null };

    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    return {
        userData: userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } as UserType : null
    }
}


export default async function ApiPage() {
    const { user } = await getAuthenticatedUser();
    if (!user) return null;

    const { userData } = await getData(user.uid);
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
