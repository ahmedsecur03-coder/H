
'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User, Shield } from "lucide-react";

export default function ProfilePage() {

    return (
        <div className="space-y-6 pb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">الملف الشخصي</h1>
                <p className="text-muted-foreground">
                    عرض معلومات حسابك.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>معلومات المستخدم</CardTitle>
                </CardHeader>
                <CardContent className="text-center p-8">
                    <Shield className="mx-auto h-16 w-16 text-muted-foreground" />
                    <h2 className="mt-4 text-xl font-semibold">وضع المستخدم المجهول</h2>
                    <p className="mt-2 text-muted-foreground">
                        أنت تستخدم التطبيق كمستخدم مجهول. لا توجد معلومات شخصية لعرضها أو تعديلها.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
