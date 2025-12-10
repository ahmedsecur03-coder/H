
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const services = [
  { name: "واجهة الموقع الرئيسية", status: "Operational" },
  { name: "لوحة تحكم المستخدم", status: "Operational" },
  { name: "نظام تقديم الطلبات", status: "Operational" },
  { name: "بوابة الدفع (فودافون كاش)", status: "Operational" },
  { name: "بوابة الدفع (Binance Pay)", status: "Operational" },
  { name: "نظام الحملات الإعلانية", status: "Operational" },
  { name: "نظام الإحالة", status: "Operational" },
  { name: "الدعم الفني", status: "Operational" },
  { name: "واجهة API", status: "Maintenance" },
  { name: "لوحة تحكم المسؤول", status: "Degraded" },
];

const statusConfig = {
  Operational: {
    icon: CheckCircle2,
    color: "bg-green-500",
    text: "يعمل بكفاءة",
  },
  Maintenance: {
    icon: Clock,
    color: "bg-yellow-500",
    text: "تحت الصيانة",
  },
  Degraded: {
    icon: AlertCircle,
    color: "bg-orange-500",
    text: "أداء متدهور",
  },
  Outage: {
    icon: AlertCircle,
    color: "bg-red-500",
    text: "انقطاع الخدمة",
  },
};

export default function SystemStatusPage() {
  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">حالة النظام</h1>
        <p className="text-muted-foreground">
          عرض حي لحالة تشغيل خدمات منصة حاجاتي.
        </p>
      </div>

      <Card className="bg-gradient-to-r from-green-500/10 via-background to-background">
        <CardHeader className="flex flex-row items-center gap-4">
          <CheckCircle2 className="h-8 w-8 text-green-400" />
          <div>
            <CardTitle>جميع الأنظمة تعمل</CardTitle>
            <CardDescription>آخر تحديث: قبل بضع ثوانٍ</CardDescription>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {services.map((service, index) => {
          const config = statusConfig[service.status as keyof typeof statusConfig] || statusConfig.Operational;
          return (
            <Card key={index} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <config.icon className={`h-6 w-6 text-${config.color.replace('bg-', '')}-500`} />
                <span className="font-medium">{service.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${config.color} animate-pulse`}></div>
                <span className={`font-semibold text-sm text-${config.color.replace('bg-', '')}-500`}>{config.text}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
