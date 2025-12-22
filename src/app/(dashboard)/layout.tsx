

"use client";

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
  SidebarMenuSubContent,
  useSidebar,
  SidebarFooter,
  SidebarMenuSubTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { dashboardNavItems } from '@/lib/placeholder-data';
import Logo from '@/components/logo';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { UserNav } from './_components/user-nav';
import type { NestedNavItem, User } from '@/lib/types';
import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { BottomNavBar } from './_components/bottom-nav';
import { MobileHeader } from './_components/mobile-header';
import { ChevronDown, Shield } from 'lucide-react';
import { doc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getRankForSpend } from '@/lib/service';

function DesktopHeader({ isAdmin }: { isAdmin: boolean }) {
  const { user } = useUser();
  const router = useRouter();
   const appUser = {
      name: user?.displayName || `مستخدم`,
      email: user?.email || "مستخدم مجهول",
      avatarUrl: user?.photoURL || `https://i.pravatar.cc/150?u=${user?.uid}`,
      id: user?.uid || 'N/A'
  };

  const handleAdminNav = () => {
    router.push('/admin/dashboard');
  };

  return (
    <header className="sticky top-0 z-10 hidden h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:flex">
        <div className="flex items-center gap-2 font-body ml-auto">
             {isAdmin && (
                <Button variant="outline" size="sm" onClick={handleAdminNav}>
                    <Shield className="w-4 h-4 ml-2"/>الانتقال للوحة المسؤول
                </Button>
             )}
            <UserNav user={appUser} isAdmin={isAdmin} />
        </div>
    </header>
  );
}

function NavItems() {
  const { state } = useSidebar();
  const isCollapsible = state === "collapsed";

  const renderNavItems = (items: NestedNavItem[]) => {
    return items.map((item) => (
      <SidebarMenuItem key={item.label}>
        {item.children ? (
          <SidebarMenuSub>
            <SidebarMenuSubTrigger>
                <div className='flex items-center gap-2'>
                    {item.icon && <item.icon />}
                    <span>{item.label}</span>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"/>
            </SidebarMenuSubTrigger>
            <SidebarMenuSubContent>
              {item.children.map((child) => (
                 <SidebarMenuSubButton key={child.href} asChild>
                    <Link href={child.href}>
                        {child.icon && <child.icon className="w-4 h-4" />}
                        <span>{child.label}</span>
                    </Link>
                </SidebarMenuSubButton>
              ))}
            </SidebarMenuSubContent>
          </SidebarMenuSub>
        ) : (
           <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                 <SidebarMenuButton asChild>
                    <Link href={item.href || '#'}>
                        {item.icon && <item.icon />}
                        <span>{item.label}</span>
                    </Link>
                </SidebarMenuButton>
              </TooltipTrigger>
               {isCollapsible && <TooltipContent side="left" align="center">{item.label}</TooltipContent>}
            </Tooltip>
           </TooltipProvider>
        )}
      </SidebarMenuItem>
    ));
  };

  return <>{renderNavItems(dashboardNavItems)}</>;
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const userDocRef = useMemo(() => (firestore && user ? doc(firestore, `users/${user.uid}`) : null), [firestore, user]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc<User>(userDocRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
        router.push('/login');
    }
  }, [user, isUserLoading, router]);
  
  const isLoading = isUserLoading || isUserDataLoading;
  
  const isAdmin = !isLoading && (userData?.role === 'admin' || user?.email === 'hagaaty@gmail.com');
  const rank = getRankForSpend(userData?.totalSpent ?? 0);

  if (isLoading || !user) {
    return (
        <div className="flex min-h-screen w-full">
            <div className="hidden md:block w-64 bg-sidebar border-l p-4">
                <div className="flex h-12 items-center justify-center px-4 mb-4">
                     <Logo />
                </div>
                <div className="flex flex-col gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                    ))}
                </div>
            </div>
            <div className="flex-1">
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                    <Skeleton className="h-8 w-8 md:hidden" />
                    <div className="flex items-center gap-2 ml-auto">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-10 rounded-full" />
                    </div>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                   <Skeleton className="w-full h-[80vh]" />
                </main>
            </div>
        </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar side="right" collapsible="icon" className="hidden md:block">
        <SidebarHeader>
          <div className="flex h-16 items-center justify-between px-4 group-data-[collapsible=icon]:hidden">
             <Logo />
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
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                    <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
                 <div>
                    <p className="font-semibold text-sm">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground">{rank.name}</p>
                 </div>
            </div>
        </SidebarFooter>
      </Sidebar>
      
      <div className="flex flex-col flex-1 md:peer-data-[state=expanded]:[margin-right:16rem] md:peer-data-[state=collapsed]:[margin-right:3rem] transition-all duration-300 ease-in-out">
        <MobileHeader isAdmin={isAdmin} />
        <DesktopHeader isAdmin={isAdmin} />
        
        <main className="flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 mb-20 md:mb-0">
          {children}
        </main>
        
        <BottomNavBar />
      </div>

    </SidebarProvider>
  );
}
