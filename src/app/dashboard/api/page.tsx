'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Code2, RefreshCw } from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import type { User as UserType } from '@/lib/types';
import { doc } from "firebase/firestore";
import { ApiKeyCard } from "./_components/api-key-card";
import { CodeExample } from "./_components/code-example";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function ApiPageSkeleton() {
    return (
        <div className="space-y-6 pb-8">
            <div>
                <Skeleton className="h-9 w-1/3" />
                <Skeleton className="h-5 w-2/3 mt-2" />
            </div>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-64 w-full" />
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

    const balanceExample = `{
  "key": "${apiKey}",
  "action": "balance"
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
                    <h3 className="font-semibold text-lg mb-4 mt-6">الإجراءات المتاحة</h3>

                    <div className="space-y-8">
                        <div>
                            <h4 className="font-medium text-xl border-b pb-2 mb-4">إضافة طلب ('add')</h4>
                            <p className="text-sm text-muted-foreground mb-4">استخدم هذا الإجراء لوضع طلب جديد في النظام.</p>
                            <CodeExample code={addOrderExample} language="json" />
                             <h5 className="font-medium mt-4 mb-2">المعلمات</h5>
                             <Table>
                                <TableHeader><TableRow><TableHead>المعلمة</TableHead><TableHead>الوصف</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    <TableRow><TableCell><code className="font-mono">key</code></TableCell><TableCell>مفتاح API الخاص بك.</TableCell></TableRow>
                                    <TableRow><TableCell><code className="font-mono">action</code></TableCell><TableCell>يجب أن تكون القيمة '<code className="font-mono">add</code>'.</TableCell></TableRow>
                                    <TableRow><TableCell><code className="font-mono">service</code></TableCell><TableCell>معرف الخدمة (ID).</TableCell></TableRow>
                                    <TableRow><TableCell><code className="font-mono">link</code></TableCell><TableCell>الرابط المستهدف للطلب.</TableCell></TableRow>
                                    <TableRow><TableCell><code className="font-mono">quantity</code></TableCell><TableCell>الكمية المطلوبة.</TableCell></TableRow>
                                </TableBody>
                             </Table>
                        </div>
                         <div>
                            <h4 className="font-medium text-xl border-b pb-2 mb-4">الاستعلام عن حالة طلب ('status')</h4>
                            <p className="text-sm text-muted-foreground mb-4">استخدم هذا الإجراء للحصول على حالة طلب معين.</p>
                             <CodeExample code={orderStatusExample} language="json" />
                             <h5 className="font-medium mt-4 mb-2">المعلمات</h5>
                             <Table>
                                <TableHeader><TableRow><TableHead>المعلمة</TableHead><TableHead>الوصف</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    <TableRow><TableCell><code className="font-mono">key</code></TableCell><TableCell>مفتاح API الخاص بك.</TableCell></TableRow>
                                    <TableRow><TableCell><code className="font-mono">action</code></TableCell><TableCell>يجب أن تكون القيمة '<code className="font-mono">status</code>'.</TableCell></TableRow>
                                    <TableRow><TableCell><code className="font-mono">order</code></TableCell><TableCell>معرف الطلب (Order ID) الذي تم إرجاعه عند إنشاء الطلب.</TableCell></TableRow>
                                </TableBody>
                             </Table>
                        </div>
                         <div>
                            <h4 className="font-medium text-xl border-b pb-2 mb-4">الحصول على قائمة الخدمات ('services')</h4>
                            <p className="text-sm text-muted-foreground mb-4">استخدم هذا الإجراء للحصول على قائمة بجميع الخدمات المتاحة.</p>
                            <CodeExample code={servicesListExample} language="json" />
                        </div>
                         <div>
                            <h4 className="font-medium text-xl border-b pb-2 mb-4">الاستعلام عن الرصيد ('balance')</h4>
                            <p className="text-sm text-muted-foreground mb-4">استخدم هذا الإجراء للاستعلام عن رصيدك الحالي.</p>
                            <CodeExample code={balanceExample} language="json" />
                        </div>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>استجابات الخادم</CardTitle>
                    <CardDescription>
                        فيما يلي الاستجابات المحتملة التي يمكن أن يرجعها الخادم.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>الاستجابة</TableHead>
                                <TableHead>الوصف</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell><CodeExample code={`{"order": 12345}`} language="json" /></TableCell>
                                <TableCell>استجابة نجاح عند إضافة طلب جديد. الرقم هو معرف الطلب.</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell><CodeExample code={`{"charge": "0.50", "status": "قيد التنفيذ", ...}`} language="json" /></TableCell>
                                <TableCell>استجابة نجاح عند الاستعلام عن حالة طلب.</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell><CodeExample code={`[{"service": 1, "name": "...", "rate": "0.50"}, ... ]`} language="json" /></TableCell>
                                <TableCell>استجابة نجاح عند طلب قائمة الخدمات.</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell><CodeExample code={`{"balance": "100.50", "currency": "USD"}`} language="json" /></TableCell>
                                <TableCell>استجابة نجاح عند الاستعلام عن الرصيد.</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell><CodeExample code={`{"error": "Incorrect request"}`} language="json" /></TableCell>
                                <TableCell>استجابة خطأ عامة. تحقق من تنسيق طلبك.</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell><CodeExample code={`{"error": "Not enough funds"}`} language="json" /></TableCell>
                                <TableCell>خطأ يشير إلى أن رصيدك غير كافٍ لإتمام الطلب.</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell><CodeExample code={`{"error": "Invalid API key"}`} language="json" /></TableCell>
                                <TableCell>خطأ يشير إلى أن مفتاح API المستخدم غير صالح.</TableCell>
                            </TableRow>
                        </TableBody>
                     </Table>
                </CardContent>
            </Card>

        </div>
    );
}
