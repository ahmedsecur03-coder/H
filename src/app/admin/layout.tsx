"use client";

import Link from 'next/link';
import { Bell, Shield, ChevronDown } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
  SidebarMenuSub,
  SidebarMenuSubTrigger,
  SidebarMenuSubContent,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { adminNavItems } from '@/lib/placeholder-data';
import Logo from '@/components/logo';
import { UserNav } from '@/app/dashboard/_components/user-nav';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { doc } from 'firebase/firestore';
import type { User, NestedNavItem } from '@/lib/types';
import { Notifications } from '@/components/notifications';


function AdminHeader({ userData }: { userData: User }) {
  const adminUser = {
    name: userData.name || "Admin",
    email: userData.email || "admin@example.com",
    avatarUrl: userData.avatarUrl || `https://i.pravatar.cc/150?u=${userData.id}`,
    id: userData.id || 'N/A'
  };

  return (
     <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <SidebarTrigger className="md:hidden" />
        <div className="ms-auto flex items-center gap-4">
             <Notifications userData={userData} />
            <UserNav user={adminUser} isAdmin={true} />
        </div>
    </header>
  );
}


function AdminNavItems() {
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
                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </SidebarMenuSubTrigger>
                    <SidebarMenuSubContent>
                        {item.children.map((child) => (
                            <SidebarMenuSubButton key={child.href} href={child.href || '#'} isActive={pathname === child.href}>
                                {child.icon && <child.icon className="w-4 h-4" />}
                                <span>{child.label}</span>
                            </SidebarMenuSubButton>
                        ))}
                    </SidebarMenuSubContent>
                </SidebarMenuSub>
            );
        }

        return (
            <Link key={item.href} href={item.href || '#'} passHref>
                <SidebarMenuButton isActive={pathname === item.href}>
                    {Icon && <Icon className="h-4 w-4" />}
                    <span>{item.label}</span>
                </SidebarMenuButton>
            </Link>
        );
    };

    return <>{adminNavItems.map((item) => <SidebarMenuItem key={item.label}>{renderNavItem(item)}</SidebarMenuItem>)}</>;
}


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => (firestore && user ? doc(firestore, `users/${user.uid}`) : null), [firestore, user]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc<User>(userDocRef);
  
  const isLoading = isUserLoading || isUserDataLoading;

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !userData) {
    return (
      <div className="flex min-h-screen w-full">
        <div className="hidden w-64 border-e bg-muted/40 p-4 md:block">
          <div className="mb-4 flex h-12 items-center justify-center px-4">
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
            <div className="ms-auto flex items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Skeleton className="h-[80vh] w-full" />
          </main>
        </div>
      </div>
    );
  }
  
  return (
    <SidebarProvider>
      <Sidebar side="right" collapsible="icon">
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
             <AdminNavItems />
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <div className="bg-transparent transition-all duration-300 ease-in-out md:peer-data-[state=expanded]:me-[16rem] md:peer-data-[state=collapsed]:me-[3.5rem]">
        <AdminHeader userData={userData} />
        <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
