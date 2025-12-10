import { Rocket } from 'lucide-react';
import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-primary">
      <Rocket className="h-6 w-6" />
      <span className="text-xl font-bold font-headline">حاجاتي</span>
    </Link>
  );
}
