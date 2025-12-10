import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

function VodafoneCashTab() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>فودافون كاش</CardTitle>
                <CardDescription>
                    قم بتحويل المبلغ المطلوب إلى الرقم <code>01012345678</code> ثم أدخل رقمك الذي قمت بالتحويل منه والمبلغ.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="vf-number">رقم هاتفك</Label>
                    <Input id="vf-number" placeholder="010xxxxxxxx" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="vf-amount">المبلغ المحول (بالجنيه المصري)</Label>
                    <Input id="vf-amount" type="number" placeholder="100" />
                </div>
                <Button>تأكيد الإيداع</Button>
            </CardContent>
        </Card>
    );
}

function BinancePayTab() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Binance Pay</CardTitle>
                <CardDescription>
                    استخدم معرف Binance Pay التالي لإرسال المبلغ (USDT): <code>USER12345</code>. ثم أدخل معرف العملية (Transaction ID).
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="binance-tx">معرف العملية (Transaction ID)</Label>
                    <Input id="binance-tx" placeholder="123456789123456789" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="binance-amount">المبلغ المحول (USDT)</Label>
                    <Input id="binance-amount" type="number" placeholder="50" />
                </div>
                <Button>تأكيد الإيداع</Button>
            </CardContent>
        </Card>
    );
}


export default function AddFundsPage() {
  return (
     <div className="space-y-6 pb-8">
       <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">شحن الرصيد</h1>
        <p className="text-muted-foreground">
          اختر طريقة الدفع المناسبة لك لإضافة رصيد إلى حسابك.
        </p>
      </div>

       <Tabs defaultValue="vodafone" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vodafone">فودافون كاش</TabsTrigger>
            <TabsTrigger value="binance">Binance Pay</TabsTrigger>
        </TabsList>
        <TabsContent value="vodafone">
            <VodafoneCashTab />
        </TabsContent>
        <TabsContent value="binance">
            <BinancePayTab />
        </TabsContent>
        </Tabs>
    </div>
  );
}
