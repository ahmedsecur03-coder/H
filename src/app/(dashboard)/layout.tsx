
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
  SidebarInset,
  SidebarTrigger,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubContent,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { dashboardNavItems } from '@/lib/placeholder-data';
import Logo from '@/components/logo';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { UserNav } from './_components/user-nav';
import type { NestedNavItem } from '@/lib/types';
import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { BottomNavBar } from './_components/bottom-nav';
import { MobileHeader } from './_components/mobile-header';
import { ChevronDown } from 'lucide-react';

function DesktopHeader({ isAdmin }: { isAdmin: boolean }) {
  const { user } = useUser();
   const appUser = {
      name: user?.displayName || `مستخدم #${user?.uid.substring(0, 6)}`,
      email: user?.email || "مستخدم مجهول",
      avatarUrl: user?.photoURL || `https://i.pravatar.cc/150?u=${user?.uid}`,
  };

  return (
    <header className="sticky top-0 z-10 hidden h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:flex">
        <div className="flex items-center gap-2 font-body ml-auto">
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
            <SidebarMenuButton
              className='justify-between'
            >
              <div className='flex items-center gap-2'>
                {item.icon && <item.icon />}
                <span>{item.label}</span>
              </div>
               <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"/>
            </SidebarMenuButton>
            <SidebarMenuSubContent>
              {item.children.map((child) => (
                <SidebarMenuSubButton key={child.href} asChild>
                  <Link href={child.href}>
                    {child.label}
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

  useEffect(() => {
    if (!isUserLoading && !user) {
        router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
        <div className="flex min-h-screen w-full">
            <div className="hidden md:block w-64 bg-muted/40 border-l p-4">
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
  
  const isAdmin = user.email === 'hagaaty@gmail.com';

  return (
    <SidebarProvider>
      {/* Desktop Sidebar */}
      <Sidebar side="right" collapsible="icon" className="hidden md:block">
        <SidebarHeader>
          <div className="flex h-16 items-center justify-between px-4 group-data-[collapsible=icon]:hidden">
             <Logo />
             {isAdmin && (
                <Button variant="outline" size="sm" className='bg-card' asChild>
                    <Link href="/admin/dashboard">الانتقال للوحة المسؤول</Link>
                </Button>
             )}
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <NavItems />
          </SidebarMenu>
        </SidebarContent>
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
