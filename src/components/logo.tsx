import Link from 'next/link';
import { cn } from '@/lib/utils';

const HagaatySmmIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="44"
    height="44"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <defs>
      <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0052D4" />
        <stop offset="100%" stopColor="#6FB1FC" />
      </linearGradient>
    </defs>
    
    {/* Creative Abstract Growth Mark (Representing speed and digital expansion) */}
    <circle cx="50" cy="50" r="45" stroke="url(#logo-gradient)" strokeWidth="2" strokeDasharray="10 5" opacity="0.3" />
    <path
      d="M30 70L50 20L70 70L50 60L30 70Z"
      fill="url(#logo-gradient)"
    />
    <path
      d="M45 75L50 65L55 75H45Z"
      fill="#6FB1FC"
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
