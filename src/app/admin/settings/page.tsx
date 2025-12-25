'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2 } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, getDocs, collectionGroup, writeBatch, query, where, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = useState(false);
  const [isCleaning, setIsCleaning] = useState<string|null>(null);

  const settingsDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'settings', 'global') : null),
    [firestore]
  );
  
  const { data: settingsData, isLoading: isSettingsLoading } = useDoc<any>(settingsDocRef);

  const [vodafoneNumber, setVodafoneNumber] = useState('');
  const [binanceId, setBinanceId] = useState('');
  const [usdRate, setUsdRate] = useState('');
  const [whatsappSupport, setWhatsappSupport] = useState('');

  useEffect(() => {
    if (settingsData) {
      setVodafoneNumber(settingsData.vodafoneNumber || '');
      setBinanceId(settingsData.binanceId || '');
      setUsdRate(settingsData.usdRate?.toString() || '');
      setWhatsappSupport(settingsData.whatsappSupport || '');
    }
  }, [settingsData]);


  const handleSaveChanges = async () => {
    if (!firestore || !settingsDocRef) return;
    setIsSaving(true);
    
    const settingsToSave = {
        vodafoneNumber,
        binanceId,
        usdRate: parseFloat(usdRate) || 0,
        whatsappSupport,
    };

    setDoc(settingsDocRef, settingsToSave, { merge: true })
        .then(() => {
             toast({
              title: "تم حفظ الإعدادات",
              description: "تم تحديث إعدادات الموقع بنجاح.",
            });
        })
        .catch(serverError => {
            const permissionError = new FirestorePermissionError({
                path: settingsDocRef.path,
                operation: 'write',
                requestResourceData: settingsToSave,
            });
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
            setIsSaving(false);
        });
  };

  const handleCleanup = async (type: 'orders' | 'deposits') => {
    if (!firestore) return;
    setIsCleaning(type);

    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const fiveDaysAgoISOString = fiveDaysAgo.toISOString(); // Use ISO string for comparison

    let collectionName = '';
    let dateField = '';
    let statusWhereClause: any = null;

    if (type === 'orders') {
        collectionName = 'orders';
        dateField = 'orderDate';
    } else if (type === 'deposits') {
        collectionName = 'deposits';
        dateField = 'depositDate';
        statusWhereClause = where('status', '==', 'مرفوض');
    }

    try {
        let q = query(
            collectionGroup(firestore, collectionName),
            where(dateField, '<', fiveDaysAgoISOString) // Compare string with string
        );

        if (statusWhereClause) {
            q = query(q, statusWhereClause);
        }

        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            toast({ title: 'لا يوجد ما يمكن حذفه', description: `لم يتم العثور على أي ${type === 'orders' ? 'طلبات' : 'إيداعات'} قديمة.` });
            setIsCleaning(null);
            return;
        }

        // Firestore allows a maximum of 500 operations in a single batch.
        const batchArray = [];
        let currentBatch = writeBatch(firestore);
        let operationCount = 0;

        snapshot.docs.forEach((doc, index) => {
            currentBatch.delete(doc.ref);
            operationCount++;
            if (operationCount === 499) {
                batchArray.push(currentBatch);
                currentBatch = writeBatch(firestore);
                operationCount = 0;
            }
        });
        batchArray.push(currentBatch);

        await Promise.all(batchArray.map(batch => batch.commit()));

        toast({
            title: "نجاح!",
            description: `تم حذف ${snapshot.size} ${type === 'orders' ? 'طلب' : 'إيداع'} قديم بنجاح.`,
        });

    } catch (error) {
        console.error(`Error cleaning up ${type}:`, error);
        toast({
            variant: 'destructive',
            title: "فشل التنظيف",
            description: "حدث خطأ أثناء عملية الحذف. تحقق من صلاحيات الأمان.",
        });
        // We can emit a generic error here as we are dealing with multiple paths
        const permissionError = new FirestorePermissionError({
            path: `collectionGroup(${collectionName})`,
            operation: 'delete'
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setIsCleaning(null);
    }
}


  if(isSettingsLoading) {
    return (
        <div className="space-y-6 pb-8">
            <div>
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-5 w-1/2 mt-2" />
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        </div>
    );
  }


  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">إعدادات الموقع</h1>
        <p className="text-muted-foreground">التحكم في الإعدادات العامة للمنصة.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>إعدادات الدفع</CardTitle>
                    <CardDescription>أدخل معلومات طرق الدفع التي ستظهر للمستخدمين عند شحن الرصيد.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="vodafone-number">رقم فودافون كاش</Label>
                        <Input id="vodafone-number" value={vodafoneNumber} onChange={e => setVodafoneNumber(e.target.value)} placeholder="010xxxxxxxx" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="binance-id">معرف Binance Pay</Label>
                        <Input id="binance-id" value={binanceId} onChange={e => setBinanceId(e.target.value)} placeholder="USER12345" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="usd-rate">سعر صرف الدولار (مقابل الجنيه المصري)</Label>
                        <Input id="usd-rate" type="number" value={usdRate} onChange={e => setUsdRate(e.target.value)} placeholder="50" />
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>إعدادات عامة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="whatsapp-support">رابط دعم واتساب</Label>
                        <Input id="whatsapp-support" value={whatsappSupport} onChange={e => setWhatsappSupport(e.target.value)} placeholder="https://wa.me/2010xxxxxxxx" />
                    </div>
                </CardContent>
             </Card>
        </div>

        <div className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>الصيانة</CardTitle>
                    <CardDescription>أدوات للحفاظ على أداء قاعدة البيانات.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        تنظيف السجلات القديمة يمكن أن يساعد في تحسين سرعة استجابة المنصة. سيتم حذف السجلات الأقدم من 5 أيام.
                    </p>
                    
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full" disabled={isCleaning !== null}>
                                {isCleaning === 'orders' ? <Loader2 className="ml-2 animate-spin" /> : <Trash2 className="ml-2"/>}
                                حذف الطلبات القديمة
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                <AlertDialogDescription>سيتم حذف جميع الطلبات (من كل الحالات) الأقدم من 5 أيام بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleCleanup('orders')} className="bg-destructive hover:bg-destructive/90">متابعة الحذف</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full" disabled={isCleaning !== null}>
                                {isCleaning === 'deposits' ? <Loader2 className="ml-2 animate-spin" /> : <Trash2 className="ml-2"/>}
                                حذف الإيداعات المرفوضة
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                <AlertDialogDescription>سيتم حذف جميع طلبات الإيداع المرفوضة الأقدم من 5 أيام بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleCleanup('deposits')} className="bg-destructive hover:bg-destructive/90">متابعة الحذف</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                </CardContent>
            </Card>
        </div>
      </div>
       <Separator className="my-6" />
        <CardFooter className="flex justify-end p-0">
            <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                حفظ التغييرات
            </Button>
        </CardFooter>
    </div>
  );

    