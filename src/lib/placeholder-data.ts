

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
  History
} from 'lucide-react';
import { PLATFORM_ICONS } from './icon-data';


export const dashboardNavItems: NestedNavItem[] = [
  { href: '/', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/services', label: 'الخدمات', icon: Package },
  { href: '/orders', label: 'الطلبات', icon: ShoppingCart },
  { href: '/mass-order', label: 'طلب جماعي', icon: ListOrdered },
  { href: '/add-funds', label: 'شحن الرصيد', icon: DollarSign },
  { href: '/affiliate', label: 'برنامج الإحالة', icon: Users },
  {
    label: 'الخدمات المتقدمة',
    icon: Rocket,
    href: '#',
    children: [
        { href: '/campaigns', label: 'الحملات الإعلانية', icon: Megaphone },
        { href: '/agency-accounts', label: 'حسابات إعلانية وكالة', icon: Briefcase },
    ]
  },
  { href: '/blog', label: 'المدونة', icon: BookOpen },
  { href: '/support', label: 'الدعم الفني', icon: MessageSquare },
  { href: '/api', label: 'API', icon: Code2 },
  { href: '/system-status', label: 'حالة النظام', icon: HeartPulse },
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
    { href: '/admin/system-log', label: 'سجل النظام', icon: History },
    { href: '/', label: 'لوحة المستخدم', icon: Shield },
];
