import type { User, Order, NavItem } from '@/lib/types';
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

export const mockUser: User = {
  id: '1',
  name: 'عبدالله',
  email: 'user@example.com',
  avatarUrl: 'https://picsum.photos/seed/avatar1/40/40',
  rank: 'قائد صاروخي',
  balance: 150.75,
  adBalance: 50.25,
  totalSpent: 1250.0,
  referralCode: 'REF123XYZ',
};

export const mockOrders: Order[] = [
  {
    id: 'ORD001',
    serviceName: 'متابعين انستغرام',
    link: 'instagram.com/user',
    quantity: 1000,
    charge: 5.0,
    date: '2024-05-20',
    status: 'مكتمل',
  },
  {
    id: 'ORD002',
    serviceName: 'مشاهدات يوتيوب',
    link: 'youtube.com/watch?v=xyz',
    quantity: 5000,
    charge: 12.5,
    date: '2024-05-19',
    status: 'مكتمل',
  },
  {
    id: 'ORD003',
    serviceName: 'إعجابات فيسبوك',
    link: 'facebook.com/page/post',
    quantity: 500,
    charge: 2.75,
    date: '2024-05-19',
    status: 'قيد التنفيذ',
  },
  {
    id: 'ORD004',
    serviceName: 'متابعين تيك توك',
    link: 'tiktok.com/@user',
    quantity: 2000,
    charge: 8.0,
    date: '2024-05-18',
    status: 'جزئي',
  },
  {
    id: 'ORD005',
    serviceName: 'مشاهدات انستغرام ريلز',
    link: 'instagram.com/reel/abc',
    quantity: 10000,
    charge: 4.5,
    date: '2024-05-17',
    status: 'ملغي',
  },
];

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
