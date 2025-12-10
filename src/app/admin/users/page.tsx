

'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, doc, runTransaction } from 'firebase/firestore';
import type { User } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

function EditUserDialog({ user }: { user: User }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState(user.balance.toString());
  const [adBalance, setAdBalance] = useState(user.adBalance.toString());
  const [rank, setRank] = useState(user.rank);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;

    setIsSaving(true);
    try {
        const userDocRef = doc(firestore, 'users', user.id);
        await runTransaction(firestore, async (transaction) => {
            transaction.update(userDocRef, {
                balance: parseFloat(balance),
                adBalance: parseFloat(adBalance),
                rank: rank,
            });
        });
        toast({ title: 'نجاح', description: 'تم تحديث بيانات المستخدم بنجاح.' });
        setOpen(false);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
        setIsSaving(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">تعديل</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تعديل المستخدم: {user.name}</DialogTitle>
          <DialogDescription>
            تغيير الرصيد والرتبة للمستخدم. كن حذراً عند إجراء التعديلات.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="balance">الرصيد الأساسي</Label>
            <Input id="balance" type="number" value={balance} onChange={e => setBalance(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adBalance">رصيد الإعلانات</Label>
            <Input id="adBalance" type="number" value={adBalance} onChange={e => setAdBalance(e.target.value)} />
          </div>
           <div className="space-y-2">
            <Label htmlFor="rank">الرتبة</Label>
            <Input id="rank" value={rank} onChange={e => setRank(e.target.value as User['rank'])} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin" /> : 'حفظ التغييرات'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


export default function AdminUsersPage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const usersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  const { data: allUsers, isLoading } = useCollection<User>(usersQuery);

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
            {Array.from({length: 6}).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
         </TableRow>
      ));
    }
    
    return filteredUsers.map((user) => (
      <TableRow key={user.id}>
        <TableCell>
          <div className="font-medium">{user.name}</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
        </TableCell>
        <TableCell><Badge variant="secondary">{user.rank}</Badge></TableCell>
        <TableCell className="font-medium">${(user.balance ?? 0).toFixed(2)}</TableCell>
        <TableCell>${(user.totalSpent ?? 0).toFixed(2)}</TableCell>
        <TableCell>{new Date(user.createdAt).toLocaleDateString('ar-EG')}</TableCell>
        <TableCell className="text-right">
          <EditUserDialog user={user} />
        </TableCell>
      </TableRow>
    ));
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">إدارة المستخدمين</h1>
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
