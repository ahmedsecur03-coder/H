'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Campaign } from '@/lib/types';
import { BarChart, Eye, MousePointerClick, Target, Clock, DollarSign } from "lucide-react";

export function CampaignDetailsDialog({ campaign: initialCampaign }: { campaign: Campaign }) {
    const [open, setOpen] = useState(false);
    const [campaign, setCampaign] = useState(initialCampaign);

    useEffect(() => {
        // Reset campaign data to the original state from props when the dialog is opened or the underlying data changes.
        setCampaign(initialCampaign);

        // If the campaign is not active or the dialog is closed, do nothing.
        if (initialCampaign.status !== 'نشط' || !open) {
            return;
        }

        // Set up an interval to simulate live campaign data updates.
        const interval = setInterval(() => {
            setCampaign(prevCampaign => {
                // Prevent further updates if the campaign is no longer active (e.g., manually stopped or completed).
                if (prevCampaign.status !== 'نشط') {
                    clearInterval(interval);
                    return prevCampaign;
                }
                
                // Simulate new impressions and clicks with some randomness.
                const newImpressions = (prevCampaign.impressions || 0) + Math.floor(Math.random() * 500) + 100;
                const newClicks = (prevCampaign.clicks || 0) + Math.floor(newImpressions / (Math.floor(Math.random() * 200) + 80)); // Simulate a realistic CTR
                
                // Simulate the cost of new clicks and update the total spend, ensuring it doesn't exceed the budget.
                const newSpend = Math.min(prevCampaign.budget, (prevCampaign.spend || 0) + (newClicks - (prevCampaign.clicks || 0)) * (Math.random() * 0.1 + 0.05));

                // Simulate results based on clicks.
                const newResults = (prevCampaign.results || 0) + Math.floor(newClicks / (Math.floor(Math.random() * 5) + 2));

                // Recalculate metrics.
                const ctr = newImpressions > 0 ? (newClicks / newImpressions) * 100 : 0;
                const cpc = newClicks > 0 ? newSpend / newClicks : 0;
                
                // If the budget is fully spent, mark the campaign as complete.
                let status = prevCampaign.status;
                if (newSpend >= prevCampaign.budget) {
                    status = 'مكتمل';
                }

                return {
                    ...prevCampaign,
                    impressions: newImpressions,
                    clicks: newClicks,
                    spend: newSpend,
                    results: newResults,
                    ctr: ctr,
                    cpc: cpc,
                    status: status,
                };
            });
        }, 3000); // Update every 3 seconds

        // Cleanup: clear the interval and reset the campaign state when the component unmounts or the dialog is closed.
        return () => {
            clearInterval(interval);
            setCampaign(initialCampaign); 
        };
    }, [open, initialCampaign]);

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
