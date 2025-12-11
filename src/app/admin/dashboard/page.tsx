
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
import { Line, LineChart, CartesianGrid, XAxis, Tooltip } from 'recharts';
import { DollarSign, Users, ShoppingCart, Activity } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, where } from 'firebase/firestore';
import type { Order, User, Ticket } from '@/lib/types';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const chartConfig = {
  revenue: {
    label: 'الإيرادات',
    color: 'hsl(var(--primary))',
  },
  users: {
    label: 'مستخدمون جدد',
    color: 'hsl(var(--accent))',
  },
} as const;


function processPerformanceData(orders: Order[], users: User[]) {
    if (!orders || !users) return [];
    
    const dataByDate: Record<string, { date: string, revenue: number, users: number, orders: number }> = {};
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        dataByDate[dateStr] = { date: dateStr, revenue: 0, users: 0, orders: 0 };
    }

    orders.forEach(order => {
        const orderDate = new Date(order.orderDate);
        const dateStr = orderDate.toISOString().split('T')[0];
        if (dataByDate[dateStr]) {
            dataByDate[dateStr].revenue += order.charge;
            dataByDate[dateStr].orders += 1;
        }
    });

    users.forEach(user => {
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

    const ordersQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'orders')) : null, [firestore]);
    const { data: allOrders, isLoading: isOrdersLoading } = useCollection<Order>(ordersQuery);

    const usersQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'users')) : null, [firestore]);
    const { data: allUsers, isLoading: isUsersLoading } = useCollection<User>(usersQuery);
    
    const openTicketsQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'tickets'), where('status', '!=', 'مغلقة')) : null, [firestore]);
    const { data: openTickets, isLoading: isTicketsLoading } = useCollection<Ticket>(openTicketsQuery);


    const isLoading = isOrdersLoading || isUsersLoading || isTicketsLoading;
    
    const performanceData = useMemo(() => {
        if (!allOrders || !allUsers) return [];
        return processPerformanceData(allOrders, allUsers);
    }, [allOrders, allUsers]);

    const totalRevenue = useMemo(() => performanceData.reduce((acc, item) => acc + item.revenue, 0), [performanceData]);
    const totalNewUsers = useMemo(() => performanceData.reduce((acc, item) => acc + item.users, 0), [performanceData]);
    const totalOrders = useMemo(() => performanceData.reduce((acc, item) => acc + item.orders, 0), [performanceData]);
    const totalUsersCount = allUsers?.length ?? 0;
    const openTicketsCount = openTickets?.length ?? 0;

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
                    <CardTitle className="text-sm font-medium">إجمالي الإيرادات (آخر 7 أيام)</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
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
                    <CardTitle className="text-sm font-medium">إجمالي الطلبات (آخر 7 أيام)</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+{totalOrders}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">تذاكر الدعم المفتوحة</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{openTicketsCount}</div>
                    <p className="text-xs text-muted-foreground">تتطلب استجابة</p>
                </CardContent>
            </Card>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>نظرة عامة على الأداء</CardTitle>
                 <CardDescription>الإيرادات والمستخدمون الجدد في آخر 7 أيام.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[350px] w-full">
                  <LineChart accessibilityLayer data={performanceData}>
                     <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                      />
                      <Tooltip
                        content={<ChartTooltipContent indicator="dot" />}
                      />
                     <Line
                        dataKey="revenue"
                        type="natural"
                        stroke="var(--color-revenue)"
                        strokeWidth={2}
                        dot={{ fill: "var(--color-revenue)" }}
                        activeDot={{ r: 6 }}
                        name="الإيرادات"
                      />
                       <Line
                        dataKey="users"
                        type="natural"
                        stroke="var(--color-users)"
                        strokeWidth={2}
                        dot={{ fill: "var(--color-users)" }}
                        activeDot={{ r: 6 }}
                        name="مستخدمون جدد"
                      />
                  </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    </div>
  );
}
