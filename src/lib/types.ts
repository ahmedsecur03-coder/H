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
  serviceId: string;
  serviceName: string;
  link: string;
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

export type Ticket = {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: 'مفتوحة' | 'مغلقة' | 'قيد المراجعة';
  createdDate: string;
  messages: {
    sender: 'user' | 'admin';
    text: string;
    timestamp: string;
  }[];
};

export type Deposit = {
  id: string;
  userId: string;
  amount: number;
  paymentMethod: 'فودافون كاش' | 'Binance Pay';
  details: { [key: string]: string }; // e.g., { "phoneNumber": "010..." } or { "transactionId": "..." }
  depositDate: string;
  status: 'معلق' | 'مقبول' | 'مرفوض';
};

export type AffiliateTransaction = {
    id: string;
    userId: string; // User who earned the commission
    referralId: string; // User who made the purchase
    orderId: string;
    amount: number;
    level: number; // 1, 2, 3, 4, 5
    transactionDate: string;
};


export type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};
