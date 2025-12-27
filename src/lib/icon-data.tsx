import React from 'react';
import { Package, Facebook, Youtube, Send, Twitter, Users, Clapperboard, Gamepad2, MapPin, Search, AppWindow, Waypoints, Star, MessageSquare, Hand, Radio, Wifi, Rss, Tv, Bot, Club, Instagram as InstagramIcon } from 'lucide-react';
// The partner icons are no longer needed here as they are rendered directly in the partners component.
// We will only import WhatsAppIcon if it exists, otherwise define it inline.

export function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.7-5.1a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

export const PLATFORM_ICONS: { [key: string]: React.ElementType } = {
  Instagram: InstagramIcon,
  TikTok: Rss, // Placeholder, actual images are used
  Facebook: Facebook,
  YouTube: Youtube,
  Telegram: Send,
  'X (Twitter)': Twitter,
  Google: Search, // Placeholder
  Snapchat: Star, // Placeholder
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
  Meta: Facebook, // Placeholder
  Default: Package,
};
