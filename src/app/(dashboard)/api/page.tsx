
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Code2, RefreshCw, Loader2 } from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc } from 'firebase/firestore';
import type { User as UserType } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const ApiKeyCard = () => {
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isRegenerating, setIsRegenerating] = useState(false);

    const userDocRef = useMemoFirebase(
        () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
        [firestore, user]
    );
    const { data: userData, isLoading: isUserDocLoading } = useDoc<UserType>(userDocRef);
    
    const apiKey = userData?.apiKey || '';

    const copyApiKey = () => {
        if (!apiKey) return;
        navigator.clipboard.writeText(apiKey);
        toast({ title: "تم نسخ مفتاح API!" });
    };

    const handleRegenerate = async () => {
        if (!userDocRef) return;
        setIsRegenerating(true);
        try {
            // A more secure, browser-native way to generate a random UUID.
            const newKey = `hy_${crypto.randomUUID()}`;
            await updateDoc(userDocRef, { apiKey: newKey });
            toast({ title: "تم إنشاء مفتاح جديد بنجاح!", description: "المفتاح القديم لم يعد صالحاً." });
        } catch (error) {
            toast({ variant: 'destructive', title: "خطأ", description: "فشل إنشاء مفتاح جديد." });
        } finally {
            setIsRegenerating(false);
        }
    };
    
    if (isUserLoading || isUserDocLoading) {
        return <Skeleton className="h-40 w-full" />
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
                <Input readOnly value={apiKey} className="font-mono" placeholder="جاري تحميل المفتاح..." />
                <Button size="icon" variant="outline" onClick={copyApiKey} disabled={!apiKey}>
                    <Copy className="h-4 w-4" />
                </Button>
            </CardContent>
             <CardFooter>
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button variant="destructive" disabled={isRegenerating}>
                        {isRegenerating ? <Loader2 className="ml-2 animate-spin" /> : <RefreshCw className="ml-2" />}
                         إعادة توليد المفتاح
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>هل أنت متأكد تماماً؟</AlertDialogTitle>
                      <AlertDialogDescription>
                        سيؤدي هذا إلى جعل مفتاح API القديم الخاص بك غير صالح بشكل دائم. ستحتاج إلى تحديث أي تطبيقات تستخدم المفتاح القديم.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRegenerate}>نعم، قم بإنشاء مفتاح جديد</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
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


export default function ApiPage() {
    const { user } = useUser();
    const firestore = useFirestore();
     const userDocRef = useMemoFirebase(
        () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
        [firestore, user]
    );
    const { data: userData } = useDoc<UserType>(userDocRef);

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
