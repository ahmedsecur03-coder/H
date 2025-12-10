
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">الإعدادات</h1>
        <p className="text-muted-foreground">
          إدارة تفضيلات حسابك وإعدادات الإشعارات.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>إشعارات البريد الإلكتروني</CardTitle>
          <CardDescription>
            تحكم في رسائل البريد الإلكتروني التي تصلك من المنصة.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="newsletter-emails" className="text-base">النشرة البريدية الأسبوعية</Label>
              <p className="text-sm text-muted-foreground">
                احصل على ملخص بأهم الخدمات الجديدة والعروض الخاصة.
              </p>
            </div>
            <Switch id="newsletter-emails" />
          </div>
           <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="order-updates" className="text-base">تحديثات الطلبات</Label>
              <p className="text-sm text-muted-foreground">
                استقبل بريداً إلكترونياً عند اكتمال أو تغيير حالة أحد طلباتك.
              </p>
            </div>
            <Switch id="order-updates" defaultChecked />
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button>حفظ التغييرات</Button>
      </div>
    </div>
  );
}
