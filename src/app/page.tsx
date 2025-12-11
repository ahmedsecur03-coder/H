
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import CosmicBackground from '@/components/cosmic-background';

// This page now acts as a router.
// If the user is logged in, it redirects to the dashboard.
// If not, it redirects to the public landing page.
export default function InitialRoutingPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/home');
      }
    }
  }, [user, isUserLoading, router]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4 overflow-hidden">
        <CosmicBackground />
        <div className="z-10 flex flex-col items-center gap-4 text-center">
             <Loader2 className="h-16 w-16 text-primary animate-spin" />
             <h1 className="text-2xl font-headline font-bold text-primary-foreground">جاري توجيهك إلى مجرة حاجاتي...</h1>
        </div>
    </div>
  );
}
