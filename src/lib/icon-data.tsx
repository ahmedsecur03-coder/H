
import React from 'react';
import { Package, Facebook, Youtube, Send, Twitter, Users, Clapperboard, Gamepad2, MapPin, Search, AppWindow, Waypoints, Star, MessageSquare, Hand, Radio, Wifi, Rss, Tv, Bot, Club, Instagram as InstagramIcon } from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/icons';

export const PLATFORM_ICONS: { [key: string]: React.ElementType } = {
  Instagram: InstagramIcon,
  TikTok: Rss, // Using a generic icon as placeholder
  Facebook: Facebook,
  YouTube: Youtube,
  Telegram: Send,
  'X (Twitter)': Twitter,
  Google: Search, 
  Snapchat: Star, // Using a generic icon as placeholder
  'خدمات الألعاب': Gamepad2,
  'خرائط جوجل': MapPin,
  'زيارات مواقع': Search,
  'خدمات الوكالة': Waypoints,
  'الحملات الإعلانية': Waypoints,
  'تصميم المواقع': AppWindow,
  'Kwai': Star,
  'WhatsApp': WhatsAppIcon,
  'VK': Users,
  'Threads': Rss,
  'Kick': Radio,
  'Clubhouse': Club,
  Meta: Facebook, // Using facebook as a representative icon for Meta
  Default: Package,
};

    