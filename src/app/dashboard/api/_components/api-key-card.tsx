
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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

export const ApiKeyCard = ({ apiKey, onRegenerate, isRegenerating }: { apiKey: string; onRegenerate: () => void; isRegenerating: boolean; }) => {

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
                        <Button variant="destructive" size="sm">
                            <RefreshCw className="me-2 h-4 w-4" />
                             إنشاء مفتاح جديد
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                            <AlertDialogDescription>
                                سيتم إنشاء مفتاح API جديد وإلغاء صلاحية المفتاح الحالي. أي تطبيقات تستخدم المفتاح القديم ستتوقف عن العمل. هذا الإجراء لا يمكن التراجع عنه.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={onRegenerate} disabled={isRegenerating}>
                                {isRegenerating ? <Loader2 className="me-2 animate-spin" /> : null}
                                نعم، قم بإنشاء مفتاح جديد
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    )
}
