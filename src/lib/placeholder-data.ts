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
  AppWindow
} from 'lucide-react';
import { PLATFORM_ICONS } from './icon-data';


export const publicNavItems: NestedNavItem[] = [
    { href: '/', label: 'الرئيسية', icon: Home },
    { 
      label: 'الخدمات',
      icon: Package,
      href: '/services',
      children: [
        { href: '/services', label: 'جميع خدمات SMM', description: 'تصفح كل خدمات التسويق عبر وسائل التواصل الاجتماعي.', icon: Users },
        { href: '/dashboard/campaigns', label: 'الحملات الإعلانية', description: 'إدارة حملاتك على جوجل، فيسبوك، وتيك توك.', icon: Megaphone },
        { href: '/agency-accounts', label: 'حسابات إعلانية (وكالة)', description: 'حسابات قوية وموثوقة للإنفاق العالي.', icon: Briefcase },
        { href: '/dashboard/support', label: 'تصميم المواقع والتطبيقات', description: 'اطلب تصميم موقع أو تطبيق احترافي.', icon: AppWindow },
      ]
    },
    { href: '/blog', label: 'المدونة', icon: BookOpen },
];

export const dashboardNavItems: NestedNavItem[] = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  {
    label: 'الخدمات',
    icon: Rocket,
    children: [
        { href: '/services', label: 'خدمات SMM', icon: Users },
        { href: '/dashboard/campaigns', label: 'الحملات الإعلانية', icon: Megaphone },
        { href: '/agency-accounts', label: 'حسابات إعلانية وكالة', icon: Briefcase },
    ]
  },
  { href: '/dashboard/orders', label: 'الطلبات', icon: ShoppingCart },
  { href: '/dashboard/mass-order', label: 'طلب جماعي', icon: ListOrdered },
  { href: '/dashboard/add-funds', label: 'شحن الرصيد', icon: DollarSign },
  { href: '/dashboard/affiliate', label: 'برنامج الإحالة', icon: Users },
  { href: '/dashboard/support', label: 'الدعم الفني', icon: MessageSquare },
  { href: '/dashboard/api', label: 'API', icon: Code2 },
  { href: '/blog', label: 'المدونة', icon: BookOpen },
  { href: '/dashboard/system-status', label: 'حالة النظام', icon: HeartPulse },
  { href: '/dashboard/settings', label: 'الإعدادات', icon: Settings },
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
