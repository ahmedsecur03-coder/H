
'use client';

import { useState, useMemo, useCallback, useEffect, Suspense } from 'react';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { Service } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Upload, ListFilter, Pencil, CheckCircle, XCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ServiceDialog } from './_components/service-dialog';
import { ImportDialog } from './_components/import-dialog';
import { Badge } from '@/components/ui/badge';
import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { useServices } from '@/hooks/useServices';


const ITEMS_PER_PAGE = 25;
const PROFIT_MARGIN = 1.50; // 50% profit margin

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
                            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
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
  
  const { services: allServices, isLoading } = useServices();

  const fetchServiceData = useCallback(() => {
    // This function is now a placeholder as useServices handles fetching.
    // It can be used to trigger a re-fetch if useServices is updated to support it.
  }, []);

  useEffect(() => {
    // Data is fetched by the hook, no need for manual fetch here.
  }, []);

  const { paginatedServices, pageCount } = useMemo(() => {
    if (!allServices) {
        return { paginatedServices: [], pageCount: 0 };
    }
    const filtered = allServices.filter(service =>
        !currentSearch ||
        String(service.id).includes(currentSearch) ||
        service.category.toLowerCase().includes(currentSearch.toLowerCase()) ||
        service.platform.toLowerCase().includes(currentSearch.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return { paginatedServices: paginated, pageCount: totalPages };
  }, [allServices, currentSearch, currentPage]);

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

    const priceDocRef = doc(firestore, 'servicePrices', String(selectedService.id));
    
    toast({ title: 'جاري حفظ السعر...' });

    updateDoc(priceDocRef, data)
    .then(() => {
        toast({ title: 'نجاح', description: 'تم تحديث سعر الخدمة بنجاح.' });
        fetchServiceData(); 
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

  const handleOpenDialog = (service?: Service) => {
      setSelectedService(service);
      setIsDialogOpen(true);
  }
  
  if (isLoading) {
    return <ServicesPageSkeleton />;
  }

  const renderContent = () => {
    if (paginatedServices.length === 0) {
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
    return paginatedServices.map(service => (
      <TableRow key={service.id}>
          <TableCell className="font-mono text-xs">{service.id}</TableCell>
          <TableCell>{service.category}</TableCell>
          <TableCell>{service.platform}</TableCell>
          <TableCell>${(service.price * PROFIT_MARGIN).toFixed(4)}</TableCell>
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
          <div className="overflow-x-auto">
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
