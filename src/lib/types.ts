export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  rank: 'مستكشف نجمي' | 'قائد صاروخي' | 'سيد المجرة' | 'سيد كوني';
  role?: 'admin' | 'user';
  balance: number;
  adBalance: number;
  totalSpent: number;
  referralCode: string;
  referrerId: string | null;
  createdAt: string;
  lastRewardClaimedAt?: string; // Date and time the daily reward was last claimed.
  affiliateEarnings?: number;
  referralsCount?: number;
  affiliateLevel?: 'برونزي' | 'فضي' | 'ذهبي' | 'ماسي';
  notificationPreferences?: {
    newsletter?: boolean;
    orderUpdates?: boolean;
  };
};

export type Service = {
  id: string;
  platform: string;
  category: string;
  price: number; // Price per 1000
  min: number;
  max: number;
  description?: string;
  avgTime?: string;
  guarantee?: boolean;
  speed?: string;
  dripFeed?: boolean;
  refill?: boolean;
  startTime?: string;
  dropRate?: string;
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
  description?: string;
};

export type NestedNavItem = NavItem & {
  children?: Omit<NestedNavItem, 'children'>[];
}


export type Campaign = {
    id: string;
    userId: string;
    name: string;
    platform: 'Google' | 'Facebook' | 'TikTok' | 'Snapchat';
    goal: 'زيارات للموقع' | 'مشاهدات فيديو' | 'تفاعل مع المنشور' | 'زيادة الوعي' | 'تحويلات';
    targetAudience: string;
    startDate: string;
    endDate?: string;
    budget: number;
    durationDays: number;
    spend: number;
    status: 'نشط' | 'متوقف' | 'مكتمل' | 'بانتظار المراجعة';
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    results: number;
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

export type Withdrawal = {
    id: string;
    userId: string;
    amount: number;
    method: 'فودافون كاش' | 'Binance Pay';
    details: Record<string, any>;
    requestDate: string;
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

export type BlogPost = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  publishDate: string;
};


export type SystemLog = {
    id: string;
    event: string;
    level: 'info' | 'warning' | 'error';
    message: string;
    timestamp: string;
    metadata: Record<string, any>;
}