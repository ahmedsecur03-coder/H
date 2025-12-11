'use client';

import { useState, useMemo, useCallback } from 'react';
import { useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Service } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Upload, Trash2, Loader2, ListFilter, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// A reusable component for inline editing
function EditableCell({ value, onSave, type = 'text' }: { value: string | number, onSave: (newValue: string) => Promise<void>, type?: 'text' | 'number' }) {
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
                <Input
                    type={type}
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    autoFocus
                    className="h-8"
                />
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
        );
    }
    
    return (
        <div onClick={() => setIsEditing(true)} className="cursor-pointer hover:bg-muted/50 p-1 rounded-md min-h-[2rem] flex items-center">
            {value}
        </div>
    );
}

function AddNewServiceRow({ onAdd, isAdding }: { onAdd: (service: Omit<Service, 'id'>) => void, isAdding: boolean }) {
    const [newService, setNewService] = useState({ platform: '', category: '', price: '0', min: '0', max: '0', refill: false });

    const handleAdd = () => {
        onAdd({
            ...newService,
            price: parseFloat(newService.price) || 0,
            min: parseInt(newService.min, 10) || 0,
            max: parseInt(newService.max, 10) || 0,
        });
        setNewService({ platform: '', category: '', price: '0', min: '0', max: '0', refill: false });
    };

    return (
        <TableRow className="bg-muted/50 hover:bg-muted/60">
            <TableCell><Input className="h-8 bg-background" placeholder="ID (auto)" disabled /></TableCell>
            <TableCell><Input className="h-8 bg-background" placeholder="الفئة" value={newService.category} onChange={e => setNewService({...newService, category: e.target.value})} /></TableCell>
            <TableCell><Input className="h-8 bg-background" placeholder="المنصة" value={newService.platform} onChange={e => setNewService({...newService, platform: e.target.value})} /></TableCell>
            <TableCell><Input className="h-8 bg-background" placeholder="السعر" type="number" value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})} /></TableCell>
            <TableCell>
                <div className="flex gap-1">
                    <Input className="h-8 bg-background" placeholder="أدنى" type="number" value={newService.min} onChange={e => setNewService({...newService, min: e.target.value})} />
                    <Input className="h-8 bg-background" placeholder="أقصى" type="number" value={newService.max} onChange={e => setNewService({...newService, max: e.target.value})} />
                </div>
            </TableCell>
            <TableCell className="text-center">
                <Switch checked={newService.refill} onCheckedChange={checked => setNewService({...newService, refill: checked})} />
            </TableCell>
            <TableCell className="text-right">
                <Button size="icon" onClick={handleAdd} disabled={isAdding}>
                    {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
            </TableCell>
        </TableRow>
    );
}

