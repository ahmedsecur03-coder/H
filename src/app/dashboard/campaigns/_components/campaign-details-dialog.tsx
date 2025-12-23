
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Campaign } from '@/lib/types';
import { BarChart, Eye, MousePointerClick, Target, Clock, DollarSign } from "lucide-react";

export function CampaignDetailsDialog({ campaign }: { campaign: Campaign }) {
    const [open, setOpen] = useState(false);

    const statusVariant = {
        'نشط': 'default',
        'متوقف': 'secondary',
        'مكتمل': 'outline',
        'بانتظار المراجعة': 'destructive',
    } as const;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">عرض التفاصيل</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>تفاصيل الحملة: {campaign.name}</DialogTitle>
                    <DialogDescription>نظرة شاملة على أداء حملتك حتى الآن.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 py-4">
                     <div className="flex items-center justify-between col-span-2">
                        <span className="text-muted-foreground">الحالة:</span>
                        <Badge variant={statusVariant[campaign.status] || 'secondary'}>{campaign.status}</Badge>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <Eye className="w-8 h-8 text-primary" />
                        <div>
                            <p className="text-xs text-muted-foreground">مرات الظهور</p>
                            <p className="text-xl font-bold">{(campaign.impressions || 0).toLocaleString()}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <MousePointerClick className="w-8 h-8 text-primary" />
                        <div>
                            <p className="text-xs text-muted-foreground">النقرات</p>
                            <p className="text-xl font-bold">{(campaign.clicks || 0).toLocaleString()}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <Target className="w-8 h-8 text-primary" />
                        <div>
                            <p className="text-xs text-muted-foreground">النتائج ({campaign.goal})</p>
                            <p className="text-xl font-bold">{(campaign.results || 0).toLocaleString()}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <BarChart className="w-8 h-8 text-primary" />
                        <div>
                            <p className="text-xs text-muted-foreground">نسبة النقر (CTR)</p>
                            <p className="text-xl font-bold">{(campaign.ctr || 0).toFixed(2)}%</p>
                        </div>
                    </div>
                     <div className="flex items-center justify-between text-sm col-span-2">
                        <span className="text-muted-foreground flex items-center gap-1"><DollarSign className="w-4 h-4"/> تكلفة النقرة (CPC):</span>
                        <span className="font-mono font-bold">${(campaign.cpc || 0).toFixed(3)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm col-span-2">
                        <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-4 h-4"/> المدة:</span>
                        <span className="font-mono font-bold">{campaign.durationDays} أيام</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
