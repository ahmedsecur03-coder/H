

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
  Banknote,
  Users2,
  BookOpen,
  HeartPulse,
  Code2,
  Rocket,
  PenSquare,
  Briefcase,
  Palette,
  Shield,
  History,
  Home,
  HandCoins,
  AppWindow,
  UserCircle,
  BarChart2,
} from 'lucide-react';
import { PLATFORM_ICONS } from './icon-data';


export const publicNavItems: NestedNavItem[] = [
    { href: '/', label: 'الرئيسية', icon: Home },
    { 
      label: 'الخدمات',
      icon: Package,
      children: [
        { href: '/services', label: 'جميع خدمات SMM', description: 'تصفح كل خدمات التسويق عبر وسائل التواصل الاجتماعي.', icon: Users },
        { href: '/dashboard/campaigns', label: 'الحملات الإعلانية', description: 'إدارة حملاتك على جوجل، فيسبوك، وتيك توك.', icon: Megaphone },
        { href: '/dashboard/agency-accounts', label: 'حسابات إعلانية (وكالة)', description: 'شراء وإدارة حسابات قوية وموثوقة للإنفاق العالي.', icon: Briefcase },
        { href: '/#', label: 'تصميم المواقع والتطبيقات', description: 'اطلب تصميم موقع أو تطبيق احترافي. (قريباً)', icon: AppWindow },
      ]
    },
    { href: '/blog', label: 'المدونة', icon: BookOpen },
];

export const dashboardNavItems: NestedNavItem[] = [
  { href: '/dashboard', label: ' لوحة التحكم', icon: LayoutDashboard },
  { href: '/dashboard/analytics', label: 'التحليلات', icon: BarChart2 },
  { href: '/dashboard/add-funds', label: 'شحن الرصيد', icon: DollarSign },
  { 
    label: 'الطلبات',
    icon: ShoppingCart,
    children: [
        { href: '/dashboard/orders', label: 'سجل الطلبات', icon: ListOrdered },
        { href: '/dashboard/mass-order', label: 'طلب جماعي', icon: Package },
    ]
  },
   { 
    label: 'الحملات الإعلانية',
    icon: Megaphone,
     children: [
        { href: '/dashboard/campaigns', label: 'إدارة الحملات', icon: Megaphone },
        { href: '/dashboard/agency-accounts', label: 'حساباتي الإعلانية', icon: Briefcase },
    ]
  },
  { href: '/dashboard/affiliate', label: 'برنامج الإحالة', icon: Users },
  { href: '/dashboard/support', label: 'الدعم الفني', icon: MessageSquare },
  { 
      label: 'الحساب',
      icon: UserCircle,
      children: [
        { href: '/dashboard/profile', label: 'الملف الشخصي', icon: UserCircle },
        { href: '/dashboard/settings', label: 'الإعدادات', icon: Settings },
        { href: '/dashboard/api', label: 'API', icon: Code2 },
      ]
   },
   { href: '/dashboard/system-status', label: 'حالة النظام', icon: HeartPulse },
];

export const adminNavItems: NestedNavItem[] = [
    { href: '/admin/dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { href: '/admin/deposits', label: 'الإيداعات', icon: Banknote },
    { href: '/admin/withdrawals', label: 'السحوبات', icon: HandCoins },
    { href: '/admin/users', label: 'المستخدمون', icon: Users2 },
    { href: '/admin/orders', label: 'الطلبات', icon: ShoppingCart },
    { href: '/admin/services', label: 'الخدمات', icon: Package },
    { href: '/admin/campaigns', label: 'الحملات', icon: Megaphone },
    { href: '/admin/support', label: 'الدعم الفني', icon: MessageSquare },
    { href: '/admin/blog', label: 'المدونة', icon: PenSquare },
    { href: '/admin/settings', label: 'الإعدادات', icon: Settings },
    { href: '/admin/system-log', label: 'سجل النظام', icon: History },
    { href: '/dashboard', label: 'لوحة المستخدم', icon: Shield },
];
