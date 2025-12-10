import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function OrdersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>إدارة الطلبات</CardTitle>
      </CardHeader>
      <CardContent>
        <p>سيتم عرض جميع طلبات المستخدم هنا مع إمكانية الفلترة والبحث.</p>
      </CardContent>
    </Card>
  );
}
