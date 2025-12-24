'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, orderBy, where, getDocs, limit, startAfter, endBefore, limitToLast, DocumentData, Query, DocumentSnapshot,getCountFromServer, and, or } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { EditUserDialog } from './_components/edit-user-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';

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
  const [pageCount, setPageCount] = useState(0);
  const [firstDoc, setFirstDoc] = useState<DocumentSnapshot | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  
  const fetchUsers = useCallback(async (page: number, searchTerm: string, direction: 'next' | 'prev' | 'none' = 'none') => {
    if (!firestore) return;
    setIsLoading(true);

    try {
        let baseQuery: Query;
        if (searchTerm) {
            // Firestore doesn't support full-text search on multiple fields natively with case-insensitivity.
            // This is a workaround that searches for an exact match on email, which is more likely to be unique.
            // A more robust solution would use a dedicated search service like Algolia or Typesense.
             baseQuery = query(collection(firestore, 'users'), where('email', '>=', searchTerm), where('email', '<=', searchTerm + '\uf8ff'));
        } else {
            baseQuery = query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
        }

        const countQuery = baseQuery; // Use the same base query for counting
        const totalUsersSnapshot = await getCountFromServer(countQuery);
        const totalUsers = totalUsersSnapshot.data().count;
        setPageCount(Math.ceil(totalUsers / ITEMS_PER_PAGE));
        
        let finalQuery = baseQuery;
        if (direction === 'next' && lastDoc) {
          finalQuery = query(baseQuery, startAfter(lastDoc), limit(ITEMS_PER_PAGE));
        } else if (direction === 'prev' && firstDoc) {
          finalQuery = query(baseQuery, endBefore(firstDoc), limitToLast(ITEMS_PER_PAGE));
        } else {
          // For initial load or direct page jumps (simplified)
           if (page > 1 && !searchTerm) { // Pagination without cursors is complex with variable queries, simplifying for non-search
               // This is a simplification and might not be perfectly accurate on direct page jumps with search.
               // A full cursor-based pagination would require storing cursors for every page.
           }
           finalQuery = query(baseQuery, limit(ITEMS_PER_PAGE));
        }

        const snapshot = await getDocs(finalQuery);
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        
        setUsers(usersData);
        setFirstDoc(snapshot.docs[0] || null);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);

    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch users.' });
    } finally {
        setIsLoading(false);
    }
  }, [firestore, toast, lastDoc, firstDoc]);


  useEffect(() => {
    fetchUsers(currentPage, currentSearch);
  }, [currentSearch, currentPage]);


  const handleFilterChange = (key: 'search' | 'page', value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const direction = key === 'page' ? (Number(value) > currentPage ? 'next' : 'prev') : 'none';
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
     if (key === 'search') {
      params.set('page', '1');
    }
    router.replace(`${pathname}?${params.toString()}`);
    // The useEffect will trigger the fetch
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


  if (isLoading && users.length === 0) {
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
            <EditUserDialog user={user} onUserUpdate={() => fetchUsers(currentPage, currentSearch)}>
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
          <CardTitle>بحث وتعديل المستخدمين</CardTitle>
          <CardDescription>
            ابحث بالبريد الإلكتروني لتعديل بيانات المستخدم.
          </CardDescription>
          <div className="relative pt-4">
              <Search className="absolute right-3 rtl:left-3 rtl:right-auto top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالبريد الإلكتروني..."
                className="pe-10 rtl:ps-10"
                value={currentSearch}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
            {isLoading ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                     {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-60" />)}
                 </div>
            ) : users.length > 0 ? (
                <>
                    {/* Mobile View */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-4 p-4">
                         {users.map((user) => <UserCard key={user.id} user={user} />)}
                    </div>
                    {/* Desktop View */}
                    <div className="hidden md:block">
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
                                        <EditUserDialog user={user} onUserUpdate={() => fetchUsers(currentPage, currentSearch)}>
                                            <Button variant="outline" size="sm">تعديل</Button>
                                        </EditUserDialog>
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                 </>
            ) : (
                <div className="h-24 text-center flex items-center justify-center text-muted-foreground">لم يتم العثور على مستخدمين يطابقون هذا البحث.</div>
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

    