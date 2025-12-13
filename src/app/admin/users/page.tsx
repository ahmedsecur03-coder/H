
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { EditUserDialog } from './_components/edit-user-dialog';

export default function AdminUsersPage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  // Corrected and simplified query definition
  const usersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users')) : null),
    [firestore]
  );
  
  const { data: allUsers, isLoading, forceCollectionUpdate } = useCollection<User>(usersQuery);

  const filteredUsers = useMemo(() => {
    if (!allUsers) return [];
    if (!searchTerm) return allUsers;

    const lowerCaseSearch = searchTerm.toLowerCase();
    return allUsers.filter(user => 
        (user.name && user.name.toLowerCase().includes(lowerCaseSearch)) ||
        (user.email && user.email.toLowerCase().includes(lowerCaseSearch)) ||
        user.id.toLowerCase().includes(lowerCaseSearch)
    );
  }, [allUsers, searchTerm]);
  
  const renderContent = () => {
     if (isLoading) {
      return Array.from({length: 5}).map((_, i) => (
         <TableRow key={i}>
            {Array.from({length: 8}).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
         </TableRow>
      ));
    }
    
    if (!filteredUsers || filteredUsers.length === 0) {
        return (
            <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">لا يوجد مستخدمون يطابقون بحثك.</TableCell>
            </TableRow>
        );
    }

    return filteredUsers.map((user) => (
      <TableRow key={user.id}>
        <TableCell>
          <div className="font-medium">{user.name}</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
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
            <EditUserDialog user={user} onUserUpdate={forceCollectionUpdate}>
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
      </Card>
    </div>
  );
}
