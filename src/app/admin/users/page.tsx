
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useFirestore, useCollection, useMemoFirebase, FirestorePermissionError, errorEmitter } from '@/firebase';
import { collection, query, doc, runTransaction, updateDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const RANKS: User['rank'][] = ['مستكشف نجمي', 'قائد صاروخي', 'سيد المجرة', 'سيد كوني'];

function EditUserDialog({ user, children, onUserUpdate }: { user: User, children: React.ReactNode, onUserUpdate: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [balance, setBalance] = useState(String(user.balance ?? 0));
    const [adBalance, setAdBalance] = useState(String(user.adBalance ?? 0));
    const [rank, setRank] = useState(user.rank);

    const handleSave = async () => {
        if (!firestore) return;
        setIsSaving(true);
        const userDocRef = doc(firestore, 'users', user.id);
        const balanceValue = parseFloat(balance);
        const adBalanceValue = parseFloat(adBalance);

        if (isNaN(balanceValue) || isNaN(adBalanceValue)) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء إدخال قيم رصيد صالحة.' });
            setIsSaving(false);
            return;
        }

        const updateData = {
            balance: balanceValue,
            adBalance: adBalanceValue,
            rank: rank,
        };

        try {
            await updateDoc(userDocRef, updateData);
            toast({ title: 'نجاح', description: 'تم تحديث بيانات المستخدم.' });
            onUserUpdate();
            setOpen(false);
        } catch (error) {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: updateData,
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تحديث المستخدم بسبب خطأ في الصلاحيات.' });
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>تعديل المستخدم: {user.name}</DialogTitle>
                    <DialogDescription>{user.email}</DialogDescription>
                </DialogHeader>
                 <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="balance">الرصيد</Label>
                        <Input id="balance" type="number" value={balance} onChange={(e) => setBalance(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="adBalance">رصيد الإعلانات</Label>
                        <Input id="adBalance" type="number" value={adBalance} onChange={(e) => setAdBalance(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="rank">الرتبة</Label>
                        <Select value={rank} onValueChange={(value) => setRank(value as User['rank'])}>
                            <SelectTrigger id="rank"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {RANKS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="animate-spin" /> : 'حفظ التغييرات'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function AdminUsersPage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const usersQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'users')) : null), [firestore]);
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
            {Array.from({length: 7}).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
         </TableRow>
      ));
    }
    
    if (!filteredUsers || filteredUsers.length === 0) {
        return (
            <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">لا يوجد مستخدمون يطابقون بحثك.</TableCell>
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
            <Badge variant="secondary">{user.rank}</Badge>
        </TableCell>
        <TableCell>${(user.balance ?? 0).toFixed(2)}</TableCell>
        <TableCell>${(user.adBalance ?? 0).toFixed(2)}</TableCell>
        <TableCell>${(user.totalSpent ?? 0).toFixed(2)}</TableCell>
        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
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
