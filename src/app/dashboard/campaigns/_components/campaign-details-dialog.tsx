'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Campaign } from '@/lib/types';
import { BarChart, Eye, MousePointerClick, Target, Clock, DollarSign } from "lucide-react";

export function CampaignDetailsDialog({ campaign, children }: { campaign: Campaign, children: React.ReactNode }) {
    const [open, setOpen] = useState(false);

    const statusVariant = {
        'نشط': 'default',
        'متوقف': 'secondary',
        'مكتمل': 'outline',
        'بانتظار المراجعة': 'destructive',
    } as const;

    const stats = [
        { label: "مرات الظهور", value: (campaign.impressions || 0).toLocaleString(), icon: Eye },
        { label: "النقرات", value: (campaign.clicks || 0).toLocaleString(), icon: MousePointerClick },
        { label: "النتائج", "description": `(${campaign.goal})`, value: (campaign.results || 0).toLocaleString(), icon: Target },
        { label: "نسبة النقر (CTR)", value: `${(campaign.ctr || 0).toFixed(2)}%`, icon: BarChart },
    ];
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>تفاصيل الحملة: {campaign.name}</DialogTitle>
                    <DialogDescription>نظرة عامة على أداء حملتك الإعلانية.</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                     <div className="flex items-center justify-between col-span-2 text-lg border-b pb-4">
                        <span className="text-muted-foreground">الحالة:</span>
                        <Badge variant={statusVariant[campaign.status] || 'secondary'} className="px-3 py-1">{campaign.status}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {stats.map(stat => (
                            <div key={stat.label} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                                <stat.icon className="w-8 h-8 text-primary shrink-0" />
                                <div>
                                    <p className="text-xs text-muted-foreground">{stat.label} {stat.description}</p>
                                    <p className="text-xl font-bold">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                     <div className="space-y-3 pt-4 border-t">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1.5"><DollarSign className="w-4 h-4"/> تكلفة النقرة (CPC):</span>
                            <span className="font-mono font-bold">${(campaign.cpc || 0).toFixed(3)}</span>
                        </div>
                         <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="w-4 h-4"/> المدة:</span>
                            <span className="font-mono font-bold">{campaign.durationDays} أيام</span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
