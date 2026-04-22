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
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    {/* Animated Living Pulse Layers */}
    <circle cx="50" cy="50" r="40" stroke="url(#logo-gradient)" strokeWidth="1" strokeDasharray="10 5" opacity="0.4" className="animate-[spin_10s_linear_infinite]" />
    
    <circle cx="50" cy="50" r="30" fill="url(#logo-gradient)" opacity="0.2" className="animate-pulse">
        <animate attributeName="r" values="25;35;25" dur="3s" repeatCount="indefinite" />
    </circle>
    
    <circle cx="50" cy="50" r="20" fill="url(#logo-gradient)" opacity="0.5" filter="url(#glow)">
         <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
    </circle>

    {/* Dynamic Center Mark */}
    <rect x="45" y="45" width="10" height="10" rx="2" fill="white" className="animate-bounce" />
    
    {/* Orbital Path */}
    <path
      d="M50 15 A 35 35 0 0 1 85 50"
      stroke="url(#logo-gradient)"
      strokeWidth="3"
      strokeLinecap="round"
      className="animate-[spin_3s_linear_infinite]"
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
