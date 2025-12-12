
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
import { Search, Flame, ShieldCheck, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  'Google',
  'Snapchat',
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
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><Skeleton className="h-5 w-24"/></TableHead>
                                <TableHead><Skeleton className="h-5 w-24"/></TableHead>
                                <TableHead><Skeleton className="h-5 w-24"/></TableHead>
                                <TableHead><Skeleton className="h-5 w-16"/></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {Array.from({ length: 10 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ServicesPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const { user } = useUser();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('default');
  const [activePlatform, setActivePlatform] = useState('Instagram');

  const servicesQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'services')) : null,
    [firestore]
  );
  
  const { data: allServices, isLoading } = useCollection<Service>(servicesQuery);

  const filteredAndSortedServices = useMemo(() => {
    if (!allServices) return [];
    
    let filtered = allServices.filter(service => service.platform === activePlatform);

    if (searchTerm) {
      filtered = filtered.filter((service) => {
        const serviceName = `${service.id} ${service.category}`.toLowerCase();
        return serviceName.includes(searchTerm.toLowerCase());
      });
    }

    if (sortOrder === 'price_asc') {
      return [...filtered].sort((a, b) => a.price - b.price);
    }
    
    return filtered;

  }, [allServices, searchTerm, sortOrder, activePlatform]);


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
    setSortOrder('default');
  }, []);


  const ActivePlatformIcon = PLATFORM_ICONS[activePlatform as keyof typeof PLATFORM_ICONS] || PLATFORM_ICONS.Default;

  return (
    <div className="space-y-6 pb-8">
        <div>
            <div className="flex items-center gap-3 mb-2">
                 {ActivePlatformIcon && <div className="w-8 h-8"><ActivePlatformIcon /></div>}
                <h1 className="text-3xl font-bold tracking-tight font-headline">
                    خدمات {activePlatform}
                </h1>
            </div>
            <p className="text-muted-foreground">
                كل ما تحتاجه للنمو على {activePlatform}. تصفح القائمة أدناه للعثور على الخدمة المثالية لك.
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
                    <CardTitle>قائمة الخدمات</CardTitle>
                    <CardDescription>استخدم البحث والفرز للعثور على الخدمة التي تريدها بسرعة.</CardDescription>
                    <div className="flex items-center gap-4 pt-4">
                        <div className="relative flex-1">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={`ابحث في خدمات ${activePlatform}...`}
                                className="pr-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={sortOrder} onValueChange={setSortOrder}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="فرز حسب" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">افتراضي</SelectItem>
                                <SelectItem value="price_asc">الأرخص أولاً</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
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
                            {filteredAndSortedServices.length > 0 ? (
                                filteredAndSortedServices.map((service) => (
                                    <TableRow key={service.id}>
                                        <TableCell>
                                            <div className="font-medium flex items-center gap-2">
                                                <span>{service.category}</span>
                                                {service.guarantee && <TooltipProvider><Tooltip><TooltipTrigger><ShieldCheck className="h-4 w-4 text-green-400" /></TooltipTrigger><TooltipContent>خدمة مع ضمان</TooltipContent></Tooltip></TooltipProvider>}
                                                {service.speed === 'فوري' && <TooltipProvider><Tooltip><TooltipTrigger><Flame className="h-4 w-4 text-orange-400" /></TooltipTrigger><TooltipContent>بدء فوري</TooltipContent></Tooltip></TooltipProvider>}
                                                {service.refill && <TooltipProvider><Tooltip><TooltipTrigger><RefreshCcw className="h-4 w-4 text-blue-400" /></TooltipTrigger><TooltipContent>إعادة تعبئة مدعومة</TooltipContent></Tooltip></TooltipProvider>}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">ID: {service.id}</div>
                                        </TableCell>
                                        <TableCell className="text-center font-mono text-sm">${service.price.toFixed(4)}</TableCell>
                                        <TableCell className="text-center text-muted-foreground text-sm">{service.min.toLocaleString()} / {service.max.toLocaleString()}</TableCell>
                                        <TableCell className="text-left">
                                            <Button variant="default" size="sm" onClick={() => handleOrderNow(service.id)}>
                                                اطلب الآن
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        لا توجد خدمات تطابق بحثك في هذه الفئة.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        )}
    </div>
  );
}

    