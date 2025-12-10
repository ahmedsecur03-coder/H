import { Flame } from 'lucide-react';

export default function AuthLogo() {
  return (
    <div className="flex flex-col items-center gap-2 text-primary">
      <Flame className="h-10 w-10 text-primary" />
      <span className="text-2xl font-bold font-headline text-primary-foreground">حاجاتي</span>
    </div>
  );
}