export default function AdminServicesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const servicesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'services')) : null, [firestore]);
  const { data: services, isLoading, forceCollectionUpdate } = useCollection<Service>(servicesQuery);

  const filteredServices = useMemo(() => {
    if (!services) return [];
    if (!searchTerm) return services;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return services.filter(service => 
      service.platform.toLowerCase().includes(lowerCaseSearch) ||
      service.category.toLowerCase().includes(lowerCaseSearch) ||
      service.id.toLowerCase().includes(lowerCaseSearch)
    );
  }, [services, searchTerm]);
  
  const handleFieldUpdate = useCallback(async (serviceId: string, field: keyof Service, value: string | number | boolean) => {
    if (!firestore) return;
    const serviceDocRef = doc(firestore, 'services', serviceId);
    
    let processedValue = value;
    if (field === 'price' || field === 'min' || field === 'max') {
        processedValue = typeof value === 'string' ? parseFloat(value) : value;
        if(isNaN(processedValue as number)) {
            toast({ variant: 'destructive', title: 'قيمة غير صالحة'});
            throw new Error('Invalid number');
        }
    }

    const updateData = { [field]: processedValue };
    
    return updateDoc(serviceDocRef, updateData).catch(serverError => {
        const permissionError = new FirestorePermissionError({ path: serviceDocRef.path, operation: 'update', requestResourceData: updateData });
        errorEmitter.emit('permission-error', permissionError);
        throw new Error('فشل تحديث الخدمة.');
    });
  }, [firestore, toast]);

  const handleAddService = async (data: Omit<Service, 'id'>) => {
    if (!firestore) return;
    if (!data.category || !data.platform) {
        toast({variant: 'destructive', title: 'خطأ', description: 'الفئة والمنصة حقول مطلوبة.'});
        return;
    }
    setIsAdding(true);
    const servicesColRef = collection(firestore, 'services');
    addDoc(servicesColRef, data)
        .then(() => {
            toast({ title: 'نجاح', description: 'تمت إضافة الخدمة بنجاح.' });
            forceCollectionUpdate();
        })
        .catch(serverError => {
            const permissionError = new FirestorePermissionError({ path: servicesColRef.path, operation: 'create', requestResourceData: data });
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setIsAdding(false));
  };

  const handleDeleteService = async (id: string) => {
      if (!firestore) return;
      const serviceDocRef = doc(firestore, 'services', id);
      deleteDoc(serviceDocRef)
        .then(() => {
            toast({ title: 'نجاح', description: 'تم حذف الخدمة بنجاح.' });
        })
        .catch(serverError => {
            const permissionError = new FirestorePermissionError({ path: serviceDocRef.path, operation: 'delete' });
            errorEmitter.emit('permission-error', permissionError);
        });
  };

  const renderContent = () => {
    if (isLoading && !filteredServices) {
      return Array.from({length: 10}).map((_, i) => (
        <TableRow key={i}>
          {Array.from({length: 7}).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
        </TableRow>
      ));
    }
     if (!filteredServices || filteredServices.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="h-24 text-center">
             <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mx-auto bg-muted p-4 rounded-full"><ListFilter className="h-12 w-12 text-muted-foreground" /></div>
                <h3 className="mt-4 font-headline text-2xl">{searchTerm ? "لا توجد خدمات تطابق بحثك" : "لا توجد خدمات لعرضها"}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{searchTerm ? "حاول تغيير كلمات البحث." : "ابدأ بإضافة خدمة جديدة."}</p>
            </div>
          </TableCell>
        </TableRow>
      );
    }
    return filteredServices.map(service => (
      <TableRow key={service.id}>
          <TableCell className="font-mono text-xs">{service.id}</TableCell>
          <TableCell><EditableCell value={service.category} onSave={(v) => handleFieldUpdate(service.id, 'category', v)} /></TableCell>
          <TableCell><EditableCell value={service.platform} onSave={(v) => handleFieldUpdate(service.id, 'platform', v)} /></TableCell>
          <TableCell><EditableCell value={service.price.toFixed(4)} type="number" onSave={(v) => handleFieldUpdate(service.id, 'price', v)} /></TableCell>
          <TableCell className="flex gap-1">
            <EditableCell value={service.min} type="number" onSave={(v) => handleFieldUpdate(service.id, 'min', v)} />
            -
            <EditableCell value={service.max} type="number" onSave={(v) => handleFieldUpdate(service.id, 'max', v)} />
          </TableCell>
           <TableCell className="text-center">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger><Switch checked={!!service.refill} onCheckedChange={(c) => handleFieldUpdate(service.id, 'refill', c)} /></TooltipTrigger>
                    <TooltipContent>إعادة تعبئة مدعومة</TooltipContent>
                </Tooltip>
            </TooltipProvider>
          </TableCell>
          <TableCell className="text-right">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد تماماً؟</AlertDialogTitle><AlertDialogDescription>هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف الخدمة نهائياً من قاعدة البيانات.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteService(service.id)} className="bg-destructive hover:bg-destructive/90">متابعة الحذف</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </TableCell>
      </TableRow>
    ));
  }


  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة الخدمات</h1>
          <p className="text-muted-foreground">إضافة وتعديل وحذف خدمات المنصة.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline"><Upload className="ml-2 h-4 w-4" />استيراد بالجملة</Button>
        </div>
      </div>
       <Card>
        <CardHeader>
            <Input placeholder="ابحث عن خدمة بالرقم، الاسم، أو الفئة..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </CardHeader>
        <CardContent>
           {isLoading && !services ? ( <Skeleton className="h-96 w-full"/> ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>رقم الخدمة</TableHead>
                            <TableHead>الاسم</TableHead>
                            <TableHead>المنصة</TableHead>
                            <TableHead>السعر/1000</TableHead>
                            <TableHead>الحدود</TableHead>
                            <TableHead className="text-center">إعادة تعبئة</TableHead>
                            <TableHead className="text-right">إجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <AddNewServiceRow onAdd={handleAddService} isAdding={isAdding}/>
                        {renderContent()}
                    </TableBody>
                </Table>
            )}
        </CardContent>
       </Card>
    </div>
  );
}
