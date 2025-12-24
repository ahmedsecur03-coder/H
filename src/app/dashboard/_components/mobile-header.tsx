
'use client';

import Logo from "@/components/logo"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { PanelLeft, Shield } from "lucide-react"
import Link from "next/link";
import { dashboardNavItems } from "@/lib/placeholder-data";
import { usePathname } from "next/navigation";
import { UserNav } from "../_components/user-nav";
import type { User as UserType } from '@/lib/types';
import { useTranslation } from "react-i18next";

export function MobileHeader({ isAdmin, userData }: { isAdmin: boolean, userData: UserType }) {
    const { t } = useTranslation();
    const pathname = usePathname();

    // Use userData from Firestore as the source of truth
    const appUser = {
        name: userData.name,
        email: userData.email,
        avatarUrl: userData.avatarUrl || `https://i.pravatar.cc/150?u=${userData.id}`,
        id: userData.id
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
                  {t('mobileHeader.navDescription')}
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
                        {t(item.label)}
                    </Link>
                ))}
                 {isAdmin && (
                    <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                    >
                       <Shield className="h-5 w-5" />
                        {t('userNav.adminPanel')}
                    </Link>
                 )}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="ms-auto">
             <UserNav user={appUser} isAdmin={isAdmin} />
          </div>
        </header>
    )
}
