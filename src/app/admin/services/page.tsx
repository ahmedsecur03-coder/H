
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
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
import { PlusCircle, Upload, Pencil, Trash2, Loader2, ListFilter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

function ServiceDialog({ service, onSave, children }: { service?: Service, onSave: (data: Omit<Service, 'id'>) => Promise<void>, children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [platform, setPlatform] = useState(service?.platform || '');
    const [category, setCategory] = useState(service?.category || '');
    const [price, setPrice] = useState(service?.price.toString() || '');
    const [min, setMin] = useState(service?.min.toString() || '');
    const [max, setMax] = useState(service?.max.toString() || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave({
                platform,
                category,
                price: parseFloat(price),
                min: parseInt(min, 10),
                max: parseInt(max, 10),
            });
            setOpen(false);
        } finally {
            setIsSaving(false);
        }
    };
    
    // Reset state when dialog opens or service changes
    React.useEffect(() => {
        if (open) {
            setPlatform(service?.platform || '');
            setCategory(service?.category || '');
            setPrice(service?.price?.toString() || '');
            setMin(service?.min?.toString() || '');
            setMax(service?.max?.toString() || '');
        }
    }, [open, service]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{service ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="platform">المنصة</Label>
                        <Input id="platform" value={platform} onChange={e => setPlatform(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">الفئة</Label>
                        <Input id="category" value={category} onChange={e => setCategory(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="price">السعر لكل 1000</Label>
                        <Input id="price" type="number" step="0.0001" value={price} onChange={e => setPrice(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="min">الحد الأدنى</Label>
                        <Input id="min" type="number" value={min} onChange={e => setMin(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="max">الحد الأقصى</Label>
                        <Input id="max" type="number" value={max} onChange={e => setMax(e.target.value)} required />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="animate-spin" /> : 'حفظ'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function AdminServicesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
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

  const handleAddService = async (data: Omit<Service, 'id'>) => {
    if (!firestore) return;
    try {
        await addDoc(collection(firestore, 'services'), data);
        toast({ title: 'نجاح', description: 'تمت إضافة الخدمة بنجاح.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    }
  };

  const handleEditService = async (id: string, data: Omit<Service, 'id'>) => {
     if (!firestore) return;
    try {
        await updateDoc(doc(firestore, 'services', id), data);
        toast({ title: 'نجاح', description: 'تم تحديث الخدمة بنجاح.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    }
  };

  const handleDeleteService = async (id: string) => {
      if (!firestore) return;
      try {
        await deleteDoc(doc(firestore, 'services', id));
        toast({ title: 'نجاح', description: 'تم حذف الخدمة بنجاح.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    }
  };

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
              <ServiceDialog service={service} onSave={(data) => handleEditService(service.id, data)}>
                <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                </Button>
              </ServiceDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>هل أنت متأكد تماماً؟</AlertDialogTitle>
                    <AlertDialogDescription>
                        هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف الخدمة نهائياً من قاعدة البيانات.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteService(service.id)}>متابعة الحذف</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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
            <ServiceDialog onSave={handleAddService}>
                 <Button>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    إضافة خدمة جديدة
                </Button>
            </ServiceDialog>
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
           {isLoading ? (
               <Skeleton className="h-96 w-full"/>
           ) : (
                filteredServices && filteredServices.length > 0 ? (
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
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="mx-auto bg-muted p-4 rounded-full">
                            <ListFilter className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="mt-4 font-headline text-2xl">
                           {searchTerm ? "لا توجد خدمات تطابق بحثك" : "لا توجد خدمات لعرضها"}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                           {searchTerm ? "حاول تغيير كلمات البحث." : "ابدأ بإضافة خدمة جديدة."}
                        </p>
                    </div>
                )
            )}
        </CardContent>
       </Card>
    </div>
  );
}
