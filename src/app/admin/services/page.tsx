
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Service } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { PlusCircle, Upload, Pencil, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminServicesPage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const servicesQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'services')) : null,
    [firestore]
  );
  
  const { data: services, isLoading } = useCollection<Service>(servicesQuery);

  const filteredServices = useMemo(() => {
    if (!services) return [];
    if (!searchTerm) return services;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return services.filter(service => 
      service.platform.toLowerCase().includes(lowerCaseSearch) ||
      service.category.toLowerCase().includes(lowerCaseSearch) ||
      service.id.toLowerCase().includes(lowerCaseSearch)
    );
  }, [services, searchTerm]);

  const renderContent = () => {
    if (isLoading) {
      return Array.from({length: 10}).map((_, i) => (
        <TableRow key={i}>
          {Array.from({length: 6}).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
        </TableRow>
      ));
    }
     if (!filteredServices || filteredServices.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-24 text-center">
            {searchTerm ? "لا توجد خدمات تطابق بحثك." : "لا توجد خدمات حالياً."}
          </TableCell>
        </TableRow>
      );
    }
    return filteredServices.map(service => (
      <TableRow key={service.id}>
          <TableCell className="font-mono">{service.id.substring(0,8)}</TableCell>
          <TableCell className="font-medium">{service.category}</TableCell>
          <TableCell>{service.platform}</TableCell>
          <TableCell>${service.price.toFixed(4)}</TableCell>
          <TableCell>{service.min.toLocaleString()} - {service.max.toLocaleString()}</TableCell>
          <TableCell className="text-right">
              <Button variant="ghost" size="icon">
                  <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
              </Button>
          </TableCell>
      </TableRow>
    ));
  }


  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة الخدمات</h1>
          <p className="text-muted-foreground">
            إضافة وتعديل وحذف خدمات المنصة.
          </p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline">
                <Upload className="ml-2 h-4 w-4" />
                استيراد بالجملة
            </Button>
            <Button>
                <PlusCircle className="ml-2 h-4 w-4" />
                إضافة خدمة جديدة
            </Button>
        </div>
      </div>
       <Card>
        <CardHeader>
            <Input 
              placeholder="ابحث عن خدمة بالرقم، الاسم، أو الفئة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>رقم الخدمة</TableHead>
                        <TableHead>الاسم</TableHead>
                        <TableHead>الفئة</TableHead>
                        <TableHead>السعر لكل 1000</TableHead>
                        <TableHead>الحدود (أدنى-أقصى)</TableHead>
                        <TableHead className="text-right">إجراءات</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                   {renderContent()}
                </TableBody>
            </Table>
        </CardContent>
       </Card>
    </div>
  );
}
