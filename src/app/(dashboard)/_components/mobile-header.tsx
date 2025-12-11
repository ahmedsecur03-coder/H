
'use client';

import Logo from '@/components/logo';
import { UserNav } from './user-nav';
import { useUser } from '@/firebase';

export function MobileHeader({ isAdmin }: { isAdmin: boolean }) {
  const { user } = useUser();
   const appUser = {
      name: user?.displayName || `مستخدم`,
      email: user?.email || "مستخدم مجهول",
      avatarUrl: user?.photoURL || `https://i.pravatar.cc/150?u=${user?.uid}`,
      id: user?.uid || 'N/A'
  };

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur-sm md:hidden">
      <Logo />
      <div className="flex items-center gap-2 font-body">
        <UserNav user={appUser} isAdmin={isAdmin} />
      </div>
    </header>
  );
}
