import type { NavItem } from '@/lib/types';
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
  Users2
} from 'lucide-react';


export const dashboardNavItems: NavItem[] = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/dashboard/services', label: 'جميع الخدمات', icon: Package },
  { href: '/dashboard/orders', label: 'إدارة الطلبات', icon: ShoppingCart },
  { href: '/dashboard/mass-order', label: 'طلب جماعي', icon: ListOrdered },
  { href: '/dashboard/add-funds', label: 'شحن الرصيد', icon: DollarSign },
  { href: '/dashboard/affiliate', label: 'نظام الإحالة', icon: Users },
  { href: '/dashboard/campaigns', label: 'مركز الحملات', icon: Megaphone },
  { href: '/dashboard/support', label: 'الدعم الفني', icon: MessageSquare },
];

export const adminNavItems: NavItem[] = [
    { href: '/admin/dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { href: '/admin/deposits', label: 'الإيداعات', icon: Banknote },
    { href: '/admin/users', label: 'المستخدمون', icon: Users2 },
    { href: '/admin/orders', label: 'الطلبات', icon: ShoppingCart },
    { href: '/admin/campaigns', label: 'الحملات', icon: Megaphone },
    { href: '/admin/services', label: 'الخدمات', icon: Package },
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
