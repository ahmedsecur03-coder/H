'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">إعدادات الموقع</h1>
        <p className="text-muted-foreground">التحكم في الإعدادات العامة للمنصة.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>إعدادات الدفع</CardTitle>
                    <CardDescription>أدخل معلومات طرق الدفع التي ستظهر للمستخدمين عند شحن الرصيد.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="vodafone-number">رقم فودافون كاش</Label>
                        <Input id="vodafone-number" placeholder="010xxxxxxxx" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="binance-id">معرف Binance Pay</Label>
                        <Input id="binance-id" placeholder="USER12345" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="usd-rate">سعر صرف الدولار (مقابل الجنيه المصري)</Label>
                        <Input id="usd-rate" type="number" placeholder="50" />
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>إعدادات عامة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="whatsapp-support">رابط دعم واتساب</Label>
                        <Input id="whatsapp-support" placeholder="https://wa.me/2010xxxxxxxx" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="deal-of-day">معرف خدمة "صفقة اليوم"</Label>
                        <Input id="deal-of-day" placeholder="أدخل ID الخدمة" />
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>الصيانة</CardTitle>
                    <CardDescription>أدوات للحفاظ على أداء قاعدة البيانات.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        تنظيف السجلات القديمة يمكن أن يساعد في تحسين سرعة استجابة المنصة.
                    </p>
                    <Button variant="destructive" className="w-full">
                        حذف الطلبات المكتملة الأقدم من 90 يوم
                    </Button>
                     <Button variant="destructive" className="w-full">
                        حذف الإيداعات المرفوضة الأقدم من 30 يوم
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
       <Separator className="my-6" />
        <div className="flex justify-end">
            <Button>حفظ التغييرات</Button>
        </div>
    </div>
  );
}
