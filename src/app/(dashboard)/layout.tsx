

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
  SidebarFooter,
  SidebarMenuSubTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { dashboardNavItems } from '@/lib/placeholder-data';
import Logo from '@/components/logo';
import { useRouter, usePathname } from 'next/navigation';
import { UserNav } from './_components/user-nav';
import type { NestedNavItem, User } from '@/lib/types';
import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { BottomNavBar } from './_components/bottom-nav';
import { MobileHeader } from './_components/mobile-header';
import { ChevronDown, Shield } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getRankForSpend } from '@/lib/service';
import { cn } from '@/lib/utils';
import DynamicAiAssistant from '@/components/dynamic-ai-assistant';
import { getAuthenticatedUser } from '@/firebase/server-auth';
import { initializeFirebaseServer } from '@/firebase/server';

function DesktopHeader({ isAdmin, user }: { isAdmin: boolean, user: any }) {
  const appUser = {
      name: user?.displayName || `مستخدم`,
      email: user?.email || "مستخدم مجهول",
      avatarUrl: user?.photoURL || `https://i.pravatar.cc/150?u=${user?.uid}`,
      id: user?.uid || 'N/A'
  };

  return (
    <header className="sticky top-0 z-10 hidden h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:flex">
        <div className="flex items-center gap-2 font-body ml-auto">
             {isAdmin && (
                <Button variant="outline" size="sm" asChild>
                    <Link href="/admin/dashboard">
                        <Shield className="w-4 h-4 ml-2"/>الانتقال للوحة المسؤول
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

  const renderNavItem = (item: NestedNavItem, index: number) => {
    const isActive = item.href ? pathname === item.href : false;
    const Icon = item.icon;

    if (item.children) {
      return (
        <SidebarMenuItem key={`${item.label}-${index}`} asChild>
            <SidebarMenuSub>
                <SidebarMenuSubTrigger>
                    <div className='flex items-center gap-2'>
                        {Icon && <Icon />}
                        <span>{item.label}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"/>
                </SidebarMenuSubTrigger>
                <SidebarMenuSubContent>
                    {item.children.map((child) => (
                        <Link key={child.href} href={child.href || '#'} passHref>
                            <SidebarMenuSubButton isActive={pathname === child.href}>
                                {child.icon && <child.icon className="w-4 h-4" />}
                                <span>{child.label}</span>
                            </SidebarMenuSubButton>
                        </Link>
                    ))}
                </SidebarMenuSubContent>
            </SidebarMenuSub>
        </SidebarMenuItem>
      );
    }

    return (
      <SidebarMenuItem key={`${item.label}-${index}`} asChild>
        <Link href={item.href || '#'} passHref>
          <SidebarMenuButton isActive={isActive}>
            {Icon && <Icon />}
            <span>{item.label}</span>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    );
  };

  return <>{dashboardNavItems.map((item, index) => renderNavItem(item, index))}</>;
}


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getAuthenticatedUser();

  if (!user) {
    // In a real app, you'd redirect here
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <p>يرجى تسجيل الدخول للوصول إلى لوحة التحكم.</p>
      </div>
    );
  }

  const { firestore } = initializeFirebaseServer();
  let userData: User | null = null;
  if(firestore) {
    const userDocRef = doc(firestore, `users/${user.uid}`);
    const userDoc = await getDoc(userDocRef);
    if(userDoc.exists()) {
        userData = userDoc.data() as User;
    }
  }

  const isAdmin = userData?.role === 'admin' || user?.email === 'hagaaty@gmail.com';
  const rank = getRankForSpend(userData?.totalSpent ?? 0);

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
        <DesktopHeader isAdmin={isAdmin} user={user} />
        
        <main className="flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 mb-20 md:mb-0">
          {children}
        </main>
        
        <BottomNavBar />
        <DynamicAiAssistant />
      </div>

    </SidebarProvider>
  );
}
