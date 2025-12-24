'use client';

import { useState, useMemo, useCallback, useEffect, Suspense } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, doc, addDoc, updateDoc, deleteDoc, setDoc, orderBy, getDocs, writeBatch } from 'firebase/firestore';
import type { Service, ServicePrice } from '@/lib/types';
import { SMM_SERVICES } from '@/lib/smm-services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Upload, Trash2, ListFilter, Pencil, CheckCircle, XCircle, Search } from 'lucide-react';
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
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';


const ITEMS_PER_PAGE = 25;

function ServicesPageSkeleton() {
    return (
        <div className="space-y-6 pb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-5 w-64 mt-2" />
                </div>
                <div className="flex gap-2 self-end sm:self-center">
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>
            <Card>
                <CardHeader><Skeleton className="h-10 w-full" /></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {Array.from({ length: 8 }).map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 15 }).map((_, i) => (
                                <TableRow key={i}>
                                    {Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>)}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="justify-center border-t pt-4">
                    <Skeleton className="h-9 w-64" />
                </CardFooter>
            </Card>
        </div>
    );
}

function AdminServicesPageComponent() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get('page')) || 1;
  const currentSearch = searchParams.get('search') || '';
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | undefined>(undefined);
  
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageCount, setPageCount] = useState(0);

  const fetchServiceData = useCallback(async () => {
    if (!firestore) return;
    setIsLoading(true);

    try {
        // Step 1: Get dynamic prices from Firestore
        const pricesSnapshot = await getDocs(collection(firestore, 'servicePrices'));
        const pricesMap = new Map<string, number>();
        pricesSnapshot.forEach(doc => {
            pricesMap.set(doc.id, doc.data().price);
        });

        // Step 2: Merge with static data from SMM_SERVICES
        const allServices = SMM_SERVICES.map(service => ({
            ...service,
            price: pricesMap.get(service.id) ?? service.price, // Use Firestore price if available, otherwise fallback
        }));
        
        // Step 3: Apply client-side filtering and pagination
        const filtered = allServices.filter(service =>
          service.id.toString().includes(currentSearch) ||
          service.category.toLowerCase().includes(currentSearch.toLowerCase()) ||
          service.platform.toLowerCase().includes(currentSearch.toLowerCase())
        );

        const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
        setPageCount(totalPages);

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        setServices(filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE));

    } catch (error) {
        console.error("Error fetching services data: ", error);
        toast({variant: 'destructive', title: "خطأ", description: "فشل في جلب بيانات الخدمات."});
    } finally {
        setIsLoading(false);
    }
  }, [firestore, currentSearch, currentPage, toast]);


  useEffect(() => {
    fetchServiceData();
  }, [fetchServiceData]);


  const handleFilterChange = (key: 'search' | 'page', value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key === 'search') {
      params.set('page', '1');
    }
    router.replace(`${pathname}?${params.toString()}`);
  };


  const renderPaginationItems = () => {
    if (pageCount <= 1) return null;
    const pageNumbers: (number | 'ellipsis')[] = [];
    if (pageCount <= 7) {
        for (let i = 1; i <= pageCount; i++) pageNumbers.push(i);
    } else {
        pageNumbers.push(1);
        if (currentPage > 3) pageNumbers.push('ellipsis');
        let start = Math.max(2, currentPage - 1);
        let end = Math.min(pageCount - 1, currentPage + 1);
        for (let i = start; i <= end; i++) pageNumbers.push(i);
        if (currentPage < pageCount - 2) pageNumbers.push('ellipsis');
        pageNumbers.push(pageCount);
    }
    return pageNumbers.map((page, index) => (
        <PaginationItem key={`${page}-${index}`}>
            {page === 'ellipsis' ? <PaginationEllipsis /> : (
                <PaginationLink href="#" isActive={currentPage === page} onClick={(e) => { e.preventDefault(); handleFilterChange('page', String(page)); }}>{page}</PaginationLink>
            )}
        </PaginationItem>
    ));
  };

  
  const handleSaveService = (data: { price: number }) => {
    if (!firestore || !selectedService) return;

    const priceDocRef = doc(firestore, 'servicePrices', selectedService.id);
    
    toast({ title: 'جاري حفظ السعر...' });

    updateDoc(priceDocRef, data)
    .then(() => {
        toast({ title: 'نجاح', description: 'تم تحديث سعر الخدمة بنجاح.' });
        fetchServiceData(); // Re-fetch data to show updated price
        setIsDialogOpen(false);
        setSelectedService(undefined);
    }).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: priceDocRef.path,
            operation: 'update',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const handleDeleteService = (id: string) => {
      if (!firestore) return;
      // This now only deletes the price document, leaving the static data intact.
      // The service will still appear in the list but may use a fallback price.
      const priceDocRef = doc(firestore, 'servicePrices', id);
      deleteDoc(priceDocRef)
        .then(() => {
            toast({ title: 'نجاح', description: 'تم حذف السعر المخصص للخدمة.' });
            fetchServiceData();
        })
        .catch(serverError => {
            const permissionError = new FirestorePermissionError({ path: priceDocRef.path, operation: 'delete' });
            errorEmitter.emit('permission-error', permissionError);
        });
  };

  const handleOpenDialog = (service?: Service) => {
      setSelectedService(service);
      setIsDialogOpen(true);
  }

  const ServiceCard = ({ service }: { service: Service }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium truncate">{service.category}</CardTitle>
        <CardDescription>{service.platform} - #{service.id}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between">
            <span className="text-muted-foreground">السعر/1000</span>
            <span className="font-semibold">${service.price.toFixed(4)}</span>
        </div>
        <div className="flex justify-between">
            <span className="text-muted-foreground">الحدود</span>
            <span>{service.min} / {service.max}</span>
        </div>
         <div className="flex justify-between items-center">
            <span className="text-muted-foreground">ضمان</span>
            {service.guarantee ? <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 ml-1" />نعم</Badge> : <Badge variant="secondary"><XCircle className="w-3 h-3 ml-1" />لا</Badge>}
        </div>
      </CardContent>
      <CardFooter className="gap-2">
         <Button variant="ghost" size="sm" className="flex-1" onClick={() => handleOpenDialog(service)}><Pencil className="h-4 w-4" /></Button>
      </CardFooter>
    </Card>
  );

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
          <TableCell colSpan={8}>
             <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mx-auto bg-muted p-4 rounded-full"><ListFilter className="h-12 w-12 text-muted-foreground" /></div>
                <h3 className="mt-4 font-headline text-2xl">{currentSearch ? "لا توجد خدمات تطابق بحثك" : "لا توجد خدمات لعرضها"}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{currentSearch ? "حاول تغيير كلمات البحث." : "ابدأ بمزامنة أسعار الخدمات."}</p>
                 {!currentSearch && (
                    <div className="flex gap-2 mt-4">
                        <ImportDialog onImportComplete={fetchServiceData}>
                            <Button variant="outline"><Upload className="ml-2 h-4 w-4" />مزامنة الأسعار</Button>
                        </ImportDialog>
                    </div>
                )}
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
          </TableCell>
      </TableRow>
    ));
  }


  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة الخدمات</h1>
          <p className="text-muted-foreground">تعديل أسعار خدمات المنصة.</p>
        </div>
        <div className="flex gap-2 self-end sm:self-center">
           <ImportDialog onImportComplete={fetchServiceData}>
             <Button variant="outline"><Upload className="ml-2 h-4 w-4" />مزامنة الأسعار</Button>
           </ImportDialog>
        </div>
      </div>
       <Card>
        <CardHeader>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="relative">
                  <Search className="absolute right-3 rtl:left-3 rtl:right-auto top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="ابحث عن خدمة بالرقم، الاسم، أو الفئة..." 
                    value={currentSearch} 
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pe-10 rtl:ps-10"
                   />
              </div>
            </form>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
             <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-60" />)}
            </div>
          ) : !services || services.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mx-auto bg-muted p-4 rounded-full"><ListFilter className="h-12 w-12 text-muted-foreground" /></div>
                <h3 className="mt-4 font-headline text-2xl">{currentSearch ? "لا توجد خدمات تطابق بحثك" : "لا توجد خدمات لعرضها"}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{currentSearch ? "حاول تغيير كلمات البحث." : "ابدأ بمزامنة أسعار الخدمات."}</p>
            </div>
          ) : (
            <>
              <div className="hidden lg:block">
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
              </div>
            </>
          )}
        </CardContent>
         {pageCount > 1 && (
            <CardFooter className="flex items-center justify-center border-t pt-4">
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handleFilterChange('page', String(currentPage - 1)); }} disabled={currentPage === 1}/>
                        </PaginationItem>
                        {renderPaginationItems()}
                        <PaginationItem>
                            <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handleFilterChange('page', String(currentPage + 1)); }} disabled={currentPage === pageCount} />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </CardFooter>
        )}
       </Card>
        <ServiceDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            service={selectedService}
            onSave={handleSaveService}
        >
            {/* This dialog is controlled programmatically */}
        </ServiceDialog>
    </div>
  );
}

export default function AdminServicesPage() {
    return (
        <Suspense fallback={<ServicesPageSkeleton />}>
            <AdminServicesPageComponent />
        </Suspense>
    )
}
