
'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get('page')) || 1;
  const currentSearch = searchParams.get('search') || '';
  
  const [debouncedSearch] = useDebounce(currentSearch, 300);

  const usersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );
  const { data: allUsers, isLoading, forceCollectionUpdate } = useCollection<User>(usersQuery);

  const { paginatedUsers, pageCount } = useMemo(() => {
    if (!allUsers) {
      return { paginatedUsers: [], pageCount: 0 };
    }
    const filtered = allUsers.filter(user => 
        (user.name?.toLowerCase() || '').includes(debouncedSearch.toLowerCase()) || 
        (user.email?.toLowerCase() || '').includes(debouncedSearch.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    
    return {
      paginatedUsers: filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE),
      pageCount: totalPages,
    };
  }, [allUsers, debouncedSearch, currentPage]);


  const handleFilterChange = (key: 'search' | 'page', value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== 'page') {
      params.set('page', '1');
    }
    router.replace(`${pathname}?${params.toString()}`);
  };
  
   const renderPaginationItems = () => {
    if (pageCount <= 1) return null;
    
    const pageNumbers: (number | 'ellipsis')[] = [];
    if (pageCount <= 5) {
      for (let i = 1; i <= pageCount; i++) pageNumbers.push(i);
    } else {
      pageNumbers.push(1);
      if (currentPage > 3) pageNumbers.push('ellipsis');
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(pageCount - 1, currentPage + 1);

      if(currentPage <= 2) end = 3;
      if(currentPage >= pageCount - 1) start = pageCount - 2;

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


  if (isLoading && !allUsers) {
    return <UsersPageSkeleton />;
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">{t('adminUsers.title')}</h1>
        <p className="text-muted-foreground">
          {t('adminUsers.description')}
        </p>
      </div>

       <Card>
        <CardHeader>
          <div className="relative">
              <Search className="absolute right-3 rtl:left-3 rtl:right-auto top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('adminUsers.searchPlaceholder')}
                className="pe-10 rtl:ps-10"
                value={currentSearch}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
        </CardHeader>
        <CardContent className="p-0">
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('adminUsers.table.user')}</TableHead>
                <TableHead>{t('adminUsers.table.role')}</TableHead>
                <TableHead>{t('adminUsers.table.rank')}</TableHead>
                <TableHead>{t('adminUsers.table.balance')}</TableHead>
                <TableHead>{t('adminUsers.table.adBalance')}</TableHead>
                <TableHead>{t('adminUsers.table.totalSpent')}</TableHead>
                <TableHead>{t('adminUsers.table.joinDate')}</TableHead>
                <TableHead className="text-right">{t('adminUsers.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedUsers.length > 0 ? paginatedUsers.map((user) => (
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
                        {t(`roles.${user.role || 'user'}`)}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <Badge variant="secondary">{t(`ranks.${user.rank}`)}</Badge>
                    </TableCell>
                    <TableCell>${(user.balance ?? 0).toFixed(2)}</TableCell>
                    <TableCell>${(user.adBalance ?? 0).toFixed(2)}</TableCell>
                    <TableCell>${(user.totalSpent ?? 0).toFixed(2)}</TableCell>
                    <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                        <EditUserDialog user={user} onUserUpdate={forceCollectionUpdate}>
                            <Button variant="outline" size="sm">{t('edit')}</Button>
                        </EditUserDialog>
                    </TableCell>
                  </TableRow>
                )) : (
                     <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">{t('adminUsers.noMatch')}</TableCell>
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
