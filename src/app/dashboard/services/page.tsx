
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
                     <div className="flex flex-wrap items-center gap-2 mb-4">
                        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-24" />)}
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {Array.from({ length: 5 }).map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 10 }).map((_, i) => (
                                <TableRow key={i}>
                                    {Array.from({ length: 5 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
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
  const [activeCategory, setActiveCategory] = useState('الكل');

  const servicesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'services')) : null),
    [firestore]
  );
  const { data: services, isLoading } = useCollection<Service>(servicesQuery);

  const categories = useMemo(() => {
    if (!services) return ['الكل'];
    const uniqueCategories = [...new Set(services.map((s) => s.category))];
    return ['الكل', ...uniqueCategories];
  }, [services]);

  const filteredServices = useMemo(() => {
    if (!services) return [];
    return services.filter((service) => {
      const serviceName = `${service.id} ${service.category} ${service.platform}`.toLowerCase();
      const matchesSearch = serviceName.includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'الكل' || service.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [services, searchTerm, activeCategory]);

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
             <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالرقم أو اسم الخدمة..."
                className="pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
             <div className="flex flex-wrap items-center gap-2">
                {categories.map(category => (
                    <Button 
                        key={category}
                        variant={activeCategory === category ? 'default' : 'outline'}
                        onClick={() => setActiveCategory(category)}
                        className="rounded-full"
                    >
                        {category}
                    </Button>
                ))}
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
    </div>
  );
}
