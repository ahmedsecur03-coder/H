export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  rank: 'مستكشف نجمي' | 'قائد صاروخي' | 'سيد المجرة' | 'سيد كوني';
  balance: number;
  adBalance: number;
  totalSpent: number;
  referralCode: string;
  referrerId: string | null;
  createdAt: string;
  affiliateEarnings?: number;
  referralsCount?: number;
  affiliateLevel?: 'برونزي' | 'فضي' | 'ذهبي' | 'ماسي';
};

export type Service = {
  id: string;
  platform: string;
  category: string;
  price: number; // Price per 1000
  min: number;
  max: number;
};

export type Order = {
  id: string;
  serviceName: string;
  link: string;
  quantity: number;
  charge: number;
  orderDate: string;
  status: 'مكتمل' | 'قيد التنفيذ' | 'ملغي' | 'جزئي';
};

export type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};
