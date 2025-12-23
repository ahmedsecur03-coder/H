
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, getDocs, limit, orderBy, startAfter, endBefore, limitToLast, where, DocumentData, Query, getCountFromServer } from 'firebase/firestore';
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

const ITEMS_PER_PAGE = 15;

export default function AdminUsersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [pageCursors, setPageCursors] = useState<(DocumentData | null)[]>([null]); // Array to store cursors for each page start

  const fetchUsers = useCallback(async (newPage: number) => {
    if (!firestore) return;
    setIsLoading(true);

    try {
        let q: Query = collection(firestore, 'users');

        // Note: Firestore doesn't support case-insensitive search or searching across multiple fields with OR.
        // We will do a basic prefix search on email which is a common use case.
        if (debouncedSearchTerm) {
             q = query(q, where('email', '>=', debouncedSearchTerm), where('email', '<=', debouncedSearchTerm + '\uf8ff'));
        }

        q = query(q, orderBy('email', 'desc'));

        if (newPage > page && pageCursors[page]) {
            q = query(q, startAfter(pageCursors[page]));
        } else if (newPage < page && pageCursors[newPage - 1]) {
            // This is tricky without knowing the exact previous cursor. A full-featured pagination would require more state.
            // For simplicity, we'll reset and go to the target page. This is a simplification for this context.
            let tempQuery = query(collection(firestore, 'users'), orderBy('email', 'desc'));
             if (debouncedSearchTerm) {
                tempQuery = query(tempQuery, where('email', '>=', debouncedSearchTerm), where('email', '<=', debouncedSearchTerm + '\uf8ff'));
            }
            if (newPage > 1) {
                 tempQuery = query(tempQuery, limit((newPage - 1) * ITEMS_PER_PAGE));
                 const prevDocs = await getDocs(tempQuery);
                 const lastPrevDoc = prevDocs.docs[prevDocs.docs.length - 1];
                 q = query(q, startAfter(lastPrevDoc));
            }
        }
        
        q = query(q, limit(ITEMS_PER_PAGE));

        const documentSnapshots = await getDocs(q);
        const newUsers: User[] = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));

        setUsers(newUsers);

        if (documentSnapshots.docs.length > 0) {
            const newCursors = [...pageCursors];
            newCursors[newPage] = documentSnapshots.docs[documentSnapshots.docs.length - 1];
            setPageCursors(newCursors);
        }
        
        setPage(newPage);

    } catch (error) {
        console.error("Error fetching users:", error);
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب المستخدمين.' });
    } finally {
        setIsLoading(false);
    }
  }, [firestore, toast, debouncedSearchTerm, page, pageCursors]);

  useEffect(() => {
    // Reset and fetch when search term changes
    setPage(1);
    setPageCursors([null]);
    fetchUsers(1);
  }, [debouncedSearchTerm, firestore]);

  const handleManualFetch = () => {
    setPage(1);
    setPageCursors([null]);
    fetchUsers(1);
  }

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
                <TableCell colSpan={8} className="h-24 text-center">لا يوجد مستخدمون يطابقون بحثك.</TableCell>
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
            <EditUserDialog user={user} onUserUpdate={handleManualFetch}>
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
                placeholder="ابحث بالبريد الإلكتروني..."
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
            <span className="text-sm text-muted-foreground">صفحة {page}</span>
            <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => fetchUsers(page - 1)} disabled={page <= 1}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => fetchUsers(page + 1)} disabled={users.length < ITEMS_PER_PAGE}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
