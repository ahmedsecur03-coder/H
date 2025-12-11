

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
  Instagram,
  Clapperboard,
  Facebook,
  Youtube,
  Send,
  Twitter,
  Globe,
  Palette,
  Briefcase
} from 'lucide-react';
import React from 'react';


export const dashboardNavItems: NestedNavItem[] = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { 
    label: 'الخدمات', 
    icon: Package,
    href: '/dashboard/services',
    children: [
        { href: '/dashboard/services?platform=Instagram', label: 'انستغرام', icon: Instagram },
        { href: '/dashboard/services?platform=TikTok', label: 'تيك توك', icon: Clapperboard },
        { href: '/dashboard/services?platform=Facebook', label: 'فيسبوك', icon: Facebook },
        { href: '/dashboard/services?platform=YouTube', label: 'يوتيوب', icon: Youtube },
        { href: '/dashboard/services?platform=Telegram', label: 'تيليجرام', icon: Send },
        { href: '/dashboard/services?platform=X (Twitter)', label: 'اكس (تويتر)', icon: Twitter },
    ]
  },
  { href: '/dashboard/orders', label: 'الطلبات', icon: ShoppingCart },
  { href: '/dashboard/mass-order', label: 'طلب جماعي', icon: ListOrdered },
  { href: '/dashboard/add-funds', label: 'شحن الرصيد', icon: DollarSign },
  { href: '/dashboard/affiliate', label: 'برنامج الإحالة', icon: Users },
  {
    label: 'الخدمات المتقدمة',
    icon: Rocket,
    href: '#',
    children: [
        { href: '/dashboard/campaigns', label: 'الحملات الإعلانية', icon: Megaphone },
        { href: '#', label: 'حسابات إعلانية وكالة', icon: Briefcase },
        { href: '#', label: 'تصميم المواقع', icon: Palette },
    ]
  },
  { href: '/dashboard/blog', label: 'المدونة', icon: BookOpen },
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
