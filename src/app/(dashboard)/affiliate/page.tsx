import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, DollarSign, Users, Crown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

const topMarketers = [
    { rank: 1, name: "محمد علي", earnings: 2500.50 },
    { rank: 2, name: "فاطمة الزهراء", earnings: 2210.75 },
    { rank: 3, name: "أحمد خالد", earnings: 1980.00 },
    // ... more marketers
];

export default function AffiliatePage() {
  return (
    <div className="space-y-6 pb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">نظام الإحالة</h1>
            <p className="text-muted-foreground">
              اكسب المال عن طريق دعوة أصدقائك للانضمام إلى منصة حاجاتي.
            </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">أرباحك الحالية</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">$150.25</div>
                    <p className="text-xs text-muted-foreground">الحد الأدنى للسحب: $10.00</p>
                </CardContent>
                 <CardFooter>
                    <Button className="w-full">طلب سحب الأرباح</Button>
                </CardFooter>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إجمالي المدعوين</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">125</div>
                    <p className="text-xs text-muted-foreground">3 مستويات في شبكتك</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">مستواك التسويقي</CardTitle>
                    <Crown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">ذهبي</div>
                    <p className="text-xs text-muted-foreground">نسبة العمولة: 20%</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>الترقية التالية</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-sm text-muted-foreground mb-2">
                        فاضل لك $500 للوصول للمستوى الماسي (25%)
                    </div>
                    <Progress value={75} />
                </CardContent>
            </Card>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>رابط الإحالة الخاص بك</CardTitle>
                    <CardDescription>شاركه مع أصدقائك لتبدأ في كسب العمولات.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-2">
                    <Input readOnly value="https://hajaty.app/signup?ref=REF123XYZ" />
                    <Button size="icon" variant="outline">
                        <Copy className="h-4 w-4" />
                    </Button>
                </CardContent>
            </Card>
            <Card>
                 <CardHeader>
                    <CardTitle>أفضل 10 مسوقين</CardTitle>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>الترتيب</TableHead>
                                <TableHead>الاسم</TableHead>
                                <TableHead className="text-right">الأرباح</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topMarketers.map((m) => (
                                <TableRow key={m.rank}>
                                    <TableCell>{m.rank}</TableCell>
                                    <TableCell>{m.name}</TableCell>
                                    <TableCell className="text-right">${m.earnings.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
