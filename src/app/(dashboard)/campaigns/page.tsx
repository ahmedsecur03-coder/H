import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Rocket, ListFilter } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const mockCampaigns = [
    { id: "CAM001", name: "حملة رمضان", platform: "Facebook", status: "نشط", spend: 50, budget: 200, startDate: "2024-05-15" },
    { id: "CAM002", name: "تخفيضات الصيف", platform: "Google", status: "مكتمل", spend: 300, budget: 300, startDate: "2024-04-10" },
    { id: "CAM003", name: "إطلاق منتج جديد", platform: "TikTok", status: "متوقف", spend: 25, budget: 150, startDate: "2024-05-20" },
];


export default function CampaignsPage() {
  return (
     <div className="space-y-6 pb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">مركز الحملات الإعلانية</h1>
                <p className="text-muted-foreground">
                أنشئ وأدر حملاتك الإعلانية عبر المنصات المختلفة من مكان واحد.
                </p>
            </div>
             <Button>
                <PlusCircle className="ml-2 h-4 w-4" />
                إنشاء حملة جديدة
            </Button>
        </div>

        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>حملاتك الإعلانية</CardTitle>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <ListFilter className="ml-2 h-4 w-4" />
                        فلترة
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {mockCampaigns.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>الحملة</TableHead>
                                <TableHead>المنصة</TableHead>
                                <TableHead>الحالة</TableHead>
                                <TableHead>الإنفاق</TableHead>
                                <TableHead>الميزانية</TableHead>
                                <TableHead>تاريخ البدء</TableHead>
                                <TableHead className="text-right">إجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockCampaigns.map((campaign) => (
                                <TableRow key={campaign.id}>
                                    <TableCell className="font-medium">{campaign.name}</TableCell>
                                    <TableCell>{campaign.platform}</TableCell>
                                    <TableCell><Badge variant={campaign.status === 'نشط' ? 'default' : 'secondary'}>{campaign.status}</Badge></TableCell>
                                    <TableCell>${campaign.spend.toFixed(2)}</TableCell>
                                    <TableCell>${campaign.budget.toFixed(2)}</TableCell>
                                    <TableCell>{campaign.startDate}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">تفاصيل</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-20">
                        <Rocket className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">ابدأ حملتك الإعلانية الأولى</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            ليس لديك أي حملات إعلانية حتى الآن. انقر لإنشاء حملة جديدة.
                        </p>
                        <Button className="mt-4">
                             <PlusCircle className="ml-2 h-4 w-4" />
                             إنشاء حملة
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
