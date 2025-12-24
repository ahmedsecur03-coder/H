

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
    { href: '/', label: 'nav.home', icon: Home },
    { 
      label: 'nav.services.title',
      icon: Package,
      children: [
        { href: '/services', label: 'nav.services.smm', description: 'nav.services.smmDesc', icon: Users },
        { href: '/dashboard/campaigns', label: 'nav.services.campaigns', description: 'nav.services.campaignsDesc', icon: Megaphone },
        { href: '/dashboard/agency-accounts', label: 'nav.services.agency', description: 'nav.services.agencyDesc', icon: Briefcase },
        { href: '/#', label: 'nav.services.design', description: 'nav.services.designDesc', icon: AppWindow },
      ]
    },
    { href: '/blog', label: 'nav.blog', icon: BookOpen },
];

export const dashboardNavItems: NestedNavItem[] = [
  { href: '/dashboard', label: 'nav.dashboard', icon: LayoutDashboard },
  { href: '/dashboard/analytics', label: 'nav.analytics', icon: BarChart2 },
  { href: '/dashboard/add-funds', label: 'nav.addFunds', icon: DollarSign },
  { 
    label: 'nav.orders.title',
    icon: ShoppingCart,
    children: [
        { href: '/dashboard/orders', label: 'nav.orders.history', icon: ListOrdered },
        { href: '/dashboard/mass-order', label: 'nav.orders.massOrder', icon: Package },
    ]
  },
   { 
    label: 'nav.campaigns.title',
    icon: Megaphone,
     children: [
        { href: '/dashboard/campaigns', label: 'nav.campaigns.manage', icon: Megaphone },
        { href: '/dashboard/agency-accounts', label: 'nav.campaigns.agency', icon: Briefcase },
    ]
  },
  { href: '/dashboard/affiliate', label: 'nav.affiliate', icon: Users },
  { href: '/dashboard/support', label: 'nav.support', icon: MessageSquare },
  { 
      label: 'nav.account.title',
      icon: UserCircle,
      children: [
        { href: '/dashboard/profile', label: 'nav.account.profile', icon: UserCircle },
        { href: '/dashboard/settings', label: 'nav.account.settings', icon: Settings },
        { href: '/dashboard/api', label: 'nav.account.api', icon: Code2 },
      ]
   },
   { href: '/dashboard/system-status', label: 'nav.systemStatus', icon: HeartPulse },
];

export const adminNavItems: NestedNavItem[] = [
    { href: '/admin/dashboard', label: 'adminNav.dashboard', icon: LayoutDashboard },
    { href: '/admin/deposits', label: 'adminNav.deposits', icon: Banknote },
    { href: '/admin/withdrawals', label: 'adminNav.withdrawals', icon: HandCoins },
    { href: '/admin/users', label: 'adminNav.users', icon: Users2 },
    { href: '/admin/orders', label: 'adminNav.orders', icon: ShoppingCart },
    { href: '/admin/services', label: 'adminNav.services', icon: Package },
    { href: '/admin/campaigns', label: 'adminNav.campaigns', icon: Megaphone },
    { href: '/admin/support', label: 'adminNav.support', icon: MessageSquare },
    { href: '/admin/blog', label: 'adminNav.blog', icon: PenSquare },
    { href: '/admin/settings', label: 'adminNav.settings', icon: Settings },
    { href: '/admin/system-log', label: 'adminNav.systemLog', icon: History },
    { href: '/dashboard', label: 'adminNav.userDashboard', icon: Shield },
];
