
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, getDocs, limit, orderBy, startAfter, endBefore, limitToLast, where, DocumentData, Query } from 'firebase/firestore';
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

const ITEMS_PER_PAGE = 15;

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [firstVisible, setFirstVisible] = useState<DocumentData | null>(null);
  const [isNextPageAvailable, setIsNextPageAvailable] = useState(false);

  const fetchUsers = useCallback(async (direction: 'next' | 'prev' | 'initial' = 'initial') => {
    if (!firestore) return;
    setIsLoading(true);

    try {
      let q: Query = collection(firestore, 'users');

      if (debouncedSearchTerm) {
        q = query(q, where('email', '>=', debouncedSearchTerm), where('email', '<=', debouncedSearchTerm + '\uf8ff'));
      }
      
      q = query(q, orderBy('createdAt', 'desc'));

      if (direction === 'next' && lastVisible) {
          q = query(q, startAfter(lastVisible));
      } else if (direction === 'prev' && firstVisible) {
          q = query(q, endBefore(firstVisible), limitToLast(ITEMS_PER_PAGE));
      }
      
      const limitedQuery = query(q, limit(ITEMS_PER_PAGE + 1));

      const documentSnapshots = await getDocs(limitedQuery);
      
      const newUsers: User[] = [];
      documentSnapshots.docs.slice(0, ITEMS_PER_PAGE).forEach(doc => {
          newUsers.push({ id: doc.id, ...doc.data() } as User);
      });

      if (direction === 'initial' && newUsers.length === 0) {
        setPage(1);
      }

      setUsers(newUsers);
      setIsNextPageAvailable(documentSnapshots.docs.length > ITEMS_PER_PAGE);

      setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length > 1 ? documentSnapshots.docs.length - 2 : 0]);
      setFirstVisible(documentSnapshots.docs[0]);
      
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({ variant: 'destructive', title: t('error'), description: t('adminUsers.fetchError') });
    } finally {
      setIsLoading(false);
    }
  }, [firestore, toast, t, debouncedSearchTerm, lastVisible, firstVisible]);

  useEffect(() => {
    setPage(1);
    setLastVisible(null);
    setFirstVisible(null);
    fetchUsers('initial');
  }, [debouncedSearchTerm, firestore]);

  const handleNextPage = () => {
    if (isNextPageAvailable) {
      setPage(p => p + 1);
      fetchUsers('next');
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(p => p - 1);
      fetchUsers('prev');
    }
  };


  const renderContent = () => {
     if (isLoading) {
      return Array.from({length: 10}).map((_, i) => (
         <TableRow key={i}>
            {Array.from({length: 8}).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
         </TableRow>
      ));
    }
    
    if (!users || users.length === 0) {
        return (
            <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">{t('adminUsers.noMatch')}</TableCell>
            </TableRow>
        );
    }

    return users.map((user) => (
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
            <EditUserDialog user={user} onUserUpdate={() => fetchUsers('initial')}>
                <Button variant="outline" size="sm">{t('edit')}</Button>
            </EditUserDialog>
        </TableCell>
      </TableRow>
    ));
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
        </CardHeader>
        <CardContent>
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
              {renderContent()}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('page')} {page}</span>
            <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={handlePrevPage} disabled={page <= 1 || isLoading}>
                    <ChevronRight className="h-4 w-4 rtl:hidden" />
                    <ChevronLeft className="h-4 w-4 ltr:hidden" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleNextPage} disabled={!isNextPageAvailable || isLoading}>
                    <ChevronLeft className="h-4 w-4 rtl:hidden" />
                    <ChevronRight className="h-4 w-4 ltr:hidden" />
                </Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
