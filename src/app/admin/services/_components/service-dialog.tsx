
'use client';

import React, { useState, useEffect } from 'react';
import type { Service } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

export function ServiceDialog({ service, onSave, children, onOpenChange, open }: { service?: Service, onSave: (data: any) => void, children: React.ReactNode, open: boolean, onOpenChange: (open: boolean) => void }) {
    
    const getInitialData = (service?: Service) => ({
        id: service?.id || '',
        category: service?.category || '',
        platform: service?.platform || '',
        price: service?.price || 0,
        min: service?.min || 0,
        max: service?.max || 0,
        refill: service?.refill || false,
        guarantee: service?.guarantee || false,
        dripFeed: service?.dripFeed || false,
        speed: service?.speed || '',
        avgTime: service?.avgTime || '',
        description: service?.description || '',
        startTime: service?.startTime || '',
        dropRate: service?.dropRate || '',
    });

    const [data, setData] = useState(getInitialData(service));
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setData(getInitialData(service));
        }
    }, [service, open]);

    const handleChange = (field: keyof typeof data, value: string | number | boolean) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        onSave(data);
        setIsSaving(false);
        onOpenChange(false);
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{service ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}</DialogTitle>
                    <DialogDescription>
                        {service ? `تعديل تفاصيل الخدمة رقم ${service.id}` : 'أدخل تفاصيل الخدمة الجديدة.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>رقم الخدمة (ID)</Label>
                        <Input value={data.id} onChange={e => handleChange('id', e.target.value)} placeholder="اتركه فارغاً للتوليد التلقائي" disabled={!!service} />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label>المنصة</Label>
                            <Input value={data.platform} onChange={e => handleChange('platform', e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label>الفئة</Label>
                            <Input value={data.category} onChange={e => handleChange('category', e.target.value)} required />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>الوصف</Label>
                        <Textarea value={data.description} onChange={e => handleChange('description', e.target.value)} placeholder="أدخل وصفًا تفصيليًا للخدمة..." />
                    </div>
                    <div className="space-y-2">
                        <Label>السعر/1000</Label>
                        <Input type="number" step="any" value={data.price} onChange={e => handleChange('price', parseFloat(e.target.value) || 0)} required />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>الحد الأدنى</Label>
                            <Input type="number" value={data.min} onChange={e => handleChange('min', parseInt(e.target.value) || 0)} required />
                        </div>
                        <div className="space-y-2">
                            <Label>الحد الأقصى</Label>
                            <Input type="number" value={data.max} onChange={e => handleChange('max', parseInt(e.target.value) || 0)} required />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label>السرعة</Label>
                            <Input value={data.speed} onChange={e => handleChange('speed', e.target.value)} placeholder="مثال: 1K/Day" />
                        </div>
                         <div className="space-y-2">
                            <Label>متوسط الوقت</Label>
                            <Input value={data.avgTime} onChange={e => handleChange('avgTime', e.target.value)} placeholder="مثال: 1-2 Hours" />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label>وقت البدء</Label>
                            <Input value={data.startTime} onChange={e => handleChange('startTime', e.target.value)} placeholder="مثال: 0-1 Hour" />
                        </div>
                         <div className="space-y-2">
                            <Label>معدل النقصان</Label>
                            <Input value={data.dropRate} onChange={e => handleChange('dropRate', e.target.value)} placeholder="مثال: 1-5%" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between pt-4">
                        <div className="flex items-center space-x-2">
                            <Switch id="refill" checked={data.refill} onCheckedChange={checked => handleChange('refill', checked)} />
                            <Label htmlFor="refill">إعادة تعبئة</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="guarantee" checked={data.guarantee} onCheckedChange={checked => handleChange('guarantee', checked)} />
                            <Label htmlFor="guarantee">ضمان</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="dripFeed" checked={data.dripFeed} onCheckedChange={checked => handleChange('dripFeed', checked)} />
                            <Label htmlFor="dripFeed">تغذية بالتقطير</Label>
                        </div>
                    </div>
                     <DialogFooter>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="animate-spin" /> : 'حفظ'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
