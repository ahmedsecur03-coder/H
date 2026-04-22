import Link from 'next/link';
import { cn } from '@/lib/utils';

const TechLogoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="44"
    height="44"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <defs>
      <linearGradient id="tech-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0052D4" />
        <stop offset="50%" stopColor="#6FB1FC" />
        <stop offset="100%" stopColor="#0052D4" />
      </linearGradient>
      <filter id="tech-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    {/* Outer Hexagon Frame */}
    <path
      d="M50 5 L89 27.5 V72.5 L50 95 L11 72.5 V27.5 L50 5Z"
      stroke="url(#tech-gradient)"
      strokeWidth="2"
      strokeDasharray="4 2"
      opacity="0.5"
      className="animate-[spin_20s_linear_infinite]"
    />

    {/* Inner Animated Circuits */}
    <path
      d="M50 20 L75 35 V65 L50 80 L25 65 V35 L50 20Z"
      stroke="url(#tech-gradient)"
      strokeWidth="3"
      filter="url(#tech-glow)"
    >
      <animate
        attributeName="stroke-dasharray"
        values="0,150;150,0;0,150"
        dur="4s"
        repeatCount="indefinite"
      />
    </path>

    {/* Central Pulsing Data Node */}
    <circle cx="50" cy="50" r="12" fill="url(#tech-gradient)" className="animate-pulse" />
    <circle cx="50" cy="50" r="6" fill="white">
      <animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" />
    </circle>

    {/* Moving Connections */}
    <g opacity="0.8">
       <circle cx="50" cy="20" r="2" fill="white">
          <animate attributeName="cy" values="20;80;20" dur="3s" repeatCount="indefinite" />
       </circle>
       <circle cx="25" cy="35" r="2" fill="white">
          <animate attributeName="cx" values="25;75;25" dur="2.5s" repeatCount="indefinite" />
       </circle>
    </g>

    {/* Tech Scanner Line */}
    <rect x="15" y="0" width="70" height="2" fill="white" opacity="0.3" filter="url(#tech-glow)">
      <animateTransform
        attributeName="transform"
        type="translate"
        from="0 10"
        to="0 90"
        dur="2s"
        repeatCount="indefinite"
      />
    </rect>
  </svg>
);

export default function Logo({ className, hideText }: { className?: string; hideText?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-3 group", className)}>
      <div className="relative flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
        <TechLogoIcon />
      </div>
      {!hideText && (
        <div className="flex flex-col leading-tight">
          <span className="text-xl font-black font-headline tracking-tighter text-foreground uppercase italic">
            Hagaaty <span className="text-primary">SMM</span>
          </span>
          <span className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
            Advanced Tech Solutions
          </span>
        </div>
      )}
    </Link>
  );
}
