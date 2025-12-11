
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
  Rocket,
  PenSquare,
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
    { href: '/admin/blog', label: 'المدونة', icon: PenSquare },
    { href: '/admin/settings', label: 'الإعدادات', icon: Settings },
];
