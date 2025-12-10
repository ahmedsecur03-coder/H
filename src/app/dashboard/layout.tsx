
"use client";

import Link from 'next/link';
import {
  Bell,
} from 'lucide-react';
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
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { dashboardNavItems } from '@/lib/placeholder-data';
import Logo from '@/components/logo';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { UserNav } from './_components/user-nav';

function Header() {
  const { user } = useUser();
   const appUser = {
      name: user?.displayName || `مستخدم #${user?.uid.substring(0, 6)}`,
      email: user?.email || "مستخدم مجهول",
      avatarUrl: user?.photoURL || `https://i.pravatar.cc/150?u=${user?.uid}`,
  };
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <SidebarTrigger className="md:hidden" />
       <div className="flex items-center gap-4 ml-auto">
         <UserNav user={appUser} />
       </div>
    </header>
  );
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
        router.push('/');
    }
  }, [user, isUserLoading, router]);

  // While loading, show a skeleton layout to prevent flashing content.
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
                    <div className="relative flex-1 md:grow-0">
                       <Skeleton className="h-9 w-full md:w-[200px] lg:w-[320px]" />
                    </div>
                    <div className="flex items-center gap-2 mr-auto">
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

  // Once loading is complete and user is authenticated, render the real layout.
  const appUser = {
      name: user.displayName || `مستخدم #${user.uid.substring(0, 6)}`,
      email: user.email || "مستخدم مسجل",
      avatarUrl: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
  };

  return (
    <SidebarProvider>
      <Sidebar side="right" collapsible="icon">
        <SidebarHeader>
          <div className="flex h-16 items-center justify-center px-4 group-data-[collapsible=icon]:hidden">
             <Logo />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {dashboardNavItems.map((item, index) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  tooltip={{
                    children: item.label,
                    className: 'font-body',
                    side: 'left',
                  }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="bg-transparent">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
