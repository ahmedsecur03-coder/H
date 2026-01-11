
'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Send } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, getDocs, collectionGroup, writeBatch, query, where, Timestamp, orderBy, collection, addDoc, Firestore } from 'firebase/firestore';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Notification, Order, Deposit } from '@/lib/types';


async function runCleanup(firestore: Firestore, type: 'orders' | 'deposits') {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const fiveDaysAgoISO = fiveDaysAgo.toISOString();

    const collectionGroupRef = collectionGroup(firestore, type);
    
    let docsQuery;
    if (type === 'orders') {
        docsQuery = query(collectionGroupRef, where('status', 'in', ['مكتمل', 'ملغي']), where('orderDate', '<', fiveDaysAgoISO));
    } else { // deposits
        docsQuery = query(collectionGroupRef, where('status', '==', 'مرفوض'), where('depositDate', '<', fiveDaysAgoISO));
    }

    const snapshot = await getDocs(docsQuery);
    const docsToDelete = snapshot.docs;
    
    if (docsToDelete.length === 0) {
        return { count: 0 };
    }

    const batchArray: any[] = [];
    let currentBatch = writeBatch(firestore);
    let operationCount = 0;

    docsToDelete.forEach((doc) => {
        currentBatch.delete(doc.ref);
        operationCount++;
        if (operationCount === 499) {
            batchArray.push(currentBatch);
            currentBatch = writeBatch(firestore);
            operationCount = 0;
        }
    });
    
    if (operationCount > 0) {
        batchArray.push(currentBatch);
    }

    await Promise.all(batchArray.map(batch => batch.commit()));
    return { count: docsToDelete.length };
}


async function runBroadcast(firestore: Firestore, message: string, type: Notification['type']) {
    const broadcastData = {
        message,
        type,
        createdAt: new Date().toISOString(),
        sent: false, // This field can be used by a Cloud Function to track which broadcasts have been processed
    };
    await addDoc(collection(firestore, 'broadcasts'), broadcastData);
}


export default function AdminSettingsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = useState(false);
  const [isCleaning, setIsCleaning] = useState<string|null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<Notification['type']>('info');


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
        try {
            const result = await runCleanup(firestore, type);
            if (result.count > 0) {
                 toast({ title: "نجاح!", description: `تم حذف ${result.count} ${type === 'orders' ? 'طلب' : 'إيداع'} قديم بنجاح.` });
            } else {
                toast({ title: 'لا يوجد ما يمكن حذفه', description: `لم يتم العثور على أي ${type === 'orders' ? 'طلبات' : 'إيداعات'} قديمة.` });
            }
        } catch (error) {
             const permissionError = new FirestorePermissionError({ path: `collectionGroup(${type})`, operation: 'delete' });
             errorEmitter.emit('permission-error', permissionError);
        } finally {
            setIsCleaning(null);
        }
    };

  const handleBroadcast = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!firestore || !broadcastMessage.trim()) {
          toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء كتابة رسالة الإشعار.' });
          return;
      }
      setIsBroadcasting(true);
      
      try {
        await runBroadcast(firestore, broadcastMessage, broadcastType);
        toast({ title: "تم إرسال طلب البث", description: "سيقوم الخادم بتوزيع الإشعار على جميع المستخدمين." });
        setBroadcastMessage('');
      } catch (error) {
          const permissionError = new FirestorePermissionError({ path: 'broadcasts', operation: 'create' });
          errorEmitter.emit('permission-error', permissionError);
      } finally {
        setIsBroadcasting(false);
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
                    <CardTitle>إرسال إشعار عام</CardTitle>
                    <CardDescription>إرسال إشعار لجميع المستخدمين. يتطلب وظيفة خادم للتوزيع.</CardDescription>
                </CardHeader>
                <form onSubmit={handleBroadcast}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="broadcast-message">رسالة الإشعار</Label>
                            <Textarea id="broadcast-message" value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} placeholder="مثال: صيانة مجدولة يوم الجمعة..." required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="broadcast-type">نوع الإشعار</Label>
                            <Select value={broadcastType} onValueChange={(v) => setBroadcastType(v as Notification['type'])}>
                                <SelectTrigger id="broadcast-type"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="info">معلومة (Info)</SelectItem>
                                    <SelectItem value="success">نجاح (Success)</SelectItem>
                                    <SelectItem value="warning">تحذير (Warning)</SelectItem>
                                    <SelectItem value="error">خطأ (Error)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isBroadcasting}>
                            {isBroadcasting ? <Loader2 className="animate-spin me-2" /> : <Send className="me-2 h-4 w-4" />}
                            إرسال الإشعار
                        </Button>
                    </CardFooter>
                </form>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>صيانة النظام</CardTitle>
                    <CardDescription>تنظيف البيانات القديمة لتحسين الأداء.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p>حذف الطلبات القديمة (أقدم من 5 أيام)</p>
                         <Button variant="outline" size="sm" onClick={() => handleCleanup('orders')} disabled={!!isCleaning}>
                            {isCleaning === 'orders' ? <Loader2 className="animate-spin" /> : <Trash2 className="h-4 w-4"/>}
                        </Button>
                    </div>
                     <div className="flex justify-between items-center">
                        <p>حذف طلبات الإيداع المرفوضة القديمة</p>
                        <Button variant="outline" size="sm" onClick={() => handleCleanup('deposits')} disabled={!!isCleaning}>
                            {isCleaning === 'deposits' ? <Loader2 className="animate-spin" /> : <Trash2 className="h-4 w-4"/>}
                        </Button>
                    </div>
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
}
