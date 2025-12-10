
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const statusVariant = {
    'نشط': 'default',
    'متوقف': 'secondary',
    'مكتمل': 'outline',
    'بانتظار المراجعة': 'destructive'
} as const;


const dummyCampaigns = [
    {
        id: 'camp_1',
        user: 'أحمد المصري',
        name: 'حملة تخفيضات الصيف',
        platform: 'Facebook',
        budget: 500,
        spend: 120.50,
        status: 'نشط',
        startDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
        id: 'camp_2',
        user: 'سارة خالد',
        name: 'إطلاق منتج جديد',
        platform: 'Google',
        budget: 1000,
        spend: 0,
        status: 'بانتظار المراجعة',
        startDate: new Date().toISOString(),
    }
];

export default function AdminCampaignsPage() {
  const campaigns = dummyCampaigns;
  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">إدارة الحملات</h1>
        <p className="text-muted-foreground">
          مراجعة الحملات الإعلانية للمستخدمين والموافقة عليها أو رفضها.
        </p>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>جميع الحملات</CardTitle>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الحملة</TableHead>
                <TableHead>المستخدم</TableHead>
                <TableHead>المنصة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإنفاق</TableHead>
                <TableHead>الميزانية</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>{campaign.user}</TableCell>
                  <TableCell>{campaign.platform}</TableCell>
                  <TableCell><Badge variant={statusVariant[campaign.status]}>{campaign.status}</Badge></TableCell>
                  <TableCell>${campaign.spend.toFixed(2)}</TableCell>
                  <TableCell>${campaign.budget.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">تفاصيل</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
