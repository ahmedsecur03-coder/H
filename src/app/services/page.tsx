
'use client';
import { useMemo, useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Service } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ChevronLeft, Info, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

function ServicesSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: 6 }).map((_, i) => (
              <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 10 }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: 6 }).map((_, j) => (
                <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function ServicesPage() {
  const { t } = useTranslation();
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const servicesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'services')) : null),
    [firestore]
  );
  const { data: allServices, isLoading } = useCollection<Service>(servicesQuery);

  const { platforms, categories, filteredServices } = useMemo(() => {
    if (!allServices) {
      return { platforms: [], categories: [], filteredServices: [] };
    }

    const platforms = [...new Set(allServices.map(s => s.platform))];
    const categories = [...new Set(allServices.map(s => s.category))];

    const filtered = allServices.filter(service => {
      const searchMatch =
        searchTerm === '' ||
        service.id.toString().includes(searchTerm) ||
        service.category.toLowerCase().includes(searchTerm.toLowerCase());
      const platformMatch = platformFilter === 'all' || service.platform === platformFilter;
      const categoryMatch = categoryFilter === 'all' || service.category === categoryFilter;
      return searchMatch && platformMatch && categoryMatch;
    });

    return { platforms, categories, filteredServices: filtered };
  }, [allServices, searchTerm, platformFilter, categoryFilter]);

  const [selectedService, setSelectedService] = useState<Service | null>(null);

  if (isLoading || !allServices) {
    return <ServicesSkeleton />;
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight font-headline">{t('servicesPage.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('servicesPage.description')}
        </p>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="relative sm:col-span-2 md:col-span-1">
            <Search className="absolute right-3 rtl:left-3 rtl:right-auto top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('servicesPage.searchPlaceholder')}
              className="pe-10 rtl:ps-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t('servicesPage.platformFilterPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('servicesPage.allPlatforms')}</SelectItem>
              {platforms.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t('servicesPage.categoryFilterPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('servicesPage.allCategories')}</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
        
      {selectedService ? (
         <Card>
            <CardHeader>
                 <Button variant="ghost" size="sm" onClick={() => setSelectedService(null)} className="self-start">
                     <ChevronRight className="h-4 w-4 me-2 rtl:hidden" />
                     <ChevronLeft className="h-4 w-4 ms-2 ltr:hidden" />
                     {t('backToList')}
                 </Button>
                 <CardTitle>{selectedService.category} - {selectedService.platform}</CardTitle>
                 <CardDescription>{t('servicesPage.serviceId')}: {selectedService.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-muted-foreground">{selectedService.description || t('servicesPage.noDescription')}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between border-b pb-2"><span>{t('servicesPage.pricePer1000')}:</span><span className="font-bold font-mono">${selectedService.price.toFixed(4)}</span></div>
                    <div className="flex justify-between border-b pb-2"><span>{t('servicesPage.avgTime')}:</span><span className="font-bold">{selectedService.avgTime || 'N/A'}</span></div>
                    <div className="flex justify-between border-b pb-2"><span>{t('servicesPage.minOrder')}:</span><span className="font-bold">{selectedService.min.toLocaleString()}</span></div>
                    <div className="flex justify-between border-b pb-2"><span>{t('servicesPage.maxOrder')}:</span><span className="font-bold">{selectedService.max.toLocaleString()}</span></div>
                </div>
            </CardContent>
             <CardFooter>
                 <Button asChild className="w-full">
                    <Link href={`/login?redirect=/dashboard/mass-order&prefill=${encodeURIComponent(`${selectedService.id}| |`)}`}>
                        {t('servicesPage.orderThisService')}
                    </Link>
                 </Button>
            </CardFooter>
         </Card>
      ) : (
        <Card>
            <CardContent className="p-0">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>{t('servicesPage.table.service')}</TableHead>
                    <TableHead>{t('servicesPage.table.platform')}</TableHead>
                    <TableHead>{t('servicesPage.table.pricePer1000')}</TableHead>
                    <TableHead>{t('servicesPage.table.limits')}</TableHead>
                    <TableHead className="text-right">{t('servicesPage.table.action')}</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredServices.map(service => (
                    <TableRow key={service.id}>
                    <TableCell className="font-mono text-xs">{service.id}</TableCell>
                    <TableCell className="font-medium">{service.category}</TableCell>
                    <TableCell>{service.platform}</TableCell>
                    <TableCell>${service.price.toFixed(4)}</TableCell>
                    <TableCell>{service.min.toLocaleString()} / {service.max.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedService(service)}>
                            <Info className="h-4 w-4 me-2" />
                            {t('details')}
                        </Button>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
