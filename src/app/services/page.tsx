
'use client';
import { useMemo, useState, useEffect } from 'react';
import type { Service, ServicePrice } from '@/lib/types';
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
import { useServices } from '@/hooks/useServices';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

const PROFIT_MARGIN = 1.50; // 50% profit margin
const ITEMS_PER_PAGE = 20;

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
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
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
  const { services: allServices, isLoading } = useServices();
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const { platforms, categories, filteredServices, pageCount } = useMemo(() => {
    if (!allServices) {
      return { platforms: [], categories: [], filteredServices: [], pageCount: 0 };
    }

    const platforms = [...new Set(allServices.map(s => s.platform))];
    const availableCategories = platformFilter === 'all' 
      ? [...new Set(allServices.map(s => s.category))]
      : [...new Set(allServices.filter(s => s.platform === platformFilter).map(s => s.category))];

    const filtered = allServices.filter(service => {
      const searchMatch =
        searchTerm === '' ||
        service.id.toString().includes(searchTerm) ||
        service.category.toLowerCase().includes(searchTerm.toLowerCase());
      const platformMatch = platformFilter === 'all' || service.platform === platformFilter;
      const categoryMatch = categoryFilter === 'all' || service.category === categoryFilter;
      return searchMatch && platformMatch && categoryMatch;
    });

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return { platforms, categories: availableCategories, filteredServices: paginated, pageCount: totalPages };
  }, [allServices, searchTerm, platformFilter, categoryFilter, currentPage]);

  const [selectedService, setSelectedService] = useState<Service | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, platformFilter, categoryFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  }

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
                <PaginationLink href="#" isActive={currentPage === page} onClick={(e) => { e.preventDefault(); handlePageChange(page as number); }}>{page}</PaginationLink>
            )}
        </PaginationItem>
    ));
  };


  if (isLoading) {
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
          <Select value={platformFilter} onValueChange={(value) => { setPlatformFilter(value); setCategoryFilter('all'); }}>
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
              {filteredServices.length > 0 ? filteredServices.map(service => (
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
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    لا توجد خدمات تطابق بحثك.
                  </TableCell>
                </TableRow>
              )}
              </TableBody>
          </Table>
          </CardContent>
          {pageCount > 1 && (
            <CardFooter className="justify-center border-t pt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} disabled={currentPage === 1} />
                  </PaginationItem>
                  {renderPaginationItems()}
                  <PaginationItem>
                    <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} disabled={currentPage === pageCount} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </CardFooter>
          )}
      </Card>
    </div>
  );
}
