
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Service } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Upload, Trash2, Loader2, ListFilter, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import React from 'react';

function ServiceDialog({ service, onSave, children, onOpenChange, open }: { service?: Service, onSave: (data: any) => Promise<void>, children: React.ReactNode, open: boolean, onOpenChange: (open: boolean) => void }) {
    const [data, setData] = useState({
        id: service?.id || '',
        category: service?.category || '',
        platform: service?.platform || '',
        price: service?.price || 0,
        min: service?.min || 0,
        max: service?.max || 0,
        refill: service?.refill || false,
    });
    const [isSaving, setIsSaving] = useState(false);

    React.useEffect(() => {
        if (service) {
            setData({
                id: service.id,
                category: service.category,
                platform: service.platform,
                price: service.price,
                min: service.min,
                max: service.max,
                refill: service.refill || false,
            });
        } else {
             setData({ id: '', category: '', platform: '', price: 0, min: 0, max: 0, refill: false });
        }
    }, [service, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(data);
            onOpenChange(false);
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{service ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>رقم الخدمة (ID)</Label>
                        <Input value={data.id} onChange={e => setData({...data, id: e.target.value})} placeholder="اتركه فارغاً للتوليد التلقائي" disabled={!!service} />
                    </div>
                     <div className="space-y-2">
                        <Label>الفئة</Label>
                        <Input value={data.category} onChange={e => setData({...data, category: e.target.value})} required />
                    </div>
                     <div className="space-y-2">
                        <Label>المنصة</Label>
                        <Input value={data.platform} onChange={e => setData({...data, platform: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                        <Label>السعر/1000</Label>
                        <Input type="number" value={data.price} onChange={e => setData({...data, price: parseFloat(e.target.value) || 0})} required />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>الحد الأدنى</Label>
                            <Input type="number" value={data.min} onChange={e => setData({...data, min: parseInt(e.target.value) || 0})} required />
                        </div>
                        <div className="space-y-2">
                            <Label>الحد الأقصى</Label>
                            <Input type="number" value={data.max} onChange={e => setData({...data, max: parseInt(e.target.value) || 0})} required />
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                         <Switch id="refill" checked={data.refill} onCheckedChange={checked => setData({...data, refill: checked})} />
                        <Label htmlFor="refill">إعادة تعبئة مدعومة</Label>
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | undefined>(undefined);

  const servicesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'services')) : null, [firestore]);
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
  
  const handleSaveService = async (data: Omit<Service, 'id'> & { id?: string }) => {
    if (!firestore) return;

    if (selectedService) { // Editing existing service
        const serviceDocRef = doc(firestore, 'services', selectedService.id);
        const { id, ...updateData } = data; // Don't update the ID
        await updateDoc(serviceDocRef, updateData)
            .then(() => toast({ title: 'نجاح', description: 'تم تحديث الخدمة بنجاح.' }))
            .catch(serverError => {
                const permissionError = new FirestorePermissionError({ path: serviceDocRef.path, operation: 'update', requestResourceData: updateData });
                errorEmitter.emit('permission-error', permissionError);
            });
    } else { // Adding new service
        const servicesColRef = collection(firestore, 'services');
        if (data.id) { // Use user-provided ID
            const newServiceDocRef = doc(firestore, 'services', data.id);
            const { id, ...newServiceData } = data;
            await setDoc(newServiceDocRef, newServiceData)
                .then(() => toast({ title: 'نجاح', description: 'تمت إضافة الخدمة بنجاح.' }))
                .catch(serverError => {
                    const permissionError = new FirestorePermissionError({ path: newServiceDocRef.path, operation: 'create', requestResourceData: newServiceData });
                    errorEmitter.emit('permission-error', permissionError);
                });
        } else { // Auto-generate ID
             const { id, ...newServiceData } = data;
             await addDoc(servicesColRef, newServiceData)
                .then(() => toast({ title: 'نجاح', description: 'تمت إضافة الخدمة بنجاح.' }))
                .catch(serverError => {
                    const permissionError = new FirestorePermissionError({ path: servicesColRef.path, operation: 'create', requestResourceData: newServiceData });
                    errorEmitter.emit('permission-error', permissionError);
                });
        }
    }
  };

  const handleDeleteService = async (id: string) => {
      if (!firestore) return;
      const serviceDocRef = doc(firestore, 'services', id);
      deleteDoc(serviceDocRef)
        .then(() => {
            toast({ title: 'نجاح', description: 'تم حذف الخدمة بنجاح.' });
        })
        .catch(serverError => {
            const permissionError = new FirestorePermissionError({ path: serviceDocRef.path, operation: 'delete' });
            errorEmitter.emit('permission-error', permissionError);
        });
  };

  const handleOpenDialog = (service?: Service) => {
      setSelectedService(service);
      setIsDialogOpen(true);
  }

  const renderContent = () => {
    if (isLoading && !filteredServices) {
      return Array.from({length: 10}).map((_, i) => (
        <TableRow key={i}>
          {Array.from({length: 7}).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
        </TableRow>
      ));
    }
     if (!filteredServices || filteredServices.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="h-24 text-center">
             <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mx-auto bg-muted p-4 rounded-full"><ListFilter className="h-12 w-12 text-muted-foreground" /></div>
                <h3 className="mt-4 font-headline text-2xl">{searchTerm ? "لا توجد خدمات تطابق بحثك" : "لا توجد خدمات لعرضها"}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{searchTerm ? "حاول تغيير كلمات البحث." : "ابدأ بإضافة خدمة جديدة."}</p>
            </div>
          </TableCell>
        </TableRow>
      );
    }
    return filteredServices.map(service => (
      <TableRow key={service.id}>
          <TableCell className="font-mono text-xs">{service.id}</TableCell>
          <TableCell>{service.category}</TableCell>
          <TableCell>{service.platform}</TableCell>
          <TableCell>${service.price.toFixed(4)}</TableCell>
          <TableCell>{service.min} / {service.max}</TableCell>
           <TableCell className="text-center">
            {service.refill ? <Badge variant="default">نعم</Badge> : <Badge variant="secondary">لا</Badge>}
          </TableCell>
          <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(service)}><Pencil className="h-4 w-4" /></Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد تماماً؟</AlertDialogTitle><AlertDialogDescription>هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف الخدمة نهائياً من قاعدة البيانات.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteService(service.id)} className="bg-destructive hover:bg-destructive/90">متابعة الحذف</AlertDialogAction></AlertDialogFooter>
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
          <p className="text-muted-foreground">إضافة وتعديل وحذف خدمات المنصة.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline"><Upload className="ml-2 h-4 w-4" />استيراد بالجملة</Button>
           <Button onClick={() => handleOpenDialog()}><PlusCircle className="ml-2 h-4 w-4" />إضافة خدمة</Button>
        </div>
      </div>
       <Card>
        <CardHeader>
            <Input placeholder="ابحث عن خدمة بالرقم، الاسم، أو الفئة..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </CardHeader>
        <CardContent>
           {isLoading && !services ? ( <Skeleton className="h-96 w-full"/> ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>رقم الخدمة</TableHead>
                            <TableHead>الاسم</TableHead>
                            <TableHead>المنصة</TableHead>
                            <TableHead>السعر/1000</TableHead>
                            <TableHead>الحدود</TableHead>
                            <TableHead className="text-center">إعادة تعبئة</TableHead>
                            <TableHead className="text-right">إجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {renderContent()}
                    </TableBody>
                </Table>
            )}
        </CardContent>
       </Card>
        <ServiceDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            service={selectedService}
            onSave={handleSaveService}
        />
    </div>
  );
}
