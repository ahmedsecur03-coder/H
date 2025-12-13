'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, Users, ShoppingCart, Activity } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const chartConfig = {
  revenue: {
    label: 'الإيرادات ($)',
    color: 'hsl(var(--primary))',
  },
  users: {
    label: 'مستخدمون جدد',
    color: 'hsl(var(--accent))',
  },
} as const;


function processPerformanceData(users: User[]) {
    if (!users) return [];
    
    const dataByDate: Record<string, { date: string, revenue: number, users: number, orders: number }> = {};
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        dataByDate[dateStr] = { date: dateStr, revenue: 0, users: 0, orders: 0 };
    }

    // Revenue and order processing is disabled for now to fix the bug.
    // orders.forEach(order => {
    //     const orderDate = new Date(order.orderDate);
    //     const dateStr = orderDate.toISOString().split('T')[0];
    //     if (dataByDate[dateStr]) {
    //         dataByDate[dateStr].revenue += order.charge;
    //         dataByDate[dateStr].orders += 1;
    //     }
    // });

    users.forEach(user => {
        if(!user.createdAt) return;
        const joinDate = new Date(user.createdAt);
        const dateStr = joinDate.toISOString().split('T')[0];
        if (dataByDate[dateStr]) {
            dataByDate[dateStr].users += 1;
        }
    });

    return Object.values(dataByDate);
}


export default function AdminDashboardPage() {
    const firestore = useFirestore();

    const usersQuery = useMemoFirebase(
      () => (firestore ? query(collection(firestore, 'users')) : null),
      [firestore]
    );
    const { data: allUsers, isLoading: isUsersLoading } = useCollection<User>(usersQuery);

    const isLoading = isUsersLoading;
    
    const performanceData = useMemo(() => {
        if (!allUsers) return [];
        return processPerformanceData(allUsers);
    }, [allUsers]);

    // Simplified stats - we can re-enable these later with a more robust fetching strategy.
    const totalRevenue = 0; // Temporarily disabled
    const totalOrders = 0; // Temporarily disabled
    const openTicketsCount = 0; // Temporarily disabled

    const totalUsersCount = allUsers?.length ?? 0;
    const totalNewUsers = useMemo(() => {
        if (!allUsers) return 0;
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return allUsers.filter(user => user.createdAt && new Date(user.createdAt) > oneWeekAgo).length;
    }, [allUsers]);
    

  if(isLoading) {
    return (
        <div className="space-y-6 pb-8">
            <div>
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-5 w-1/2 mt-2" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({length: 4}).map((_,i) => <Skeleton key={i} className="h-32" />)}
            </div>
            <Skeleton className="h-96" />
        </div>
    )
  }


  return (
    <div className="space-y-6 pb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">لوحة تحكم المسؤول</h1>
            <p className="text-muted-foreground">نظرة عامة وشاملة على أداء منصة حاجاتي.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">(قيد الصيانة)</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalUsersCount}</div>
                    <p className="text-xs text-muted-foreground">+{totalNewUsers} في آخر 7 أيام</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalOrders}</div>
                     <p className="text-xs text-muted-foreground">(قيد الصيانة)</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">تذاكر الدعم المفتوحة</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{openTicketsCount}</div>
                    <p className="text-xs text-muted-foreground">(قيد الصيانة)</p>
                </CardContent>
            </Card>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>نظرة عامة على الأداء</CardTitle>
                 <CardDescription>المستخدمون الجدد في آخر 7 أيام.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[350px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                        data={performanceData}
                        margin={{
                            top: 5,
                            right: 10,
                            left: 10,
                            bottom: 5,
                        }}
                        >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => new Date(value).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                        />
                        <YAxis yAxisId="right" stroke="var(--color-users)" orientation="right" allowDecimals={false} />
                        <Tooltip
                            content={<ChartTooltipContent
                                formatter={(value, name) => {
                                    if (name === 'revenue') {
                                        return `$${(value as number).toFixed(2)}`;
                                    }
                                    return value;
                                }}
                                indicator="dot" 
                            />}
                        />
                         <Legend />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="users"
                            stroke="var(--color-users)"
                            strokeWidth={2}
                             name={chartConfig.users.label}
                        />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    </div>
  );
}
