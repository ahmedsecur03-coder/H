
import { Sparkles } from 'lucide-react';

export default function AuthLogo() {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
        <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-orange-500 to-amber-400 rounded-full blur-lg animate-pulse"></div>
             <div className="relative rounded-full bg-background p-4 border border-primary/50">
                <Sparkles className="h-8 w-8 text-primary" />
            </div>
        </div>
      <span className="text-2xl font-bold font-headline text-primary-foreground mt-2">حاجاتي</span>
    </div>
  );
}
