'use client';

import { useMemo } from 'react';
import type { Order } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { BarChart, PieChart, DollarSign, ListOrdered, TrendingUp } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Pie,
  Cell,
  PieChart as RechartsPieChart,
  Legend
} from 'recharts';
import { useTranslation } from 'react-i18next';

// Process data for charts
function processAnalyticsData(orders: Order[]) {
    const spendingByDay: { [key: string]: number } = {};
    const spendingByCategory: { [key: string]: number } = {};
    let totalSpent = 0;

    const today = new Date();
    const last7Days: { date: string, spend: number }[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        last7Days.push({ date: dateStr, spend: 0 });
        spendingByDay[dateStr] = 0;
    }
    
    orders.forEach(order => {
        const orderDate = new Date(order.orderDate).toISOString().split('T')[0];
        const category = order.serviceName.split(' - ')[0] || 'Other';
        
        if (spendingByDay.hasOwnProperty(orderDate)) {
            spendingByDay[orderDate] += order.charge;
        }

        spendingByCategory[category] = (spendingByCategory[category] || 0) + order.charge;
        totalSpent += order.charge;
    });

    last7Days.forEach(day => {
        day.spend = spendingByDay[day.date];
    });

    const categoryData = Object.entries(spendingByCategory)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const averageOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;
    const mostUsedCategory = categoryData.length > 0 ? categoryData[0].name : 'N/A';

    return {
        dailySpending: last7Days,
        categorySpending: categoryData,
        totalOrders: orders.length,
        averageOrderValue,
        mostUsedCategory,
    };
}


const chartConfig = {
    spend: {
        label: "Spend ($)",
        color: "hsl(var(--primary))",
    },
};

const PIE_CHART_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
];

export function AnalyticsClientPage({ orders }: { orders: Order[] }) {
    const { t } = useTranslation();
    const { dailySpending, categorySpending, totalOrders, averageOrderValue, mostUsedCategory } = processAnalyticsData(orders);

    const totalSpendingLast30Days = useMemo(() => orders.reduce((sum, order) => sum + order.charge, 0), [orders]);

    if(orders.length === 0) {
        return (
             <div className="text-center py-20 bg-card border rounded-lg">
                <BarChart className="mx-auto h-16 w-16 text-muted-foreground" />
                <h2 className="mt-4 text-2xl font-bold">{t('analytics.noData.title')}</h2>
                <p className="mt-2 text-muted-foreground">
                    {t('analytics.noData.description')}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">{t('analytics.title')}</h1>
                <p className="text-muted-foreground">
                    {t('analytics.description')}
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('analytics.totalSpend30Days')}</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalSpendingLast30Days.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('analytics.totalOrders30Days')}</CardTitle>
                        <ListOrdered className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalOrders.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('analytics.avgOrderValue')}</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${averageOrderValue.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>{t('analytics.dailySpend.title')}</CardTitle>
                        <CardDescription>{t('analytics.dailySpend.description')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[300px] w-full">
                            <RechartsBarChart data={dailySpending} accessibilityLayer>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tickFormatter={(value) => new Date(value).toLocaleDateString(t('locale') || 'en-US', { month: 'short', day: 'numeric' })}
                                />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="spend" fill="var(--color-spend)" radius={4} />
                            </RechartsBarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>{t('analytics.categorySpend.title')}</CardTitle>
                        <CardDescription>{t('analytics.categorySpend.description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                         <ChartContainer config={{}} className="h-[300px] w-full">
                            <RechartsPieChart>
                                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                <Pie
                                    data={categorySpending}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={60}
                                    strokeWidth={5}
                                >
                                    {categorySpending.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Legend />
                            </RechartsPieChart>
                         </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
