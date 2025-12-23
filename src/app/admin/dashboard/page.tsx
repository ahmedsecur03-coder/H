
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
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, collectionGroup, where, getDocs, getCountFromServer, Timestamp } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { User, Order, Ticket } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';


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


function processPerformanceData(users: User[], orders: Order[]) {
    if (!users || !orders) return [];
    
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
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalUsers: 0,
        totalOrders: 0,
        openTickets: 0,
        newUsersLast7Days: 0,
    });
    const [performanceData, setPerformanceData] = useState<any[]>([]);

    useEffect(() => {
        if (!firestore) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // --- Efficient Count Queries ---
                const usersCol = collection(firestore, 'users');
                const ordersColGroup = collectionGroup(firestore, 'orders');
                const ticketsColGroup = collectionGroup(firestore, 'tickets');

                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);

                const usersCountQuery = query(usersCol);
                const newUsersCountQuery = query(usersCol, where('createdAt', '>=', sevenDaysAgoTimestamp.toDate().toISOString()));
                const ordersCountQuery = query(ordersColGroup);
                const openTicketsCountQuery = query(ticketsColGroup, where('status', '!=', 'مغلقة'));

                const [
                    usersSnapshot,
                    newUsersSnapshot,
                    ordersSnapshot,
                    openTicketsSnapshot,
                ] = await Promise.all([
                    getCountFromServer(usersCountQuery),
                    getCountFromServer(newUsersCountQuery),
                    getCountFromServer(ordersCountQuery),
                    getCountFromServer(openTicketsCountQuery),
                ]);

                // --- Chart Data Queries (last 7 days) ---
                const usersChartQuery = query(usersCol, where('createdAt', '>=', sevenDaysAgoTimestamp.toDate().toISOString()));
                const ordersChartQuery = query(ordersColGroup, where('orderDate', '>=', sevenDaysAgoTimestamp.toDate().toISOString()));
                const revenueQuery = query(ordersColGroup); // still need all for total revenue

                const [
                    usersChartDocs,
                    ordersChartDocs,
                    allOrdersDocs
                ] = await Promise.all([
                    getDocs(usersChartQuery),
                    getDocs(ordersChartQuery),
                    getDocs(revenueQuery)
                ]);

                const usersForChart = usersChartDocs.docs.map(doc => doc.data() as User);
                const ordersForChart = ordersChartDocs.docs.map(doc => doc.data() as Order);
                
                const totalRevenue = allOrdersDocs.docs.reduce((acc, doc) => acc + (doc.data() as Order).charge, 0);

                // --- Set State ---
                setStats({
                    totalRevenue: totalRevenue,
                    totalUsers: usersSnapshot.data().count,
                    totalOrders: ordersSnapshot.data().count,
                    openTickets: openTicketsSnapshot.data().count,
                    newUsersLast7Days: newUsersSnapshot.data().count,
                });

                setPerformanceData(processPerformanceData(usersForChart, ordersForChart));

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                toast({
                    variant: "destructive",
                    title: "خطأ في جلب البيانات",
                    description: "فشل تحميل بيانات لوحة التحكم. قد تكون بسبب الصلاحيات.",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [firestore, toast]);
    

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
                    <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">+{stats.newUsersLast7Days} في آخر 7 أيام</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalOrders}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">تذاكر الدعم المفتوحة</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.openTickets}</div>
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
                        <YAxis yAxisId="left" stroke="var(--color-revenue)" orientation="left" />
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
                            yAxisId="left"
                            type="monotone"
                            dataKey="revenue"
                            stroke="var(--color-revenue)"
                            strokeWidth={2}
                            name={chartConfig.revenue.label}
                        />
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

    