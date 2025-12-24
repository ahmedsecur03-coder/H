
'use client';

import Logo from "@/components/logo"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { PanelLeft, Shield, ChevronDown } from "lucide-react"
import Link from "next/link";
import { dashboardNavItems } from "@/lib/placeholder-data";
import { usePathname } from "next/navigation";
import { UserNav } from "../_components/user-nav";
import type { User as UserType, NestedNavItem } from '@/lib/types';
import { Notifications } from "@/components/notifications";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import React from "react";
import { cn } from "@/lib/utils";

export function MobileHeader({ isAdmin, userData }: { isAdmin: boolean, userData: UserType }) {
    const pathname = usePathname();

    const appUser = {
        name: userData.name,
        email: userData.email,
        avatarUrl: userData.avatarUrl || `https://i.pravatar.cc/150?u=${userData.id}`,
        id: userData.id
    };

    const renderNavItem = (item: NestedNavItem, isSubItem = false) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        if (item.children) {
            return (
                <Collapsible key={item.label} className="w-full">
                    <CollapsibleTrigger asChild>
                        <div className={cn("flex w-full items-center justify-between rounded-md p-2 hover:bg-muted", isActive && "bg-muted")}>
                             <div className="flex items-center gap-4">
                                <Icon className="h-5 w-5" />
                                <span className="text-lg font-medium">{item.label}</span>
                            </div>
                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                        </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="ps-8 mt-2 space-y-2">
                        {item.children.map(child => renderNavItem(child, true))}
                    </CollapsibleContent>
                </Collapsible>
            );
        }

        return (
            <SheetClose asChild key={item.href}>
                <Link
                    href={item.href || '#'}
                    className={cn(
                        'flex items-center gap-4 rounded-md p-2',
                        isActive ? 'bg-muted font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground',
                        isSubItem ? 'text-base' : 'text-lg font-medium'
                    )}
                >
                    <Icon className="h-5 w-5" />
                    {item.label}
                </Link>
            </SheetClose>
        );
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
                  مرحباً بك في لوحة تحكم حاجاتي
                </SheetDescription>
              </SheetHeader>
              <nav className="grid gap-2">
                 {dashboardNavItems.map(item => renderNavItem(item))}
                 {isAdmin && (
                    <SheetClose asChild>
                        <Link
                            href="/admin/dashboard"
                            className="flex items-center gap-4 px-2.5 text-lg font-medium text-muted-foreground hover:text-foreground"
                        >
                           <Shield className="h-5 w-5" />
                            لوحة التحكم للمسؤول
                        </Link>
                    </SheetClose>
                 )}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="ms-auto flex items-center gap-2">
             <Notifications userData={userData} />
             <UserNav user={appUser} isAdmin={isAdmin} />
          </div>
        </header>
    )
}
