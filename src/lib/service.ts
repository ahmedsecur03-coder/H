
import type { User } from '@/lib/types';

export const RANKS: { name: User['rank']; spend: number; discount: number, reward: number }[] = [
  { name: 'مستكشف نجمي', spend: 0, discount: 0, reward: 0 },
  { name: 'قائد صاروخي', spend: 500, discount: 2, reward: 5 },
  { name: 'سيد المجرة', spend: 2500, discount: 5, reward: 20 },
  { name: 'سيد كوني', spend: 10000, discount: 10, reward: 50 },
];

export const AFFILIATE_LEVELS = {
    'برونزي': { commission: 10 },
    'فضي': { commission: 12 },
    'ذهبي': { commission: 15 },
    'ماسي': { commission: 20 },
};


export function getRankForSpend(spend: number) {
  let currentRank = RANKS[0];
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (spend >= RANKS[i].spend) {
      currentRank = RANKS[i];
      break;
    }
  }
  return currentRank;
}
