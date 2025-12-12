

"use client";

import Link from 'next/link';
import { Bell, Shield } from 'lucide-react';
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
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { adminNavItems } from '@/lib/placeholder-data';
import Logo from '@/components/logo';
import { UserNav } from '@/app/(dashboard)/_components/user-nav';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const ADMIN_EMAILS = ['hagaaty@gmail.com', 'admin@gmail.com'];

function AdminHeader() {
  const { user } = useUser();
  const adminUser = {
    name: user?.displayName || "مسؤول",
    email: user?.email || "admin@example.com",
    avatarUrl: user?.photoURL || `https://i.pravatar.cc/150?u=${user?.uid}`,
    id: user?.uid || 'N/A'
  };

  return (
     <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-sm px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <SidebarTrigger className="md:hidden" />
        <div className="flex items-center gap-4 ml-auto">
             <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5"/>
                <span className="sr-only">الإشعارات</span>
             </Button>
            <UserNav user={adminUser} isAdmin={true} />
        </div>
    </header>
  );
}


function AdminNavItems() {
  const { state } = useSidebar();
  const isCollapsible = state === "collapsed";

  return (
    <>
        {adminNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <SidebarMenuButton asChild>
                                <Link href={item.href}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </TooltipTrigger>
                        {isCollapsible && <TooltipContent side="left" align="center">{item.label}</TooltipContent>}
                    </Tooltip>
                </TooltipProvider>
            </SidebarMenuItem>
        ))}
    </>
  )
}


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      if (!user) {
        // If not logged in, redirect to login page
        router.push('/login');
      } else if (!ADMIN_EMAILS.includes(user.email || '')) {
        // If logged in but not an admin, redirect to user dashboard
        router.push('/dashboard');
      }
    }
  }, [user, isUserLoading, router]);

  // Show a loading skeleton while checking auth and permissions
  if (isUserLoading || !user || !ADMIN_EMAILS.includes(user.email || '')) {
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
              <Skeleton className="h-10 w-10 rounded-full" />
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

  // If loading is complete and user is the admin, render the layout
  
  return (
    <SidebarProvider>
      <Sidebar side="right" collapsible="icon">
        <SidebarHeader>
          <div className="flex h-16 items-center justify-between px-4 group-data-[collapsible=icon]:hidden">
            <Logo />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
             <AdminNavItems />
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="bg-transparent">
        <AdminHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
