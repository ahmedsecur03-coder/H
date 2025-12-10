import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ListOrdered } from "lucide-react";

export default function MassOrderPage() {
  return (
    <div className="space-y-6 pb-8">
       <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">طلب جماعي</h1>
        <p className="text-muted-foreground">
          أضف طلبات متعددة بسرعة عن طريق لصقها في الحقل أدناه.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>إدخال الطلبات</CardTitle>
          <CardDescription>
            اتبع التنسيق التالي لكل طلب في سطر منفصل: <code>id_الخدمة|الرابط|الكمية</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder={`1|https://instagram.com/user1|1000\n2|https://youtube.com/watch?v=abc|5000\n5|https://facebook.com/page|200`}
            className="min-h-[250px] text-left ltr"
          />
          <Button>
            <ListOrdered className="ml-2 h-4 w-4" />
            إرسال الطلبات
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
