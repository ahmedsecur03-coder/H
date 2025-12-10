'use client';

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

const dummyServices = [
    {
        id: '1',
        name: 'متابعين انستغرام',
        category: 'انستغرام',
        price: 1.20,
        min: 100,
        max: 100000,
    },
    {
        id: '2',
        name: 'مشاهدات تيك توك',
        category: 'تيك توك',
        price: 0.05,
        min: 1000,
        max: 10000000,
    },
    {
        id: '3',
        name: 'مشاهدات يوتيوب',
        category: 'يوتيوب',
        price: 2.50,
        min: 500,
        max: 1000000,
    }
];

export default function AdminServicesPage() {
  // TODO: Replace with actual Firestore data fetching
  const services = dummyServices;

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
            <Input placeholder="ابحث عن خدمة..." />
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
                    {services.map(service => (
                        <TableRow key={service.id}>
                            <TableCell className="font-mono">{service.id}</TableCell>
                            <TableCell className="font-medium">{service.name}</TableCell>
                            <TableCell>{service.category}</TableCell>
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
                    ))}
                </TableBody>
            </Table>
        </CardContent>
       </Card>
    </div>
  );
}
