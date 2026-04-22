import Link from 'next/link';
import { cn } from '@/lib/utils';

const HagaatySmmIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <defs>
      <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0052D4" />
        <stop offset="50%" stopColor="#4364F7" />
        <stop offset="100%" stopColor="#6FB1FC" />
      </linearGradient>
    </defs>
    {/* H Shape */}
    <path
      d="M20 20V80H35V55H65V80H80V20H65V45H35V20H20Z"
      fill="url(#logo-gradient)"
    />
    {/* S Shape Overlay Effect */}
    <path
      d="M45 35C45 30 50 25 60 25H85V40H60C55 40 55 45 60 45H75C85 45 90 55 90 65C90 75 85 85 70 85H40V70H70C75 70 75 65 70 65H55C45 65 40 55 40 45C40 40 42 37 45 35Z"
      fill="#1A1A1A"
      className="dark:fill-white/90"
    />
    {/* Dynamic Swoosh */}
    <path
      d="M10 65L90 35L95 40L15 70L10 65Z"
      fill="url(#logo-gradient)"
      opacity="0.8"
    />
  </svg>
);

export default function Logo({ className, hideText }: { className?: string; hideText?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 group", className)}>
      <div className="relative flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
        <HagaatySmmIcon />
      </div>
      {!hideText && (
        <div className="flex flex-col leading-tight">
          <span className="text-xl font-black font-headline tracking-tighter text-foreground uppercase italic">
            Hagaaty <span className="text-primary">SMM</span>
          </span>
          <span className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
            Your Trusted Panel
          </span>
        </div>
      )}
    </Link>
  );
}
