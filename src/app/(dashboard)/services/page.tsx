'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Service } from '@/lib/types';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Search, DollarSign, ListFilter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

function ServiceCard({ service }: { service: Service }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="bg-primary/10 text-primary p-3 rounded-full">
            <Package className="h-6 w-6" />
        </div>
        <div>
            <CardTitle className="text-lg font-headline">{service.category}</CardTitle>
            <CardDescription>{service.platform}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-2 text-sm">
        <div className="flex justify-between">
            <span className="text-muted-foreground">السعر لكل 1000:</span>
            <span className="font-semibold text-primary">${service.price.toFixed(2)}</span>
        </div>
         <div className="flex justify-between">
            <span className="text-muted-foreground">الحد الأدنى:</span>
            <span>{service.min.toLocaleString()}</span>
        </div>
         <div className="flex justify-between">
            <span className="text-muted-foreground">الحد الأقصى:</span>
            <span>{service.max.toLocaleString()}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">
          <DollarSign className="ml-2 h-4 w-4" /> طلب الخدمة
        </Button>
      </CardFooter>
    </Card>
  );
}

function ServiceGridSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-[260px] w-full" />
            ))}
        </div>
    );
}


export default function ServicesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');

  const servicesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'services')) : null),
    [firestore]
  );
  const { data: services, isLoading } = useCollection<Service>(servicesQuery);

  const { categories, platforms } = useMemo(() => {
    if (!services) return { categories: [], platforms: [] };
    const uniqueCategories = [...new Set(services.map((s) => s.category))];
    const uniquePlatforms = [...new Set(services.map((s) => s.platform))];
    return { categories: uniqueCategories, platforms: uniquePlatforms };
  }, [services]);

  const filteredServices = useMemo(() => {
    if (!services) return [];
    return services.filter((service) => {
      const matchesSearch =
        service.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.platform.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' || service.category === selectedCategory;
      const matchesPlatform =
        selectedPlatform === 'all' || service.platform === selectedPlatform;
      return matchesSearch && matchesCategory && matchesPlatform;
    });
  }, [services, searchTerm, selectedCategory, selectedPlatform]);

  const seedServices = () => {
    if (!firestore) return;
    const servicesToSeed: Omit<Service, 'id'>[] = [
      { platform: "انستغرام", category: "متابعين", price: 5, min: 100, max: 10000 },
      { platform: "انستغرام", category: "إعجابات", price: 2, min: 50, max: 5000 },
      { platform: "انستغرام", category: "مشاهدات فيديو", price: 1.5, min: 100, max: 100000 },
      { platform: "فيسبوك", category: "إعجابات صفحة", price: 8, min: 100, max: 2000 },
      { platform: "فيسبوك", category: "مشاهدات فيديو", price: 2.5, min: 100, max: 50000 },
      { platform: "فيسبوك", category: "مشاركات", price: 10, min: 10, max: 1000 },
      { platform: "يوتيوب", category: "مشاهدات", price: 3, min: 1000, max: 100000 },
      { platform: "يوتيوب", category: "مشتركين", price: 25, min: 50, max: 1000 },
      { platform: "تيك توك", category: "متابعين", price: 4, min: 100, max: 20000 },
      { platform: "تيك توك", category: "مشاهدات", price: 0.5, min: 1000, max: 1000000 },
      { platform: "تويتر", category: "متابعين", price: 6, min: 100, max: 5000 },
      { platform: "تصميم مواقع", category: "موقع تعريفي", price: 250, min: 1, max: 1 },
    ];
    
    const servicesCol = collection(firestore, 'services');
    servicesToSeed.forEach(service => {
        addDocumentNonBlocking(servicesCol, service);
    });

    toast({ title: "تمت إضافة خدمات تجريبية بنجاح!" });
  };


  return (
    <div className="space-y-6 pb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">جميع الخدمات</h1>
                <p className="text-muted-foreground">
                    استعرض، ابحث، وفلتر جميع الخدمات المتاحة في منصة حاجاتي.
                </p>
            </div>
             <Button size="sm" variant="outline" onClick={seedServices}>إضافة خدمات تجريبية</Button>
        </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن خدمة..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="فلترة حسب الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedPlatform}
              onValueChange={setSelectedPlatform}
            >
              <SelectTrigger>
                <SelectValue placeholder="فلترة حسب المنصة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المنصات</SelectItem>
                {platforms.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <ServiceGridSkeleton />
      ) : (
        filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
            <Card className="flex flex-col items-center justify-center py-20 text-center">
                <CardHeader>
                    <div className="mx-auto bg-muted p-4 rounded-full">
                        <ListFilter className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <CardTitle className="mt-4 font-headline text-2xl">لا توجد خدمات تطابق بحثك</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        حاول تغيير كلمات البحث أو إزالة الفلاتر لعرض المزيد من النتائج.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('all');
                        setSelectedPlatform('all');
                    }}>
                        إزالة جميع الفلاتر
                    </Button>
                </CardFooter>
            </Card>
        )
      )}
    </div>
  );
}
