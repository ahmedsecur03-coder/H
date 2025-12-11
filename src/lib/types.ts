
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
  userId: string;
  serviceId: string;
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

export type NestedNavItem = NavItem & {
  children?: NavItem[];
}


export type Campaign = {
    id: string;
    userId: string;
    name: string;
    platform: 'Google' | 'Facebook' | 'TikTok' | 'Snapchat' | 'API';
    startDate: string;
    endDate?: string;
    budget: number;
    spend: number;
    status: 'نشط' | 'متوقف' | 'مكتمل' | 'بانتظار المراجعة';
};

export type Deposit = {
    id: string;
    userId: string;
    amount: number;
    paymentMethod: 'فودافون كاش' | 'Binance Pay';
    details: Record<string, any>;
    depositDate: string;
    status: 'معلق' | 'مقبول' | 'مرفوض';
};

export type AffiliateTransaction = {
    id: string;
    userId: string;
    referralId: string;
    orderId: string;
    amount: number;
    transactionDate: string;
    level: number;
};

export type Ticket = {
    id: string;
    userId: string;
    subject: string;
    message: string;
    status: 'مفتوحة' | 'قيد المراجعة' | 'مغلقة';
    createdDate: string;
    messages: {
        sender: 'user' | 'admin';
        text: string;
        timestamp: string;
    }[];
};
