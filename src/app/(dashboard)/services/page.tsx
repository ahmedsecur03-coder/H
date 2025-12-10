'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Service } from '@/lib/types';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Search, DollarSign, ListFilter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useRouter } from 'next/navigation';

function ServicesPageSkeleton() {
    return (
        <div className="space-y-6">
            <Card>
                 <CardHeader>
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-5 w-1/2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-10 w-full mb-4" />
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {Array.from({ length: 6 }).map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 10 }).map((_, i) => (
                                <TableRow key={i}>
                                    {Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
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
  const { toast } = useToast();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [activePlatform, setActivePlatform] = useState('الكل');

  const servicesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'services')) : null),
    [firestore]
  );
  const { data: services, isLoading } = useCollection<Service>(servicesQuery);

  const platforms = useMemo(() => {
    if (!services) return ['الكل'];
    const uniquePlatforms = [...new Set(services.map((s) => s.platform))];
    return ['الكل', ...uniquePlatforms];
  }, [services]);

  const filteredServices = useMemo(() => {
    if (!services) return [];
    return services.filter((service) => {
      const serviceName = `${service.id} ${service.category} ${service.platform}`.toLowerCase();
      const matchesSearch = serviceName.includes(searchTerm.toLowerCase());
      const matchesPlatform = activePlatform === 'الكل' || service.platform === activePlatform;
      return matchesSearch && matchesPlatform;
    });
  }, [services, searchTerm, activePlatform]);

  const seedServices = () => {
    if (!firestore) return;
    const servicesToSeed: Omit<Service, 'id'>[] = [
      { platform: "انستغرام", category: "متابعين مضمون", price: 5, min: 100, max: 10000 },
      { platform: "انستغرام", category: "إعجابات سريعة", price: 2, min: 50, max: 5000 },
      { platform: "فيسبوك", category: "إعجابات صفحة", price: 8, min: 100, max: 2000 },
      { platform: "يوتيوب", category: "مشاهدات", price: 3, min: 1000, max: 100000 },
      { platform: "تيك توك", category: "متابعين عرب", price: 6, min: 100, max: 20000 },
      { platform: "تويتر", category: "متابعين", price: 6, min: 100, max: 5000 },
      { platform: "تصميم مواقع", category: "موقع تعريفي", price: 250, min: 1, max: 1 },
      { platform: "حملات إعلانية", category: "إدارة حملة فيسبوك", price: 150, min: 1, max: 1 },
    ];
    
    const servicesCol = collection(firestore, 'services');
    servicesToSeed.forEach(service => {
        addDocumentNonBlocking(servicesCol, service);
    });

    toast({ title: "تمت إضافة خدمات تجريبية بنجاح!" });
  };


  if (isLoading) {
    return <ServicesPageSkeleton />;
  }

  return (
    <div className="space-y-6 pb-8">
      <Card>
        <CardHeader>
            <CardTitle className="font-headline text-2xl">قائمة الخدمات</CardTitle>
            <CardDescription>
                استعرض، ابحث، وفلتر جميع الخدمات المتاحة في منصة حاجاتي.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
             <div className="flex flex-wrap items-center gap-2">
                {platforms.map(platform => (
                    <Button 
                        key={platform}
                        variant={activePlatform === platform ? 'default' : 'outline'}
                        onClick={() => setActivePlatform(platform)}
                    >
                        {platform}
                    </Button>
                ))}
             </div>
             <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالرقم أو اسم الخدمة..."
                className="pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
        </CardContent>
        <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">رقم الخدمة</TableHead>
                  <TableHead>الخدمة</TableHead>
                  <TableHead className="text-center">السعر لكل 1000</TableHead>
                  <TableHead className="text-center">الحد الأدنى</TableHead>
                  <TableHead className="text-center">الحد الأقصى</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-mono text-xs">{service.id.substring(0,6)}</TableCell>
                    <TableCell className="font-medium">{`${service.platform} - ${service.category}`}</TableCell>
                    <TableCell className="text-center font-medium text-primary">${service.price.toFixed(2)}</TableCell>
                    <TableCell className="text-center">{service.min.toLocaleString()}</TableCell>
                    <TableCell className="text-center">{service.max.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                       <Button size="sm" onClick={() => router.push('/dashboard')}>
                          طلب
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {filteredServices.length === 0 && (
                 <div className="text-center py-20">
                    <ListFilter className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">لا توجد خدمات تطابق بحثك</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        حاول تغيير كلمات البحث أو الفلتر.
                    </p>
                </div>
            )}
        </CardContent>
      </Card>
      
       <Button size="sm" variant="ghost" onClick={seedServices}>إضافة خدمات تجريبية</Button>
    </div>
  );
}
