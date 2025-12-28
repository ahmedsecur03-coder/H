
'use client';

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, orderBy, getDocs, limit, startAfter, Query as FirestoreQuery, where, getCountFromServer } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
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
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import Link from 'next/link';

const ITEMS_PER_PAGE = 15;

function UsersPageSkeleton() {
    return (
        <div className="space-y-6 pb-8">
            <div>
                <Skeleton className="h-9 w-1/3" />
                <Skeleton className="h-5 w-2/3 mt-2" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-10 w-full" />
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
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
                    </div>
                </CardContent>
                <CardFooter className="justify-center border-t pt-4">
                    <Skeleton className="h-9 w-64" />
                </CardFooter>
            </Card>
        </div>
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
  
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchUsers = useCallback(async () => {
    if (!firestore) return;
    setIsLoading(true);

    try {
        const usersQuery = query(collection(firestore, 'users'));
        const snapshot = await getDocs(usersQuery);
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        // Sort client-side
        usersData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAllUsers(usersData);
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch users.' });
    } finally {
        setIsLoading(false);
    }
  }, [firestore, toast]);


  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  const { paginatedUsers, pageCount } = useMemo(() => {
    if (!allUsers) return { paginatedUsers: [], pageCount: 0 };
    
    const filtered = allUsers.filter(user => 
        currentSearch
        ? user.email?.toLowerCase().includes(currentSearch.toLowerCase()) || 
          user.name?.toLowerCase().includes(currentSearch.toLowerCase()) ||
          user.id.toLowerCase().includes(currentSearch.toLowerCase())
        : true
    );

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return { paginatedUsers: paginated, pageCount: totalPages };
  }, [allUsers, currentSearch, currentPage]);


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


  if (isLoading && allUsers.length === 0) {
    return <UsersPageSkeleton />;
  }

    const UserCard = ({ user }: { user: User }) => (
    <Card>
        <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
                <CardTitle className="text-base">{user.name}</CardTitle>
                <CardDescription className="text-xs">{user.email}</CardDescription>
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
            <EditUserDialog user={user} onUserUpdate={() => fetchUsers()}>
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
                value={currentSearch}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
        </CardHeader>
       </Card>

       {isLoading && paginatedUsers.length === 0 ? (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
           {Array.from({length: 8}).map((_, i) => <Skeleton key={i} className="h-64" />)}
         </div>
       ) : paginatedUsers.length > 0 ? (
         <>
            {/* Mobile View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-4">
                {paginatedUsers.map((user) => <UserCard key={user.id} user={user} />)}
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
                              {paginatedUsers.map((user) => (
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
                                      <EditUserDialog user={user} onUserUpdate={() => fetchUsers()}>
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
            {pageCount > 1 && (
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
            )}
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
        <Suspense fallback={<UsersPageSkeleton />}>
            <AdminUsersPageComponent />
        </Suspense>
    )
}
