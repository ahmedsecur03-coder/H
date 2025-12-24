'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, getDocs, limit, startAfter, endBefore, limitToLast, DocumentData, Query, DocumentSnapshot } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { EditUserDialog } from './_components/edit-user-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from 'use-debounce';
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

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [firstVisible, setFirstVisible] = useState<DocumentSnapshot | null>(null);
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  
  const currentSearch = searchParams.get('search') || '';
  const [debouncedSearch] = useDebounce(currentSearch, 500);

  const fetchUsers = useCallback(async (direction: 'next' | 'prev' | 'first' = 'first') => {
    if (!firestore) return;
    setIsLoading(true);

    let q: Query = collection(firestore, 'users');
    let isSearchQuery = false;
    
    if (debouncedSearch) {
        // This is a simple prefix search on email, which is more Firestore-friendly.
        q = query(q, 
            orderBy('email'),
            where('email', '>=', debouncedSearch), 
            where('email', '<=', debouncedSearch + '\uf8ff')
        );
        isSearchQuery = true;
    } else {
        q = query(q, orderBy('createdAt', 'desc'));
    }

    if (direction === 'next' && lastVisible) {
        q = query(q, startAfter(lastVisible), limit(ITEMS_PER_PAGE));
    } else if (direction === 'prev' && firstVisible) {
        q = query(q, endBefore(firstVisible), limitToLast(ITEMS_PER_PAGE));
    } else {
         q = query(q, limit(ITEMS_PER_PAGE));
    }

    try {
        const documentSnapshots = await getDocs(q);
        // For search, we still do a client-side filter for name as a fallback
        // since we can't do a compound OR query efficiently.
        let newUsers = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));

        if (isSearchQuery) {
          newUsers = newUsers.filter(u => u.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || u.email.toLowerCase().includes(debouncedSearch.toLowerCase()));
        }

        setUsers(newUsers);
        setFirstVisible(documentSnapshots.docs[0] || null);
        setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1] || null);

        if (direction === 'first') setPage(1);
        else if (direction === 'next') setPage(p => p + 1);
        else if (direction === 'prev' && page > 1) setPage(p => p - 1);

    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch users.' });
    } finally {
        setIsLoading(false);
    }
  }, [firestore, debouncedSearch, lastVisible, firstVisible, page, toast]);

  useEffect(() => {
    fetchUsers('first');
  }, [debouncedSearch]);


  const handleFilterChange = (key: 'search', value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`);
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
          <CardTitle>بحث وتعديل المستخدمين</CardTitle>
          <CardDescription>
            ابحث بالاسم أو البريد الإلكتروني لتعديل بيانات المستخدم.
          </CardDescription>
          <div className="relative pt-4">
              <Search className="absolute right-3 rtl:left-3 rtl:right-auto top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالاسم أو البريد الإلكتروني..."
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
                                        <EditUserDialog user={user} onUserUpdate={() => fetchUsers()}>
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
                <div className="h-24 text-center flex items-center justify-center">لم يتم العثور على مستخدمين.</div>
            )}
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t pt-4">
            <span className="text-sm text-muted-foreground">
                Page {page}
            </span>
            <div className="flex gap-2">
                <Button onClick={() => fetchUsers('prev')} disabled={isLoading || page <= 1} variant="outline">Previous</Button>
                <Button onClick={() => fetchUsers('next')} disabled={isLoading || users.length < ITEMS_PER_PAGE} variant="outline">Next</Button>
            </div>
        </CardFooter>
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
