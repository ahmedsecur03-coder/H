import Link from 'next/link';
import { cn } from '@/lib/utils';

const HagaatyIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M74.968 83.2803C63.536 83.2803 54.04 78.4803 50.12 71.9523C47.912 75.3123 45.008 78.0723 41.576 80.0643C35.912 83.4243 28.536 84.4323 22 82.9923C27.664 89.2323 35.848 92.7363 45.448 92.7363C52.072 92.7363 58.048 90.7443 62.648 87.1203C67.248 83.4963 70.472 78.6963 71.912 73.1523C73.448 79.3923 77.864 84.1923 83.624 86.8643L85.608 84.5283C80.392 82.0323 76.552 78.0963 74.968 73.1523C77.304 77.0883 80.664 80.1123 84.68 81.8883L83.336 86.8643C78.92 84.9123 74.968 83.2803 74.968 83.2803Z"
      className="text-primary fill-current"
    />
    <path
      d="M93.304 80.6883L88.984 82.0323L90.328 77.0563L94.648 78.4003L93.304 80.6883Z"
      className="text-primary fill-current"
    />
  </svg>
);


export default function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <div className="rounded-lg bg-primary/10 p-1">
        <HagaatyIcon />
      </div>
      <span className="text-2xl font-bold font-headline text-foreground">hagaaty</span>
    </Link>
  );
}
