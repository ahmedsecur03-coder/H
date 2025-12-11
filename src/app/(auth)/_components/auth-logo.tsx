import { Flame } from 'lucide-react';

export default function AuthLogo() {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
        <div className="rounded-lg bg-primary/20 p-3 mb-2">
            <Flame className="h-10 w-10 text-primary" />
        </div>
      <span className="text-2xl font-bold font-headline text-primary-foreground">حاجاتي</span>
    </div>
  );
}
