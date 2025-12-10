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

export const performanceData = [
    { date: '2024-05-01', orders: 10, spend: 50 },
    { date: '2024-05-02', orders: 12, spend: 65 },
    { date: '2024-05-03', orders: 8, spend: 40 },
    { date: '2024-05-04', orders: 15, spend: 80 },
    { date: '2024-05-05', orders: 18, spend: 95 },
    { date: '2024-05-06', orders: 14, spend: 70 },
    { date: '2024-05-07', orders: 20, spend: 110 },
];
