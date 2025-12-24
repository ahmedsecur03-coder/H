
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
} from 'lucide-react';
import { PLATFORM_ICONS } from './icon-data';


export const publicNavItems: NestedNavItem[] = [
    { href: '/', label: 'الرئيسية', icon: Home },
    { 
      label: 'الخدمات',
      icon: Package,
      children: [
        { href: '/services', label: 'خدمات SMM', description: 'زيادة المتابعين، الإعجابات، المشاهدات لجميع المنصات.', icon: Users },
        { href: '/dashboard/campaigns', label: 'الحملات الإعلانية', description: 'إدارة حملاتك الإعلانية على جوجل، ميتا، وتيك توك.', icon: Megaphone },
        { href: '/dashboard/agency-accounts', label: 'حسابات إعلانية (ايجنسي)', description: 'شراء وشحن حسابات إعلانية احترافية.', icon: Briefcase },
        { href: '/#', label: 'تصميم المواقع', description: 'تصميم وتطوير مواقع احترافية لعملك.', icon: AppWindow },
      ]
    },
    { href: '/blog', label: 'المدونة', icon: BookOpen },
];

export const dashboardNavItems: NestedNavItem[] = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { 
    label: 'الحملات الإعلانية',
    icon: Megaphone,
     children: [
        { href: '/dashboard/campaigns', label: 'بدء واداره الحملات اعلانيه', icon: Megaphone },
        { href: '/dashboard/agency-accounts', label: 'فتح حسابات إعلانية (ايجنسي)', icon: Briefcase },
    ]
  },
  { 
    label: 'خدمات SMM',
    icon: ShoppingCart,
    children: [
        { href: '/dashboard/services', label: 'كل الخدمات', icon: Rocket },
        { href: '/dashboard/orders', label: 'سجل الطلبات', icon: ListOrdered },
        { href: '/dashboard/mass-order', label: 'طلب جماعي', icon: Package },
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
        { href: '/dashboard/settings', label: 'الإعدادات', icon: Settings },
        { href: '/dashboard/api', label: 'API', icon: Code2 },
      ]
   },
   { href: '/dashboard/system-status', label: 'حالة النظام', icon: HeartPulse },
];

export const adminNavItems: NestedNavItem[] = [
    { href: '/admin/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { href: '/admin/deposits', label: 'الإيداعات', icon: Banknote },
    { href: '/admin/withdrawals', label: 'السحوبات', icon: HandCoins },
    { href: '/admin/users', label: 'المستخدمون', icon: Users2 },
    { href: '/admin/orders', label: 'الطلبات', icon: ShoppingCart },
    { href: '/admin/services', label: 'الخدمات', icon: Package },
    { href: '/admin/campaigns', label: 'الحملات', icon: Megaphone },
    { href: '/admin/support', label: 'الدعم', icon: MessageSquare },
    { href: '/admin/blog', label: 'المدونة', icon: PenSquare },
    { href: '/admin/settings', label: 'الإعدادات', icon: Settings },
    { href: '/admin/system-log', label: 'سجل النظام', icon: History },
    { href: '/dashboard', label: 'لوحة المستخدم', icon: Shield },
];
