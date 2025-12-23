
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, getDocs, limit, orderBy, startAfter, DocumentData, Query } from 'firebase/firestore';
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

const ITEMS_PER_PAGE = 25;

export default function AdminUsersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [paginatedUsers, setPaginatedUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [page, setPage] = useState(1);
  const [isLastPage, setIsLastPage] = useState(false);

  // Memoize this function
  const fetchUsers = useMemo(() => async (direction: 'next' | 'initial' = 'initial') => {
    if (!firestore) return;
    setIsLoading(true);

    try {
        let q: Query = query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));

        if (direction === 'next' && lastVisible) {
            q = query(q, startAfter(lastVisible));
        }
        
        q = query(q, limit(ITEMS_PER_PAGE));

        const documentSnapshots = await getDocs(q);
        const newUsers: User[] = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));

        if (newUsers.length === 0 && direction === 'next') {
            toast({ title: "هذه هي الصفحة الأخيرة." });
            setIsLastPage(true);
            setIsLoading(false);
            return;
        }

        setAllUsers(prev => direction === 'initial' ? newUsers : [...prev, ...newUsers]);
        setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
        
        if (direction === 'initial') {
            setPage(1);
        }

        setIsLastPage(newUsers.length < ITEMS_PER_PAGE);

    } catch (error) {
        console.error("Error fetching users:", error);
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب المستخدمين.' });
    } finally {
        setIsLoading(false);
    }
  }, [firestore, toast, lastVisible]);


  useEffect(() => {
    fetchUsers('initial');
  }, [firestore]); // Only refetch if firestore instance changes

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return allUsers;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return allUsers.filter(user => 
        (user.name && user.name.toLowerCase().includes(lowerCaseSearch)) ||
        (user.email && user.email.toLowerCase().includes(lowerCaseSearch)) ||
        user.id.toLowerCase().includes(lowerCaseSearch)
    );
  }, [allUsers, searchTerm]);
  
  // Since we are fetching all users and then filtering, pagination should be on the filtered list
  const currentUsers = useMemo(() => {
     const startIndex = (page - 1) * ITEMS_PER_PAGE;
     return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredUsers, page]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage > page && newPage > totalPages && !isLastPage) {
        // We need to fetch more data
        fetchUsers('next');
    }
    setPage(newPage);
  }

  const renderContent = () => {
     if (isLoading && page === 1) {
      return Array.from({length: 10}).map((_, i) => (
         <TableRow key={i}>
            {Array.from({length: 8}).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
         </TableRow>
      ));
    }
    
    if (!currentUsers || currentUsers.length === 0) {
        return (
            <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">لا يوجد مستخدمون يطابقون بحثك.</TableCell>
            </TableRow>
        );
    }

    return currentUsers.map((user) => (
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
              {user.role === 'admin' ? <Shield className="w-3 h-3 ml-1" /> : null}
              {user.role || 'user'}
            </Badge>
        </TableCell>
        <TableCell>
            <Badge variant="secondary">{user.rank}</Badge>
        </TableCell>
        <TableCell>${(user.balance ?? 0).toFixed(2)}</TableCell>
        <TableCell>${(user.adBalance ?? 0).toFixed(2)}</TableCell>
        <TableCell>${(user.totalSpent ?? 0).toFixed(2)}</TableCell>
        <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'غير متوفر'}</TableCell>
        <TableCell className="text-right">
            <EditUserDialog user={user} onUserUpdate={() => fetchUsers('initial')}>
                <Button variant="outline" size="sm">تعديل</Button>
            </EditUserDialog>
        </TableCell>
      </TableRow>
    ));
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">إدارة المستخدمين</h1>
        <p className="text-muted-foreground">
          عرض وتعديل بيانات المستخدمين في المنصة.
        </p>
      </div>

       <Card>
        <CardHeader>
          <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالاسم، البريد الإلكتروني، أو المعرف..."
                className="pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
        </CardHeader>
        <CardContent>
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
              {renderContent()}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">صفحة {page} من {totalPages > 0 ? totalPages : 1}</span>
            <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => handlePageChange(page - 1)} disabled={page <= 1}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
