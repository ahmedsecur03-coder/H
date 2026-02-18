
import type { NestedNavItem } from '@/lib/types';
import {
  LayoutDashboard,
  ShoppingCart,
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

export const publicNavItems: NestedNavItem[] = [
    { href: '/', label: 'الرئيسية', icon: Home },
    { 
      label: 'الخدمات',
      icon: Package,
      children: [
        { href: '/services', label: 'خدمات SMM', description: 'زيادة المتابعين، الإعجابات، المشاهدات لجميع المنصات.', icon: Rocket },
        { href: '/dashboard/mass-order', label: 'طلب جماعي', description: 'أضف مئات الطلبات دفعة واحدة بسهولة.', icon: Package },
      ]
    },
    { href: '/about', label: 'من نحن', icon: Info },
    { href: '/blog', label: 'المدونة', icon: BookOpen },
];

export const dashboardNavItems: NestedNavItem[] = [
  { href: '/dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { 
    label: 'خدمات SMM',
    icon: ShoppingBag,
    children: [
        { href: '/dashboard/services', label: 'قائمة الخدمات', icon: Rocket },
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
        label: 'العمليات المالية',
        icon: DollarSign,
        children: [
           { href: '/admin/deposits', label: 'الإيداعات', icon: Banknote },
           { href: '/admin/withdrawals', label: 'السحوبات', icon: HandCoins },
        ]
    },
    { href: '/admin/orders', label: 'إدارة الطلبات', icon: ListOrdered },
    { href: '/admin/services', label: 'إدارة الخدمات', icon: Package },
    { 
        label: 'المحتوى',
        icon: PenSquare,
        children: [
           { href: '/admin/blog', label: 'المدونة', icon: BookOpen },
        ]
    },
    { 
        label: 'النظام',
        icon: Settings,
        children: [
            { href: '/admin/settings', label: 'الإعدادات العامة', icon: Settings },
            { href: '/admin/system-log', label: 'سجل النظام', icon: Terminal },
            { href: '/admin/system-status', label: 'حالة النظام', icon: ServerCrash },
        ]
    },
    { href: '/dashboard', label: 'عرض كـ مستخدم', icon: Shield },
];
