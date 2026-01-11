

'use client';

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, getDocs, limit, startAfter, endBefore, limitToLast, DocumentData, where, Query } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Shield, ListFilter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { EditUserDialog } from './_components/edit-user-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 15;


function TableSkeleton() {
    return (
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
    );
}


function AdminUsersPageComponent() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get('page')) || 1;
  const currentSearch = searchParams.get('search') || '';
  
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageMarkers, setPageMarkers] = useState<(DocumentData | null)[]>([null]);
  
  const fetchUsers = useCallback(async (page: number, direction: 'next' | 'prev' | 'current') => {
    if (!firestore) return;
    setIsLoading(true);

    try {
        let q: Query = collection(firestore, 'users');

        if (currentSearch) {
             q = query(q, where('email', '>=', currentSearch), where('email', '<=', currentSearch + '\uf8ff'));
        }

        q = query(q, orderBy('email', 'asc'));

        if (direction === 'next' && page > 1 && pageMarkers[page-1]) {
            q = query(q, startAfter(pageMarkers[page-1]));
        }
        
        q = query(q, limit(ITEMS_PER_PAGE));
        
        const snapshot = await getDocs(q);
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(usersData);
        
        if (snapshot.docs.length > 0) {
            const lastVisible = snapshot.docs[snapshot.docs.length - 1];
            setPageMarkers(prev => {
                const newMarkers = [...prev];
                newMarkers[page] = lastVisible;
                return newMarkers;
            });
        }
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: "خطأ في الاستعلام", description: 'لا يمكن جلب المستخدمين. قد يتطلب هذا البحث إنشاء فهرس مركب في Firestore. تحقق من سجلات الأخطاء للحصول على رابط الإنشاء.'})
    } finally {
        setIsLoading(false);
    }
  }, [firestore, toast, currentSearch, pageMarkers]);
  
  useEffect(() => {
    fetchUsers(1, 'current');
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSearch]); 

  const handlePageChange = (newPage: number) => {
    const direction = newPage > currentPage ? 'next' : 'prev';
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.replace(`${pathname}?${params.toString()}`);
    fetchUsers(newPage, direction);
  };
  
  const handleFilterChange = (key: 'search', value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.replace(`${pathname}?${params.toString()}`);
  };

  const UserCard = ({ user }: { user: User }) => (
    <Card>
        <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
                <CardTitle className="text-base">{user.name}</CardTitle>
            </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
                <span className="text-muted-foreground">الرتبة</span>
                <Badge variant="secondary">{user.rank}</Badge>
            </div>
            <div className="flex justify-between">
                <span className="text-muted-foreground">الرصيد</span>
                <span className="font-semibold">${(user.balance ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-muted-foreground">رصيد الإعلانات</span>
                <span className="font-semibold">${(user.adBalance ?? 0).toFixed(2)}</span>
            </div>
        </CardContent>
        <CardFooter>
            <EditUserDialog user={user} onUserUpdate={() => fetchUsers(currentPage, 'current')}>
                <Button variant="outline" size="sm" className="w-full">تعديل</Button>
            </EditUserDialog>
        </CardFooter>
    </Card>
  );
  

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">إدارة المستخدمين</h1>
        <p className="text-muted-foreground">
          عرض وتعديل بيانات المستخدمين في النظام.
        </p>
      </div>

       <Card>
        <CardHeader>
          <div className="relative">
              <Search className="absolute right-3 rtl:left-3 rtl:right-auto top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالاسم، البريد الإلكتروني، أو المعرف..."
                className="pe-10 rtl:ps-10"
                defaultValue={currentSearch}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
        </CardHeader>
       </Card>

       {isLoading ? (
         <Card>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <TableSkeleton />
                </div>
            </CardContent>
          </Card>
       ) : users.length > 0 ? (
         <>
            {/* Mobile View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-4">
                {users.map((user) => <UserCard key={user.id} user={user} />)}
            </div>

            {/* Desktop View */}
            <Card className="hidden md:block">
              <CardContent className="p-0">
                  <div className="overflow-x-auto">
                      <Table>
                          <TableHeader>
                          <TableRow>
                              <TableHead>المستخدم</TableHead>
                              <TableHead>الدور</TableHead>
                              <TableHead>الرتبة</TableHead>
                              <TableHead>الرصيد</TableHead>
                              <TableHead>رصيد الإعلانات</TableHead>
                              <TableHead>إجمالي الإنفاق</TableHead>
                              <TableHead>تاريخ الانضمام</TableHead>
                              <TableHead className="text-right">إجراءات</TableHead>
                          </TableRow>
                          </TableHeader>
                          <TableBody>
                              {users.map((user) => (
                              <TableRow key={user.id}>
                                  <TableCell>
                                  <div className="flex items-center gap-3">
                                      <Avatar className="h-9 w-9">
                                          <AvatarImage src={user.avatarUrl} alt={user.name} />
                                          <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                          <div className="font-medium">{user.name}</div>
                                          <div className="text-sm text-muted-foreground">{user.email}</div>
                                      </div>
                                  </div>
                                  </TableCell>
                                  <TableCell>
                                      <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                                      {user.role === 'admin' ? <Shield className="w-3 h-3 me-1" /> : null}
                                      {user.role || 'user'}
                                      </Badge>
                                  </TableCell>
                                  <TableCell>
                                      <Badge variant="secondary">{user.rank}</Badge>
                                  </TableCell>
                                  <TableCell>${(user.balance ?? 0).toFixed(2)}</TableCell>
                                  <TableCell>${(user.adBalance ?? 0).toFixed(2)}</TableCell>
                                  <TableCell>${(user.totalSpent ?? 0).toFixed(2)}</TableCell>
                                  <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-EG') : 'N/A'}</TableCell>
                                  <TableCell className="text-right">
                                      <EditUserDialog user={user} onUserUpdate={() => fetchUsers(currentPage, 'current')}>
                                          <Button variant="outline" size="sm">تعديل</Button>
                                      </EditUserDialog>
                                  </TableCell>
                              </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  </div>
              </CardContent>
            </Card>
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} disabled={currentPage === 1}/>
                    </PaginationItem>
                     <PaginationItem>
                        <span className="p-2 text-sm">صفحة {currentPage}</span>
                    </PaginationItem>
                    <PaginationItem>
                        <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} disabled={users.length < ITEMS_PER_PAGE} />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </>
       ) : (
          <Card className="flex flex-col items-center justify-center py-20 text-center">
            <CardHeader>
                <div className="mx-auto bg-muted p-4 rounded-full">
                    <ListFilter className="h-12 w-12 text-muted-foreground" />
                </div>
                <CardTitle className="mt-4 font-headline text-2xl">لا يوجد مستخدمون يطابقون بحثك</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    حاول تغيير كلمات البحث.
                </p>
                <Button variant="outline" onClick={() => router.replace(pathname)} className="mt-4">
                  إعادة تعيين الفلاتر
                </Button>
            </CardContent>
          </Card>
       )}
    </div>
  );
}


export default function AdminUsersPage() {
    return (
        <Suspense fallback={
            <div className="space-y-6 pb-8">
                <div>
                    <Skeleton className="h-9 w-1/3" />
                    <Skeleton className="h-5 w-2/3 mt-2" />
                </div>
                <Card>
                    <CardHeader><Skeleton className="h-10 w-full" /></CardHeader>
                </Card>
                <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <TableSkeleton />
                      </div>
                    </CardContent>
                </Card>
            </div>
        }>
            <AdminUsersPageComponent />
        </Suspense>
    )
}
