'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
                 <p className="text-xs text-muted-foreground">
                    إذا كنت تعتقد أن مفتاحك قد تم اختراقه، يرجى الاتصال بالدعم لإنشاء مفتاح جديد.
                 </p>
            </CardFooter>
        </Card>
    )
}
