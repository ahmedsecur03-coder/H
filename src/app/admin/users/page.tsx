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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const RANKS: User['rank'][] = ['مستكشف نجمي', 'قائد صاروخي', 'سيد المجرة', 'سيد كوني'];

// A reusable component for inline editing
function EditableCell({ value, onSave, type = 'text', options }: { value: string | number, onSave: (newValue: string) => Promise<void>, type?: 'text' | 'number' | 'select', options?: readonly string[] }) {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(String(value));
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const handleSave = async () => {
        if (String(value) === currentValue) {
            setIsEditing(false);
            return;
        }
        setIsSaving(true);
        try {
            await onSave(currentValue);
            setIsEditing(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'فشل التحديث', description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                {type === 'select' && options ? (
                    <Select value={currentValue} onValueChange={setCurrentValue}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                    </Select>
                ) : (
                    <Input
                        type={type}
                        value={currentValue}
                        onChange={(e) => setCurrentValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        autoFocus
                        className="h-8"
                    />
                )}
                 {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
        );
    }
    
    return (
        <div onClick={() => setIsEditing(true)} className="cursor-pointer hover:bg-muted/50 p-1 rounded-md min-h-[2rem] flex items-center">
            {type === 'select' ? <Badge variant="secondary">{value}</Badge> : value}
        </div>
    );
}


export default function AdminUsersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const usersQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'users')) : null), [firestore]);
  const { data: allUsers, isLoading, forceCollectionUpdate } = useCollection<User>(usersQuery);

  const handleFieldUpdate = useCallback(async (userId: string, field: keyof User, value: string | number) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', userId);

    const updateData = { [field]: value };

    return updateDoc(userDocRef, updateData)
        .then(() => {
            toast({ title: 'نجاح', description: `تم تحديث ${field} للمستخدم.` });
            forceCollectionUpdate(); // Refresh the data in the table
        })
        .catch(serverError => {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: updateData,
            });
            errorEmitter.emit('permission-error', permissionError);
            throw new Error('فشل التحديث بسبب الصلاحيات.');
        });
  }, [firestore, toast, forceCollectionUpdate]);


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
        <TableCell>
            <EditableCell 
                value={user.rank}
                type="select"
                options={RANKS}
                onSave={(newValue) => handleFieldUpdate(user.id, 'rank', newValue)}
            />
        </TableCell>
        <TableCell>
             <EditableCell 
                value={`$${(user.balance ?? 0).toFixed(2)}`}
                type="number"
                onSave={async (newValue) => {
                    const numericValue = parseFloat(newValue.replace('$', ''));
                    if (!isNaN(numericValue)) {
                        await handleFieldUpdate(user.id, 'balance', numericValue);
                    } else {
                        toast({ variant: 'destructive', title: 'قيمة غير صالحة'});
                    }
                }}
            />
        </TableCell>
        <TableCell>
             <EditableCell 
                value={`$${(user.adBalance ?? 0).toFixed(2)}`}
                type="number"
                onSave={async (newValue) => {
                    const numericValue = parseFloat(newValue.replace('$', ''));
                    if (!isNaN(numericValue)) {
                        await handleFieldUpdate(user.id, 'adBalance', numericValue);
                    } else {
                        toast({ variant: 'destructive', title: 'قيمة غير صالحة'});
                    }
                }}
            />
        </TableCell>
        <TableCell>${(user.totalSpent ?? 0).toFixed(2)}</TableCell>
        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
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
