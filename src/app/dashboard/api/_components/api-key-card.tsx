'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, RefreshCw, Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
} from "@/components/ui/alert-dialog";
import { regenerateApiKey } from '../actions';
import { useRouter } from 'next/navigation';

function CopyButton({ textToCopy }: { textToCopy: string }) {
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);
  
    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        toast({ title: "تم نسخ مفتاح API!" });
        setTimeout(() => setCopied(false), 2000);
    };
  
    return (
        <Button size="icon" variant="outline" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
    );
}

export const ApiKeyCard = ({ apiKey }: { apiKey: string }) => {
    const { toast } = useToast();
    const router = useRouter();
    const [isRegenerating, setIsRegenerating] = useState(false);

    const handleRegenerate = async () => {
        setIsRegenerating(true);
        try {
            await regenerateApiKey();
            toast({ title: "تم إنشاء مفتاح جديد بنجاح!", description: "المفتاح القديم لم يعد صالحاً." });
            router.refresh();
        } catch (error) {
            toast({ variant: 'destructive', title: "خطأ", description: "فشل إنشاء مفتاح جديد." });
        } finally {
            setIsRegenerating(false);
        }
    };

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
                <CopyButton textToCopy={apiKey} />
            </CardContent>
             <CardFooter>
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button variant="destructive" disabled={isRegenerating}>
                        {isRegenerating ? <Loader2 className="ml-2 animate-spin" /> : <RefreshCw className="ml-2 h-4 w-4" />}
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
