'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Service } from '@/lib/types';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHeader,
  TableHead,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Flame, ShieldCheck, RefreshCcw, Users, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PLATFORM_ICONS } from '@/lib/icon-data';
import React from 'react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const PLATFORMS = [
  'Instagram',
  'TikTok',
  'Facebook',
  'YouTube',
  'Telegram',
  'X (Twitter)',
  'Snapchat',
  'Kwai',
  'VK',
  'WhatsApp',
  'خدمات الألعاب',
  'خرائط جوجل',
  'Threads',
  'Kick',
  'Clubhouse',
  'زيارات مواقع',
];

function ServicesPageSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-5 w-2/3" />
            <Card>
                 <CardHeader>
                    <Skeleton className="h-8 w-full" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 py-4">
                        <Skeleton className="h-10 flex-1" />
                    </div>
                     <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}

function CategoryAccordion({ services, searchTerm, handleOrderNow }: { services: Service[], searchTerm: string, handleOrderNow: (id: string) => void }) {
    const categories = useMemo(() => {
        const grouped: { [key: string]: Service[] } = {};
        services.forEach(service => {
            if (!grouped[service.category]) {
                grouped[service.category] = [];
            }
            grouped[service.category].push(service);
        });
        return grouped;
    }, [services]);
    
    const filteredCategories = useMemo(() => {
        if (!searchTerm) return Object.keys(categories);
        return Object.keys(categories).filter(category =>
            category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            categories[category].some(s => s.id.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [categories, searchTerm]);

    if (filteredCategories.length === 0) {
        return <div className="h-24 text-center flex items-center justify-center text-muted-foreground">لا توجد خدمات تطابق بحثك.</div>;
    }

    return (
        <Accordion type="multiple" className="w-full">
            {filteredCategories.map(category => (
                <AccordionItem value={category} key={category}>
                    <AccordionTrigger>{category} ({categories[category].length})</AccordionTrigger>
                    <AccordionContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>الخدمة</TableHead>
                                    <TableHead className="w-32 text-center">السعر/1000</TableHead>
                                    <TableHead className="w-48 text-center">الحدود</TableHead>
                                    <TableHead className="w-28 text-left"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories[category].map((service) => (
                                     <TableRow key={service.id}>
                                        <TableCell>
                                            <div className="font-medium flex items-center gap-2">
                                                <span>ID: {service.id}</span>
                                                {service.guarantee && <TooltipProvider><Tooltip><TooltipTrigger><ShieldCheck className="h-4 w-4 text-green-400" /></TooltipTrigger><TooltipContent>خدمة مع ضمان</TooltipContent></Tooltip></TooltipProvider>}
                                                {service.speed === 'فوري' && <TooltipProvider><Tooltip><TooltipTrigger><Flame className="h-4 w-4 text-orange-400" /></TooltipTrigger><TooltipContent>بدء فوري</TooltipContent></Tooltip></TooltipProvider>}
                                                {service.refill && <TooltipProvider><Tooltip><TooltipTrigger><RefreshCcw className="h-4 w-4 text-blue-400" /></TooltipTrigger><TooltipContent>إعادة تعبئة مدعومة</TooltipContent></Tooltip></TooltipProvider>}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">{service.category}</div>
                                        </TableCell>
                                        <TableCell className="text-center font-mono text-sm">${service.price.toFixed(4)}</TableCell>
                                        <TableCell className="text-center text-muted-foreground text-sm">{service.min.toLocaleString()} / {service.max.toLocaleString()}</TableCell>
                                        <TableCell className="text-left">
                                            <Button variant="default" size="sm" onClick={() => handleOrderNow(service.id)}>
                                                اطلب الآن
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}

export default function ServicesPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const { user } = useUser();

  const [searchTerm, setSearchTerm] = useState('');
  const [activePlatform, setActivePlatform] = useState('Instagram');

  const servicesQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'services')) : null,
    [firestore]
  );
  
  const { data: allServices, isLoading } = useCollection<Service>(servicesQuery);

  const platformServices = useMemo(() => {
    if (!allServices) return [];
    return allServices.filter(service => service.platform === activePlatform);
  }, [allServices, activePlatform]);


  const handleOrderNow = (serviceId: string) => {
    if (user) {
        const orderText = `${serviceId}|ضع الرابط هنا|1000`;
        router.push(`/dashboard/mass-order?prefill=${encodeURIComponent(orderText)}`);
    } else {
        router.push('/login');
    }
  };
  
  const handlePlatformChange = useCallback((platform: string) => {
    setActivePlatform(platform);
    setSearchTerm('');
  }, []);


  const ActivePlatformIcon = PLATFORM_ICONS[activePlatform as keyof typeof PLATFORM_ICONS] || PLATFORM_ICONS.Default;

  return (
    <div className="space-y-6 pb-8">
        <div>
            <div className="flex items-center gap-3 mb-2">
                 <Users className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold tracking-tight font-headline">
                    خدمات التسويق عبر وسائل التواصل (SMM)
                </h1>
            </div>
            <p className="text-muted-foreground">
                كل ما تحتاجه للنمو على جميع المنصات. تصفح القائمة أدناه للعثور على الخدمة المثالية لك.
            </p>
        </div>
        
        <Tabs value={activePlatform} onValueChange={handlePlatformChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
                {PLATFORMS.map(p => (
                    <TabsTrigger key={p} value={p}>{p}</TabsTrigger>
                ))}
            </TabsList>
        </Tabs>

        {isLoading ? <ServicesPageSkeleton /> : (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ActivePlatformIcon className="w-6 h-6" />
                        <span>قائمة خدمات {activePlatform}</span>
                    </CardTitle>
                    <CardDescription>استخدم البحث للعثور على فئة أو خدمة محددة.</CardDescription>
                     <div className="relative pt-4">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={`ابحث في خدمات ${activePlatform}...`}
                            className="pr-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <CategoryAccordion 
                        services={platformServices} 
                        searchTerm={searchTerm} 
                        handleOrderNow={handleOrderNow} 
                    />
                </CardContent>
            </Card>
        )}
    </div>
  );
}

    