
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Code2 } from "lucide-react";
import { useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';


const ApiKeyCard = () => {
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();

    // Use a portion of the user's UID as a mock API key
    const apiKey = user ? `hy_${user.uid.slice(0, 16)}...` : '';

    const copyApiKey = () => {
        navigator.clipboard.writeText(apiKey);
        toast({ title: "تم نسخ مفتاح API!" });
    };
    
    if (isUserLoading) {
        return <Skeleton className="h-48 w-full" />
    }

    return (
         <Card>
            <CardHeader>
                <CardTitle>مفتاح API الخاص بك</CardTitle>
                <CardDescription>
                    استخدم هذا المفتاح لمصادقة طلباتك. حافظ عليه سريًا!
                </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
                <Input readOnly value={apiKey} className="font-mono" />
                <Button size="icon" variant="outline" onClick={copyApiKey}>
                    <Copy className="h-4 w-4" />
                </Button>
            </CardContent>
        </Card>
    )
}

const CodeExample = ({ code, language }: { code: string; language: string }) => {
    return (
         <div className="rounded-md overflow-hidden bg-[#1E1E1E]">
            <SyntaxHighlighter language={language} style={vscDarkPlus} customStyle={{ margin: 0, padding: '1.5rem', direction: 'ltr' }}>
                {code.trim()}
            </SyntaxHighlighter>
        </div>
    );
};

const addOrderExample = `{
  "key": "YOUR_API_KEY",
  "action": "add",
  "service": 1,
  "link": "https://www.instagram.com/p/C0_Zg3yI3bJ/",
  "quantity": 1000
}`;

const orderStatusExample = `{
  "key": "YOUR_API_KEY",
  "action": "status",
  "order": 12345
}`;

const servicesListExample = `{
  "key": "YOUR_API_KEY",
  "action": "services"
}`;


export default function ApiPage() {

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
            
            <ApiKeyCard />

            <Card>
                <CardHeader>
                    <CardTitle>نقاط النهاية (Endpoints)</CardTitle>
                     <CardDescription>
                        جميع الطلبات يتم إرسالها إلى نقطة النهاية التالية عبر طريقة POST:
                    </CardDescription>
                    <Input readOnly value="https://hagaaty.com/api/v2" className="text-center font-mono" />
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="addOrder">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="addOrder">إضافة طلب</TabsTrigger>
                            <TabsTrigger value="orderStatus">حالة الطلب</TabsTrigger>
                            <TabsTrigger value="servicesList">قائمة الخدمات</TabsTrigger>
                        </TabsList>
                        <TabsContent value="addOrder" className="mt-4">
                            <h3 className="font-semibold text-lg mb-2">إضافة طلب جديد</h3>
                            <p className="text-sm text-muted-foreground mb-4">استخدم هذا الإجراء لوضع طلب جديد في النظام.</p>
                            <CodeExample code={addOrderExample} language="json" />
                        </TabsContent>
                        <TabsContent value="orderStatus" className="mt-4">
                            <h3 className="font-semibold text-lg mb-2">الاستعلام عن حالة طلب</h3>
                            <p className="text-sm text-muted-foreground mb-4">استخدم هذا الإجراء للحصول على حالة طلب معين.</p>
                             <CodeExample code={orderStatusExample} language="json" />
                        </TabsContent>
                        <TabsContent value="servicesList" className="mt-4">
                            <h3 className="font-semibold text-lg mb-2">الحصول على قائمة الخدمات</h3>
                            <p className="text-sm text-muted-foreground mb-4">استخدم هذا الإجراء للحصول على قائمة بجميع الخدمات المتاحة.</p>
                            <CodeExample code={servicesListExample} language="json" />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

        </div>
    );
}

// You might need to install react-syntax-highlighter and its types
// npm install react-syntax-highlighter @types/react-syntax-highlighter
