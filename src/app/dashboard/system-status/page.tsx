'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Clock, Database, Server, KeyRound, MessageSquare, Briefcase } from "lucide-react";
import { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { getCountFromServer, collection } from 'firebase/firestore';
import { ServiceCheckItem } from "./_components/service-check-item";


export default function SystemStatusPage() {
    const firestore = useFirestore();
    const { user } = useUser();

    // These functions represent the "check" for each service.
    const checkDatabase = async () => {
        if (!firestore) throw new Error("Firestore not available");
        const servicesCol = collection(firestore, 'services');
        await getCountFromServer(servicesCol);
        return true;
    };

    const checkAuthentication = async () => {
        if (!user) throw new Error("User not authenticated");
        // Simple check if user object exists
        return true;
    };
    
    const checkApi = async () => {
        // In a real scenario, this would ping the actual API endpoint.
        // For this demo, we'll simulate a successful check.
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
    }
    
     const checkSupport = async () => {
        // Simulate checking if the support ticket collection is accessible
         if (!firestore || !user) throw new Error("User or Firestore not available");
        const ticketsCol = collection(firestore, `users/${user.uid}/tickets`);
        await getCountFromServer(ticketsCol);
        return true;
    };

    const checkCampaigns = async () => {
        // Simulate checking if the campaigns collection is accessible
        if (!firestore || !user) throw new Error("User or Firestore not available");
        const campaignsCol = collection(firestore, `users/${user.uid}/campaigns`);
        await getCountFromServer(campaignsCol);
        return true;
    }


    const servicesToMonitor = [
        { name: "الواجهة الرئيسية للمنصة", checkFn: async () => true, icon: Server },
        { name: "نظام المصادقة وتسجيل الدخول", checkFn: checkAuthentication, icon: KeyRound },
        { name: "قاعدة بيانات الخدمات والطلبات", checkFn: checkDatabase, icon: Database },
        { name: "نظام تذاكر الدعم الفني", checkFn: checkSupport, icon: MessageSquare },
        { name: "نظام إدارة الحملات الإعلانية", checkFn: checkCampaigns, icon: Briefcase },
        { name: "واجهة برمجة التطبيقات (API)", checkFn: checkApi, icon: KeyRound },
    ];

    return (
        <div className="space-y-6 pb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">حالة النظام</h1>
                <p className="text-muted-foreground">
                    نظرة مباشرة على أداء وصحة جميع خدمات منصة حاجاتي.
                </p>
            </div>

            <div className="space-y-4">
                {servicesToMonitor.map((service, index) => (
                    <ServiceCheckItem 
                        key={index}
                        name={service.name}
                        checkFn={service.checkFn}
                        Icon={service.icon}
                    />
                ))}
            </div>
             <Card className="mt-8">
                <CardHeader>
                    <CardTitle>ملاحظة</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                       هذه الصفحة مخصصة لمراقبة الحالة العامة للخدمات الرئيسية. إذا واجهت مشكلة مع خدمة معينة غير مذكورة هنا، يرجى التواصل مع الدعم الفني.
                    </p>
                </CardContent>
             </Card>
        </div>
    );
}
