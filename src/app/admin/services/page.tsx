
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, doc, addDoc, updateDoc, deleteDoc, setDoc, getDocs, limit, orderBy, startAfter, endBefore, limitToLast, where, DocumentData, Query } from 'firebase/firestore';
import type { Service } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Upload, Trash2, ListFilter, Pencil, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ServiceDialog } from './_components/service-dialog';
import { ImportDialog } from './_components/import-dialog';
import { Badge } from '@/components/ui/badge';
import React from 'react';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

const ITEMS_PER_PAGE = 25;

export default function AdminServicesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | undefined>(undefined);
  
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [firstVisible, setFirstVisible] = useState<DocumentData | null>(null);
  const [page, setPage] = useState(1);

  const fetchServices = async (direction: 'next' | 'prev' | 'initial' = 'initial') => {
      if (!firestore) return;
      setIsLoading(true);

      try {
          let q: Query = collection(firestore, 'services');

          // Note: Firestore does not support robust text search natively.
          // For a production app, a third-party search service like Algolia or Typesense would be used.
          // Here, we'll order by ID and do a basic filter if a search term is provided.
          // This search is limited and case-sensitive.
          if (searchTerm) {
             q = query(q, where('id', '>=', searchTerm), where('id', '<=', searchTerm + '\uf8ff'));
          }

          q = query(q, orderBy('id'));
          
          if (direction === 'next' && lastVisible) {
              q = query(q, startAfter(lastVisible));
          } else if (direction === 'prev' && firstVisible) {
              q = query(q, endBefore(firstVisible), limitToLast(ITEMS_PER_PAGE));
          }

          if (direction !== 'prev') {
              q = query(q, limit(ITEMS_PER_PAGE));
          }

          const documentSnapshots = await getDocs(q);
          const newServices: Service[] = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));

           if (newServices.length === 0 && direction !== 'initial') {
              toast({ title: direction === 'next' ? "هذه هي الصفحة الأخيرة." : "هذه هي الصفحة الأولى." });
              setIsLoading(false);
              return;
            }

          setServices(newServices);
          setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
          setFirstVisible(documentSnapshots.docs[0]);

          if (direction === 'next') setPage(p => p + 1);
          if (direction === 'prev' && page > 1) setPage(p => p - 1);
          if (direction === 'initial') setPage(1);

      } catch (error) {
          console.error("Error fetching services:", error);
          toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب الخدمات.' });
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
    fetchServices('initial');
  }, [firestore]); // Re-fetch only when firestore instance changes

  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      fetchServices('initial');
  }
  
  const handleSaveService = async (data: Omit<Service, 'id'> & { id?: string }) => {
    if (!firestore) return;

    if (selectedService) { // Editing existing service
        const serviceDocRef = doc(firestore, 'services', selectedService.id);
        const { id, ...updateData } = data; // Don't update the ID
        await updateDoc(serviceDocRef, updateData)
            .then(() => {
                toast({ title: 'نجاح', description: 'تم تحديث الخدمة بنجاح.' });
                fetchServices('initial'); // Refresh data
            })
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
                .then(() => {
                    toast({ title: 'نجاح', description: 'تمت إضافة الخدمة بنجاح.' });
                    fetchServices('initial'); // Refresh data
                })
                .catch(serverError => {
                    const permissionError = new FirestorePermissionError({ path: newServiceDocRef.path, operation: 'create', requestResourceData: newServiceData });
                    errorEmitter.emit('permission-error', permissionError);
                });
        } else { // Auto-generate ID
             const { id, ...newServiceData } = data;
             await addDoc(servicesColRef, newServiceData)
                .then(() => {
                    toast({ title: 'نجاح', description: 'تمت إضافة الخدمة بنجاح.' });
                    fetchServices('initial'); // Refresh data
                })
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
            fetchServices('initial'); // Refresh data
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
    if (isLoading) {
      return Array.from({length: 10}).map((_, i) => (
        <TableRow key={i}>
          {Array.from({length: 8}).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
        </TableRow>
      ));
    }
     if (!services || services.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={8} className="h-24 text-center">
             <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mx-auto bg-muted p-4 rounded-full"><ListFilter className="h-12 w-12 text-muted-foreground" /></div>
                <h3 className="mt-4 font-headline text-2xl">{searchTerm ? "لا توجد خدمات تطابق بحثك" : "لا توجد خدمات لعرضها"}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{searchTerm ? "حاول تغيير كلمات البحث." : "ابدأ بإضافة خدمة جديدة أو استيرادها."}</p>
            </div>
          </TableCell>
        </TableRow>
      );
    }
    return services.map(service => (
      <TableRow key={service.id}>
          <TableCell className="font-mono text-xs">{service.id}</TableCell>
          <TableCell>{service.category}</TableCell>
          <TableCell>{service.platform}</TableCell>
          <TableCell>${service.price.toFixed(4)}</TableCell>
          <TableCell>{service.min} / {service.max}</TableCell>
          <TableCell className="text-center">
             {service.guarantee ? <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 ml-1" />نعم</Badge> : <Badge variant="secondary"><XCircle className="w-3 h-3 ml-1" />لا</Badge>}
          </TableCell>
           <TableCell className="text-center">
            {service.refill ? <Badge variant="default"><CheckCircle className="w-3 h-3 ml-1" />نعم</Badge> : <Badge variant="secondary"><XCircle className="w-3 h-3 ml-1" />لا</Badge>}
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
           <ImportDialog onImportComplete={() => fetchServices('initial')}>
             <Button variant="outline"><Upload className="ml-2 h-4 w-4" />استيراد بالجملة</Button>
           </ImportDialog>
            <ServiceDialog
                open={isDialogOpen && !selectedService}
                onOpenChange={(open) => { if (!open) setSelectedService(undefined); setIsDialogOpen(open); }}
                onSave={handleSaveService}
            >
                <Button onClick={() => handleOpenDialog()}><PlusCircle className="ml-2 h-4 w-4" />إضافة خدمة</Button>
            </ServiceDialog>
        </div>
      </div>
       <Card>
        <CardHeader>
            <form onSubmit={handleSearch}>
              <Input placeholder="ابحث عن خدمة بالرقم، الاسم، أو الفئة..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </form>
        </CardHeader>
        <CardContent>
           <Table>
              <TableHeader>
                  <TableRow>
                      <TableHead>رقم الخدمة</TableHead>
                      <TableHead>الاسم</TableHead>
                      <TableHead>المنصة</TableHead>
                      <TableHead>السعر/1000</TableHead>
                      <TableHead>الحدود</TableHead>
                      <TableHead className="text-center">ضمان</TableHead>
                      <TableHead className="text-center">إعادة تعبئة</TableHead>
                      <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {renderContent()}
              </TableBody>
          </Table>
        </CardContent>
         <CardFooter className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">صفحة {page}</span>
            <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => fetchServices('prev')} disabled={page <= 1}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => fetchServices('next')} disabled={services.length < ITEMS_PER_PAGE}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
            </div>
        </CardFooter>
       </Card>
        {selectedService && <ServiceDialog
            open={isDialogOpen && !!selectedService}
            onOpenChange={(open) => { if (!open) setSelectedService(undefined); setIsDialogOpen(open); }}
            service={selectedService}
            onSave={handleSaveService}
        >
            {/* This dialog is controlled by the button in the table row */}
        </ServiceDialog>}
    </div>
  );
}

    