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
  { href: '/services', label: 'جميع الخدمات', icon: Package },
  { href: '/orders', label: 'إدارة الطلبات', icon: ShoppingCart },
  { href: '/mass-order', label: 'طلب جماعي', icon: ListOrdered },
  { href: '/add-funds', label: 'شحن الرصيد', icon: DollarSign },
  { href: '/affiliate', label: 'نظام الإحالة', icon: Users },
  { href: '/campaigns', label: 'مركز الحملات', icon: Megaphone },
  { href: '/support', label: 'الدعم الفني', icon: MessageSquare },
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
    { date: '2024-05-01', orders: 10, spend: 50, revenue: 75 },
    { date: '2024-05-02', orders: 12, spend: 65, revenue: 90 },
    { date: '2024-05-03', orders: 8, spend: 40, revenue: 60 },
    { date: '2024-05-04', orders: 15, spend: 80, revenue: 120 },
    { date: '2024-05-05', orders: 18, spend: 95, revenue: 140 },
    { date: '2024-05-06', orders: 14, spend: 70, revenue: 105 },
    { date: '2024-05-07', orders: 20, spend: 110, revenue: 165 },
];
