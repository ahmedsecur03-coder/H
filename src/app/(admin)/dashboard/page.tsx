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
  ChartConfig,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, Tooltip } from 'recharts';
import { DollarSign, Users, ShoppingCart, Activity } from 'lucide-react';
import { performanceData } from '@/lib/placeholder-data';


const chartConfig = {
  revenue: {
    label: 'الإيرادات',
    color: 'hsl(var(--primary))',
  },
  users: {
    label: 'مستخدمون جدد',
    color: 'hsl(var(--accent))',
  },
} satisfies ChartConfig;

const totalRevenue = performanceData.reduce((acc, item) => acc + item.revenue, 0);
const totalUsers = 548; // Dummy data
const totalOrders = performanceData.reduce((acc, item) => acc + item.orders, 0);
const newTickets = 12; // Dummy data

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6 pb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">لوحة تحكم المسؤول</h1>
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
                    <p className="text-xs text-muted-foreground">خلال آخر 7 أيام</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+{totalUsers}</div>
                    <p className="text-xs text-muted-foreground">+180.1% من الشهر الماضي</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+{totalOrders}</div>
                     <p className="text-xs text-muted-foreground">+19% من الشهر الماضي</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">تذاكر الدعم الجديدة</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{newTickets}</div>
                    <p className="text-xs text-muted-foreground">2 منها عاجلة</p>
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
                      />
                       <Line
                        dataKey="users"
                        type="natural"
                        stroke="var(--color-users)"
                        strokeWidth={2}
                        dot={{ fill: "var(--color-users)" }}
                        activeDot={{ r: 6 }}
                      />
                  </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    </div>
  );
}
