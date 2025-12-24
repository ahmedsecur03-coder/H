
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Campaign } from '@/lib/types';
import { BarChart, Eye, MousePointerClick, Target, Clock, DollarSign } from "lucide-react";
import { useTranslation } from 'react-i18next';

export function CampaignDetailsDialog({ campaign }: { campaign: Campaign }) {
    const { t } = useTranslation();
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
                <Button variant="outline" size="sm">{t('campaigns.details.viewDetails')}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{t('campaigns.details.title', { name: campaign.name })}</DialogTitle>
                    <DialogDescription>{t('campaigns.details.description')}</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 py-4">
                     <div className="flex items-center justify-between col-span-2">
                        <span className="text-muted-foreground">{t('campaigns.status')}:</span>
                        <Badge variant={statusVariant[campaign.status] || 'secondary'}>{t(`campaignStatus.${campaign.status}`)}</Badge>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <Eye className="w-8 h-8 text-primary" />
                        <div>
                            <p className="text-xs text-muted-foreground">{t('campaigns.details.impressions')}</p>
                            <p className="text-xl font-bold">{(campaign.impressions || 0).toLocaleString()}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <MousePointerClick className="w-8 h-8 text-primary" />
                        <div>
                            <p className="text-xs text-muted-foreground">{t('campaigns.details.clicks')}</p>
                            <p className="text-xl font-bold">{(campaign.clicks || 0).toLocaleString()}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <Target className="w-8 h-8 text-primary" />
                        <div>
                            <p className="text-xs text-muted-foreground">{t('campaigns.details.results', { goal: campaign.goal })}</p>
                            <p className="text-xl font-bold">{(campaign.results || 0).toLocaleString()}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <BarChart className="w-8 h-8 text-primary" />
                        <div>
                            <p className="text-xs text-muted-foreground">{t('campaigns.details.ctr')}</p>
                            <p className="text-xl font-bold">{(campaign.ctr || 0).toFixed(2)}%</p>
                        </div>
                    </div>
                     <div className="flex items-center justify-between text-sm col-span-2">
                        <span className="text-muted-foreground flex items-center gap-1"><DollarSign className="w-4 h-4"/> {t('campaigns.details.cpc')}:</span>
                        <span className="font-mono font-bold">${(campaign.cpc || 0).toFixed(3)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm col-span-2">
                        <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-4 h-4"/> {t('campaigns.duration')}:</span>
                        <span className="font-mono font-bold">{t('campaigns.days', { count: campaign.durationDays })}</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
