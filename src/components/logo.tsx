import Link from 'next/link';
import { cn } from '@/lib/utils';

const HagaatySmmIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="44"
    height="44"
    viewBox="0 0 120 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <defs>
      <linearGradient id="h-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0052D4" />
        <stop offset="100%" stopColor="#6FB1FC" />
      </linearGradient>
      <linearGradient id="swoosh-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0052D4" />
        <stop offset="100%" stopColor="#6FB1FC" />
      </linearGradient>
    </defs>
    
    {/* H Shape (Blue Gradient) */}
    <path
      d="M10 20V80H25V55H45V80H60V20H45V45H25V20H10Z"
      fill="url(#h-gradient)"
    />
    
    {/* S Shape (Dark Navy/Black) */}
    <path
      d="M55 35C55 30 60 25 75 25H100V40H75C70 40 70 45 75 45H90C105 45 110 55 110 65C110 75 105 85 90 85H50V70H90C95 70 95 65 90 65H75C60 65 55 55 55 45C55 40 57 37 60 35Z"
      fill="#0B1120"
      className="dark:fill-slate-200"
    />
    
    {/* Dynamic Swoosh (The diagonal cut from the image) */}
    <path
      d="M5 75L115 35L118 42L8 82L5 75Z"
      fill="url(#swoosh-gradient)"
      opacity="0.9"
    />
  </svg>
);

export default function Logo({ className, hideText }: { className?: string; hideText?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-3 group", className)}>
      <div className="relative flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
        <HagaatySmmIcon />
      </div>
      {!hideText && (
        <div className="flex flex-col leading-tight">
          <span className="text-xl font-black font-headline tracking-tighter text-foreground uppercase italic">
            Hagaaty <span className="text-primary">SMM</span>
          </span>
          <span className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
            Creative Digital Growth
          </span>
        </div>
      )}
    </Link>
  );
}