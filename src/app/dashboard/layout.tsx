
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
  SidebarMenuSub,
  SidebarMenuSubTrigger,
  SidebarMenuSubContent,
  SidebarMenuSubButton,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { dashboardNavItems } from '@/lib/placeholder-data';
import Logo from '@/components/logo';
import { UserNav } from '@/app/dashboard/_components/user-nav';
import type { NestedNavItem, User } from '@/lib/types';
import React from 'react';
import { BottomNavBar } from '@/app/dashboard/_components/bottom-nav';
import { MobileHeader } from '@/app/dashboard/_components/mobile-header';
import { ChevronDown, Shield, Loader2, Wallet, DollarSign } from 'lucide-react';
import { doc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getRankForSpend, RANKS } from '@/lib/service';
import { redirect, usePathname } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/theme-toggle';
import { Notifications } from '@/components/notifications';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

function DesktopHeader({ isAdmin, userData }: { isAdmin: boolean, userData: User }) {
  const appUser = {
      name: userData.name,
      email: userData.email,
      avatarUrl: userData.avatarUrl || `https://i.pravatar.cc/150?u=${userData.id}`,
      id: userData.id,
  };

  return (
    <header className="sticky top-0 z-10 hidden h-14 items-center justify-end gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:flex">
        <div className="ms-auto flex items-center gap-4 font-sans">
             <div className="flex items-center gap-4 border-s ps-4">
                <div className="flex items-center gap-2">
                     <div className="p-2 bg-muted rounded-md">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                     </div>
                    <div>
                        <div className="text-xs text-muted-foreground">الرصيد الأساسي</div>
                        <div className="font-bold font-mono">${(userData.balance ?? 0).toFixed(2)}</div>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <div className="p-2 bg-muted rounded-md">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </div>
                     <div>
                        <div className="text-xs text-muted-foreground">رصيد الإعلانات</div>
                        <div className="font-bold font-mono">${(userData.adBalance ?? 0).toFixed(2)}</div>
                    </div>
                </div>
             </div>
             <ThemeToggle />
             <Notifications userData={userData} />
            <UserNav user={appUser} isAdmin={isAdmin} />
        </div>
    </header>
  );
}

function NavItems({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const renderNavItem = (item: NestedNavItem) => {
    const Icon = item.icon;

    if (item.children) {
      return (
        <SidebarMenuSub key={item.label}>
          <SidebarMenuSubTrigger>
            <div className='flex items-center gap-2'>
              {Icon && <Icon className="h-4 w-4" />}
              <span>{item.label}</span>
            </div>
          </SidebarMenuSubTrigger>
          <SidebarMenuSubContent>
            {item.children.map((child) => (
               <SidebarMenuItem key={child.href}>
                <SidebarMenuSubButton href={child.href || '#'} isActive={pathname === child.href}>
                    {child.icon && <child.icon className="w-4 h-4" />}
                    <span>{child.label}</span>
                </SidebarMenuSubButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenuSubContent>
        </SidebarMenuSub>
      );
    }

    return (
        <Link href={item.href || '#'} passHref key={item.href}>
          <SidebarMenuButton isActive={pathname === item.href}>
            {Icon && <Icon className="h-4 w-4" />}
            <span>{item.label}</span>
          </SidebarMenuButton>
        </Link>
    );
  };

  return (
    <>
      {dashboardNavItems.map((item) => <SidebarMenuItem key={item.label}>{renderNavItem(item)}</SidebarMenuItem>)}
    </>
  );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(() => (firestore && user ? doc(firestore, `users/${user.uid}`) : null), [firestore, user]);
    const { data: userData, isLoading: isUserDataLoading } = useDoc<User>(userDocRef);
    
    React.useEffect(() => {
        if(!isUserLoading && !user) {
            redirect('/auth/login');
        }
    }, [isUserLoading, user]);

    if (isUserLoading || isUserDataLoading || !user || !userData) {
      return (
           <div className="flex min-h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
      )
    }
  
    const isAdmin = userData.role === 'admin';
    const rank = getRankForSpend(userData.totalSpent);
    const currentRankIndex = RANKS.findIndex(r => r.name === rank.name);
    const nextRank = currentRankIndex < RANKS.length - 1 ? RANKS[currentRankIndex + 1] : null;
    const progressToNextRank = nextRank ? ((userData.totalSpent - rank.spend) / (nextRank.spend - rank.spend)) * 100 : 100;

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full flex-col bg-muted/40 md:flex-row">
                <Sidebar side="right" collapsible="icon" className="hidden md:flex">
                    <SidebarHeader>
                    <div className="flex h-16 items-center justify-between px-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                        <Logo className="group-data-[collapsible=icon]:hidden" />
                        <div className="hidden group-data-[collapsible=icon]:block">
                        <Logo/>
                        </div>
                    </div>
                    </SidebarHeader>
                    <SidebarContent>
                      <div className="flex flex-col p-2 items-center gap-2 group-data-[collapsible=icon]:hidden">
                        <Avatar className="h-20 w-20 border-2 border-primary">
                          <AvatarImage src={userData.avatarUrl}/>
                          <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <p className="font-semibold">{userData.name}</p>
                        <Badge>{rank.name}</Badge>
                        {nextRank && (
                          <div className="w-full text-center mt-2">
                             <Progress value={progressToNextRank} className="h-1"/>
                             <p className="text-xs text-muted-foreground mt-1">الترقية التالية: {nextRank.name}</p>
                          </div>
                        )}
                      </div>
                      <SidebarMenu>
                          <NavItems isAdmin={isAdmin} />
                      </SidebarMenu>
                    </SidebarContent>
                    {isAdmin && (
                       <SidebarFooter>
                          <Link href="/admin/dashboard" passHref>
                              <SidebarMenuButton>
                                  <Shield className="h-4 w-4 text-primary" />
                                  <span>لوحة تحكم المسؤول</span>
                              </SidebarMenuButton>
                          </Link>
                      </SidebarFooter>
                    )}
                </Sidebar>
                
                <div className="flex flex-1 flex-col">
                    <MobileHeader isAdmin={isAdmin} userData={userData} />
                    <DesktopHeader isAdmin={isAdmin} userData={userData} />
                    
                    <main className="flex-1 overflow-auto p-4 sm:px-6 sm:py-6 md:mb-0 mb-20">
                      {children}
                    </main>
                    
                    <BottomNavBar />
                </div>
            </div>
        </SidebarProvider>
    );
}
