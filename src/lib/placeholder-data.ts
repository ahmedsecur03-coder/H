
import type { NestedNavItem } from '@/lib/types';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ListOrdered,
  DollarSign,
  Users,
  Megaphone,
  MessageSquare,
  Settings,
  ShieldCheck,
  Banknote,
  Users2,
  BookOpen,
  Info,
  Code2,
  HeartPulse,
  Rocket
} from 'lucide-react';


export const dashboardNavItems: NestedNavItem[] = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  {
    label: 'الطلبات',
    icon: ShoppingCart,
    children: [
      { href: '/dashboard/orders', label: 'سجل الطلبات' },
      { href: '/dashboard/mass-order', label: 'طلب جماعي' },
    ],
  },
  { href: '/dashboard/services', label: 'الخدمات', icon: Package },
  { href: '/dashboard/add-funds', label: 'شحن الرصيد', icon: DollarSign },
  { href: '/dashboard/campaigns', label: 'الحملات', icon: Rocket },
  { href: '/dashboard/affiliate', label: 'برنامج الإحالة', icon: Users },
  { href: '/dashboard/support', label: 'الدعم الفني', icon: MessageSquare },
  { href: '/dashboard/api', label: 'API', icon: Code2 },
  { href: '/dashboard/system-status', label: 'حالة النظام', icon: HeartPulse },
];

export const adminNavItems: NestedNavItem[] = [
    { href: '/admin/dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { href: '/admin/deposits', label: 'الإيداعات', icon: Banknote },
    { href: '/admin/users', label: 'المستخدمون', icon: Users2 },
    { href: '/admin/orders', label: 'الطلبات', icon: ShoppingCart },
    { href: '/admin/services', label: 'الخدمات', icon: Package },
    { href: '/admin/campaigns', label: 'الحملات', icon: Megaphone },
    { href: '/admin/support', label: 'الدعم الفني', icon: MessageSquare },
    { href: '/admin/settings', label: 'الإعدادات', icon: Settings },
];

export const performanceData = [
    { date: '2024-05-01', orders: 10, spend: 50, revenue: 75, users: 5 },
    { date: '2024-05-02', orders: 12, spend: 65, revenue: 90, users: 2 },
    { date: '2024-05-03', orders: 8, spend: 40, revenue: 60, users: 8 },
    { date: '2024-05-04', orders: 15, spend: 80, revenue: 120, users: 3 },
    { date: '2024-05-05', orders: 18, spend: 95, revenue: 140, users: 10 },
    { date: '2024-05-06', orders: 14, spend: 70, revenue: 105, users: 7 },
    { date: '2024-05-07', orders: 20, spend: 110, revenue: 165, users: 12 },
];
