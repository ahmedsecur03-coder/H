
'use client';

import Logo from "@/components/logo"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { PanelLeft, Shield } from "lucide-react"
import Link from "next/link";
import { dashboardNavItems } from "@/lib/placeholder-data";
import { usePathname } from "next/navigation";
import { UserNav } from "./user-nav";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from 'firebase/firestore';
import type { User as UserType } from '@/lib/types';

export function MobileHeader({ isAdmin }: { isAdmin: boolean }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const userDocRef = useMemoFirebase(() => (firestore && user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
    const { data: userData } = useDoc<UserType>(userDocRef);

    const pathname = usePathname();
    const appUser = {
        name: user?.displayName || `مستخدم`,
        email: user?.email || "مستخدم مجهول",
        avatarUrl: user?.photoURL || `https://i.pravatar.cc/150?u=${user?.uid}`,
        id: user?.uid || 'N/A'
    };
    
    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-xs">
              <SheetHeader className="text-right mb-6">
                <SheetTitle><Logo /></SheetTitle>
                <SheetDescription>
                  قائمة التنقل الرئيسية في لوحة التحكم
                </SheetDescription>
              </SheetHeader>
              <nav className="grid gap-6 text-lg font-medium">
                {dashboardNavItems.map(item => (
                    <Link
                        key={item.label}
                        href={item.href || '#'}
                        className={`flex items-center gap-4 px-2.5 ${pathname === item.href ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                    </Link>
                ))}
                 {isAdmin && (
                    <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                    >
                       <Shield className="h-5 w-5" />
                        لوحة المسؤول
                    </Link>
                 )}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="ml-auto">
             <UserNav user={appUser} isAdmin={isAdmin} />
          </div>
        </header>
    )
}
