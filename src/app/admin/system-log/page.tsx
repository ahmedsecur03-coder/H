
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import type { SystemLog } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
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
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Info, Terminal, Code2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const levelConfig = {
  info: {
    variant: 'secondary' as const,
    icon: Info,
    className: 'border-blue-500/50 text-blue-500'
  },
  warning: {
    variant: 'default' as const,
    className: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-600 dark:text-yellow-400',
    icon: AlertTriangle,
  },
  error: {
    variant: 'destructive' as const,
    icon: AlertTriangle,
  },
};

const eventConfig = {
    'api_request': { icon: Code2 },
    'permission_denied': { icon: AlertTriangle },
    'user_created': { icon: User },
    'default': { icon: Terminal }
}

export default function SystemLogPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const logsQuery = query(collection(firestore, 'systemLogs'), orderBy('timestamp', 'desc'), limit(100));
            const querySnapshot = await getDocs(logsQuery);
            const fetchedLogs: SystemLog[] = [];
            querySnapshot.forEach(doc => {
                fetchedLogs.push({ id: doc.id, ...doc.data() } as SystemLog);
            });
            setLogs(fetchedLogs);
        } catch (error) {
            console.error("Error fetching system logs:", error);
            setLogs([]); 
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب سجلات النظام. قد تكون المجموعة غير موجودة أو هناك مشكلة في الصلاحيات.' });
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchLogs();
  }, [firestore, toast]);
  
  const renderContent = () => {
    if (isLoading) {
      return Array.from({length: 10}).map((_, i) => (
        <TableRow key={i}>
            {Array.from({length: 4}).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
        </TableRow>
      ));
    }

    if (!logs || logs.length === 0) {
       return (
        <TableRow>
          <TableCell colSpan={4} className="h-24 text-center">
            لا توجد سجلات في النظام لعرضها.
          </TableCell>
        </TableRow>
      );
    }
    
    return logs.map((log) => {
        const config = levelConfig[log.level] || levelConfig.info;
        const Icon = config.icon;
        const EventIcon = eventConfig[log.event as keyof typeof eventConfig] ? eventConfig[log.event as keyof typeof eventConfig].icon : eventConfig.default.icon;
        return (
            <TableRow key={log.id}>
                <TableCell>
                    <Badge variant={config.variant} className={config.className}>
                        <Icon className="h-3 w-3 ml-1" />
                        {log.level.toUpperCase()}
                    </Badge>
                </TableCell>
                <TableCell className="font-medium">{log.message}</TableCell>
                <TableCell>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                               <div className="flex items-center gap-2 text-muted-foreground font-mono text-xs">
                                 <EventIcon className="h-4 w-4" />
                                 <span>{log.event}</span>
                               </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <pre className="text-xs max-w-sm overflow-auto p-2 bg-background">
                                    {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">{new Date(log.timestamp).toLocaleString('ar-EG')}</TableCell>
            </TableRow>
        );
    });
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
            <Terminal className="h-8 w-8"/>
            سجل أحداث النظام
        </h1>
        <p className="text-muted-foreground">عرض مباشر لأهم الأحداث التي تتم داخل المنصة.</p>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>آخر 100 حدث</CardTitle>
           <CardDescription>يتم عرض الأحداث من الأحدث إلى الأقدم. مرر الفأرة فوق الحدث لعرض التفاصيل.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">المستوى</TableHead>
                <TableHead>الرسالة</TableHead>
                <TableHead>الحدث</TableHead>
                <TableHead>الوقت</TableHead>
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
