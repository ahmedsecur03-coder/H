
import {
  LayoutDashboard,
  Package,
  ListOrdered,
  DollarSign,
  Users,
  MessageSquare,
  Settings,
  Banknote,
  Users2,
  BookOpen,
  HeartPulse,
  Code2,
  Rocket,
  PenSquare,
  Shield,
  Home,
  HandCoins,
  UserCircle,
  Info,
  Terminal,
  ShoppingBag,
  ServerCrash,
} from 'lucide-react';
import type { NestedNavItem } from '@/lib/types';

export const publicNavItems: NestedNavItem[] = [
    { href: '/', label: 'الرئيسية', icon: Home },
    { 
      label: 'الخدمات',
      icon: Package,
      children: [
        { href: '/services', label: 'قائمة الخدمات', description: 'تصفح جميع خدمات SMM المتاحة.', icon: Rocket },
        { href: '/dashboard/mass-order', label: 'طلب جماعي', description: 'أضف طلبات متعددة دفعة واحدة.', icon: Package },
      ]
    },
    { href: '/about', label: 'من نحن', icon: Info },
    { href: '/blog', label: 'المدونة', icon: BookOpen },
];

export const dashboardNavItems: NestedNavItem[] = [
  { href: '/dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { 
    label: 'الطلبات',
    icon: ShoppingBag,
    children: [
        { href: '/dashboard/services', label: 'طلب جديد', icon: Rocket },
        { href: '/dashboard/mass-order', label: 'طلب جماعي', icon: Package },
        { href: '/dashboard/orders', label: 'سجل الطلبات', icon: ListOrdered },
    ]
  },
  { href: '/dashboard/add-funds', label: 'شحن الرصيد', icon: DollarSign },
  { href: '/dashboard/affiliate', label: 'التسويق بالعمولة', icon: Users },
  { href: '/dashboard/support', label: 'الدعم الفني', icon: MessageSquare },
  { 
      label: 'الحساب',
      icon: UserCircle,
      children: [
        { href: '/dashboard/profile', label: 'الملف الشخصي', icon: UserCircle },
        { href: '/dashboard/api', label: 'واجهة API', icon: Code2 },
        { href: '/dashboard/settings', label: 'الإعدادات', icon: Settings },
      ]
   },
   { href: '/dashboard/system-status', label: 'حالة النظام', icon: HeartPulse },
];

export const adminNavItems: NestedNavItem[] = [
    { href: '/admin/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { href: '/admin/users', label: 'المستخدمون', icon: Users2 },
    { 
        label: 'المالية',
        icon: DollarSign,
        children: [
           { href: '/admin/deposits', label: 'الإيداعات', icon: Banknote },
           { href: '/admin/withdrawals', label: 'السحوبات', icon: HandCoins },
        ]
    },
    { href: '/admin/orders', label: 'الطلبات', icon: ListOrdered },
    { href: '/admin/services', label: 'الخدمات', icon: Package },
    { href: '/admin/blog', label: 'المدونة', icon: BookOpen },
    { 
        label: 'النظام',
        icon: Settings,
        children: [
            { href: '/admin/settings', label: 'الإعدادات', icon: Settings },
            { href: '/admin/system-log', label: 'السجلات', icon: Terminal },
            { href: '/admin/system-status', label: 'الحالة', icon: ServerCrash },
        ]
    },
    { href: '/dashboard', label: 'عرض كـ مستخدم', icon: Shield },
];
