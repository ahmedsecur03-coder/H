
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

  const seedServices = () => {
    if (!firestore) return;
    const profitMargin = 1.5;
    const servicesToSeed: Omit<Service, 'id'>[] = [
      // SMM Services from user
      { platform: "انستغرام", category: "متابعين انستغرام", price: 0.6091 * profitMargin, min: 10, max: 1000000 },
      { platform: "فيسبوك", category: "متابعين فيسبوك", price: 0.1504 * profitMargin, min: 100, max: 100000 },
      { platform: "فيسبوك", category: "متابعين فيسبوك", price: 0.1923 * profitMargin, min: 100, max: 1000000 },
      { platform: "فيسبوك", category: "متابعين فيسبوك", price: 0.1504 * profitMargin, min: 100, max: 100000 },
      { platform: "فيسبوك", category: "إعجابات ومتابعة صفحة فيسبوك", price: 0.3705 * profitMargin, min: 10, max: 100000 },
      { platform: "فيسبوك", category: "أعضاء جروبات فيسبوك", price: 0.2875 * profitMargin, min: 100, max: 100000 },
      { platform: "انستغرام", category: "متابعين انستغرام", price: 0.9264 * profitMargin, min: 10, max: 1000000 },
      { platform: "انستغرام", category: "متابعين انستغرام", price: 1.1862 * profitMargin, min: 10, max: 1000000 },
      { platform: "انستغرام", category: "متابعين انستغرام", price: 1.296 * profitMargin, min: 10, max: 1000000 },
      { platform: "انستغرام", category: "متابعين انستغرام", price: 1.3838 * profitMargin, min: 10, max: 1000000 },
      { platform: "انستغرام", category: "متابعين انستغرام", price: 1.4637 * profitMargin, min: 10, max: 1000000 },
      { platform: "انستغرام", category: "متابعين انستغرام", price: 1.5435 * profitMargin, min: 10, max: 1000000 },
      { platform: "انستغرام", category: "متابعين انستغرام", price: 1.4032 * profitMargin, min: 10, max: 1000000 },
      { platform: "انستغرام", category: "متابعين انستغرام", price: 1.6364 * profitMargin, min: 10, max: 1000000 },
      { platform: "انستغرام", category: "متابعين انستغرام", price: 1.8012 * profitMargin, min: 10, max: 1000000 },
      { platform: "انستغرام", category: "متابعين انستغرام", price: 1.911 * profitMargin, min: 10, max: 1000000 },
      { platform: "انستغرام", category: "متابعين انستغرام", price: 2.0212 * profitMargin, min: 10, max: 1000000 },
      { platform: "انستغرام", category: "متابعين انستغرام", price: 2.1499 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 0.902 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 0.935 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 0.946 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 0.957 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 0.968 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 0.979 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 1.54 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 1.551 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 1.562 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 1.573 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 1.584 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 1.595 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 1.606 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 1.617 * profitMargin, min: 10, max: 1000000 },
      { platform: "انستغرام", category: "إعجابات انستغرام", price: 0.231 * profitMargin, min: 50, max: 1000000 },
      { platform: "انستغرام", category: "إعجابات انستغرام", price: 0.242 * profitMargin, min: 50, max: 1000000 },
      { platform: "انستغرام", category: "إعجابات انستغرام", price: 0.253 * profitMargin, min: 50, max: 1000000 },
      { platform: "تيك توك", category: "مشاهدات تيك توك", price: 0.0085 * profitMargin, min: 5000, max: 2147483647 },
      { platform: "تيك توك", category: "مشاهدات تيك توك", price: 0.0116 * profitMargin, min: 50, max: 2147483647 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 0.8464 * profitMargin, min: 50, max: 200000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 1.10 * profitMargin, min: 10, max: 10000000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 0.825 * profitMargin, min: 10, max: 10000000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 1.10 * profitMargin, min: 10, max: 10000000 },
      { platform: "تيك توك", category: "حفظ فيديو تيك توك", price: 0.0127 * profitMargin, min: 10, max: 2147483647 },
      { platform: "فيسبوك", category: "متابعين فيسبوك", price: 0.3076 * profitMargin, min: 10, max: 1000000 },
      { platform: "فيسبوك", category: "متابعين فيسبوك", price: 0.3185 * profitMargin, min: 10, max: 1000000 },
      { platform: "فيسبوك", category: "متابعين فيسبوك", price: 0.3391 * profitMargin, min: 10, max: 1000000 },
      { platform: "فيسبوك", category: "متابعين فيسبوك", price: 0.2248 * profitMargin, min: 10, max: 1000000 },
      { platform: "فيسبوك", category: "إعجابات ومتابعة صفحة فيسبوك", price: 0.5775 * profitMargin, min: 100, max: 50000 },
      { platform: "فيسبوك", category: "إعجابات ومتابعة صفحة فيسبوك", price: 0.3402 * profitMargin, min: 10, max: 200000 },
      { platform: "فيسبوك", category: "إعجابات ومتابعة صفحة فيسبوك", price: 0.3644 * profitMargin, min: 10, max: 200000 },
      { platform: "فيسبوك", category: "إعجابات ومتابعة صفحة فيسبوك", price: 0.3809 * profitMargin, min: 10, max: 200000 },
      { platform: "فيسبوك", category: "إعجابات ومتابعة صفحة فيسبوك", price: 0.3975 * profitMargin, min: 10, max: 200000 },
      { platform: "فيسبوك", category: "إعجابات ومتابعة صفحة فيسبوك", price: 0.414 * profitMargin, min: 10, max: 200000 },
      { platform: "تيك توك", category: "إعجابات تيك توك", price: 0.0154 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "إعجابات تيك توك", price: 0.016 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "إعجابات تيك توك", price: 0.0165 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "إعجابات تيك توك", price: 0.0171 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "إعجابات تيك توك", price: 0.0176 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "إعجابات تيك توك", price: 0.0182 * profitMargin, min: 10, max: 1000000 },
      { platform: "انستغرام", category: "مشاهدات انستغرام", price: 0.0009 * profitMargin, min: 100, max: 2147483647 },
      { platform: "انستغرام", category: "حفظ منشور انستغرام", price: 0.0028 * profitMargin, min: 5, max: 50000 },
      { platform: "انستغرام", category: "متابعين انستغرام", price: 1.1862 * profitMargin, min: 100, max: 1000000 },
      { platform: "انستغرام", category: "متابعين انستغرام", price: 4.0425 * profitMargin, min: 10, max: 1000000 },
      { platform: "انستغرام", category: "متابعين انستغرام", price: 4.4468 * profitMargin, min: 10, max: 1000000 },
      { platform: "انستغرام", category: "متابعين انستغرام", price: 3.1482 * profitMargin, min: 10, max: 1000000 },
      { platform: "يوتيوب", category: "مشاهدات يوتيوب", price: 1.045 * profitMargin, min: 100, max: 10000000 },
      { platform: "يوتيوب", category: "إعجابات يوتيوب", price: 0.308 * profitMargin, min: 10, max: 500000 },
      { platform: "يوتيوب", category: "تعليقات يوتيوب", price: 3.564 * profitMargin, min: 10, max: 20000 },
      { platform: "تليجرام", category: "أعضاء قنوات/جروبات تليجرام", price: 0.715 * profitMargin, min: 500, max: 200000 },
      { platform: "تليجرام", category: "مشاهدات منشورات تليجرام", price: 0.0047 * profitMargin, min: 5, max: 217545811 },
      { platform: "تليجرام", category: "تفاعلات تليجرام", price: 0.013 * profitMargin, min: 10, max: 1000000 },
      { platform: "تليجرام", category: "تفاعلات تليجرام", price: 0.013 * profitMargin, min: 10, max: 1000000 },
      { platform: "Canva", category: "اشتراكات", price: 0.15 * profitMargin, min: 1, max: 1 },
      { platform: "تيك توك", category: "نقاط معركة تيك توك", price: 0.1265 * profitMargin, min: 500, max: 1000000000 },
      { platform: "تيك توك", category: "نقاط معركة تيك توك", price: 0.132 * profitMargin, min: 100, max: 2147483647 },
      { platform: "تيك توك", category: "نقاط معركة تيك توك", price: 0.154 * profitMargin, min: 100, max: 2147483647 },
      { platform: "تيك توك", category: "نقاط معركة تيك توك", price: 0.165 * profitMargin, min: 100, max: 2147483647 },
      { platform: "تيك توك", category: "نقاط معركة تيك توك", price: 0.187 * profitMargin, min: 100, max: 2147483647 },
      { platform: "تيك توك", category: "شحن عملات تيكتوك", price: 11.50 * profitMargin, min: 500, max: 100000000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 6.2675 * profitMargin, min: 500, max: 500 },
      { platform: "تيك توك", category: "تعليقات تيك توك", price: 31.90 * profitMargin, min: 10, max: 5000 },
      { platform: "تيك توك", category: "مشاركات تيك توك", price: 0.209 * profitMargin, min: 100, max: 10000 },
      { platform: "تيك توك", category: "مشاركات تيك توك", price: 0.2128 * profitMargin, min: 10, max: 20000 },
      { platform: "تيك توك", category: "مشاهدات تيك توك", price: 0.0046 * profitMargin, min: 50, max: 2147483333 },
      { platform: "تيك توك", category: "مشاهدات تيك توك", price: 0.0229 * profitMargin, min: 100, max: 2147483647 },
      { platform: "تيك توك", category: "مشاهدات تيك توك", price: 0.0159 * profitMargin, min: 100, max: 2147483647 },
      { platform: "تيك توك", category: "مشاهدات تيك توك", price: 0.0212 * profitMargin, min: 100, max: 2147483647 },
      { platform: "تيك توك", category: "مشاهدات تيك توك", price: 0.0422 * profitMargin, min: 5000, max: 2147483647 },
      { platform: "تيك توك", category: "مشاهدات تيك توك", price: 0.0168 * profitMargin, min: 100, max: 2147483647 },
      { platform: "تيك توك", category: "مشاهدات تيك توك مستهدفة", price: 0.0539 * profitMargin, min: 1000, max: 1000000 },
      { platform: "تيك توك", category: "مشاهدات تيك توك مستهدفة", price: 0.0539 * profitMargin, min: 1000, max: 1000000 },
      { platform: "تيك توك", category: "مشاهدات تيك توك مستهدفة", price: 0.0539 * profitMargin, min: 1000, max: 1000000 },
      { platform: "تيك توك", category: "مشاهدات تيك توك مستهدفة", price: 0.0539 * profitMargin, min: 1000, max: 1000000 },
      { platform: "تيك توك", category: "مشاهدات تيك توك مستهدفة", price: 0.0539 * profitMargin, min: 1000, max: 1000000 },
      { platform: "تيك توك", category: "مشاهدات تيك توك مستهدفة", price: 0.0539 * profitMargin, min: 1000, max: 1000000 },
      { platform: "تيك توك", category: "مشاهدات تيك توك مستهدفة", price: 0.0539 * profitMargin, min: 1000, max: 1000000 },
      { platform: "تيك توك", category: "مشاهدات تيك توك مستهدفة", price: 0.0539 * profitMargin, min: 1000, max: 1000000 },
      { platform: "تيك توك", category: "مشاهدات تيك توك مستهدفة", price: 0.0539 * profitMargin, min: 1000, max: 1000000 },
      { platform: "تيك توك", category: "مشاهدات تيك توك مستهدفة", price: 0.0539 * profitMargin, min: 1000, max: 1000000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 1.562 * profitMargin, min: 10, max: 500000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 1.54 * profitMargin, min: 10, max: 500000 },
      { platform: "تيك توك", category: "إعجابات تيك توك", price: 0.0319 * profitMargin, min: 10, max: 5000000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 1.595 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "إعجابات تيك توك", price: 0.033 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 0.851 * profitMargin, min: 10, max: 100000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 1.815 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 1.98 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 3.375 * profitMargin, min: 10, max: 500000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 1.76 * profitMargin, min: 1000, max: 150000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 1.76 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 5.17 * profitMargin, min: 100, max: 100000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 1.595 * profitMargin, min: 10, max: 500000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 1.595 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 1.617 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 1.969 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 0.88 * profitMargin, min: 100, max: 100000 },
      { platform: "تيك توك", category: "متابعين تيك توك", price: 0.92 * profitMargin, min: 100, max: 100000 },
      { platform: "تيك توك", category: "إعجابات ومشاهدات تيك توك", price: 0.132 * profitMargin, min: 10, max: 10000000 },
      { platform: "تيك توك", category: "إعجابات ومشاهدات تيك توك", price: 0.143 * profitMargin, min: 10, max: 10000000 },
      { platform: "تيك توك", category: "إعجابات ومشاهدات تيك توك", price: 0.154 * profitMargin, min: 10, max: 10000000 },
      { platform: "تيك توك", category: "إعجابات ومشاهدات تيك توك", price: 0.077 * profitMargin, min: 10, max: 2000000 },
      { platform: "تيك توك", category: "إعجابات ومشاهدات تيك توك", price: 0.0825 * profitMargin, min: 10, max: 2000000 },
      { platform: "تيك توك", category: "إعجابات ومشاهدات تيك توك", price: 0.0847 * profitMargin, min: 10, max: 2000000 },
      { platform: "تيك توك", category: "إعجابات ومشاهدات تيك توك", price: 0.088 * profitMargin, min: 10, max: 2000000 },
      { platform: "تيك توك", category: "إعجابات ومشاهدات تيك توك", price: 0.0825 * profitMargin, min: 10, max: 5000000 },
      { platform: "تيك توك", category: "إعجابات ومشاهدات تيك توك", price: 0.0842 * profitMargin, min: 10, max: 5000000 },
      { platform: "تيك توك", category: "إعجابات ومشاهدات تيك توك", price: 0.0867 * profitMargin, min: 10, max: 5000000 },
      { platform: "تيك توك", category: "إعجابات ومشاهدات تيك توك", price: 0.0891 * profitMargin, min: 10, max: 5000000 },
      { platform: "تيك توك", category: "إعجابات ومشاهدات تيك توك", price: 0.0908 * profitMargin, min: 10, max: 5000000 },
      { platform: "تيك توك", category: "إعجابات ومشاهدات تيك توك", price: 0.0933 * profitMargin, min: 10, max: 5000000 },
      { platform: "تيك توك", category: "إعجابات تيك توك", price: 0.0407 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "إعجابات تيك توك", price: 0.0418 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "إعجابات تيك توك", price: 0.0759 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "إعجابات تيك توك", price: 0.099 * profitMargin, min: 10, max: 10000000 },
      { platform: "تيك توك", category: "إعجابات تيك توك", price: 0.0418 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "إعجابات تيك توك", price: 0.0149 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "إعجابات تيك توك", price: 0.0792 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "إعجابات تيك توك", price: 0.033 * profitMargin, min: 10, max: 5000000 },
      { platform: "تيك توك", category: "إعجابات تيك توك", price: 0.1045 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "إعجابات تيك توك", price: 0.0341 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "إعجابات تيك توك", price: 0.1155 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "إعجابات تيك توك", price: 0.1155 * profitMargin, min: 10, max: 5000000 },
      { platform: "تيك توك", category: "إعجابات تيك توك", price: 0.121 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "إعجابات تيك توك", price: 0.132 * profitMargin, min: 10, max: 300000 },
      { platform: "تيك توك", category: "إعجابات تيك توك", price: 0.0121 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "إعجابات تيك توك", price: 0.0618 * profitMargin, min: 10, max: 20000000 },
      { platform: "تيك توك", category: "إعجابات تيك توك", price: 0.165 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "إعجابات تيك توك", price: 0.044 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "إعجابات تيك توك", price: 0.1622 * profitMargin, min: 10, max: 5000000 },
      { platform: "تيك توك", category: "تعليقات تيك توك", price: 0.715 * profitMargin, min: 1, max: 100000 },
      { platform: "تيك توك", category: "تعليقات تيك توك", price: 7.70 * profitMargin, min: 10, max: 30000 },
      { platform: "تيك توك", category: "تعليقات تيك توك", price: 8.80 * profitMargin, min: 10, max: 5000 },
      { platform: "تيك توك", category: "تعليقات تيك توك", price: 2.97 * profitMargin, min: 10, max: 100000 },
      { platform: "تيك توك", category: "تعليقات تيك توك", price: 3.30 * profitMargin, min: 10, max: 100000 },
      { platform: "تيك توك", category: "تعليقات تيك توك", price: 3.85 * profitMargin, min: 10, max: 500000 },
      { platform: "تيك توك", category: "حفظ فيديو تيك توك", price: 0.132 * profitMargin, min: 10, max: 217545811 },
      { platform: "تيك توك", category: "حفظ فيديو تيك توك", price: 0.1114 * profitMargin, min: 10, max: 1000000 },
      { platform: "تيك توك", category: "حفظ فيديو تيك توك", price: 0.143 * profitMargin, min: 10, max: 217545811 },
      { platform: "تيك توك", category: "مشاركات تيك توك", price: 0.099 * profitMargin, min: 10, max: 217545811 },
      { platform: "تيك توك", category: "مشاركات تيك توك", price: 0.011 * profitMargin, min: 10, max: 10000000 },
      { platform: "تيك توك", category: "بث مباشر تيك توك", price: 1.10 * profitMargin, min: 50, max: 30000 },
      { platform: "تيك توك", category: "بث مباشر تيك توك", price: 2.20 * profitMargin, min: 50, max: 30000 },
      { platform: "تيك توك", category: "بث مباشر تيك توك", price: 4.40 * profitMargin, min: 50, max: 30000 },
      { platform: "تيك توك", category: "بث مباشر تيك توك", price: 0.5049 * profitMargin, min: 10, max: 100000 },
      { platform: "تيك توك", category: "بث مباشر تيك توك", price: 1.056 * profitMargin, min: 10, max: 100000 },
      { platform: "تيك توك", category: "بث مباشر تيك توك", price: 2.112 * profitMargin, min: 10, max: 100000 },
      { platform: "تيك توك", category: "بث مباشر تيك توك", price: 4.224 * profitMargin, min: 10, max: 100000 },
      { platform: "تيك توك", category: "بث مباشر تيك توك", price: 26.40 * profitMargin, min: 10, max: 100000 },
      { platform: "تيك توك", category: "بث مباشر تيك توك", price: 0.55 * profitMargin, min: 10, max: 100000 },
      { platform: "تيك توك", category: "بث مباشر تيك توك", price: 1.10 * profitMargin, min: 10, max: 100000 },
      { platform: "تيك توك", category: "تفاعلات بث مباشر تيك توك", price: 0.077 * profitMargin, min: 100, max: 2147483647 },
      { platform: "تيك توك", category: "تفاعلات بث مباشر تيك توك", price: 0.088 * profitMargin, min: 100, max: 2147483647 },
      { platform: "تيك توك", category: "تفاعلات بث مباشر تيك توك", price: 0.099 * profitMargin, min: 100, max: 2147483647 },
      { platform: "تيك توك", category: "تفاعلات بث مباشر تيك توك", price: 0.07 * profitMargin, min: 10, max: 2147483647 },
      { platform: "تيك توك", category: "تفاعلات بث مباشر تيك توك", price: 1.65 * profitMargin, min: 10, max: 10000 },
      { platform: "تيك توك", category: "تفاعلات بث مباشر تيك توك", price: 0.0209 * profitMargin, min: 10, max: 2147483647 },
      { platform: "تيك توك", category: "تفاعلات بث مباشر تيك توك", price: 0.748 * profitMargin, min: 10, max: 10000 },
      { platform: "تيك توك", category: "تفاعلات بث مباشر تيك توك", price: 13.684 * profitMargin, min: 5, max: 10000 },
      { platform: "تيك توك", category: "تفاعلات بث مباشر تيك توك", price: 0.748 * profitMargin, min: 10, max: 10000 },
      { platform: "يوتيوب", category: "مشتركين يوتيوب", price: 0.198 * profitMargin, min: 10, max: 1000000 },
      { platform: "يوتيوب", category: "مشتركين يوتيوب", price: 0.253 * profitMargin, min: 10, max: 1000000 },
      { platform: "يوتيوب", category: "مشتركين يوتيوب", price: 0.275 * profitMargin, min: 10, max: 100000 },
      { platform: "يوتيوب", category: "مشتركين يوتيوب", price: 22.00 * profitMargin, min: 50, max: 15000 },
      { platform: "يوتيوب", category: "ساعات مشاهدة يوتيوب", price: 7.15 * profitMargin, min: 100, max: 20000 },
      { platform: "يوتيوب", category: "ساعات مشاهدة يوتيوب", price: 20.70 * profitMargin, min: 100, max: 2000 },
      { platform: "يوتيوب", category: "ساعات مشاهدة يوتيوب", price: 15.40 * profitMargin, min: 4000, max: 4000 },
      { platform: "يوتيوب", category: "مشاهدات يوتيوب", price: 0.989 * profitMargin, min: 100, max: 1000000 },
      { platform: "يوتيوب", category: "مشاهدات يوتيوب", price: 1.034 * profitMargin, min: 100, max: 1000000 },
      { platform: "يوتيوب", category: "مشاهدات يوتيوب", price: 1.081 * profitMargin, min: 100, max: 1000000 },
      { platform: "يوتيوب", category: "مشاهدات يوتيوب", price: 0.913 * profitMargin, min: 100, max: 1000000 },
      { platform: "يوتيوب", category: "مشاهدات يوتيوب", price: 0.979 * profitMargin, min: 100, max: 10000000 },
      { platform: "يوتيوب", category: "مشاهدات يوتيوب", price: 0.913 * profitMargin, min: 100, max: 1000000 },
      { platform: "يوتيوب", category: "مشاهدات يوتيوب", price: 0.671 * profitMargin, min: 50, max: 100000 },
      { platform: "يوتيوب", category: "مشاهدات يوتيوب", price: 1.045 * profitMargin, min: 100, max: 10000000 },
      { platform: "يوتيوب", category: "مشاهدات يوتيوب", price: 1.001 * profitMargin, min: 100, max: 1000000 },
      { platform: "يوتيوب", category: "مشاهدات يوتيوب", price: 0.9471 * profitMargin, min: 100, max: 5000000 },
      { platform: "يوتيوب", category: "مشاهدات يوتيوب", price: 1.001 * profitMargin, min: 100, max: 1000000 },
      { platform: "يوتيوب", category: "مشاهدات يوتيوب", price: 0.9471 * profitMargin, min: 100, max: 5000000 },
      { platform: "يوتيوب", category: "مشاهدات يوتيوب", price: 0.946 * profitMargin, min: 3000, max: 100000000 },
      { platform: "يوتيوب", category: "مشاهدات يوتيوب", price: 1.056 * profitMargin, min: 10000, max: 20000000 },
      { platform: "يوتيوب", category: "مشاهدات يوتيوب", price: 0.858 * profitMargin, min: 40000, max: 10000000 },
      { platform: "يوتيوب", category: "مشاهدات يوتيوب", price: 2.7083 * profitMargin, min: 50, max: 500000 },
      { platform: "يوتيوب", category: "مشاهدات يوتيوب مستهدفة", price: 1.10 * profitMargin, min: 500, max: 1000000 },
      { platform: "يوتيوب", category: "مشاهدات يوتيوب مستهدفة", price: 1.32 * profitMargin, min: 500, max: 1000000 },
      { platform: "يوتيوب", category: "مشاهدات يوتيوب", price: 0.869 * profitMargin, min: 40000, max: 20000000 },
      { platform: "يوتيوب", category: "مشاهدات يوتيوب", price: 0.627 * profitMargin, min: 1000000, max: 20000000 },
      { platform: "يوتيوب", category: "مشاهدات يوتيوب", price: 0.66 * profitMargin, min: 500000, max: 5000000 },
      { platform: "يوتيوب", category: "مشاهدات يوتيوب", price: 0.902 * profitMargin, min: 30000, max: 10000000 },
      { platform: "يوتيوب", category: "مشاهدات يوتيوب", price: 0.869 * profitMargin, min: 20000, max: 1000000 },
      { platform: "يوتيوب", category: "مشاهدات يوتيوب", price: 0.88 * profitMargin, min: 20000, max: 1000000 },
      { platform: "يوتيوب", category: "مشاهدات يوتيوب", price: 1.001 * profitMargin, min: 10000, max: 100000000 },
      { platform: "يوتيوب", category: "مشاهدات يوتيوب", price: 0.935 * profitMargin, min: 2000, max: 1000000 },
      { platform: "يوتيوب", category: "مشاهدات يوتيوب", price: 1.133 * profitMargin, min: 3000, max: 100000000 },
      { platform: "يوتيوب", category: "مشاهدات يوتيوب", price: 0.209 * profitMargin, min: 500000, max: 10000000 },
      { platform: "يوتيوب", category: "مشاهدات يوتيوب", price: 0.275 * profitMargin, min: 500000, max: 10000000 },
      { platform: "يوتيوب", category: "مشاهدات فيديوهات قصيرة", price: 1.045 * profitMargin, min: 100, max: 10000000 },
      { platform: "يوتيوب", category: "إعجابات فيديوهات قصيرة", price: 0.715 * profitMargin, min: 10, max: 60000 },
      { platform: "يوتيوب", category: "إعجابات فيديوهات قصيرة", price: 0.682 * profitMargin, min: 10, max: 100000 },
      { platform: "يوتيوب", category: "تعليقات فيديوهات قصيرة", price: 5.071 * profitMargin, min: 10, max: 100000 },
      { platform: "يوتيوب", category: "إعجابات يوتيوب", price: 0.165 * profitMargin, min: 10, max: 500000 },
      { platform: "يوتيوب", category: "إعجابات يوتيوب", price: 0.176 * profitMargin, min: 10, max: 500000 },
      { platform: "يوتيوب", category: "إعجابات يوتيوب", price: 0.187 * profitMargin, min: 10, max: 500000 },
      { platform: "يوتيوب", category: "إعجابات يوتيوب", price: 0.198 * profitMargin, min: 10, max: 500000 },
      { platform: "يوتيوب", category: "إعجابات يوتيوب", price: 0.207 * profitMargin, min: 10, max: 500000 },
      { platform: "يوتيوب", category: "إعجابات يوتيوب", price: 0.216 * profitMargin, min: 10, max: 500000 },
      { platform: "يوتيوب", category: "إعجابات يوتيوب", price: 0.506 * profitMargin, min: 10, max: 50000 },
      { platform: "يوتيوب", category: "إعجابات يوتيوب", price: 0.209 * profitMargin, min: 10, max: 200000 },
      { platform: "يوتيوب", category: "إعjابات يوتيوب", price: 0.198 * profitMargin, min: 10, max: 100000 },
      { platform: "يوتيوب", category: "إعجابات يوتيوب", price: 0.121 * profitMargin, min: 10, max: 20000 },
      { platform: "يوتيوب", category: "إعجابات يوتيوب", price: 0.275 * profitMargin, min: 10, max: 80000 },
      { platform: "يوتيوب", category: "إعجابات يوتيوب", price: 0.66 * profitMargin, min: 10, max: 75000 },
      { platform: "يوتيوب", category: "إعجابات يوتيوب", price: 0.935 * profitMargin, min: 10, max: 60000 },
      { platform: "يوتيوب", category: "إعجابات يوتيوب", price: 0.968 * profitMargin, min: 20, max: 500000 },
      { platform: "يوتيوب", category: "إعجابات يوتيوب", price: 0.4945 * profitMargin, min: 10, max: 100000 },
      { platform: "يوتيوب", category: "إعجابات يوتيوب", price: 0.572 * profitMargin, min: 50, max: 400000 },
      { platform: "يوتيوب", category: "إعجابات يوتيوب", price: 0.495 * profitMargin, min: 100, max: 10000 },
      { platform: "يوتيوب", category: "تعليقات يوتيوب", price: 5.071 * profitMargin, min: 10, max: 100000 },
      { platform: "يوتيوب", category: "تعليقات يوتيوب", price: 3.564 * profitMargin, min: 10, max: 20000 },
      { platform: "يوتيوب", category: "مشاركات يوتيوب", price: 1.6088 * profitMargin, min: 500, max: 150000 },
      { platform: "يوتيوب", category: "مشاركات يوتيوب", price: 0.2574 * profitMargin, min: 100, max: 100000 },
      { platform: "يوتيوب", category: "مشاركات يوتيوب مستهدفة", price: 3.30 * profitMargin, min: 100, max: 50000 },
      { platform: "يوتيوب", category: "بث مباشر يوتيوب", price: 0.44 * profitMargin, min: 50, max: 500000 },
      { platform: "انستغرام", category: "متابعين انستغرام", price: 3.1625 * profitMargin, min: 1000, max: 1000 },
      { platform: "انستغرام", category: "متابعين انستغرام", price: 4.35 * profitMargin, min: 1000, max: 25000 },
      { platform: "انستغرام", category: "متابعين انستغرام", price: 3.00 * profitMargin, min: 1000, max: 25000 },
      { platform: "انستغرام", category: "إعجابات انستغرام", price: 1.375 * profitMargin, min: 50, max: 1000 },
      { platform: "انستغرام", category: "إعجابات انستغرام", price: 1.485 * profitMargin, min: 50, max: 5000 },
      { platform: "انستغرام", category: "إعجابات انستغرام", price: 1.65 * profitMargin, min: 50, max: 100000 },
      { platform: "انستغرام", category: "إعجابات انستغرام", price: 1.98 * profitMargin, min: 50, max: 1000000 },
      { platform: "انستغرام", category: "إعجابات انستغرام", price: 1.243 * profitMargin, min: 50, max: 1000 },
      { platform: "انستغرام", category: "إعجابات انستغرام", price: 1.5255 * profitMargin, min: 50, max: 5000 },
      { platform: "انستغرام", category: "إعجابات انستغرام", price: 2.034 * profitMargin, min: 50, max: 100000 },
      { platform: "انستغرام", category: "إعجابات انستغرام", price: 2.26 * profitMargin, min: 20, max: 1000000 },
      { platform: "انستغرام", category: "إعجابات انستغرام", price: 5.50 * profitMargin, min: 100, max: 10000 },
      { platform: "انستغرام", category: "إعجابات انستغرام", price: 5.50 * profitMargin, min: 100, max: 50000 },
      { platform: "انستغرام", category: "إعجابات انستغرام", price: 5.50 * profitMargin, min: 20, max: 1000 },
      { platform: "انستغرام", category: "مشاهدات انستغرام", price: 0.099 * profitMargin, min: 20, max: 2000000 },
      { platform: "انستغرام", category: "مشاهدات انستغرام", price: 0.0061 * profitMargin, min: 100, max: 10000000 },
      { platform: "انستغرام", category: "تعليقات انستغرام", price: 11.00 * profitMargin, min: 30, max: 20000 },
      { platform: "انستغرام", category: "متابعين انستغرام", price: 0.616 * profitMargin, min: 10, max: 5000000 },
      { platform: "انستغرام", category: "متابعين انستغرام", price: 0.66 * profitMargin, min: 10, max: 5000000 },
      { platform: "انستغرام", category: "متابعين انستغرام", price: 3.842 * profitMargin, min: 50, max: 1000000 },
      { platform: "انستغرام", category: "متابعين انستغرام", price: 2.695 * profitMargin, min: 10, max: 5000000 },
      { platform: "انستغرام", category: "متابعين انستغرام", price: 2.915 * profitMargin, min: 10, max: 5000000 },
      { platform: "انستغرام", category: "متابعين انستغرام", price: 3.135 * profitMargin, min: 10, max: 5000000 },
      { platform: "انستغرام", category: "متابعين انستغرام", price: 3.245 * profitMargin, min: 10, max: 5000000 },
      { platform: "انستغرام", category: "إعجابات انستغرام", price: 0.1198 * profitMargin, min: 10, max: 100000 },
      { platform: "انستغرام", category: "إعجابات انستغرام", price: 0.1318 * profitMargin, min: 10, max: 100000 },
      { platform: "انستغرام", category: "إعجابات انستغرام", price: 0.1395 * profitMargin, min: 10, max: 100000 },
      { platform: "انستغرام", category: "إعجابات انستغرام", price: 0.1439 * profitMargin, min: 10, max: 100000 },
      { platform: "انستغرام", category: "إعجابات انستغرام", price: 0.1483 * profitMargin, min: 10, max: 100000 },
      { platform: "انستغرام", category: "إعجابات انستغرام", price: 0.1538 * profitMargin, min: 10, max: 100000 },
      { platform: "انستغرام", category: "تعليقات انستغرام", price: 4.025 * profitMargin, min: 10, max: 1000000 },
      { platform: "انستغرام", category: "تعليقات انستغرام", price: 3.85 * profitMargin, min: 10, max: 1000000 },
      { platform: "انستغرام", category: "تعليقات انستغرام", price: 6.05 * profitMargin, min: 5, max: 10000 },
      { platform: "انستغرام", category: "تعليقات انستغرام", price: 3.52 * profitMargin, min: 10, max: 100000 },
      { platform: "انستغرام", category: "تعليقات انستغرام", price: 5.50 * profitMargin, min: 10, max: 50000 },
      { platform: "انستغرام", category: "تعليقات انستغرام", price: 0.77 * profitMargin, min: 20, max: 100000 },
      { platform: "انستغرام", category: "تعليقات انستغرام", price: 0.825 * profitMargin, min: 20, max: 100000 },
      { platform: "انستغرام", category: "تعليقات انستغرام", price: 5.50 * profitMargin, min: 10, max: 20000 },
      { platform: "انستغرام", category: "تعليقات موثقة", price: 0.165 * profitMargin, min: 1, max: 1 },
      { platform: "انستغرام", category: "مشاهدات انستغرام", price: 0.0015 * profitMargin, min: 100, max: 2147483647 },
      { platform: "انستغرام", category: "مشاهدات انستغرام", price: 0.0018 * profitMargin, min: 100, max: 2147483647 },
      { platform: "انستغرام", category: "مشاهدات انستغرام", price: 0.0019 * profitMargin, min: 100, max: 2147483647 },
      { platform: "انستغرام", category: "مشاهدات انستغرام", price: 0.002 * profitMargin, min: 100, max: 2147483647 },
      { platform: "انستغرام", category: "مشاهدات انستغرام", price: 0.0021 * profitMargin, min: 100, max: 2147483647 },
      { platform: "انستغرام", category: "مشاهدات انستغرام", price: 0.0022 * profitMargin, min: 100, max: 2147483647 },
      { platform: "انستغرام", category: "مشاهدات انستغرام", price: 0.0071 * profitMargin, min: 100, max: 217545811 },
      { platform: "انستغرام", category: "مشاهدات انستغرام", price: 0.0083 * profitMargin, min: 100, max: 217545811 },
      { platform: "انستغرام", category: "مشاهدات انستغرام", price: 0.0087 * profitMargin, min: 100, max: 217545811 },
      { platform: "انستغرام", category: "مشاهدات انستغرام", price: 0.0093 * profitMargin, min: 50, max: 217545811 },
      { platform: "انستغرام", category: "مشاهدات انستغرام", price: 0.0099 * profitMargin, min: 100, max: 217545811 },
      { platform: "انستغرام", category: "مشاهدات انستغرام", price: 0.0105 * profitMargin, min: 100, max: 217545811 },
      { platform: "انستغرام", category: "مشاهدات انستغرام", price: 0.011 * profitMargin, min: 100, max: 217545811 },
      { platform: "انستغرام", category: "مشاهدات انستغرام", price: 0.0121 * profitMargin, min: 100, max: 217545811 },
      { platform: "انستغرام", category: "إعادة نشر انستغرام", price: 0.4394 * profitMargin, min: 1, max: 100000 },
      { platform: "انستغرام", category: "إعادة نشر انستغرام", price: 0.4758 * profitMargin, min: 1, max: 10000 },
      { platform: "انستغرام", category: "مشاهدات ستوري انستغرام", price: 0.11 * profitMargin, min: 100, max: 5000 },
      { platform: "انستغرام", category: "تصويت ستوري انستغرام", price: 1.188 * profitMargin, min: 100, max: 10000 },
      { platform: "انستغرام", category: "مشاركات انستغرام", price: 0.022 * profitMargin, min: 100, max: 2147483647 },
      { platform: "انستغرام", category: "مشاركات انستغرام", price: 0.0275 * profitMargin, min: 100, max: 2147483647 },
      { platform: "انستغرام", category: "انطباعات انستغرام", price: 0.4004 * profitMargin, min: 100, max: 100000 },
      { platform: "انستغرام", category: "انطباعات انستغرام", price: 0.8134 * profitMargin, min: 100, max: 100000 },
      { platform: "انستغرام", category: "انطباعات انستغرام", price: 0.84 * profitMargin, min: 100, max: 100000 },
      { platform: "انستغرام", category: "انطباعات انستغرام", price: 0.0275 * profitMargin, min: 100, max: 5000000 },
      { platform: "انستغرام", category: "انطباعات انستغرام", price: 0.33 * profitMargin, min: 10, max: 1000000 },
      { platform: "انستغرام", category: "وصول انستغرام", price: 0.11 * profitMargin, min: 10, max: 100000000 },
      { platform: "انستغرام", category: "وصول انستغرام", price: 0.22 * profitMargin, min: 10, max: 30000 },
      { platform: "انستغرام", category: "وصول انستغرام", price: 0.0966 * profitMargin, min: 100, max: 5000000 },
      { platform: "انستغرام", category: "وصول انستغرام", price: 0.1089 * profitMargin, min: 100, max: 250000 },
      { platform: "انستغرام", category: "حفظ منشور انستغرام", price: 0.0028 * profitMargin, min: 5, max: 50000 },
      { platform: "انستغرام", category: "حفظ منشور انستغرام", price: 0.11 * profitMargin, min: 10, max: 10000 },
      { platform: "انستغرام", category: "حفظ منشور انستغرام", price: 0.066 * profitMargin, min: 10, max: 1000000 },
      { platform: "انستغرام", category: "حفظ منشور انستغرام", price: 0.0033 * profitMargin, min: 5, max: 100000 },
      { platform: "انستغرام", category: "حفظ منشور انستغرام", price: 0.0025 * profitMargin, min: 5, max: 1000000 },
      { platform: "انستغرام", category: "حفظ منشور انستغرام", price: 0.0044 * profitMargin, min: 5, max: 30000 },
      { platform: "انستغرام", category: "زيارات حساب انستغرام", price: 0.0253 * profitMargin, min: 100, max: 500000 },
      { platform: "انستغرام", category: "زيارات حساب انستغرام", price: 0.0968 * profitMargin, min: 100, max: 5000000 },
      { platform: "انستغرام", category: "لايكات تعليقات انستغرام", price: 5.0731 * profitMargin, min: 20, max: 10000 },
      { platform: "انستغرام", category: "بث مباشر انستغرام", price: 1.386 * profitMargin, min: 10, max: 20000 },
      { platform: "انستغرام", category: "بث مباشر انستغرام", price: 2.772 * profitMargin, min: 10, max: 20000 },
      { platform: "انستغرام", category: "بث مباشر انستغرام", price: 1.3673 * profitMargin, min: 100, max: 20000 },
      { platform: "فيسبوك", category: "إعجابات ومتابعة صفحة فيسبوك", price: 1.2818 * profitMargin, min: 1000, max: 70000 },
      { platform: "فيسبوك", category: "إعجابات ومتابعة صفحة فيسبوك", price: 1.2408 * profitMargin, min: 1000, max: 50000 },
      { platform: "فيسبوك", category: "إعجابات ومتابعة صفحة فيسبوك", price: 2.29 * profitMargin, min: 1000, max: 10000 },
      { platform: "فيسبوك", category: "متابعين فيسبوك", price: 1.2408 * profitMargin, min: 1000, max: 50000 },
      { platform: "فيسبوك", category: "متابعين فيسبوك", price: 2.3147 * profitMargin, min: 1000, max: 9000 },
      { platform: "فيسبوك", category: "إعجابات منشورات فيسبوك", price: 2.97 * profitMargin, min: 100, max: 10000 },
      { platform: "فيسبوك", category: "إعجابات تعليقات فيسبوك", price: 1.3786 * profitMargin, min: 250, max: 5000 },
      { platform: "فيسبوك", category: "تعليقات فيسبوك", price: 1.6366 * profitMargin, min: 50, max: 10000 },
      { platform: "فيسبوك", category: "تعليقات فيسبوك", price: 2.338 * profitMargin, min: 50, max: 10000 },
      { platform: "فيسبوك", category: "تقييمات صفحات فيسبوك", price: 2.168 * profitMargin, min: 50, max: 10000 },
      { platform: "فيسبوك", category: "تقييمات صفحات فيسبوك", price: 2.5718 * profitMargin, min: 50, max: 10000 },
      { platform: "فيسبوك", category: "تصويت فيسبوك", price: 1.286 * profitMargin, min: 250, max: 10000 },
      { platform: "فيسبوك", category: "مشاركات فيسبوك", price: 0.234 * profitMargin, min: 50, max: 1000000 },
      { platform: "فيسبوك", category: "مشاركات فيسبوك", price: 0.306 * profitMargin, min: 50, max: 1000000 },
      { platform: "فيسبوك", category: "مشاركات فيسبوك", price: 0.27 * profitMargin, min: 50, max: 1000000 },
      { platform: "فيسبوك", category: "إعجابات ومتابعة صفحة فيسبوك", price: 1.265 * profitMargin, min: 10, max: 100000 },
      { platform: "فيسبوك", category: "إعجابات ومتابعة صفحة فيسبوك", price: 1.375 * profitMargin, min: 10, max: 100000 },
      { platform: "فيسبوك", category: "متابعين فيسبوك", price: 0.1632 * profitMargin, min: 10, max: 100000 },
      { platform: "فيسبوك", category: "متابعين فيسبوك", price: 0.1757 * profitMargin, min: 10, max: 100000 },
      { platform: "فيسبوك", category: "متابعين فيسبوك", price: 0.1867 * profitMargin, min: 10, max: 100000 },
      { platform: "فيسبوك", category: "متابعين فيسبوك", price: 0.1975 * profitMargin, min: 10, max: 100000 },
      { platform: "فيسبوك", category: "متابعين فيسبوك", price: 0.2083 * profitMargin, min: 10, max: 100000 },
      { platform: "فيسبوك", category: "متابعين فيسبوك", price: 0.2191 * profitMargin, min: 10, max: 100000 },
      { platform: "فيسبوك", category: "متابعين فيسبوك", price: 0.385 * profitMargin, min: 100, max: 5000000 },
      { platform: "فيسبوك", category: "متابعين فيسبوك", price: 0.2915 * profitMargin, min: 100, max: 200000 },
      { platform: "فيسبوك", category: "متابعين فيسبوك", price: 0.55 * profitMargin, min: 10, max: 100000 },
      { platform: "فيسبوك", category: "أعضاء جروبات فيسبوك", price: 2.0075 * profitMargin, min: 100, max: 100000 },
      { platform: "فيسبوك", category: "أعضاء جروبات فيسبوك", price: 0.913 * profitMargin, min: 10, max: 100000 },
      { platform: "فيسبوك", category: "إعجابات منشورات فيسبوك", price: 0.4473 * profitMargin, min: 10, max: 10000 },
      { platform: "فيسبوك", category: "تفاعلات منشورات فيسبوك", price: 0.0762 * profitMargin, min: 10, max: 500000 },
      { platform: "فيسبوك", category: "تفاعلات منشورات فيسبوك", price: 0.264 * profitMargin, min: 10, max: 100000 },
      { platform: "فيسبوك", category: "تفاعلات منشورات فيسبوك", price: 0.3294 * profitMargin, min: 50, max: 500000 },
      { platform: "فيسبوك", category: "تفاعلات منشورات فيسبوك", price: 0.6116 * profitMargin, min: 50, max: 500000 },
      { platform: "فيسبوك", category: "تفاعلات منشورات فيسبوك", price: 0.3114 * profitMargin, min: 10, max: 100000 },
      { platform: "فيسبوك", category: "تعليقات فيسبوك", price: 3.85 * profitMargin, min: 100, max: 10000 },
      { platform: "فيسبوك", category: "تعليقات فيسبوك", price: 4.40 * profitMargin, min: 100, max: 10000 },
      { platform: "فيسبوك", category: "مشاهدات فيسبوك", price: 0.077 * profitMargin, min: 100, max: 10000000 },
      { platform: "فيسبوك", category: "مشاهدات فيسبوك", price: 0.0715 * profitMargin, min: 100, max: 10000000 },
      { platform: "فيسبوك", category: "مشاهدات فيسبوك", price: 0.0351 * profitMargin, min: 500, max: 100000000 },
      { platform: "فيسبوك", category: "مشاهدات فيسبوك", price: 0.0885 * profitMargin, min: 20, max: 2000000000 },
      { platform: "فيسبوك", category: "مشاهدات فيسبوك", price: 0.066 * profitMargin, min: 100, max: 2147483647 },
      { platform: "فيسبوك", category: "مشاهدات فيسبوك", price: 0.0825 * profitMargin, min: 500, max: 2147483647 },
      { platform: "فيسبوك", category: "مشاهدات فيسبوك", price: 0.132 * profitMargin, min: 100, max: 10000000 },
      { platform: "فيسبوك", category: "مشاهدات فيسبوك", price: 0.22 * profitMargin, min: 500, max: 100000000 },
      { platform: "فيسبوك", category: "مشاهدات فيسبوك", price: 0.275 * profitMargin, min: 100, max: 10000000 },
      { platform: "فيسبوك", category: "مشاهدات فيسبوك", price: 0.363 * profitMargin, min: 100, max: 10000000 },
      { platform: "فيسبوك", category: "مشاهدات فيسبوك", price: 0.198 * profitMargin, min: 100, max: 20000000 },
      { platform: "فيسبوك", category: "مشاهدات فيسبوك", price: 0.55 * profitMargin, min: 100, max: 20000000 },
      { platform: "فيسبوك", category: "باقات تحقيق الربح", price: 0.77 * profitMargin, min: 1, max: 1 },
      { platform: "فيسبوك", category: "باقات تحقيق الربح", price: 0.88 * profitMargin, min: 1, max: 1 },
      { platform: "فيسبوك", category: "باقات تحقيق الربح", price: 1.21 * profitMargin, min: 1, max: 1 },
      { platform: "فيسبوك", category: "باقات تحقيق الربح", price: 2.31 * profitMargin, min: 1, max: 1 },
      { platform: "فيسبوك", category: "باقات تحقيق الربح", price: 2.475 * profitMargin, min: 1, max: 1 },
      { platform: "فيسبوك", category: "باقات تحقيق الربح", price: 3.41 * profitMargin, min: 1, max: 1 },
      { platform: "فيسبوك", category: "مشاهدات ستوري فيسبوك", price: 1.4161 * profitMargin, min: 10, max: 20000 },
      { platform: "فيسبوك", category: "مشاركات فيسبوك", price: 0.0033 * profitMargin, min: 1000, max: 2147483647 },
      { platform: "فيسبوك", category: "مشاركات فيسبوك", price: 0.5335 * profitMargin, min: 100, max: 2147483647 },
      { platform: "فيسبوك", category: "مشاركات فيسبوك", price: 0.5578 * profitMargin, min: 100, max: 2147483647 },
      { platform: "فيسبوك", category: "مشاركات فيسبوك", price: 0.033 * profitMargin, min: 1000, max: 2147483647 },
      { platform: "فيسبوك", category: "بث مباشر فيسبوك", price: 0.715 * profitMargin, min: 10, max: 500000 },
      { platform: "فيسبوك", category: "بث مباشر فيسبوك", price: 1.43 * profitMargin, min: 10, max: 500000 },
      { platform: "فيسبوك", category: "بث مباشر فيسبوك", price: 4.29 * profitMargin, min: 10, max: 500000 },
      { platform: "فيسبوك", category: "بث مباشر فيسبوك", price: 0.341 * profitMargin, min: 10, max: 500000 },
      { platform: "فيسبوك", category: "بث مباشر فيسبوك", price: 0.682 * profitMargin, min: 10, max: 500000 },
      { platform: "فيسبوك", category: "بث مباشر فيسبوك", price: 1.364 * profitMargin, min: 10, max: 500000 },
      { platform: "فيسبوك", category: "بث مباشر فيسبوك", price: 2.728 * profitMargin, min: 10, max: 500000 },
      { platform: "فيسبوك", category: "بث مباشر فيسبوك", price: 4.092 * profitMargin, min: 10, max: 500000 },
      { platform: "فيسبوك", category: "بث مباشر فيسبوك", price: 5.456 * profitMargin, min: 10, max: 500000 },
      { platform: "فيسبوك", category: "بث مباشر فيسبوك", price: 6.82 * profitMargin, min: 10, max: 500000 },
      { platform: "فيسبوك", category: "بث مباشر فيسبوك", price: 8.184 * profitMargin, min: 10, max: 500000 },
      { platform: "فيسبوك", category: "بث مباشر فيسبوك", price: 16.368 * profitMargin, min: 10, max: 500000 },
      { platform: "فيسبوك", category: "أحداث وتصويتات فيسبوك", price: 2.4907 * profitMargin, min: 1000, max: 20000 },
      { platform: "فيسبوك", category: "أحداث وتصويتات فيسبوك", price: 1.2984 * profitMargin, min: 50, max: 500000 },
      { platform: "تويتر", category: "متابعين تويتر", price: 198.00 * profitMargin, min: 100, max: 500000000 },
      { platform: "تويتر", category: "متابعين تويتر", price: 6.60 * profitMargin, min: 100, max: 5000000 },
      { platform: "تويتر", category: "متابعين تويتر", price: 0.792 * profitMargin, min: 100, max: 1000000 },
      { platform: "تويتر", category: "إعجابات تويتر", price: 0.5698 * profitMargin, min: 10, max: 20000 },
      { platform: "تويتر", category: "مشاهدات تويتر", price: 0.0075 * profitMargin, min: 100, max: 100000000 },
      { platform: "تويتر", category: "مشاهدات تويتر", price: 0.0123 * profitMargin, min: 100, max: 100000000 },
      { platform: "تويتر", category: "مشاهدات تويتر", price: 0.0014 * profitMargin, min: 100, max: 2147483647 },
      { platform: "تويتر", category: "مشاهدات تويتر", price: 0.0198 * profitMargin, min: 100, max: 2147483647 },
      { platform: "تويتر", category: "مشاهدات تويتر", price: 0.011 * profitMargin, min: 250, max: 50000000 },
      { platform: "تويتر", category: "مشاهدات تويتر", price: 0.0147 * profitMargin, min: 100, max: 100000000 },
      { platform: "تويتر", category: "ريتويت تويتر", price: 0.924 * profitMargin, min: 10, max: 5000 },
      { platform: "تويتر", category: "ريتويت تويتر", price: 0.3091 * profitMargin, min: 10, max: 15000 },
      { platform: "تويتر", category: "ريتويت تويتر", price: 0.8855 * profitMargin, min: 10, max: 20000 },
      { platform: "تليجرام", category: "أعضاء قنوات/جروبات تليجرام", price: 1.10 * profitMargin, min: 10, max: 100000 },
      { platform: "تليجرام", category: "أعضاء قنوات/جروبات تليجرام", price: 1.232 * profitMargin, min: 10, max: 100000 },
      { platform: "تليجرام", category: "أعضاء قنوات/جروبات تليجرام", price: 1.375 * profitMargin, min: 10, max: 100000 },
      { platform: "تليجرام", category: "أعضاء قنوات/جروبات تليجرام", price: 1.43 * profitMargin, min: 10, max: 100000 },
      { platform: "تليجرام", category: "أعضاء قنوات/جروبات تليجرام", price: 1.485 * profitMargin, min: 10, max: 100000 },
      { platform: "تليجرام", category: "أعضاء قنوات/جروبات تليجرام", price: 1.54 * profitMargin, min: 10, max: 100000 },
      { platform: "تليجرام", category: "أعضاء قنوات/جروبات تليجرام", price: 1.32 * profitMargin, min: 10, max: 50000 },
      { platform: "تليجرام", category: "أعضاء قنوات/جروبات تليجرام", price: 0.473 * profitMargin, min: 10, max: 30000 },
      { platform: "تليجرام", category: "أعضاء قنوات/جروبات تليجرام", price: 0.3663 * profitMargin, min: 10, max: 100000 },
      { platform: "تليجرام", category: "أعضاء قنوات/جروبات تليجرام", price: 0.55 * profitMargin, min: 10, max: 300000 },
      { platform: "تليجرام", category: "أعضاء قنوات/جروبات تليجرام", price: 0.935 * profitMargin, min: 100, max: 250000 },
      { platform: "تليجرام", category: "أعضاء قنوات/جروبات تليجرام", price: 0.693 * profitMargin, min: 10, max: 100000 },
      { platform: "تليجرام", category: "أعضاء قنوات/جروبات تليجرام", price: 0.968 * profitMargin, min: 500, max: 50000 },
      { platform: "تليجرام", category: "أعضاء قنوات/جروبات تليجرام", price: 0.4774 * profitMargin, min: 10, max: 500000 },
      { platform: "تليجرام", category: "أعضاء قنوات/جروبات تليجرام", price: 0.77 * profitMargin, min: 10, max: 100000 },
      { platform: "تليجرام", category: "أعضاء قنوات/جروبات تليجرام", price: 1.65 * profitMargin, min: 500, max: 100000 },
      { platform: "تليجرام", category: "أعضاء بريميوم", price: 4.95 * profitMargin, min: 10, max: 50000 },
      { platform: "تليجرام", category: "أعضاء بريميوم", price: 8.25 * profitMargin, min: 10, max: 50000 },
      { platform: "تليجرام", category: "أعضاء بريميوم", price: 14.30 * profitMargin, min: 10, max: 50000 },
      { platform: "تليجرام", category: "مشاهدات بريميوم", price: 1.078 * profitMargin, min: 10, max: 50000 },
      { platform: "تليجرام", category: "تفاعلات بريميوم", price: 1.078 * profitMargin, min: 10, max: 50000 },
      { platform: "تليجرام", category: "أعضاء بريميوم", price: 5.0578 * profitMargin, min: 10, max: 100000 },
      { platform: "تليجرام", category: "أعضاء بريميوم", price: 8.2522 * profitMargin, min: 10, max: 100000 },
      { platform: "تليجرام", category: "أعضاء بريميوم", price: 14.641 * profitMargin, min: 10, max: 100000 },
      { platform: "تليجرام", category: "مشاهدات بريميوم", price: 0.924 * profitMargin, min: 10, max: 80000 },
      { platform: "تليجرام", category: "أعضاء بريميوم", price: 3.5426 * profitMargin, min: 100, max: 20000 },
      { platform: "تليجرام", category: "أعضاء بريميوم", price: 3.85 * profitMargin, min: 10, max: 20000 },
      { platform: "تليجرام", category: "أعضاء بريميوم", price: 6.82 * profitMargin, min: 10, max: 20000 },
      { platform: "تليجرام", category: "أعضاء بريميوم", price: 11.55 * profitMargin, min: 10, max: 20000 },
      { platform: "تليجرام", category: "تعزيز قناة تليجرام", price: 27.50 * profitMargin, min: 10, max: 100000 },
      { platform: "تليجرام", category: "تعزيز قناة تليجرام", price: 110.00 * profitMargin, min: 5, max: 50000 },
      { platform: "تليجرام", category: "تعزيز قناة تليجرام", price: 198.00 * profitMargin, min: 5, max: 30000 },
      { platform: "تليجرام", category: "تعزيز قناة تليجرام", price: 341.00 * profitMargin, min: 5, max: 20000 },
      { platform: "تليجرام", category: "بدء بوت تليجرام", price: 4.125 * profitMargin, min: 100, max: 50000 },
      { platform: "تليجرام", category: "بدء بوت تليجرام", price: 4.62 * profitMargin, min: 100, max: 100000 },
      { platform: "تليجرام", category: "بدء بوت تليجرام", price: 6.05 * profitMargin, min: 100, max: 85000 },
      { platform: "تليجرام", category: "مشاهدات منشورات تليجرام", price: 0.0072 * profitMargin, min: 10, max: 500000 },
      { platform: "تليجرام", category: "مشاهدات منشورات تليجرام", price: 0.0417 * profitMargin, min: 10, max: 10000000 },
      { platform: "تليجرام", category: "مشاهدات منشورات تليجرام", price: 0.0695 * profitMargin, min: 10, max: 10000000 },
      { platform: "تليجرام", category: "مشاهدات منشورات تليجرام", price: 0.1249 * profitMargin, min: 10, max: 10000000 },
      { platform: "تليجرام", category: "مشاهدات منشورات تليجرام", price: 0.3469 * profitMargin, min: 10, max: 10000000 },
      { platform: "تليجرام", category: "مشاهدات منشورات تليجرام", price: 0.6659 * profitMargin, min: 10, max: 10000000 },
      { platform: "تليجرام", category: "مشاهدات منشورات تليجرام", price: 0.011 * profitMargin, min: 100, max: 50000000 },
      { platform: "تليجرام", category: "مشاهدات منشورات تليجرام", price: 0.055 * profitMargin, min: 100, max: 100000 },
      { platform: "تليجرام", category: "مشاهدات منشورات تليجرام", price: 0.099 * profitMargin, min: 100, max: 100000 },
      { platform: "تليجرام", category: "مشاهدات منشورات تليجرام", price: 0.187 * profitMargin, min: 100, max: 100000 },
      { platform: "تليجرام", category: "تفاعلات تليجرام", price: 0.0143 * profitMargin, min: 10, max: 1000000 },
      { platform: "تليجرام", category: "تفاعلات تليجرام", price: 0.0286 * profitMargin, min: 10, max: 1000000 },
      { platform: "تليجرام", category: "تفاعلات تليجرام", price: 0.1375 * profitMargin, min: 100, max: 1000000 },
      { platform: "تليجرام", category: "تفاعلات تليجرام", price: 0.013 * profitMargin, min: 10, max: 1000000 },
      { platform: "تليجرام", category: "تفاعلات تليجرام", price: 0.026 * profitMargin, min: 10, max: 1000000 },
      { platform: "تليجرام", category: "تعليقات تليجرام", price: 1.43 * profitMargin, min: 100, max: 15000 },
      { platform: "تليجرام", category: "تعليقات تليجرام", price: 11.00 * profitMargin, min: 5, max: 20000 },
      { platform: "تليجرام", category: "تعليقات تليجرام", price: 14.52 * profitMargin, min: 10, max: 10000 },
      { platform: "تليجرام", category: "مشاهدات قصة تليجرام", price: 0.099 * profitMargin, min: 10, max: 100000 },
      { platform: "تليجرام", category: "مشاهدات قصة تليجرام", price: 0.495 * profitMargin, min: 10, max: 50000 },
      { platform: "تليجرام", category: "مشاهدات قصة تليجرام", price: 0.33 * profitMargin, min: 10, max: 100000 },
      { platform: "تليجرام", category: "تصويت تليجرام", price: 0.275 * profitMargin, min: 50, max: 80000 },
      { platform: "تليجرام", category: "تصويت تليجرام", price: 0.462 * profitMargin, min: 20, max: 20000 },
      { platform: "تليجرام", category: "تصويت تليجرام", price: 0.495 * profitMargin, min: 20, max: 5000 },
      { platform: "تليجرام", category: "مشاركات تليجرام", price: 0.0539 * profitMargin, min: 50, max: 1000000 },
      { platform: "تليجرام", category: "بدء بوت تليجرام", price: 0.2618 * profitMargin, min: 50, max: 1000000 },
      { platform: "كواي", category: "متابعين كواي", price: 1.32 * profitMargin, min: 10, max: 1000000 },
      { platform: "كواي", category: "إعجابات كواي", price: 0.672 * profitMargin, min: 10, max: 1000000 },
      { platform: "كواي", category: "تعليقات كواي", price: 2.136 * profitMargin, min: 10, max: 1000000 },
      { platform: "كواي", category: "مشاركات كواي", price: 0.468 * profitMargin, min: 10, max: 1000000 },
      { platform: "كواي", category: "متابعين كواي", price: 0.726 * profitMargin, min: 10, max: 1000000 },
      { platform: "كواي", category: "إعجابات كواي", price: 0.374 * profitMargin, min: 10, max: 1000000 },
      { platform: "سناب شات", category: "متابعين سناب شات", price: 17.00 * profitMargin, min: 1000, max: 15000 },
      { platform: "سناب شات", category: "مشاهدات ستوري سناب شات", price: 4.2039 * profitMargin, min: 1, max: 1 },
      { platform: "سناب شات", category: "مشاهدات ستوري سناب شات", price: 4.5041 * profitMargin, min: 1, max: 1 },
      { platform: "سناب شات", category: "مشاهدات ستوري سناب شات", price: 4.6243 * profitMargin, min: 1, max: 1 },
      { platform: "سناب شات", category: "مشاهدات ستوري سناب شات", price: 4.8044 * profitMargin, min: 1, max: 1 },
      { platform: "سناب شات", category: "مشاهدات ستوري سناب شات", price: 4.9546 * profitMargin, min: 1, max: 1 },
      { platform: "سناب شات", category: "مشاهدات ستوري سناب شات", price: 59.8842 * profitMargin, min: 100, max: 100000 },
      { platform: "سناب شات", category: "مشاهدات منصة الأضواء", price: 69.8649 * profitMargin, min: 50, max: 100000 },
      { platform: "خرائط جوجل", category: "تقييمات خرائط جوجل", price: 3000.00 * profitMargin, min: 10, max: 1000 },
      { platform: "واتساب", category: "أعضاء قنوات واتساب", price: 1.65 * profitMargin, min: 10, max: 50000 },
      { platform: "واتساب", category: "أعضاء قنوات واتساب", price: 1.98 * profitMargin, min: 10, max: 10000 },
      { platform: "واتساب", category: "أعضاء قنوات واتساب", price: 3.30 * profitMargin, min: 10, max: 10000 },
      { platform: "واتساب", category: "تفاعلات واتساب", price: 0.825 * profitMargin, min: 10, max: 50000 },
      { platform: "VK", category: "متابعين VK", price: 2.4814 * profitMargin, min: 50, max: 30000 },
      { platform: "Kick", category: "مشاهدات بث مباشر Kick", price: 0.935 * profitMargin, min: 10, max: 5000 },
      { platform: "Kick", category: "مشاهدات Kick", price: 0.075 * profitMargin, min: 10, max: 10000000 },
      { platform: "Kick", category: "متابعين Kick", price: 6.60 * profitMargin, min: 10, max: 10000 },
      { platform: "كلوب هاوس", category: "متابعين كلوب هاوس", price: 18.7671 * profitMargin, min: 50, max: 3500 },
      { platform: "ثريدز", category: "متابعين ثريدز", price: 1.6758 * profitMargin, min: 10, max: 1000 },
      { platform: "ثريدز", category: "إعجابات ثريدز", price: 0.7073 * profitMargin, min: 10, max: 10000 },
      { platform: "ثريدز", category: "إعادة نشر ثريدز", price: 5.50 * profitMargin, min: 10, max: 50000 },
      { platform: "ثريدز", category: "تعليقات ثريدز", price: 2.97 * profitMargin, min: 10, max: 10000 },
      { platform: "خدمات أخرى", category: "الإبلاغ عن حسابات", price: 0.90 * profitMargin, min: 1000, max: 1000000 },
      { platform: "خدمات أخرى", category: "توثيق حسابات", price: 1000.00 * profitMargin, min: 1, max: 1 },
      { platform: "خدمات أخرى", category: "بيانات الخطوط", price: 3.00 * profitMargin, min: 1, max: 1 },
      { platform: "ببجي موبايل", category: "شحن شدات ببجي", price: 0.979 * profitMargin, min: 1, max: 1 },
      { platform: "فري فاير", category: "شحن ألماس فري فاير", price: 1.529 * profitMargin, min: 1, max: 1 },
      { platform: "يلا لودو", category: "شحن مجوهرات يلا لودو", price: 2.266 * profitMargin, min: 1, max: 1 },
      { platform: "زيارات مواقع", category: "زيارات من مصر", price: 0.15 * profitMargin, min: 500, max: 1000000 },
      // Other services
      { platform: "تصميم مواقع", category: "تصميم موقع تعريفي", price: 250 * profitMargin, min: 1, max: 1 },
      { platform: "تصميم مواقع", category: "تصميم متجر إلكتروني", price: 500 * profitMargin, min: 1, max: 1 },
      { platform: "حملات إعلانية", category: "إدارة حملة فيسبوك", price: 150 * profitMargin, min: 1, max: 1 },
      { platform: "حملات إعلانية", category: "إدارة حملة جوجل", price: 200 * profitMargin, min: 1, max: 1 },
      { platform: "حسابات إعلانية", category: "بيع حساب إعلاني", price: 100 * profitMargin, min: 1, max: 1 },
    ];
    
    const servicesCol = collection(firestore, 'services');
    servicesToSeed.forEach(service => {
        addDocumentNonBlocking(servicesCol, service);
    });

    toast({ title: "تمت إضافة الخدمات بنجاح!", description: `${servicesToSeed.length} خدمة تمت إضافتها إلى الكتالوج.` });
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
      
       <Button size="sm" variant="ghost" onClick={seedServices}>إضافة خدمات تجريبية</Button>
    </div>
  );
}
