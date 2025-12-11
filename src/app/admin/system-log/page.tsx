
'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
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
import { AlertTriangle, Info, Terminal } from 'lucide-react';

const levelConfig = {
  info: {
    variant: 'secondary' as const,
    icon: Info,
  },
  warning: {
    variant: 'default' as const,
    icon: AlertTriangle,
  },
  error: {
    variant: 'destructive' as const,
    icon: AlertTriangle,
  },
};

export default function SystemLogPage() {
  const firestore = useFirestore();

  const logsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'systemLogs'), orderBy('timestamp', 'desc'), limit(100)) : null,
    [firestore]
  );

  const { data: logs, isLoading } = useCollection<SystemLog>(logsQuery);
  
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
        const config = levelConfig[log.level];
        const Icon = config.icon;
        return (
            <TableRow key={log.id}>
                <TableCell>
                    <Badge variant={config.variant} className="gap-1">
                        <Icon className="h-3 w-3" />
                        {log.level.toUpperCase()}
                    </Badge>
                </TableCell>
                <TableCell className="font-medium">{log.message}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{log.event}</TableCell>
                <TableCell className="text-muted-foreground">{new Date(log.timestamp).toLocaleString('ar-EG')}</TableCell>
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
           <CardDescription>يتم عرض الأحداث من الأحدث إلى الأقدم.</CardDescription>
        </CardHeader>
        <CardContent>
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
