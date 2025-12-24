import React from 'react';
import { Package, Facebook, Youtube, Send, Twitter, Users, Clapperboard, Gamepad2, MapPin, Search, AppWindow, Waypoints, Star, MessageSquare, Hand, Radio, Wifi, Rss, Tv, Bot, Club, Instagram as InstagramIcon } from 'lucide-react';
import { GoogleIcon, MetaIcon, TikTokIcon, SnapchatIcon } from '@/components/ui/icons';

export const PLATFORM_ICONS: { [key: string]: React.ElementType } = {
  Instagram: InstagramIcon,
  TikTok: TikTokIcon,
  Facebook: Facebook,
  YouTube: Youtube,
  Telegram: Send,
  'X (Twitter)': Twitter,
  Google: GoogleIcon,
  Snapchat: SnapchatIcon,
  'خدمات الألعاب': Gamepad2,
  'خرائط جوجل': MapPin,
  'زيارات مواقع': Search,
  'خدمات الوكالة': Waypoints,
  'الحملات الإعلانية': Waypoints,
  'تصميم المواقع': AppWindow,
  'Kwai': Star,
  'WhatsApp': MessageSquare,
  'VK': Users,
  'Threads': Rss,
  'Kick': Radio,
  'Clubhouse': Club,
  Meta: MetaIcon,
  Default: Package,
};
