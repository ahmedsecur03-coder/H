
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import Link from "next/link";

export default function AdminSupportPage() {
  return (
    <div className="space-y-6 pb-8">
       <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">إدارة الدعم الفني</h1>
        <p className="text-muted-foreground">
          عرض والرد على تذاكر الدعم من المستخدمين.
        </p>
      </div>

       <Card className="text-center py-20">
          <CardHeader>
            <MessageSquare className="mx-auto h-16 w-16 text-primary" />
            <CardTitle className="mt-4 text-2xl">تم نقل قسم الدعم</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              تم نقل قسم الدعم الفني إلى لوحة تحكم المستخدم. يمكنك الرد على تذاكر المستخدمين من هناك.
            </p>
             <Button asChild className="mt-6">
                <Link href="/dashboard/support">
                    الانتقال إلى قسم الدعم الجديد
                </Link>
            </Button>
          </CardContent>
        </Card>
    </div>
  );
}
