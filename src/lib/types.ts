export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  rank: 'مستكشف نجمي' | 'قائد صاروخي' | 'سيد المجرة' | 'سيد كوني';
  balance: number;
  adBalance: number;
  totalSpent: number;
  referralCode: string;
  createdAt: string;
};

export type Order = {
  id: string;
  serviceId: string;
  serviceName: string;
  link?: string;
  quantity: number;
  charge: number;
  orderDate: string;
  status: 'مكتمل' | 'قيد التنفيذ' | 'ملغي' | 'جزئي';
};

export type Campaign = {
  id: string;
  name: string;
  platform: 'Google' | 'Facebook' | 'TikTok' | 'Snapchat';
  status: 'نشط' | 'متوقف' | 'مكتمل';
  spend: number;
  budget: number;
  startDate: string;
};

export type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};
