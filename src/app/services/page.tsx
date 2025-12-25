'use client';
import { useMemo, useState, useEffect } from 'react';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import type { Service, ServicePrice } from '@/lib/types';
import { SMM_SERVICES } from '@/lib/smm-services';
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
import { Search, Info, X } from 'lucide-react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';

const PROFIT_MARGIN = 1.50; // 50% profit margin

function ServicesSkeleton() {
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
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

 useEffect(() => {
    const fetchServices = async () => {
        if (!firestore) {
            // If firestore is not available, use static data as fallback
            setAllServices(SMM_SERVICES);
            setIsLoading(false);
            return;
        };

        try {
            const pricesSnapshot = await getDocs(collection(firestore, 'servicePrices'));
            const pricesMap = new Map<string, number>();
            pricesSnapshot.forEach(doc => {
                pricesMap.set(doc.id, doc.data().price);
            });

            const mergedServices = SMM_SERVICES.map(service => ({
                ...service,
                price: pricesMap.get(service.id) ?? service.price,
            }));

            setAllServices(mergedServices);
        } catch (error) {
            console.error("Error fetching dynamic prices, falling back to static data: ", error);
            setAllServices(SMM_SERVICES);
        } finally {
            setIsLoading(false);
        }
    };
    fetchServices();
  }, [firestore]);


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

    return { platforms, categories, filteredServices: filtered.slice(0, 100) }; // Limit to 100 results for performance
  }, [allServices, searchTerm, platformFilter, categoryFilter]);

  const [selectedService, setSelectedService] = useState<Service | null>(null);

  if (isLoading || !allServices) {
    return <ServicesSkeleton />;
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight font-headline">قائمة الخدمات</h1>
        <p className="text-muted-foreground mt-2">
          استكشف مجموعتنا الواسعة من الخدمات لجميع منصات التواصل الاجتماعي.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="relative sm:col-span-2 md:col-span-1">
            <Search className="absolute right-3 rtl:left-3 rtl:right-auto top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث بالرقم أو اسم الخدمة..."
              className="pe-10 rtl:ps-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger>
              <SelectValue placeholder="فلترة حسب المنصة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المنصات</SelectItem>
              {platforms.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="فلترة حسب الفئة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الفئات</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      
      <AnimatePresence>
        {selectedService && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{selectedService.category} - {selectedService.platform}</CardTitle>
                    <CardDescription>رقم الخدمة: {selectedService.id}</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedService(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{selectedService.description || 'لا يوجد وصف متاح لهذه الخدمة.'}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between border-b pb-2"><span>السعر لكل 1000:</span><span className="font-bold font-mono">${(selectedService.price * PROFIT_MARGIN).toFixed(4)}</span></div>
                      <div className="flex justify-between border-b pb-2"><span>متوسط الوقت:</span><span className="font-bold">{selectedService.avgTime || 'N/A'}</span></div>
                      <div className="flex justify-between border-b pb-2"><span>الحد الأدنى للطلب:</span><span className="font-bold">{selectedService.min.toLocaleString()}</span></div>
                      <div className="flex justify-between border-b pb-2"><span>الحد الأقصى للطلب:</span><span className="font-bold">{selectedService.max.toLocaleString()}</span></div>
                  </div>
              </CardContent>
              <CardFooter>
                  <Button asChild className="w-full">
                      <Link href={`/dashboard/mass-order?prefill=${encodeURIComponent(`${selectedService.id}| |`)}`}>
                          اطلب هذه الخدمة
                      </Link>
                  </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card>
          <CardContent className="p-0">
          <Table>
              <TableHeader>
              <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>الخدمة</TableHead>
                  <TableHead>المنصة</TableHead>
                  <TableHead>السعر/1000</TableHead>
                  <TableHead>الحدود</TableHead>
                  <TableHead className="text-right">إجراء</TableHead>
              </TableRow>
              </TableHeader>
              <TableBody>
              {filteredServices.map(service => (
                  <TableRow key={service.id} className={selectedService?.id === service.id ? 'bg-muted/50' : ''}>
                  <TableCell className="font-mono text-xs">{service.id}</TableCell>
                  <TableCell className="font-medium">{service.category}</TableCell>
                  <TableCell>{service.platform}</TableCell>
                  <TableCell>${(service.price * PROFIT_MARGIN).toFixed(4)}</TableCell>
                  <TableCell>{service.min.toLocaleString()} / {service.max.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedService(service)}>
                          <Info className="h-4 w-4 me-2" />
                          تفاصيل
                      </Button>
                  </TableCell>
                  </TableRow>
              ))}
              </TableBody>
          </Table>
          </CardContent>
      </Card>
    </div>
  );
}
