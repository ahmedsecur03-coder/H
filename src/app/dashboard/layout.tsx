
'use client';

import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarFooter,
  SidebarMenuSubTrigger,
  SidebarMenuSubContent,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { dashboardNavItems } from '@/lib/placeholder-data';
import Logo from '@/components/logo';
import { UserNav } from '@/app/dashboard/_components/user-nav';
import type { NestedNavItem, User } from '@/lib/types';
import React from 'react';
import { BottomNavBar } from '@/app/dashboard/_components/bottom-nav';
import { MobileHeader } from '@/app/dashboard/_components/mobile-header';
import { ChevronDown, Shield } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getRankForSpend } from '@/lib/service';
import { cn } from '@/lib/utils';
import { redirect, usePathname } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { LanguageToggle } from '@/components/language-toggle';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';

function DesktopHeader({ isAdmin, userData }: { isAdmin: boolean, userData: User }) {
  const { t } = useTranslation();
  
  // Use userData from Firestore as the source of truth
  const appUser = {
      name: userData.name,
      email: userData.email,
      avatarUrl: userData.avatarUrl || `https://i.pravatar.cc/150?u=${userData.id}`,
      id: userData.id,
  };

  return (
    <header className="sticky top-0 z-10 hidden h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:flex">
        <div className="ms-auto flex items-center gap-2 font-body">
             <LanguageToggle />
             {isAdmin && (
                <Button variant="outline" size="sm" asChild>
                    <Link href="/admin/dashboard">
                        <Shield className="me-2 h-4 w-4"/>{t('goToAdminPanel')}
                    </Link>
                </Button>
             )}
            <UserNav user={appUser} isAdmin={isAdmin} />
        </div>
    </header>
  );
}

function NavItems() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const renderNavItem = (item: NestedNavItem, index: number) => {
    const isActive = item.href ? pathname === item.href : false;
    const Icon = item.icon;
    const label = t(item.label);

    if (item.children) {
      return (
        <SidebarMenuItem key={`${item.label}-${index}`}>
            <SidebarMenuSub>
                <SidebarMenuSubTrigger>
                    <div className='flex items-center gap-2'>
                        {Icon && <Icon className="h-4 w-4" />}
                        <span>{label}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"/>
                </SidebarMenuSubTrigger>
                <SidebarMenuSubContent>
                    {item.children.map((child) => (
                        <Link key={child.href} href={child.href || '#'} passHref>
                            <SidebarMenuSubButton isActive={pathname === child.href}>
                                {child.icon && <child.icon className="w-4 h-4" />}
                                <span>{t(child.label)}</span>
                            </SidebarMenuSubButton>
                        </Link>
                    ))}
                </SidebarMenuSubContent>
            </SidebarMenuSub>
        </SidebarMenuItem>
      );
    }

    return (
      <SidebarMenuItem key={`${item.label}-${index}`}>
        <Link href={item.href || '#'} passHref>
          <SidebarMenuButton isActive={isActive}>
            {Icon && <Icon className="h-4 w-4" />}
            <span>{label}</span>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    );
  };

  return <>{dashboardNavItems.map((item, index) => renderNavItem(item, index))}</>;
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { t } = useTranslation();

    const userDocRef = useMemoFirebase(() => (firestore && user ? doc(firestore, `users/${user.uid}`) : null), [firestore, user]);
    const { data: userData, isLoading: isUserDataLoading } = useDoc<User>(userDocRef);
    
    React.useEffect(() => {
        if(!isUserLoading && !user) {
            redirect('/login');
        }
    }, [isUserLoading, user]);

    if (isUserLoading || isUserDataLoading || !user || !userData) {
      return (
           <div className="flex min-h-screen w-full items-center justify-center">
                <Skeleton className="h-10 w-48" />
            </div>
      )
    }
  
    const isAdmin = userData?.role === 'admin' || user?.email === 'hagaaty@gmail.com';
    const rank = getRankForSpend(userData?.totalSpent ?? 0);

    return (
        <SidebarProvider>
        <Sidebar side="left" collapsible="icon" className="hidden md:block">
            <SidebarHeader>
            <div className="flex h-16 items-center justify-between px-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                <Logo className="group-data-[collapsible=icon]:hidden" />
                 <div className="hidden group-data-[collapsible=icon]:block">
                   <Logo/>
                </div>
            </div>
            </SidebarHeader>
            <SidebarContent>
            <SidebarMenu>
                <NavItems />
            </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="border-t border-sidebar-border p-2 group-data-[collapsible=icon]:hidden">
                <div className="flex items-center gap-3 p-2">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={userData.avatarUrl || undefined} alt={userData.name || 'User'} />
                        <AvatarFallback>{userData.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold text-sm">{userData.name}</p>
                        <p className="text-xs text-muted-foreground">{t(`ranks.${rank.name}`)}</p>
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
        
        <div className="flex flex-1 flex-col transition-all duration-300 ease-in-out md:peer-data-[state=expanded]:[margin-inline-start:16rem] md:peer-data-[state=collapsed]:[margin-inline-start:3.5rem]">
            <MobileHeader isAdmin={isAdmin} userData={userData} />
            <DesktopHeader isAdmin={isAdmin} userData={userData} />
            
            <main className="mb-20 flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:mb-0 md:gap-8">
            {children}
            </main>
            
            <BottomNavBar />
        </div>

        </SidebarProvider>
    );
}
