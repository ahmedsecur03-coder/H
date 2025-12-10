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
  Users2
} from 'lucide-react';


export const dashboardNavItems: NestedNavItem[] = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { 
    label: 'الخدمات', 
    icon: Package,
    children: [
        { href: '/dashboard/services?category=instagram', label: 'انستغرام' },
        { href: '/dashboard/services?category=tiktok', label: 'تيك توك' },
        { href: '/dashboard/services?category=facebook', label: 'فيسبوك' },
        { href: '/dashboard/services?category=youtube', label: 'يوتيوب' },
        { href: '/dashboard/services?category=telegram', label: 'تليجرام' },
        { href: '/dashboard/services?category=twitter', label: 'إكس (تويتر)' },
        { href: '/dashboard/services?category=snapchat', label: 'سناب شات' },
        { href: '/dashboard/services?category=kwai', label: 'كواي' },
        { href: '/dashboard/services?category=vk', label: 'VK' },
        { href: '/dashboard/services?category=kick', label: 'Kick' },
        { href: '/dashboard/services?category=clubhouse', label: 'كلوب هاوس' },
        { href: '/dashboard/services?category=website-traffic', label: 'زيارات مواقع' },
    ]
  },
  {
      label: 'الحملات الإعلانية',
      icon: Megaphone,
      children: [
        { href: '/dashboard/campaigns/new', label: 'حملة جديدة' },
        { href: '/dashboard/campaigns', label: 'إدارة الحملات' },
      ]
  },
  { href: '/dashboard/orders', label: 'الطلبات', icon: ShoppingCart },
  { href: '/dashboard/add-funds', label: 'شحن الرصيد', icon: DollarSign },
  { href: '/dashboard/affiliate', label: 'برنامج الإحالة', icon: Users },
  { href: '/dashboard/support', label: 'الدعم الفني', icon: MessageSquare },
];

export const adminNavItems: NestedNavItem[] = [
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
